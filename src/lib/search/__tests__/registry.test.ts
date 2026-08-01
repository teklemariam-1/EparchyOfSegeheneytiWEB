import { describe, it, expect } from 'vitest'
import {
  SEARCH_CATEGORIES,
  PRIEST_WITHHOLDABLE_FIELDS,
  buildSearchWhere,
  categoryByKey,
} from '../registry'

describe('the registry covers what the site publishes', () => {
  it('includes the collections that were previously unsearchable', () => {
    const keys = SEARCH_CATEGORIES.map((c) => c.key)
    expect(keys).toContain('clergy')
    expect(keys).toContain('offices')
    expect(keys).toContain('vicariates')
  })

  it('has unique keys and unique types', () => {
    const keys = SEARCH_CATEGORIES.map((c) => c.key)
    const types = SEARCH_CATEGORIES.map((c) => c.type)
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(types).size).toBe(types.length)
  })

  it('gives every category something to search', () => {
    for (const category of SEARCH_CATEGORIES) {
      expect(category.titleFields.length, category.key).toBeGreaterThan(0)
    }
  })

  it('never searches a rich-text field', () => {
    // Rich text is stored as JSONB. A `like` against JSONB throws, the
    // per-category catch swallows it, and the entire category silently returns
    // nothing — which is how Events, Parishes and Ministries came to be
    // half-searchable without anyone noticing. Only plain-text columns qualify.
    const RICH_TEXT_FIELDS = ['body', 'content', 'about']
    const RICH_TEXT_BY_CATEGORY: Record<string, string[]> = {
      events: ['description'],
      parishes: ['description'],
      ministries: ['description'],
    }

    for (const category of SEARCH_CATEGORIES) {
      const searched = [...category.titleFields, ...category.bodyFields]
      for (const field of [...RICH_TEXT_FIELDS, ...(RICH_TEXT_BY_CATEGORY[category.key] ?? [])]) {
        expect(searched, `${category.key} must not search rich-text ${field}`).not.toContain(field)
      }
    }
  })

  it('builds every href from a slug without producing a double slash', () => {
    for (const category of SEARCH_CATEGORIES) {
      const href = category.href('a-slug')
      expect(href, category.key).toMatch(/^\/[a-z-]+\/a-slug$/)
    }
  })
})

describe('search cannot reach unpublished content', () => {
  it('constrains every draft-enabled collection to published records', () => {
    for (const category of SEARCH_CATEGORIES.filter((c) => c.hasDrafts)) {
      const where = buildSearchWhere(category, ['term'])
      expect(where.and, category.key).toContainEqual({ _status: { equals: 'published' } })
    }
  })

  it('does NOT apply the published filter where there is no _status field', () => {
    // Applying it to a collection without drafts matches nothing — this is the
    // bug that made parishes and ministries silently unsearchable.
    for (const category of SEARCH_CATEGORIES.filter((c) => !c.hasDrafts)) {
      const where = buildSearchWhere(category, ['term'])
      expect(JSON.stringify(where), category.key).not.toContain('_status')
    }
  })

  it('keeps the published constraint outside the OR, so no variant escapes it', () => {
    const news = categoryByKey('news')!
    const where = buildSearchWhere(news, ['aa', 'bb'])
    const or = where.and.find((clause: any) => clause.or)
    expect(or).toBeDefined()
    // The status clause must be a sibling of the OR, never a member of it.
    expect(JSON.stringify(or)).not.toContain('_status')
  })
})

describe('search cannot reach anything a priest withheld', () => {
  it('never searches a field that sits behind a visibility switch', () => {
    const clergy = categoryByKey('clergy')!
    const searched = [...clergy.titleFields, ...clergy.bodyFields]

    for (const withheld of PRIEST_WITHHOLDABLE_FIELDS) {
      expect(searched, `clergy search must not read ${withheld}`).not.toContain(withheld)
    }
  })

  it('searches only name and assignment, which every priest publishes', () => {
    const clergy = categoryByKey('clergy')!
    expect([...clergy.titleFields, ...clergy.bodyFields].sort()).toEqual([
      'assignment',
      'fullName',
    ])
  })

  it('leaves no withheld field anywhere in the generated query', () => {
    const clergy = categoryByKey('clergy')!
    const serialized = JSON.stringify(buildSearchWhere(clergy, ['ሰላም', 'test']))
    for (const withheld of PRIEST_WITHHOLDABLE_FIELDS) {
      expect(serialized).not.toContain(withheld)
    }
  })
})

describe('buildSearchWhere', () => {
  it('searches every field for every spelling variant', () => {
    const news = categoryByKey('news')!
    const where = buildSearchWhere(news, ['ሠገነይቲ', 'ሰገነይቲ'])
    const or = where.and.find((c: any) => c.or).or
    // 2 fields (title, excerpt) x 2 variants
    expect(or).toHaveLength(4)
    expect(or).toContainEqual({ title: { like: 'ሠገነይቲ' } })
    expect(or).toContainEqual({ excerpt: { like: 'ሰገነይቲ' } })
  })
})
