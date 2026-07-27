import { describe, it, expect, vi } from 'vitest'
import {
  deactivateIncumbent,
  requireSetActivePermission,
} from '../hooks/activation'
import { stripNonPublicEntries } from '../hooks/stripNonPublic'
import { validateGalleryKeys } from '../hooks/validateGalleryKeys'

/**
 * The sitting-Eparch flag decides the name, portrait and title shown across the
 * entire public site, so these cover the three things that must hold: only a
 * super-admin may set it, activating a successor stands the incumbent down in
 * the same transaction, and neither happens on an unrelated save.
 */

const superAdmin = { id: 3, role: 'super-admin', status: 'active' }
const chancery = { id: 1, role: 'chancery-editor', status: 'active' }

/** A req double carrying the payload stub and the transaction Payload threads through hooks. */
function makeReq(user: unknown, incumbents: unknown[] = []) {
  const update = vi.fn().mockResolvedValue({})
  const find = vi.fn().mockResolvedValue({ docs: incumbents })
  return {
    req: { user, payload: { find, update }, transactionID: 'tx-1', headers: new Headers() } as never,
    find,
    update,
  }
}

describe('requireSetActivePermission', () => {
  it('rejects a user without bishops.set_active', async () => {
    const { req } = makeReq(chancery)
    await expect(
      requireSetActivePermission({
        data: { isActive: true },
        req,
        originalDoc: { id: 5, isActive: false },
      } as never),
    ).rejects.toThrow(/permission/i)
  })

  it('rejects an anonymous caller', async () => {
    const { req } = makeReq(null)
    await expect(
      requireSetActivePermission({ data: { isActive: true }, req, originalDoc: undefined } as never),
    ).rejects.toThrow(/permission/i)
  })

  it('allows a super-admin', async () => {
    const { req } = makeReq(superAdmin)
    await expect(
      requireSetActivePermission({
        data: { isActive: true },
        req,
        originalDoc: { id: 5, isActive: false },
      } as never),
    ).resolves.toEqual({ isActive: true })
  })

  it('does not gate an ordinary save on an already-active record', async () => {
    // Editing the biography of the sitting Eparch must not require set_active,
    // or chancery staff could not touch his record at all.
    const { req } = makeReq(chancery)
    await expect(
      requireSetActivePermission({
        data: { isActive: true, biographySummary: 'edited' },
        req,
        originalDoc: { id: 5, isActive: true },
      } as never),
    ).resolves.toBeTruthy()
  })

  it('does not gate deactivation', async () => {
    const { req } = makeReq(chancery)
    await expect(
      requireSetActivePermission({
        data: { isActive: false },
        req,
        originalDoc: { id: 5, isActive: true },
      } as never),
    ).resolves.toBeTruthy()
  })
})

describe('deactivateIncumbent', () => {
  it('stands the incumbent down in the same request/transaction as the promotion', async () => {
    const { req, update } = makeReq(superAdmin, [{ id: 4, isActive: true }])

    await deactivateIncumbent({
      data: { isActive: true },
      req,
      originalDoc: { id: 9, isActive: false },
    } as never)

    expect(update).toHaveBeenCalledTimes(1)
    const call = update.mock.calls[0]![0]
    expect(call.collection).toBe('bishops')
    expect(call.id).toBe(4)
    expect(call.data.isActive).toBe(false)
    // Same `req` object => same transactionID => both writes commit or neither.
    expect(call.req).toBe(req)
  })

  it('closes out the outgoing term when staff left it blank', async () => {
    const { req, update } = makeReq(superAdmin, [{ id: 4, isActive: true }])

    await deactivateIncumbent({
      data: { isActive: true },
      req,
      originalDoc: { id: 9, isActive: false },
    } as never)

    const patch = update.mock.calls[0]![0].data
    expect(patch.termEnd).toBeTruthy()
    expect(patch.termEndReason).toBe('other')
  })

  it('never overwrites a term end the chancery already recorded', async () => {
    const recorded = '2023-11-02T00:00:00.000Z'
    const { req, update } = makeReq(superAdmin, [
      { id: 4, isActive: true, termEnd: recorded, termEndReason: 'retired' },
    ])

    await deactivateIncumbent({
      data: { isActive: true },
      req,
      originalDoc: { id: 9, isActive: false },
    } as never)

    const patch = update.mock.calls[0]![0].data
    expect(patch).not.toHaveProperty('termEnd')
    expect(patch).not.toHaveProperty('termEndReason')
    expect(patch.isActive).toBe(false)
  })

  it('does not demote the record being saved', async () => {
    const { req, update } = makeReq(superAdmin, [{ id: 9, isActive: true }])

    await deactivateIncumbent({
      data: { isActive: true },
      req,
      originalDoc: { id: 9, isActive: false },
    } as never)

    expect(update).not.toHaveBeenCalled()
  })

  it('does nothing on a save that is not an activation', async () => {
    const { req, find, update } = makeReq(superAdmin, [{ id: 4, isActive: true }])

    await deactivateIncumbent({
      data: { biographySummary: 'edited' },
      req,
      originalDoc: { id: 9, isActive: false },
    } as never)

    expect(find).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})

/**
 * Withheld entries must be absent from the API response, not merely unrendered.
 * Field-level access cannot do this — `isPublic` is a per-row flag inside an
 * array, and access is evaluated per field.
 */
describe('stripNonPublicEntries', () => {
  const doc = () => ({
    fullName: 'Abune Test',
    milestones: [
      { title: 'public', isPublic: true, links: [{ url: 'a', isPublic: true }] },
      { title: 'withheld', isPublic: false },
      { title: 'legacy-no-flag', links: [{ url: 'b', isPublic: false }] },
    ],
    honors: [{ name: 'shown' }, { name: 'hidden', isPublic: false }],
    education: [{ institution: 'kept' }, { institution: 'dropped', isPublic: false }],
    pastoralPriorities: [{ title: 'hidden', isPublic: false }],
    links: [{ url: 'public' }, { url: 'private', isPublic: false }],
    documents: [{ title: 'private', isPublic: false }],
    galleries: [
      {
        key: 'g1',
        images: [{ caption: 'shown' }, { caption: 'hidden', isPublic: false }],
      },
      { key: 'g2', isPublic: false, images: [{ caption: 'x' }] },
    ],
  })

  const anonymous = { req: { user: null } } as never

  it('removes every isPublic:false entry for an anonymous caller', () => {
    const result = stripNonPublicEntries({ doc: doc(), ...anonymous } as never) as Record<
      string,
      any
    >

    expect(result.milestones.map((m: any) => m.title)).toEqual(['public', 'legacy-no-flag'])
    expect(result.honors).toHaveLength(1)
    expect(result.education).toHaveLength(1)
    expect(result.pastoralPriorities).toHaveLength(0)
    expect(result.links).toHaveLength(1)
    expect(result.documents).toHaveLength(0)
  })

  it('strips withheld links nested inside a public milestone', () => {
    const result = stripNonPublicEntries({ doc: doc(), ...anonymous } as never) as Record<
      string,
      any
    >
    const legacy = result.milestones.find((m: any) => m.title === 'legacy-no-flag')
    expect(legacy.links).toHaveLength(0)
  })

  it('strips withheld galleries and withheld images inside a public gallery', () => {
    const result = stripNonPublicEntries({ doc: doc(), ...anonymous } as never) as Record<
      string,
      any
    >
    expect(result.galleries).toHaveLength(1)
    expect(result.galleries[0].key).toBe('g1')
    expect(result.galleries[0].images).toHaveLength(1)
  })

  it('treats an entry with no flag as public, so records predating the flag stay visible', () => {
    const result = stripNonPublicEntries({ doc: doc(), ...anonymous } as never) as Record<
      string,
      any
    >
    expect(result.milestones.some((m: any) => m.title === 'legacy-no-flag')).toBe(true)
  })

  it('returns everything to an authenticated editor', () => {
    const result = stripNonPublicEntries({
      doc: doc(),
      req: { user: { id: 1 } },
    } as never) as Record<string, any>

    expect(result.milestones).toHaveLength(3)
    expect(result.galleries).toHaveLength(2)
  })
})

describe('validateGalleryKeys', () => {
  it('rejects a milestone pointing at a gallery key that does not exist', () => {
    expect(() =>
      validateGalleryKeys({
        data: {
          milestones: [{ galleryKey: 'consecration-2024' }],
          galleries: [{ key: 'pastoral-visits' }],
        },
      } as never),
    ).toThrow(/consecration-2024/)
  })

  it('accepts a milestone whose key matches a gallery', () => {
    expect(() =>
      validateGalleryKeys({
        data: {
          milestones: [{ galleryKey: 'pastoral-visits' }],
          galleries: [{ key: 'pastoral-visits' }],
        },
      } as never),
    ).not.toThrow()
  })

  it('accepts a milestone with no gallery link', () => {
    expect(() =>
      validateGalleryKeys({ data: { milestones: [{ title: 'x' }], galleries: [] } } as never),
    ).not.toThrow()
  })
})
