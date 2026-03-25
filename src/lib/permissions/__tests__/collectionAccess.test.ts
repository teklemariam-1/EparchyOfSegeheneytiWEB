import { describe, it, expect } from 'vitest'
import {
  isSuperAdmin,
  isChanceryOrAbove,
  isAnyEditor,
  isPublicRead,
  isAuthenticated,
  isRoleOneOf,
  isOwnParishOrAbove,
} from '../collectionAccess'

// Helper — avoids importing Payload types in tests
function req(user: object | null = null) {
  return { user } as any
}

// ─── isSuperAdmin ─────────────────────────────────────────────────────────────

describe('isSuperAdmin', () => {
  it('returns true for super-admin', () => {
    expect(isSuperAdmin({ req: req({ role: 'super-admin' }) } as any)).toBe(true)
  })

  it('returns false for chancery-editor', () => {
    expect(isSuperAdmin({ req: req({ role: 'chancery-editor' }) } as any)).toBe(false)
  })

  it('returns false for parish-editor', () => {
    expect(isSuperAdmin({ req: req({ role: 'parish-editor' }) } as any)).toBe(false)
  })

  it('returns false when no user is present', () => {
    expect(isSuperAdmin({ req: req(null) } as any)).toBe(false)
  })
})

// ─── isChanceryOrAbove ────────────────────────────────────────────────────────

describe('isChanceryOrAbove', () => {
  it('returns true for super-admin', () => {
    expect(isChanceryOrAbove({ req: req({ role: 'super-admin' }) } as any)).toBe(true)
  })

  it('returns true for chancery-editor', () => {
    expect(isChanceryOrAbove({ req: req({ role: 'chancery-editor' }) } as any)).toBe(true)
  })

  it('returns false for parish-editor', () => {
    expect(isChanceryOrAbove({ req: req({ role: 'parish-editor' }) } as any)).toBe(false)
  })

  it('returns false for youth-editor', () => {
    expect(isChanceryOrAbove({ req: req({ role: 'youth-editor' }) } as any)).toBe(false)
  })

  it('returns false for unauthenticated requests', () => {
    expect(isChanceryOrAbove({ req: req(null) } as any)).toBe(false)
  })
})

// ─── isAnyEditor ─────────────────────────────────────────────────────────────

describe('isAnyEditor', () => {
  it('returns true for any authenticated user regardless of role', () => {
    for (const role of ['super-admin', 'chancery-editor', 'parish-editor', 'media-editor', 'catechist-editor', 'youth-editor']) {
      expect(isAnyEditor({ req: req({ role }) } as any)).toBe(true)
    }
  })

  it('returns false when request has no user', () => {
    expect(isAnyEditor({ req: req(null) } as any)).toBe(false)
  })
})

// ─── isPublicRead ─────────────────────────────────────────────────────────────

describe('isPublicRead', () => {
  it('returns true for unauthenticated requests', () => {
    expect(isPublicRead({ req: req(null) } as any)).toBe(true)
  })

  it('returns true for authenticated users', () => {
    expect(isPublicRead({ req: req({ role: 'super-admin' }) } as any)).toBe(true)
  })
})

// ─── isAuthenticated ─────────────────────────────────────────────────────────

describe('isAuthenticated', () => {
  it('returns true when a user object is present', () => {
    expect(isAuthenticated({ req: req({ id: 'u1', role: 'parish-editor' }) } as any)).toBe(true)
  })

  it('returns false when no user is present', () => {
    expect(isAuthenticated({ req: req(null) } as any)).toBe(false)
  })
})

// ─── isRoleOneOf ─────────────────────────────────────────────────────────────

describe('isRoleOneOf', () => {
  it('accepts a user whose role is in the list', () => {
    const fn = isRoleOneOf('super-admin', 'youth-editor')
    expect(fn({ req: req({ role: 'youth-editor' }) } as any)).toBe(true)
  })

  it('rejects a user whose role is not in the list', () => {
    const fn = isRoleOneOf('super-admin')
    expect(fn({ req: req({ role: 'parish-editor' }) } as any)).toBe(false)
  })

  it('rejects unauthenticated requests', () => {
    const fn = isRoleOneOf('super-admin', 'chancery-editor')
    expect(fn({ req: req(null) } as any)).toBe(false)
  })

  it('handles a single-role list correctly', () => {
    const fn = isRoleOneOf('media-editor')
    expect(fn({ req: req({ role: 'media-editor' }) } as any)).toBe(true)
    expect(fn({ req: req({ role: 'catechist-editor' }) } as any)).toBe(false)
  })
})

// ─── isOwnParishOrAbove ───────────────────────────────────────────────────────

describe('isOwnParishOrAbove', () => {
  const access = isOwnParishOrAbove()

  it('returns true for super-admin (bypass)', () => {
    expect(access({ req: req({ role: 'super-admin', assignedParish: null }), id: 'doc1' } as any)).toBe(true)
  })

  it('returns true for chancery-editor (bypass)', () => {
    expect(access({ req: req({ role: 'chancery-editor' }), id: 'doc1' } as any)).toBe(true)
  })

  it('returns false for unauthenticated', () => {
    expect(access({ req: req(null) } as any)).toBe(false)
  })

  it('returns false for non-parish-editor roles (e.g. youth-editor)', () => {
    expect(access({ req: req({ role: 'youth-editor', assignedParish: 'p1' }) } as any)).toBe(false)
  })

  it('allows parish-editor to create a doc in their own parish (data path)', () => {
    const result = access({
      req: req({ role: 'parish-editor', assignedParish: 'parish-1' }),
      data: { parish: 'parish-1' },
    } as any)
    expect(result).toBe(true)
  })

  it('blocks parish-editor from creating a doc in a different parish', () => {
    const result = access({
      req: req({ role: 'parish-editor', assignedParish: 'parish-1' }),
      data: { parish: 'parish-2' },
    } as any)
    expect(result).toBe(false)
  })

  it('allows parish-editor with object-shaped parish field in create data', () => {
    const result = access({
      req: req({ role: 'parish-editor', assignedParish: 'parish-1' }),
      data: { parish: { id: 'parish-1' } },
    } as any)
    expect(result).toBe(true)
  })

  it('returns a where-clause object for parish-editor on existing docs (read/update)', () => {
    const result = access({
      req: req({ role: 'parish-editor', assignedParish: 'parish-42' }),
      id: 'doc-1',
    } as any)
    expect(typeof result).toBe('object')
    expect((result as any).parish.equals).toBe('parish-42')
  })
})
