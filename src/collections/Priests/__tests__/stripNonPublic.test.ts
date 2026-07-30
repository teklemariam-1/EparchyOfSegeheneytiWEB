import { describe, it, expect } from 'vitest'
import { stripNonPublicPriestData } from '../hooks/stripNonPublic'

/**
 * These switches decide what the public internet learns about a named living
 * person. The property under test is ABSENCE FROM THE RESPONSE — not absence
 * from the page. A section merely unrendered would still sit in
 * `GET /api/priests` for anyone who looked.
 */

const priest = (over: Record<string, unknown> = {}) => ({
  id: 1,
  fullName: 'Abba Tesfay',
  bio: 'A biography.',
  education: [{ institution: 'Seminary' }],
  contact: { email: 'p@example.org', phone: '+291 1 000 000' },
  ordinationDate: '1994-06-12',
  birthDate: '1966-03-02',
  milestones: [
    { title: 'Ordination', isPublic: true },
    { title: 'A withheld chapter', isPublic: false },
  ],
  galleries: [
    {
      title: 'Ordination',
      isPublic: true,
      images: [
        { caption: 'shown', isPublic: true },
        { caption: 'withheld face', isPublic: false },
      ],
    },
    { title: 'Private album', isPublic: false, images: [] },
  ],
  ...over,
})

const anon = (doc: Record<string, unknown>) =>
  stripNonPublicPriestData({ doc, req: { user: null } } as never) as Record<string, unknown>

const staff = (doc: Record<string, unknown>) =>
  stripNonPublicPriestData({ doc, req: { user: { id: 9 } } } as never) as Record<string, unknown>

describe('defaults protect people, not data', () => {
  it('hides contact when the switch was never set', () => {
    // The case that matters at migration time: every existing priest has no
    // visibility group at all, and none of their phone numbers may leak.
    const result = anon(priest({ visibility: undefined }))
    expect(result.contact).toBeUndefined()
  })

  it('still shows biography, education and history when unset', () => {
    const result = anon(priest({ visibility: undefined }))
    expect(result.bio).toBeDefined()
    expect(result.education).toBeDefined()
    expect(result.milestones).toBeDefined()
  })

  it('never publishes a birth date, whatever the switches say', () => {
    const result = anon(priest({ visibility: { showDates: true } }))
    expect(result.birthDate).toBeUndefined()
    expect(result.ordinationDate).toBeDefined()
  })
})

describe('section switches remove the section entirely', () => {
  it.each([
    ['showBio', 'bio'],
    ['showEducation', 'education'],
    ['showMilestones', 'milestones'],
    ['showGalleries', 'galleries'],
  ])('%s = false removes %s from the response', (flag, field) => {
    const result = anon(priest({ visibility: { [flag]: false } }))
    expect(result[field]).toBeUndefined()
  })

  it('showContact = true publishes contact deliberately', () => {
    const result = anon(priest({ visibility: { showContact: true } }))
    expect(result.contact).toBeDefined()
  })

  it('showDates = false removes the ordination date', () => {
    const result = anon(priest({ visibility: { showDates: false } }))
    expect(result.ordinationDate).toBeUndefined()
    expect(result.fullName).toBeDefined()
  })
})

describe('per-entry withholding', () => {
  it('drops a withheld milestone but keeps the rest', () => {
    const result = anon(priest({ visibility: {} }))
    const milestones = result.milestones as { title: string }[]
    expect(milestones.map((m) => m.title)).toEqual(['Ordination'])
  })

  it('drops a withheld gallery and, inside a shown one, a withheld photograph', () => {
    const result = anon(priest({ visibility: {} }))
    const galleries = result.galleries as { title: string; images: { caption: string }[] }[]
    expect(galleries.map((g) => g.title)).toEqual(['Ordination'])
    expect(galleries[0]!.images.map((i) => i.caption)).toEqual(['shown'])
  })

  it('treats an entry with no flag as public — rows predating the field stay visible', () => {
    const result = anon(priest({ visibility: {}, milestones: [{ title: 'Legacy entry' }] }))
    expect((result.milestones as unknown[]).length).toBe(1)
  })
})

describe('staff see everything', () => {
  it('keeps every withheld section and entry for an authenticated user', () => {
    const result = staff(priest({ visibility: { showBio: false, showContact: false } }))
    expect(result.bio).toBeDefined()
    expect(result.contact).toBeDefined()
    expect((result.milestones as unknown[]).length).toBe(2)
    // Managing what is withheld requires seeing it.
    expect(result.birthDate).toBeDefined()
  })
})
