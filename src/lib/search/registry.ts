/**
 * What the site searches, in one place.
 *
 * This used to be spread across three: a `SCOPES` array of English labels in
 * the search page, a `TYPE_META` map of icons and URL builders beside it, and a
 * chain of `if (all || scope === …)` blocks inside the query. Adding a
 * collection meant editing all three and translating none of them, which is why
 * Clergy, Offices and Vicariates were searchable content that search could not
 * find.
 *
 * Labels are i18n KEYS, not text. Nothing user-facing is written here.
 */

export type SearchType =
  | 'news'
  | 'event'
  | 'parish'
  | 'ministry'
  | 'publication'
  | 'bishop-message'
  | 'pope-message'
  | 'priest'
  | 'office'
  | 'vicariate'

export interface SearchResult {
  type: SearchType
  slug: string
  title: string
  excerpt?: string
  category?: string
  date?: string
  /** Relevance, filled in by the ranker. Absent until then. */
  score?: number
}

export interface SearchCategory {
  /** The `scope` query-string value, and the i18n key suffix. */
  key: string
  type: SearchType
  collection: string
  icon: string
  /** Matches here mean the reader found the thing itself; ranked hardest. */
  titleFields: string[]
  /** Matches here mean the thing merely mentions it. */
  bodyFields: string[]
  /**
   * Draft-enabled collections carry `_status`. Applying the published filter to
   * a collection WITHOUT drafts matches nothing — the bug that once made
   * parishes, ministries and publications silently unsearchable.
   */
  hasDrafts: boolean
  /** Field used for the recency signal, where recency means anything. */
  dateField?: string
  href: (slug: string) => string
  toResult: (doc: Record<string, any>) => Omit<SearchResult, 'type' | 'score'>
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    key: 'news',
    type: 'news',
    collection: 'news',
    icon: '📰',
    titleFields: ['title'],
    bodyFields: ['excerpt'],
    hasDrafts: true,
    dateField: 'publishedAt',
    href: (s) => `/news/${s}`,
    toResult: (d) => ({
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      category: d.category,
      date: d.publishedAt,
    }),
  },
  {
    key: 'events',
    type: 'event',
    collection: 'events',
    icon: '📅',
    titleFields: ['title'],
    // NOT `description`: it is rich text, stored as JSONB, and a `like` against
    // JSONB throws — which the per-category catch would swallow, silently
    // emptying the whole Events category. Same reason `location` is absent: it
    // is not a column at all, it lives in a group, and the old code searched it
    // anyway. Only plain-text columns may be listed here.
    bodyFields: ['excerpt'],
    hasDrafts: true,
    dateField: 'startDate',
    href: (s) => `/events/${s}`,
    toResult: (d) => ({
      // `description` deliberately not used: rendering a Lexical document as a
      // card excerpt prints "[object Object]".
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      date: d.startDate,
    }),
  },
  {
    key: 'bishop-messages',
    type: 'bishop-message',
    collection: 'bishop-messages',
    icon: '✉️',
    titleFields: ['title'],
    bodyFields: ['excerpt'],
    hasDrafts: true,
    dateField: 'publishedAt',
    href: (s) => `/bishop-messages/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.title, excerpt: d.excerpt, date: d.publishedAt }),
  },
  {
    key: 'pope-messages',
    type: 'pope-message',
    collection: 'pope-messages',
    icon: '📜',
    titleFields: ['title'],
    bodyFields: ['excerpt'],
    hasDrafts: true,
    dateField: 'publishedAt',
    href: (s) => `/pope-messages/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.title, excerpt: d.excerpt, date: d.publishedAt }),
  },
  {
    key: 'parishes',
    type: 'parish',
    collection: 'parishes',
    icon: '⛪',
    titleFields: ['name'],
    // `description` is rich text (JSONB) — see the note on Events.
    bodyFields: ['region'],
    hasDrafts: false,
    href: (s) => `/parishes/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.name ?? d.title, excerpt: d.region || undefined }),
  },
  {
    key: 'ministries',
    type: 'ministry',
    collection: 'ministries',
    icon: '🙏',
    titleFields: ['name'],
    // `description` is rich text (JSONB) — see the note on Events.
    bodyFields: [],
    hasDrafts: false,
    href: (s) => `/ministries/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.name ?? d.title }),
  },
  {
    key: 'publications',
    type: 'publication',
    collection: 'publications',
    icon: '📖',
    titleFields: ['title'],
    bodyFields: ['description'],
    hasDrafts: false,
    href: (s) => `/publications/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.title, excerpt: d.description }),
  },
  {
    key: 'clergy',
    type: 'priest',
    collection: 'priests',
    icon: '🕊️',
    // ONLY fields that every priest publishes unconditionally.
    //
    // A priest's biography, ministry history, education, galleries, contact
    // details and ordination date each sit behind a visibility switch, and a
    // priest who has switched one off has withheld it from the public. Matching
    // a query against withheld text would leak it even without displaying it:
    // "his name comes back when I search this word" answers the question just
    // as well as printing the sentence would.
    //
    // Excluding those fields structurally is stronger than filtering them at
    // query time, because there is no clause left to get wrong. Enforced by a
    // test — see __tests__/registry.test.ts.
    titleFields: ['fullName'],
    bodyFields: ['assignment'],
    hasDrafts: false,
    href: (s) => `/priests/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.fullName, excerpt: d.assignment }),
  },
  {
    key: 'offices',
    type: 'office',
    collection: 'offices',
    icon: '🏛️',
    titleFields: ['name'],
    bodyFields: ['tagline'],
    hasDrafts: false,
    href: (s) => `/offices/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.name, excerpt: d.tagline }),
  },
  {
    key: 'vicariates',
    type: 'vicariate',
    collection: 'vicariates',
    icon: '🗺️',
    titleFields: ['name'],
    bodyFields: ['description'],
    hasDrafts: false,
    href: (s) => `/vicariates/${s}`,
    toResult: (d) => ({ slug: d.slug, title: d.name ?? d.title, excerpt: d.description }),
  },
]

/**
 * Fields a priest may withhold. Search must never look at these — see the
 * clergy entry above. Kept here so the test and the reasoning sit together.
 */
export const PRIEST_WITHHOLDABLE_FIELDS = [
  'bio',
  'milestones',
  'education',
  'galleries',
  'contact',
  'ordinationDate',
  'birthDate',
]

export const CATEGORY_BY_TYPE: Record<SearchType, SearchCategory> = Object.fromEntries(
  SEARCH_CATEGORIES.map((c) => [c.type, c]),
) as Record<SearchType, SearchCategory>

export function categoryByKey(key: string): SearchCategory | undefined {
  return SEARCH_CATEGORIES.find((c) => c.key === key)
}

/**
 * The Payload `where` for one category.
 *
 * Every spelling variant is OR'd across every searched field; the published
 * constraint is AND'd on top so no variant can reach an unpublished record.
 * Scheduled posts are covered by that same clause — scheduling leaves a record
 * as a draft until the cron flips it, so "not yet published" and "draft" are
 * the same state.
 */
export function buildSearchWhere(category: SearchCategory, variants: string[]): any {
  const fields = [...category.titleFields, ...category.bodyFields]
  const or = fields.flatMap((field) => variants.map((variant) => ({ [field]: { like: variant } })))

  const and: any[] = []
  if (category.hasDrafts) and.push({ _status: { equals: 'published' } })
  and.push({ or })

  return { and }
}
