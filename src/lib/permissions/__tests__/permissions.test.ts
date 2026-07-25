import { describe, it, expect } from 'vitest'
import { PERMISSIONS, PRESET_PERMISSIONS, isKnownPermission, permissionLabel } from '../permissions'
import { getEffectivePermissions } from '../resolve'
import { ROLES } from '../../constants/roles'

/**
 * Integrity checks on the catalog itself. Presets are hand-maintained lists of
 * catalog strings, so they can drift from it — a typo'd entry silently grants
 * nothing, and an entry added to a preset by accident silently widens access for
 * every user holding that role. These tests fail on both.
 */

describe('the catalog', () => {
  it('has no duplicate entries', () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length)
  })

  it('uses resource.action strings throughout', () => {
    for (const permission of PERMISSIONS) {
      expect(permission).toMatch(/^[a-z0-9-]+(\.[a-z0-9_-]+)+$/)
    }
  })

  it('recognizes its own entries and nothing else', () => {
    for (const permission of PERMISSIONS) expect(isKnownPermission(permission)).toBe(true)
    expect(isKnownPermission('news.destroy')).toBe(false)
    expect(isKnownPermission('')).toBe(false)
  })
})

describe('permissionLabel', () => {
  it.each([
    ['news.create', 'News · Create'],
    ['media.view-restricted', 'Media · View Restricted'],
    ['globals.about-page.edit', 'Globals · About Page · Edit'],
    ['contact-submissions.publish-qa', 'Contact Submissions · Publish Q&A'],
    ['geez-calendar.import', "Ge'ez Calendar · Import"],
    ['small-christian-communities.manage-own', 'Small Christian Communities · Manage Own'],
    ['system.maintenance-mode', 'System · Maintenance Mode'],
  ])('renders %s as "%s"', (permission, expected) => {
    expect(permissionLabel(permission)).toBe(expected)
  })

  it('produces a distinct label for every catalog entry', () => {
    // Two permissions sharing a label would be indistinguishable in the picker.
    const labels = PERMISSIONS.map(permissionLabel)
    expect(new Set(labels).size).toBe(PERMISSIONS.length)
  })

  it('never leaves a raw separator in the output', () => {
    for (const permission of PERMISSIONS) {
      const label = permissionLabel(permission)
      expect(label).not.toMatch(/[._-]/)
    }
  })
})

describe('presets', () => {
  const presetNames = Object.keys(PRESET_PERMISSIONS) as (keyof typeof PRESET_PERMISSIONS)[]

  it('covers every role except super-admin', () => {
    expect(new Set(presetNames)).toEqual(new Set(ROLES.filter((r) => r !== 'super-admin')))
  })

  it('never enumerates super-admin — the resolver short-circuits it', () => {
    // Listing it here would mean a new catalog entry silently skips super-admin.
    expect(presetNames).not.toContain('super-admin')
  })

  it.each(presetNames)('%s contains only known permissions', (name) => {
    const unknown = PRESET_PERMISSIONS[name].filter((p) => !isKnownPermission(p))
    expect(unknown).toEqual([])
  })

  it.each(presetNames)('%s lists no permission twice', (name) => {
    const list = PRESET_PERMISSIONS[name]
    expect(new Set(list).size).toBe(list.length)
  })

  it.each(presetNames)('%s falls short of the full catalog', (name) => {
    // A preset equal to the catalog would be an accidental second super-admin.
    expect(PRESET_PERMISSIONS[name].length).toBeLessThan(PERMISSIONS.length)
  })
})

describe('permissions reserved to super-admin', () => {
  // These are the actions that were super-admin-only before the permission
  // system existed; no preset may hand them out without a deliberate change here.
  const RESERVED = [
    'users.manage',
    'audit-log.view',
    'donations.config',
    'donations.delete',
    'archives.delete',
    'subscribers.delete',
    'visitor-stats.delete',
    'contact-submissions.delete',
    'system.maintenance-mode',
  ] as const

  it.each(RESERVED)('%s belongs to no role preset', (permission) => {
    const holders = Object.entries(PRESET_PERMISSIONS)
      .filter(([, list]) => (list as string[]).includes(permission))
      .map(([role]) => role)
    expect(holders).toEqual([])
  })

  it('super-admin still holds all of them', () => {
    const effective = getEffectivePermissions({ id: 1, role: 'super-admin', status: 'active' })
    for (const permission of RESERVED) expect(effective).toContain(permission)
  })
})

describe('every catalog entry is reachable', () => {
  it('is held by super-admin, a preset, or is grantable per user', () => {
    // Sanity check on the resolver's short-circuit: super-admin covers the
    // catalog exactly, so no entry can be orphaned by a preset omission.
    const effective = getEffectivePermissions({ id: 1, role: 'super-admin', status: 'active' })
    expect(new Set(effective)).toEqual(new Set(PERMISSIONS))
  })
})
