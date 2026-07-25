import { describe, it, expect, vi } from 'vitest'
import {
  guardUserBeforeChange,
  guardUserBeforeDelete,
  auditAndInviteUserAfterChange,
  rejectInactiveLogin,
} from '../userGuards'

/**
 * These guards are the real security boundary for the Users collection — the
 * admin UI only hides the fields. Each test drives the hook directly, the way a
 * raw POST to /api/users would.
 */

type FindResult = { totalDocs: number }

function payloadStub(over: Partial<Record<string, unknown>> = {}) {
  return {
    find: vi.fn(async (): Promise<FindResult> => ({ totalDocs: 1 })),
    findByID: vi.fn(async () => ({ id: 9, role: 'chancery-editor', status: 'active' })),
    create: vi.fn(async () => ({})),
    forgotPassword: vi.fn(async () => ({})),
    logger: { error: vi.fn() },
    ...over,
  }
}

const req = (user: unknown, payload = payloadStub()) => ({ user, payload }) as any

// ─── login gating ─────────────────────────────────────────────────────────────

describe('inactive accounts cannot log in', () => {
  it('rejects a suspended account', () => {
    expect(() =>
      rejectInactiveLogin({ user: { id: 1, role: 'super-admin', status: 'suspended' } } as any),
    ).toThrow(/not active/i)
  })

  it('rejects an expired account', () => {
    expect(() =>
      rejectInactiveLogin({
        user: { id: 1, role: 'chancery-editor', status: 'active', expiresAt: '2000-01-01T00:00:00.000Z' },
      } as any),
    ).toThrow(/not active/i)
  })

  it('lets an active account through', () => {
    const user = { id: 1, role: 'parish-editor', status: 'active' }
    expect(rejectInactiveLogin({ user } as any)).toEqual(user)
  })

  it('lets a legacy account with no status through', () => {
    const user = { id: 1, role: 'media-editor' }
    expect(rejectInactiveLogin({ user } as any)).toEqual(user)
  })
})

// ─── self-editing ─────────────────────────────────────────────────────────────

describe('no user may change their own role, permissions, or status', () => {
  const original = { id: 1, role: 'chancery-editor', status: 'active', email: 'a@b.c' }

  it.each([
    ['role', { role: 'super-admin' }],
    ['status', { status: 'suspended' }],
    ['permissionsGrant', { permissionsGrant: ['users.manage'] }],
    ['permissionsRevoke', { permissionsRevoke: ['news.create'] }],
    ['expiresAt', { expiresAt: '2999-01-01T00:00:00.000Z' }],
  ])('rejects a self-edit of %s', async (_field, data) => {
    await expect(
      guardUserBeforeChange({
        data,
        req: req({ id: 1, role: 'chancery-editor' }),
        operation: 'update',
        originalDoc: original,
      } as any),
    ).rejects.toThrow(/cannot change your own role/i)
  })

  it('rejects a super-admin editing their own role too', async () => {
    await expect(
      guardUserBeforeChange({
        data: { role: 'chancery-editor' },
        req: req({ id: 1, role: 'super-admin' }),
        operation: 'update',
        originalDoc: { ...original, role: 'super-admin' },
      } as any),
    ).rejects.toThrow(/cannot change your own role/i)
  })

  it('allows editing your own ordinary profile fields', async () => {
    const data = { firstName: 'New' }
    await expect(
      guardUserBeforeChange({
        data,
        req: req({ id: 1, role: 'parish-editor' }),
        operation: 'update',
        originalDoc: original,
      } as any),
    ).resolves.toEqual(data)
  })

  it('allows another administrator to change the same fields', async () => {
    const data = { role: 'media-editor' }
    await expect(
      guardUserBeforeChange({
        data,
        req: req({ id: 2, role: 'super-admin' }),
        operation: 'update',
        originalDoc: original,
      } as any),
    ).resolves.toEqual(data)
  })
})

// ─── last super-admin ─────────────────────────────────────────────────────────

describe('the last active super-admin is protected', () => {
  const target = { id: 1, role: 'super-admin', status: 'active', email: 'boss@eparchy.org' }
  const none = payloadStub({ find: vi.fn(async () => ({ totalDocs: 0 })) })
  const one = payloadStub({ find: vi.fn(async () => ({ totalDocs: 1 })) })

  it('blocks demotion when no other active super-admin exists', async () => {
    await expect(
      guardUserBeforeChange({
        data: { role: 'chancery-editor' },
        req: req({ id: 2, role: 'super-admin' }, none),
        operation: 'update',
        originalDoc: target,
      } as any),
    ).rejects.toThrow(/last active super-admin/i)
  })

  it('blocks suspension when no other active super-admin exists', async () => {
    await expect(
      guardUserBeforeChange({
        data: { status: 'suspended' },
        req: req({ id: 2, role: 'super-admin' }, none),
        operation: 'update',
        originalDoc: target,
      } as any),
    ).rejects.toThrow(/last active super-admin/i)
  })

  it('allows demotion when another active super-admin remains', async () => {
    await expect(
      guardUserBeforeChange({
        data: { role: 'chancery-editor' },
        req: req({ id: 2, role: 'super-admin' }, one),
        operation: 'update',
        originalDoc: target,
      } as any),
    ).resolves.toBeTruthy()
  })

  it('blocks deletion of the last one', async () => {
    const payload = payloadStub({
      findByID: vi.fn(async () => target),
      find: vi.fn(async () => ({ totalDocs: 0 })),
    })
    await expect(
      guardUserBeforeDelete({ req: req({ id: 2, role: 'super-admin' }, payload), id: 1 } as any),
    ).rejects.toThrow(/last active super-admin/i)
  })

  it('permits deleting a non-super-admin', async () => {
    const payload = payloadStub({
      findByID: vi.fn(async () => ({ id: 5, role: 'media-editor', status: 'active' })),
      find: vi.fn(async () => ({ totalDocs: 0 })),
    })
    await expect(
      guardUserBeforeDelete({ req: req({ id: 2, role: 'super-admin' }, payload), id: 5 } as any),
    ).resolves.toBeUndefined()
  })
})

// ─── invitation & audit ───────────────────────────────────────────────────────

describe('invitation flow', () => {
  it('sets a throwaway password when created without one', async () => {
    const data: Record<string, unknown> = { email: 'new@eparchy.org', role: 'media-editor' }
    await guardUserBeforeChange({ data, req: req(null), operation: 'create' } as any)
    expect(typeof data.password).toBe('string')
    expect((data.password as string).length).toBeGreaterThan(12)
  })

  it('leaves a supplied password alone', async () => {
    const data: Record<string, unknown> = { email: 'new@eparchy.org', password: 'Chosen1Pass' }
    await guardUserBeforeChange({ data, req: req(null), operation: 'create' } as any)
    expect(data.password).toBe('Chosen1Pass')
  })

  it('emails a set-password link and audits the creation', async () => {
    const payload = payloadStub()
    await auditAndInviteUserAfterChange({
      doc: { id: 7, email: 'new@eparchy.org', role: 'media-editor' },
      req: req({ id: 1, role: 'super-admin', email: 'boss@eparchy.org' }, payload),
      operation: 'create',
    } as any)

    expect(payload.forgotPassword).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', data: { email: 'new@eparchy.org' } }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-log',
        data: expect.objectContaining({ action: 'user.created', targetId: '7' }),
      }),
    )
  })

  it('still audits when the invitation email fails', async () => {
    const payload = payloadStub({
      forgotPassword: vi.fn(async () => {
        throw new Error('SMTP down')
      }),
    })
    await expect(
      auditAndInviteUserAfterChange({
        doc: { id: 7, email: 'new@eparchy.org' },
        req: req({ id: 1 }, payload),
        operation: 'create',
      } as any),
    ).resolves.toBeTruthy()
    expect(payload.create).toHaveBeenCalled()
  })
})

describe('audit of sensitive changes', () => {
  it('records role, status, and permission changes', async () => {
    const payload = payloadStub()
    await auditAndInviteUserAfterChange({
      doc: { id: 3, email: 'e@eparchy.org', role: 'chancery-editor', status: 'suspended', permissionsGrant: ['users.view'] },
      previousDoc: { id: 3, email: 'e@eparchy.org', role: 'media-editor', status: 'active', permissionsGrant: [] },
      req: req({ id: 1, role: 'super-admin' }, payload),
      operation: 'update',
    } as any)

    const summary = (payload.create.mock.calls[0]![0] as any).data.summary as string
    expect(summary).toMatch(/role media-editor → chancery-editor/)
    expect(summary).toMatch(/status active → suspended/)
    expect(summary).toMatch(/permission grants changed/)
  })

  it('stays silent when nothing sensitive changed', async () => {
    const payload = payloadStub()
    await auditAndInviteUserAfterChange({
      doc: { id: 3, email: 'e@eparchy.org', role: 'media-editor', firstName: 'New' },
      previousDoc: { id: 3, email: 'e@eparchy.org', role: 'media-editor', firstName: 'Old' },
      req: req({ id: 1 }, payload),
      operation: 'update',
    } as any)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('never lets an audit-log failure break the user update', async () => {
    const payload = payloadStub({
      create: vi.fn(async () => {
        throw new Error('audit table missing')
      }),
    })
    await expect(
      auditAndInviteUserAfterChange({
        doc: { id: 3, email: 'e@eparchy.org', role: 'super-admin' },
        previousDoc: { id: 3, email: 'e@eparchy.org', role: 'media-editor' },
        req: req({ id: 1 }, payload),
        operation: 'update',
      } as any),
    ).resolves.toBeTruthy()
  })
})
