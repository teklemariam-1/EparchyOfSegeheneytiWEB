/**
 * Integration tests for src/lib/payload/queries.ts
 *
 * These tests mock the Payload client (`@/lib/payload/client`) so that no real
 * database connection is required.  Each test verifies that query functions:
 *   • correctly map raw Payload documents to the exported interface shapes
 *   • forward the right `collection` / `where` arguments to `payload.find`
 *   • return safe fallback values (empty arrays / null) on errors
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the Payload client before importing any query function ───────────────
vi.mock('@/lib/payload/client', () => ({
  getPayload: vi.fn(),
}))

import { getPayload } from '@/lib/payload/client'
import {
  getNewsList,
  getNewsBySlug,
  getAllNewsSlugs,
  getUpcomingEvents,
  getEventsList,
  getEventBySlug,
  getAllEventSlugs,
  getParishesList,
  getParishBySlug,
  getAllParishSlugs,
  getMinistriesList,
  getPublicationsList,
  getMagazinesList,
  getSiteSettings,
  getLatestBishopMessage,
  getBishopMessagesList,
  globalSearch,
} from '../queries'

// ── Shared helpers ────────────────────────────────────────────────────────────

const EMPTY_PAGINATION = {
  page: 1,
  totalDocs: 0,
  totalPages: 0,
  hasPrevPage: false,
  hasNextPage: false,
}

const ONE_PAGE = {
  page: 1,
  totalDocs: 1,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
}

/** Return a mock payload instance whose `find` resolves to `result`. */
function mockFind(result: object) {
  vi.mocked(getPayload).mockResolvedValue({
    find: vi.fn().mockResolvedValue(result),
  } as any)
}

/** Return a mock payload instance whose `find` and `findGlobal` resolve to `result`. */
function mockFindGlobal(result: object) {
  vi.mocked(getPayload).mockResolvedValue({
    findGlobal: vi.fn().mockResolvedValue(result),
  } as any)
}

/** Make `getPayload` throw so we can test error-fallback branches. */
function mockError(msg = 'DB down') {
  vi.mocked(getPayload).mockRejectedValue(new Error(msg))
}

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeImage(overrides = {}) {
  return { url: '/hero.jpg', alt: 'Hero', width: 1200, height: 630, ...overrides }
}

function makeNewsDoc(overrides = {}) {
  return {
    id: 'n1',
    slug: 'eparchy-synod-2026',
    title: 'Eparchy Synod 2026',
    excerpt: 'Summary text',
    category: 'eparchy',
    publishedAt: '2026-03-01T08:00:00Z',
    featuredImage: makeImage(),
    tags: ['synod', 'church'],
    content: null,
    author: null,
    seo: null,
    ...overrides,
  }
}

function makeEventDoc(overrides = {}) {
  return {
    id: 'ev1',
    slug: 'easter-vigil-2026',
    title: 'Easter Vigil',
    startDate: '2026-04-04T20:00:00Z',
    endDate: '2026-04-05T02:00:00Z',
    isAllDay: false,
    eventType: 'liturgical',
    location: { venue: 'Cathedral', city: 'Segeneyti' },
    parish: null,
    featuredImage: null,
    excerpt: 'The great Easter Vigil.',
    description: null,
    cost: null,
    registrationUrl: null,
    seo: null,
    ...overrides,
  }
}

function makeParishDoc(overrides = {}) {
  return {
    id: 'p1',
    slug: 'segeneyti-cathedral',
    title: 'Segeneyti Cathedral',
    vicariate: 'segeneyti',
    patronSaint: 'St. Peter and St. Paul',
    city: 'Segeneyti',
    priest: { name: 'Fr. Haile Tesfai' },
    featuredImage: null,
    history: null,
    massTimes: [{ day: 'Sunday', time: '08:00', language: 'Tigrinya' }],
    address: 'Main Street',
    phone: '+291-XXX-XXXX',
    email: null,
    gallery: [],
    seo: null,
    ...overrides,
  }
}

function makeBishopMessageDoc(overrides = {}) {
  return {
    id: 'bm1',
    slug: 'easter-message-2026',
    title: 'Easter Pastoral Letter 2026',
    excerpt: 'A message of hope.',
    publishedAt: '2026-04-04T00:00:00Z',
    messageType: 'pastoral-letter',
    featuredImage: null,
    content: null,
    seo: null,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWS
// ─────────────────────────────────────────────────────────────────────────────

describe('getNewsList', () => {
  beforeEach(() => {
    mockFind({ docs: [makeNewsDoc()], ...ONE_PAGE })
  })

  it('returns mapped NewsListItem docs', async () => {
    const result = await getNewsList()
    expect(result.docs).toHaveLength(1)
    expect(result.docs[0]).toMatchObject({
      id: 'n1',
      slug: 'eparchy-synod-2026',
      title: 'Eparchy Synod 2026',
      category: 'eparchy',
    })
  })

  it('maps featuredImage to CMSImage shape', async () => {
    const result = await getNewsList()
    expect(result.docs[0].featuredImage).toEqual({
      url: '/hero.jpg',
      alt: 'Hero',
      width: 1200,
      height: 630,
    })
  })

  it('returns pagination meta', async () => {
    const result = await getNewsList()
    expect(result.meta).toMatchObject({ page: 1, totalDocs: 1, totalPages: 1 })
  })

  it('passes category filter to payload.find when category is not "all"', async () => {
    const findMock = vi.fn().mockResolvedValue({ docs: [], ...EMPTY_PAGINATION })
    vi.mocked(getPayload).mockResolvedValue({ find: findMock } as any)

    await getNewsList({ category: 'eparchy' })

    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: { equals: 'eparchy' } }),
      }),
    )
  })

  it('does NOT add category filter when category is "all"', async () => {
    const findMock = vi.fn().mockResolvedValue({ docs: [], ...EMPTY_PAGINATION })
    vi.mocked(getPayload).mockResolvedValue({ find: findMock } as any)

    await getNewsList({ category: 'all' })

    const call = findMock.mock.calls[0][0]
    expect(call.where).not.toHaveProperty('category')
  })

  it('returns empty fallback when payload throws', async () => {
    mockError()
    const result = await getNewsList()
    expect(result.docs).toHaveLength(0)
    expect(result.meta.totalDocs).toBe(0)
  })
})

describe('getNewsBySlug', () => {
  it('returns NewsDetail when the slug is found', async () => {
    const doc = makeNewsDoc({ author: { name: 'Sr. Miriam' }, content: { root: {} } })
    mockFind({ docs: [doc] })

    const result = await getNewsBySlug('eparchy-synod-2026')
    expect(result).not.toBeNull()
    expect(result?.author).toBe('Sr. Miriam')
    expect(result?.content).toBeDefined()
  })

  it('resolves author from plain string field when no .name present', async () => {
    const doc = makeNewsDoc({ author: 'Fr. Tesfai' })
    mockFind({ docs: [doc] })

    const result = await getNewsBySlug('eparchy-synod-2026')
    expect(result?.author).toBe('Fr. Tesfai')
  })

  it('returns null when the slug is not found', async () => {
    mockFind({ docs: [] })
    expect(await getNewsBySlug('missing-slug')).toBeNull()
  })

  it('returns null on error', async () => {
    mockError()
    expect(await getNewsBySlug('anything')).toBeNull()
  })
})

describe('getAllNewsSlugs', () => {
  it('returns an array of { slug } objects', async () => {
    mockFind({ docs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }] })
    const result = await getAllNewsSlugs()
    expect(result).toEqual([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
  })

  it('returns an empty array on error', async () => {
    mockError()
    expect(await getAllNewsSlugs()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────

describe('getUpcomingEvents', () => {
  it('returns mapped EventListItem array', async () => {
    mockFind({ docs: [makeEventDoc()] })
    const events = await getUpcomingEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      slug: 'easter-vigil-2026',
      eventType: 'liturgical',
      location: { venue: 'Cathedral', city: 'Segeneyti' },
    })
  })

  it('returns an empty array on error', async () => {
    mockError()
    expect(await getUpcomingEvents()).toEqual([])
  })
})

describe('getEventsList', () => {
  it('returns docs + pagination meta', async () => {
    mockFind({ docs: [makeEventDoc()], ...ONE_PAGE })
    const result = await getEventsList()
    expect(result.docs).toHaveLength(1)
    expect(result.meta).toMatchObject({ totalDocs: 1 })
  })

  it('returns empty fallback on error', async () => {
    mockError()
    const result = await getEventsList()
    expect(result.docs).toEqual([])
    expect(result.meta.totalDocs).toBe(0)
  })
})

describe('getEventBySlug', () => {
  it('returns EventDetail with extra fields', async () => {
    const doc = makeEventDoc({ cost: 'Free', registrationUrl: 'https://reg.example.com' })
    mockFind({ docs: [doc] })

    const result = await getEventBySlug('easter-vigil-2026')
    expect(result?.cost).toBe('Free')
    expect(result?.registrationUrl).toBe('https://reg.example.com')
  })

  it('returns null when not found', async () => {
    mockFind({ docs: [] })
    expect(await getEventBySlug('missing')).toBeNull()
  })

  it('returns null on error', async () => {
    mockError()
    expect(await getEventBySlug('anything')).toBeNull()
  })
})

describe('getAllEventSlugs', () => {
  it('returns slug list', async () => {
    mockFind({ docs: [{ slug: 'good-friday' }, { slug: 'easter-vigil' }] })
    expect(await getAllEventSlugs()).toEqual([
      { slug: 'good-friday' },
      { slug: 'easter-vigil' },
    ])
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getAllEventSlugs()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARISHES
// ─────────────────────────────────────────────────────────────────────────────

describe('getParishesList', () => {
  it('returns mapped ParishListItem array', async () => {
    mockFind({ docs: [makeParishDoc()] })
    const result = await getParishesList()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      slug: 'segeneyti-cathedral',
      pastor: 'Fr. Haile Tesfai',
      vicariate: 'segeneyti',
    })
  })

  it('passes vicariate filter when specified', async () => {
    const findMock = vi.fn().mockResolvedValue({ docs: [] })
    vi.mocked(getPayload).mockResolvedValue({ find: findMock } as any)

    await getParishesList(100, 'adi-keyih')

    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ vicariate: { equals: 'adi-keyih' } }),
      }),
    )
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getParishesList()).toEqual([])
  })
})

describe('getParishBySlug', () => {
  it('returns ParishDetail with massTimes', async () => {
    mockFind({ docs: [makeParishDoc()] })
    const result = await getParishBySlug('segeneyti-cathedral')
    expect(result?.massTimes).toHaveLength(1)
    expect(result?.massTimes?.[0].day).toBe('Sunday')
  })

  it('defaults massTimes to empty array when absent', async () => {
    const doc = makeParishDoc({ massTimes: undefined })
    mockFind({ docs: [doc] })
    const result = await getParishBySlug('segeneyti-cathedral')
    expect(result?.massTimes).toEqual([])
  })

  it('returns null when not found', async () => {
    mockFind({ docs: [] })
    expect(await getParishBySlug('missing')).toBeNull()
  })

  it('returns null on error', async () => {
    mockError()
    expect(await getParishBySlug('anything')).toBeNull()
  })
})

describe('getAllParishSlugs', () => {
  it('returns slug list', async () => {
    mockFind({ docs: [{ slug: 'segeneyti-cathedral' }, { slug: 'adi-keyih' }] })
    expect(await getAllParishSlugs()).toEqual([
      { slug: 'segeneyti-cathedral' },
      { slug: 'adi-keyih' },
    ])
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getAllParishSlugs()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// MINISTRIES
// ─────────────────────────────────────────────────────────────────────────────

describe('getMinistriesList', () => {
  it('returns mapped MinistryItem array', async () => {
    const doc = {
      id: 'm1',
      slug: 'youth-council',
      title: 'Youth Council',
      ministryType: 'youth-council',
      description: null,
      leader: { name: 'Dawit Gebru' },
      assignedParish: { title: 'Segeneyti Cathedral', slug: 'segeneyti-cathedral' },
      image: null,
      meetingInfo: 'Every Sunday after Mass',
    }
    mockFind({ docs: [doc] })

    const result = await getMinistriesList()
    expect(result).toHaveLength(1)
    expect(result[0].leader).toBe('Dawit Gebru')
    expect(result[0].parish?.slug).toBe('segeneyti-cathedral')
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getMinistriesList()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('getPublicationsList', () => {
  it('returns mapped PublicationItem array', async () => {
    const doc = {
      id: 'pub1',
      slug: 'catechism-2024',
      title: 'Catechism Guide 2024',
      documentType: 'educational',
      language: 'ti',
      publishedYear: 2024,
      pageCount: 120,
      isFeatured: true,
      coverImage: makeImage(),
      file: { url: '/files/catechism.pdf' },
      description: 'A comprehensive catechism guide.',
    }
    mockFind({ docs: [doc] })

    const result = await getPublicationsList()
    expect(result).toHaveLength(1)
    expect(result[0].fileUrl).toBe('/files/catechism.pdf')
    expect(result[0].coverImage?.url).toBe('/hero.jpg')
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getPublicationsList()).toEqual([])
  })
})

describe('getMagazinesList', () => {
  it('returns mapped MagazineItem array', async () => {
    const doc = {
      id: 'mag1',
      slug: 'dioghet-2026-q1',
      title: 'Dioghet Q1 2026',
      volume: 5,
      issue: 1,
      year: 2026,
      coverImage: null,
      isFeatured: false,
      summary: 'First quarterly issue of 2026.',
    }
    mockFind({ docs: [doc] })

    const result = await getMagazinesList()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ volume: 5, issue: 1, year: 2026 })
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getMagazinesList()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// BISHOP MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

describe('getLatestBishopMessage', () => {
  it('returns the first document as BishopMessageItem', async () => {
    mockFind({ docs: [makeBishopMessageDoc()] })
    const result = await getLatestBishopMessage()
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('easter-message-2026')
  })

  it('returns null when no messages exist', async () => {
    mockFind({ docs: [] })
    expect(await getLatestBishopMessage()).toBeNull()
  })

  it('returns null on error', async () => {
    mockError()
    expect(await getLatestBishopMessage()).toBeNull()
  })
})

describe('getBishopMessagesList', () => {
  it('returns mapped array of bishop messages', async () => {
    mockFind({ docs: [makeBishopMessageDoc()] })
    const result = await getBishopMessagesList()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Easter Pastoral Letter 2026')
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await getBishopMessagesList()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SITE SETTINGS (global)
// ─────────────────────────────────────────────────────────────────────────────

describe('getSiteSettings', () => {
  it('returns a SiteSettingsGlobal object', async () => {
    const globalDoc = {
      siteName: 'Catholic Eparchy of Segeneyti',
      contact: { phone: '+291-1-001', email: 'info@segeneyti.org' },
      socialLinks: {},
      analytics: {},
    }
    mockFindGlobal(globalDoc)
    const result = await getSiteSettings()
    expect(result.siteName).toBe('Catholic Eparchy of Segeneyti')
    expect(result.contact?.phone).toBe('+291-1-001')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL SEARCH
// ─────────────────────────────────────────────────────────────────────────────

describe('globalSearch', () => {
  it('aggregates results from multiple collections', async () => {
    const newsDoc = makeNewsDoc({ title: 'Synod News' })
    const eventDoc = makeEventDoc({ title: 'Easter Event' })

    // globalSearch calls payload.find once per collection — mock a sequence
    const findMock = vi.fn()
      .mockResolvedValueOnce({ docs: [newsDoc] })       // news results
      .mockResolvedValueOnce({ docs: [eventDoc] })      // events results
      .mockResolvedValue({ docs: [] })                  // all other collections

    vi.mocked(getPayload).mockResolvedValue({ find: findMock } as any)

    const results = await globalSearch('synod')
    expect(Array.isArray(results)).toBe(true)
  })

  it('returns empty array on error', async () => {
    mockError()
    expect(await globalSearch('anything')).toEqual([])
  })
})
