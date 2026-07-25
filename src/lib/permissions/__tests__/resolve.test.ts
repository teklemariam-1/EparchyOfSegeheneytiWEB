import { describe, it, expect } from 'vitest'
import { getEffectivePermissions, hasPermission, isActive, type AuthUser } from '../resolve'
import { PERMISSIONS, PRESET_PERMISSIONS } from '../permissions'

const user = (over: Partial<AuthUser>): AuthUser => ({ id: '1', role: 'chancery-editor', status: 'active', ...over })

describe('super-admin short-circuit', () => {
  it('grants the entire catalog', () => {
    const su = user({ role: 'super-admin' })
    expect(getEffectivePermissions(su)).toHaveLength(PERMISSIONS.length)
    expect(hasPermission(su, 'users.manage')).toBe(true)
    expect(hasPermission(su, 'system.maintenance-mode')).toBe(true)
    expect(hasPermission(su, 'donations.config')).toBe(true)
  })
})

describe('preset mapping preserves prior access', () => {
  it('chancery-editor can manage content + publish but not super-only actions', () => {
    const u = user({ role: 'chancery-editor' })
    expect(hasPermission(u, 'news.publish')).toBe(true)
    expect(hasPermission(u, 'donations.view')).toBe(true)
    expect(hasPermission(u, 'globals.header.edit')).toBe(true)
    // super-only:
    expect(hasPermission(u, 'users.manage')).toBe(false)
    expect(hasPermission(u, 'donations.config')).toBe(false)
    expect(hasPermission(u, 'system.maintenance-mode')).toBe(false)
    expect(hasPermission(u, 'archives.delete')).toBe(false)
    expect(hasPermission(u, 'audit-log.view')).toBe(false)
  })

  it('parish-editor is scoped to own-parish writes + ministries + media upload', () => {
    const u = user({ role: 'parish-editor' })
    expect(hasPermission(u, 'events.manage-own')).toBe(true)
    expect(hasPermission(u, 'parishes.update-own')).toBe(true)
    expect(hasPermission(u, 'ministries.update')).toBe(true)
    expect(hasPermission(u, 'media.upload')).toBe(true)
    expect(hasPermission(u, 'news.create')).toBe(false)
    expect(hasPermission(u, 'events.publish')).toBe(false)
  })

  it('youth-editor and catechist-editor are identical today', () => {
    expect(PRESET_PERMISSIONS['youth-editor']).toEqual(PRESET_PERMISSIONS['catechist-editor'])
  })

  it('media-editor can delete media, others (non-super/chancery) cannot', () => {
    expect(hasPermission(user({ role: 'media-editor' }), 'media.delete')).toBe(true)
    expect(hasPermission(user({ role: 'youth-editor' }), 'media.delete')).toBe(false)
    // but everyone authenticated can upload media (preserves isAnyEditor behavior)
    expect(hasPermission(user({ role: 'youth-editor' }), 'media.upload')).toBe(true)
  })
})

describe('per-user overrides', () => {
  it('grant adds a permission on top of the preset', () => {
    const u = user({ role: 'chancery-editor', permissionsGrant: ['donations.config'] })
    expect(hasPermission(u, 'donations.config')).toBe(true)
  })

  it('revoke removes a preset permission', () => {
    const u = user({ role: 'chancery-editor', permissionsRevoke: ['feed-sources.manage'] })
    expect(hasPermission(u, 'feed-sources.manage')).toBe(false)
  })

  it('ignores unknown permission strings in effective set', () => {
    const u = user({ role: 'parish-editor', permissionsGrant: ['not.a.real.permission'] })
    expect(getEffectivePermissions(u)).not.toContain('not.a.real.permission')
  })
})

describe('account status gating', () => {
  it('suspended user (even super-admin) has no permissions', () => {
    const su = user({ role: 'super-admin', status: 'suspended' })
    expect(isActive(su)).toBe(false)
    expect(getEffectivePermissions(su)).toEqual([])
    expect(hasPermission(su, 'news.create')).toBe(false)
  })

  it('expired temporary account has no permissions', () => {
    const u = user({ role: 'chancery-editor', expiresAt: '2000-01-01T00:00:00.000Z' })
    expect(isActive(u)).toBe(false)
    expect(hasPermission(u, 'news.create')).toBe(false)
  })

  it('a future expiry is still active', () => {
    const u = user({ role: 'chancery-editor', expiresAt: '2999-01-01T00:00:00.000Z' })
    expect(isActive(u)).toBe(true)
    expect(hasPermission(u, 'news.create')).toBe(true)
  })

  it('anonymous / null user holds nothing', () => {
    expect(hasPermission(null, 'news.create')).toBe(false)
    expect(getEffectivePermissions(undefined)).toEqual([])
  })
})
