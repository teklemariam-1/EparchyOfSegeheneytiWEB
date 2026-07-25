import { describe, it, expect } from 'vitest'
import {
  can,
  canField,
  crud,
  hideUnless,
  canManageOwnParish,
  requirePublishPermission,
} from '../access'
import { isPublicRead } from '../readAccess'
import type { AuthUser } from '../resolve'

/**
 * The access factories are what every collection config actually calls, so a
 * regression here silently widens or closes access across the whole admin.
 * Each test drives the returned function the way Payload would.
 */

const req = (user: Partial<AuthUser> & Record<string, unknown> | null) => ({ user }) as any

const chancery = { id: 1, role: 'chancery-editor', status: 'active' }
const parishEditor = { id: 2, role: 'parish-editor', status: 'active', assignedParish: 7 }
const superAdmin = { id: 3, role: 'super-admin', status: 'active' }

// ─── can / canField ───────────────────────────────────────────────────────────

describe('can', () => {
  it('grants a holder of the permission', () => {
    expect(can('news.create')({ req: req(chancery) } as any)).toBe(true)
  })

  it('denies a user whose preset lacks it', () => {
    expect(can('news.create')({ req: req(parishEditor) } as any)).toBe(false)
  })

  it('denies anonymous requests', () => {
    expect(can('news.create')({ req: req(null) } as any)).toBe(false)
  })

  it('denies a suspended user who would otherwise hold it', () => {
    expect(can('news.create')({ req: req({ ...chancery, status: 'suspended' }) } as any)).toBe(false)
  })

  it('honours a per-user grant', () => {
    const u = { ...parishEditor, permissionsGrant: ['news.create'] }
    expect(can('news.create')({ req: req(u) } as any)).toBe(true)
  })

  it('honours a per-user revoke', () => {
    const u = { ...chancery, permissionsRevoke: ['news.create'] }
    expect(can('news.create')({ req: req(u) } as any)).toBe(false)
  })
})

describe('canField', () => {
  it('gates a field on the same resolution as collection access', () => {
    expect(canField('donations.config')({ req: req(superAdmin) } as any)).toBe(true)
    expect(canField('donations.config')({ req: req(chancery) } as any)).toBe(false)
  })
})

// ─── hideUnless ───────────────────────────────────────────────────────────────

describe('hideUnless', () => {
  it('hides when the user holds none of the permissions', () => {
    expect(hideUnless('news.create', 'news.update')({ user: parishEditor })).toBe(true)
  })

  it('shows when the user holds any one of them', () => {
    expect(hideUnless('news.create', 'audit-log.view')({ user: chancery })).toBe(false)
  })

  it('hides from anonymous visitors', () => {
    expect(hideUnless('news.create')({ user: null })).toBe(true)
  })

  it('hides from a suspended user', () => {
    expect(hideUnless('news.create')({ user: { ...chancery, status: 'suspended' } })).toBe(true)
  })
})

// ─── crud ─────────────────────────────────────────────────────────────────────

describe('crud', () => {
  const block = crud(isPublicRead, 'schools.create', 'schools.update', 'schools.delete')

  it('passes the supplied read straight through', () => {
    expect(block.read).toBe(isPublicRead)
  })

  it('maps each operation to its own permission', () => {
    // Granted create only — update and delete must stay closed.
    const u = { id: 9, role: 'media-editor', status: 'active', permissionsGrant: ['schools.create'] }
    expect(block.create({ req: req(u) } as any)).toBe(true)
    expect(block.update({ req: req(u) } as any)).toBe(false)
    expect(block.delete({ req: req(u) } as any)).toBe(false)
  })

  it('opens all three for a holder of all three', () => {
    expect(block.create({ req: req(chancery) } as any)).toBe(true)
    expect(block.update({ req: req(chancery) } as any)).toBe(true)
    expect(block.delete({ req: req(chancery) } as any)).toBe(true)
  })
})

// ─── canManageOwnParish ───────────────────────────────────────────────────────

describe('canManageOwnParish', () => {
  const access = canManageOwnParish('events.create', 'events.manage-own')

  it('lets a full-permission holder through unscoped', () => {
    expect(access({ req: req(chancery), id: undefined, data: { parish: 999 } } as any)).toBe(true)
  })

  it('denies a user holding neither permission', () => {
    const u = { id: 4, role: 'media-editor', status: 'active', assignedParish: 7 }
    expect(access({ req: req(u) } as any)).toBe(false)
  })

  it('denies anonymous requests', () => {
    expect(access({ req: req(null) } as any)).toBe(false)
  })

  it('denies a suspended parish-editor', () => {
    const u = { ...parishEditor, status: 'suspended' }
    expect(access({ req: req(u), data: { parish: 7 } } as any)).toBe(false)
  })

  describe('create', () => {
    it('allows a document in the editor\'s own parish', () => {
      expect(access({ req: req(parishEditor), data: { parish: 7 } } as any)).toBe(true)
    })

    it('rejects a document in another parish', () => {
      expect(access({ req: req(parishEditor), data: { parish: 8 } } as any)).toBe(false)
    })

    it('accepts a populated relationship object', () => {
      expect(access({ req: req(parishEditor), data: { parish: { id: 7 } } } as any)).toBe(true)
    })

    it('compares ids across string/number representations', () => {
      // REST sends '7', the local API sends 7 — the same parish either way.
      expect(access({ req: req({ ...parishEditor, assignedParish: '7' }), data: { parish: 7 } } as any)).toBe(true)
    })

    it('rejects a document with no parish at all', () => {
      expect(access({ req: req(parishEditor), data: {} } as any)).toBe(false)
    })
  })

  describe('read / update / delete', () => {
    it('returns a where-clause scoped to the assigned parish', () => {
      expect(access({ req: req(parishEditor), id: 42 } as any)).toEqual({ parish: { equals: 7 } })
    })

    it('scopes a list request (no id, no data) rather than allowing it', () => {
      expect(access({ req: req(parishEditor) } as any)).toEqual({ parish: { equals: 7 } })
    })

    it('scopes a populated assignedParish by its id', () => {
      const u = { ...parishEditor, assignedParish: { id: 7, name: 'St Mary' } }
      expect(access({ req: req(u), id: 42 } as any)).toEqual({ parish: { equals: 7 } })
    })

    it('honours a custom parish field', () => {
      const byId = canManageOwnParish('parishes.update', 'parishes.update-own', 'id')
      expect(byId({ req: req(parishEditor), id: 7 } as any)).toEqual({ id: { equals: 7 } })
    })
  })

  describe('an editor with no parish assigned', () => {
    const unassigned = { id: 5, role: 'parish-editor', status: 'active' }

    it('cannot create a parish-less document', () => {
      // Both sides absent must not read as a match.
      expect(access({ req: req(unassigned), data: {} } as any)).toBe(false)
    })

    it('cannot create in an arbitrary parish', () => {
      expect(access({ req: req(unassigned), data: { parish: 7 } } as any)).toBe(false)
    })

    it('is scoped to nothing on read/update', () => {
      expect(access({ req: req(unassigned), id: 42 } as any)).toBe(false)
    })
  })
})

// ─── requirePublishPermission ─────────────────────────────────────────────────

describe('requirePublishPermission', () => {
  const hook = requirePublishPermission('news.publish') as any
  const noPublish = { id: 6, role: 'media-editor', status: 'active', permissionsGrant: ['news.update'] }

  it('blocks a draft→published transition without the permission', () => {
    expect(() =>
      hook({ data: { _status: 'published' }, req: req(noPublish), originalDoc: { _status: 'draft' } }),
    ).toThrow(/permission to publish/i)
  })

  it('blocks publishing a brand-new document without the permission', () => {
    expect(() => hook({ data: { _status: 'published' }, req: req(noPublish), originalDoc: undefined })).toThrow(
      /permission to publish/i,
    )
  })

  it('allows the transition for a holder of the publish permission', () => {
    const data = { _status: 'published' }
    expect(hook({ data, req: req(chancery), originalDoc: { _status: 'draft' } })).toEqual(data)
  })

  it('allows saving a draft without the publish permission', () => {
    const data = { _status: 'draft', title: 'WIP' }
    expect(hook({ data, req: req(noPublish), originalDoc: { _status: 'draft' } })).toEqual(data)
  })

  it('allows editing an already-published document without re-publishing rights', () => {
    // The document is already live; this edit is governed by update access alone.
    const data = { _status: 'published', title: 'Fixed typo' }
    expect(hook({ data, req: req(noPublish), originalDoc: { _status: 'published' } })).toEqual(data)
  })

  it('ignores saves that carry no status at all', () => {
    const data = { title: 'No status field' }
    expect(hook({ data, req: req(noPublish), originalDoc: { _status: 'draft' } })).toEqual(data)
  })
})
