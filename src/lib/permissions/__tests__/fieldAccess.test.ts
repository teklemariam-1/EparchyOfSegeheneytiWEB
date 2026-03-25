import { describe, it, expect } from 'vitest'
import { superAdminOnly, elevatedOnly, selfOrAdmin } from '../fieldAccess'

function req(user: object | null = null) {
  return { user } as any
}

// ─── superAdminOnly ──────────────────────────────────────────────────────────

describe('superAdminOnly', () => {
  it('returns true for super-admin', () => {
    expect(superAdminOnly({ req: req({ role: 'super-admin' }) } as any)).toBe(true)
  })

  it('returns false for chancery-editor', () => {
    expect(superAdminOnly({ req: req({ role: 'chancery-editor' }) } as any)).toBe(false)
  })

  it('returns false for parish-editor', () => {
    expect(superAdminOnly({ req: req({ role: 'parish-editor' }) } as any)).toBe(false)
  })

  it('returns false for unauthenticated requests', () => {
    expect(superAdminOnly({ req: req(null) } as any)).toBe(false)
  })
})

// ─── elevatedOnly ─────────────────────────────────────────────────────────────

describe('elevatedOnly', () => {
  it('returns true for super-admin', () => {
    expect(elevatedOnly({ req: req({ role: 'super-admin' }) } as any)).toBe(true)
  })

  it('returns true for chancery-editor', () => {
    expect(elevatedOnly({ req: req({ role: 'chancery-editor' }) } as any)).toBe(true)
  })

  it('returns false for parish-editor', () => {
    expect(elevatedOnly({ req: req({ role: 'parish-editor' }) } as any)).toBe(false)
  })

  it('returns false for media-editor', () => {
    expect(elevatedOnly({ req: req({ role: 'media-editor' }) } as any)).toBe(false)
  })

  it('returns false for unauthenticated requests', () => {
    expect(elevatedOnly({ req: req(null) } as any)).toBe(false)
  })
})

// ─── selfOrAdmin ─────────────────────────────────────────────────────────────

describe('selfOrAdmin', () => {
  it('returns true for super-admin regardless of which document id is targeted', () => {
    expect(selfOrAdmin({ req: req({ id: 'admin-1', role: 'super-admin' }), id: 'other-user' } as any)).toBe(true)
  })

  it('returns true when a non-admin user targets their own document', () => {
    expect(selfOrAdmin({ req: req({ id: 'user-1', role: 'parish-editor' }), id: 'user-1' } as any)).toBe(true)
  })

  it('returns false when a non-admin user targets a different document', () => {
    expect(selfOrAdmin({ req: req({ id: 'user-1', role: 'parish-editor' }), id: 'user-2' } as any)).toBe(false)
  })

  it('returns false when no user is present', () => {
    expect(selfOrAdmin({ req: req(null) } as any)).toBe(false)
  })
})
