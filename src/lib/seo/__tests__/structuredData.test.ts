import { describe, it, expect } from 'vitest'
import {
  websiteSchema,
  organizationSchema,
  articleSchema,
  eventSchema,
  personSchema,
} from '../structuredData'

// ─── websiteSchema ───────────────────────────────────────────────────────────

describe('websiteSchema', () => {
  it('returns @type WebSite', () => {
    expect(websiteSchema()['@type']).toBe('WebSite')
  })

  it('includes the site name', () => {
    expect(websiteSchema().name).toBe('Catholic Eparchy of Segeneyti')
  })

  it('advertises English and Tigrinya languages', () => {
    const { inLanguage } = websiteSchema()
    expect(inLanguage).toContain('en')
    expect(inLanguage).toContain('ti')
  })
})

// ─── organizationSchema ──────────────────────────────────────────────────────

describe('organizationSchema', () => {
  it('returns @type ReligiousOrganization', () => {
    expect(organizationSchema()['@type']).toBe('ReligiousOrganization')
  })

  it('includes the Segeneyti address locality', () => {
    const schema = organizationSchema()
    expect((schema.address as { addressLocality: string }).addressLocality).toBe('Segeneyti')
  })

  it('uses country code ER (Eritrea)', () => {
    const schema = organizationSchema()
    expect((schema.address as { addressCountry: string }).addressCountry).toBe('ER')
  })

  it('includes a logo URL', () => {
    expect(organizationSchema().logo).toContain('logo.png')
  })
})

// ─── articleSchema ───────────────────────────────────────────────────────────

const ARTICLE_BASE = {
  title: 'Palm Sunday Procession',
  publishedAt: '2026-04-05T08:00:00Z',
  slug: 'palm-sunday-procession',
}

describe('articleSchema', () => {
  it('returns @type NewsArticle', () => {
    expect(articleSchema(ARTICLE_BASE)['@type']).toBe('NewsArticle')
  })

  it('sets headline to the title', () => {
    expect(articleSchema(ARTICLE_BASE).headline).toBe('Palm Sunday Procession')
  })

  it('constructs the article URL from the slug', () => {
    const schema = articleSchema(ARTICLE_BASE)
    expect(schema.url).toContain('/news/palm-sunday-procession')
  })

  it('sets dateModified equal to datePublished when updatedAt is absent', () => {
    const schema = articleSchema(ARTICLE_BASE)
    expect(schema.dateModified).toBe(ARTICLE_BASE.publishedAt)
  })

  it('overrides dateModified with updatedAt when provided', () => {
    const schema = articleSchema({ ...ARTICLE_BASE, updatedAt: '2026-04-06T12:00:00Z' })
    expect(schema.dateModified).toBe('2026-04-06T12:00:00Z')
  })

  it('omits the image field when imageUrl is not given', () => {
    expect(articleSchema(ARTICLE_BASE).image).toBeUndefined()
  })

  it('wraps imageUrl in an array', () => {
    const schema = articleSchema({ ...ARTICLE_BASE, imageUrl: 'https://cdn.example.com/img.jpg' })
    expect(Array.isArray(schema.image)).toBe(true)
    expect((schema.image as string[])[0]).toBe('https://cdn.example.com/img.jpg')
  })

  it('includes publisher org name', () => {
    const schema = articleSchema(ARTICLE_BASE)
    expect((schema.publisher as { name: string }).name).toBe('Catholic Eparchy of Segeneyti')
  })
})

// ─── eventSchema ─────────────────────────────────────────────────────────────

const EVENT_BASE = {
  title: 'Easter Vigil',
  startDate: '2026-04-04T20:00:00Z',
  slug: 'easter-vigil-2026',
}

describe('eventSchema', () => {
  it('returns @type Event', () => {
    expect(eventSchema(EVENT_BASE)['@type']).toBe('Event')
  })

  it('sets the event name', () => {
    expect(eventSchema(EVENT_BASE).name).toBe('Easter Vigil')
  })

  it('constructs the event URL from the slug', () => {
    const schema = eventSchema(EVENT_BASE)
    expect(schema.url).toContain('/events/easter-vigil-2026')
  })

  it('omits location when not provided', () => {
    expect(eventSchema(EVENT_BASE).location).toBeUndefined()
  })

  it('maps location string to a Place object', () => {
    const schema = eventSchema({ ...EVENT_BASE, location: 'Segeneyti Cathedral' })
    expect((schema.location as { '@type': string; name: string })['@type']).toBe('Place')
    expect((schema.location as { name: string }).name).toBe('Segeneyti Cathedral')
  })

  it('omits image when not provided', () => {
    expect(eventSchema(EVENT_BASE).image).toBeUndefined()
  })

  it('wraps imageUrl in an array', () => {
    const schema = eventSchema({ ...EVENT_BASE, imageUrl: 'https://cdn.example.com/event.jpg' })
    expect((schema.image as string[])[0]).toBe('https://cdn.example.com/event.jpg')
  })

  it('includes organizer org name', () => {
    const schema = eventSchema(EVENT_BASE)
    expect((schema.organizer as { name: string }).name).toBe('Catholic Eparchy of Segeneyti')
  })
})

// ─── personSchema ─────────────────────────────────────────────────────────────

const PERSON_BASE = { name: 'Fr. Tesfai Haile', slug: 'fr-tesfai-haile' }

describe('personSchema', () => {
  it('returns @type Person', () => {
    expect(personSchema(PERSON_BASE)['@type']).toBe('Person')
  })

  it('sets the person name', () => {
    expect(personSchema(PERSON_BASE).name).toBe('Fr. Tesfai Haile')
  })

  it('builds the URL with the slug as a page anchor', () => {
    const schema = personSchema(PERSON_BASE)
    expect(schema.url).toContain('#fr-tesfai-haile')
  })

  it('includes jobTitle when provided', () => {
    const schema = personSchema({ ...PERSON_BASE, jobTitle: 'Parish Priest' })
    expect(schema.jobTitle).toBe('Parish Priest')
  })

  it('includes image URL when provided', () => {
    const schema = personSchema({ ...PERSON_BASE, imageUrl: 'https://cdn.example.com/priest.jpg' })
    expect(schema.image).toBe('https://cdn.example.com/priest.jpg')
  })

  it('sets affiliation to the eparchy', () => {
    const schema = personSchema(PERSON_BASE)
    expect((schema.affiliation as { name: string }).name).toBe('Catholic Eparchy of Segeneyti')
  })
})
