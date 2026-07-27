import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Field } from 'payload'
import { Bishops } from '../index'
import { internalTab } from '../fields/internal'
import { PERMISSIONS, PRESET_PERMISSIONS } from '../../../lib/permissions/permissions'
import { validateHttpUrl } from '../fields/shared'
import { MILESTONE_PERIOD, MILESTONE_TYPE_LABELS } from '../terminology'

/**
 * Structural guarantees that no runtime test can stand in for.
 *
 * The single-active rule and the internal-field protection are both things that
 * fail SILENTLY if they regress — a dropped field-access block leaks private
 * contact details into /api/bishops with every page still rendering correctly,
 * and a lost index lets two Eparchs be active with no error anywhere.
 */

describe('single sitting Eparch', () => {
  const migration = readFileSync(
    join(process.cwd(), 'src/migrations/20260726_131455_bishops_collection.ts'),
    'utf8',
  )

  it('is enforced by a partial unique index in Postgres, not only by the hook', () => {
    // A hook cannot survive a race between two concurrent saves or a direct SQL
    // write; this index is the layer that actually holds.
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX "bishops_single_active_idx" ON "bishops" \("is_active"\) WHERE "is_active" = true/,
    )
  })

  it('is partial, so more than one INACTIVE Eparch is still allowed', () => {
    // A plain unique index on is_active would permit exactly one false row —
    // i.e. one predecessor in the entire history of the eparchy.
    const indexLine = migration
      .split('\n')
      .find((line) => line.includes('bishops_single_active_idx') && line.includes('CREATE'))
    expect(indexLine).toContain('WHERE "is_active" = true')
  })

  it('drops the index on the way down', () => {
    expect(migration).toContain('DROP INDEX IF EXISTS "bishops_single_active_idx"')
  })
})

describe('permissions', () => {
  it('registers the full set the module enforces', () => {
    for (const permission of [
      'bishops.view',
      'bishops.create',
      'bishops.edit',
      'bishops.delete',
      'bishops.publish',
      'bishops.set_active',
    ]) {
      expect(PERMISSIONS).toContain(permission)
    }
  })

  it('withholds set_active from every role preset', () => {
    // super-admin is granted the whole catalog by short-circuit in the resolver,
    // so absence from every preset is exactly "super-admin only".
    for (const [role, permissions] of Object.entries(PRESET_PERMISSIONS)) {
      expect(permissions, `${role} must not hold bishops.set_active`).not.toContain(
        'bishops.set_active',
      )
    }
  })

  it('still lets chancery editors maintain the records', () => {
    expect(PRESET_PERMISSIONS['chancery-editor']).toContain('bishops.edit')
    expect(PRESET_PERMISSIONS['chancery-editor']).toContain('bishops.publish')
  })
})

describe('internal fields', () => {
  /** Walk nested fields so a block moved into a row or group is still found. */
  function collect(fields: Field[]): Field[] {
    return fields.flatMap((field) => [
      field,
      ...('fields' in field && Array.isArray(field.fields) ? collect(field.fields as Field[]) : []),
    ])
  }

  it('declare field-level read access, so they are absent from the API rather than merely unrendered', () => {
    const named = internalTab.filter((f) => 'name' in f)
    expect(named.length).toBeGreaterThan(0)
    for (const field of named) {
      expect(
        (field as { access?: { read?: unknown } }).access?.read,
        `${(field as { name: string }).name} must gate reads`,
      ).toBeTypeOf('function')
    }
  })

  it('encrypts private contact details at rest', () => {
    const group = internalTab.find(
      (f) => 'name' in f && (f as { name: string }).name === 'privateContact',
    )
    const inner = collect(((group as { fields?: Field[] }).fields ?? []) as Field[])
    for (const name of ['phone', 'email']) {
      const field = inner.find((f) => 'name' in f && (f as { name: string }).name === name)
      expect((field as { hooks?: { beforeChange?: unknown[] } })?.hooks?.beforeChange).toHaveLength(1)
    }
  })
})

describe('collection configuration', () => {
  it('enables drafts, so a record can be prepared before an appointment is public', () => {
    expect(Bishops.versions).toMatchObject({ drafts: true })
  })

  it('constrains anonymous reads to published records', () => {
    const read = Bishops.access?.read as (args: unknown) => unknown
    expect(read({ req: { user: null } })).toEqual({ _status: { equals: 'published' } })
    expect(read({ req: { user: { id: 1 } } })).toBe(true)
  })

  it('gates writes on the bishops permissions', () => {
    const create = Bishops.access?.create as (args: unknown) => unknown
    expect(create({ req: { user: null } })).toBe(false)
    expect(create({ req: { user: { id: 1, role: 'super-admin', status: 'active' } } })).toBe(true)
  })
})

describe('terminology', () => {
  it('assigns every milestone type to a life period, so none can vanish from the timeline', () => {
    for (const type of Object.keys(MILESTONE_TYPE_LABELS)) {
      expect(MILESTONE_PERIOD).toHaveProperty(type)
    }
  })
})

describe('validateHttpUrl', () => {
  it('accepts absolute http and https addresses', () => {
    expect(validateHttpUrl('https://www.vatican.va/x')).toBe(true)
    expect(validateHttpUrl('http://example.org')).toBe(true)
  })

  it('rejects a scheme-less address rather than guessing one', () => {
    expect(validateHttpUrl('vatican.va')).toBeTypeOf('string')
  })

  it('rejects javascript: and other non-web schemes', () => {
    expect(validateHttpUrl('javascript:alert(1)')).toBeTypeOf('string')
    expect(validateHttpUrl('file:///etc/passwd')).toBeTypeOf('string')
  })

  it('allows an empty value, since links are optional', () => {
    expect(validateHttpUrl('')).toBe(true)
    expect(validateHttpUrl(null)).toBe(true)
  })
})
