import * as Sentry from '@sentry/nextjs'
import { getPayload } from '../payload/client'
import { cachedQuery } from '../payload/cache'

/**
 * Public read layer for the Eparchs.
 *
 * Two things happen here that must not move into a component:
 *
 *  1. `overrideAccess: false` with no user. These queries run through the same
 *     access rules an anonymous HTTP caller gets, so drafts are excluded and the
 *     collection's afterRead hook strips every `isPublic: false` entry before
 *     the data reaches this file. Filtering in JSX would leave the withheld
 *     entries in `/api/bishops` for anyone who looked.
 *  2. Caching. Everything is wrapped in `cachedQuery` against the `bishops` tag,
 *     which the collection's afterChange hooks invalidate — so an edit or a
 *     change of sitting Eparch propagates with no rebuild.
 */

/** Depth 2: portraits, gallery images and related documents resolve; deeper adds nothing. */
const DEPTH = 2

export interface BishopMilestone {
  milestoneType?: string | null
  title?: string | null
  date?: string | null
  datePrecision?: string | null
  endDate?: string | null
  endDatePrecision?: string | null
  order?: number | null
  location?: string | null
  description?: unknown
  parish?: { slug?: string; name?: string } | null
  vicariate?: { slug?: string; name?: string } | null
  people?: Array<{ role?: string | null; name?: string | null; priest?: { fullName?: string } | null }> | null
  photos?: Array<{ url?: string; alt?: string; width?: number; height?: number }> | null
  galleryKey?: string | null
  links?: BishopLink[] | null
  documents?: BishopDocument[] | null
}

export interface BishopLink {
  url?: string | null
  label?: string | null
  linkType?: string | null
  sourceName?: string | null
  date?: string | null
}

export interface BishopDocument {
  title?: string | null
  documentType?: string | null
  date?: string | null
  publication?: { slug?: string; title?: string } | null
  file?: { url?: string; filename?: string } | null
}

export interface BishopHonor {
  name?: string | null
  category?: string | null
  awardingBody?: string | null
  date?: string | null
  datePrecision?: string | null
  place?: string | null
  description?: string | null
  url?: string | null
  certificate?: { url?: string; alt?: string } | null
}

export interface BishopGalleryImage {
  image?: { url?: string; alt?: string; width?: number; height?: number } | null
  caption?: string | null
  date?: string | null
  credit?: string | null
}

export interface BishopGallery {
  key?: string | null
  title?: string | null
  description?: string | null
  date?: string | null
  coverImage?: { url?: string; alt?: string } | null
  images?: BishopGalleryImage[] | null
}

export interface BishopRecord {
  id: string | number
  slug: string
  isActive?: boolean | null
  fullName?: string | null
  episcopalName?: string | null
  honorific?: string | null
  formalTitle?: string | null
  motto?: string | null
  mottoOriginal?: string | null
  mottoNote?: string | null
  portrait?: { url?: string; alt?: string; width?: number; height?: number } | null
  coatOfArms?: { url?: string; alt?: string } | null
  dateOfBirth?: string | null
  dateOfBirthPrecision?: string | null
  placeOfBirth?: string | null
  dateOfDeath?: string | null
  dateOfDeathPrecision?: string | null
  placeOfDeath?: string | null
  nationality?: string | null
  termStart?: string | null
  termEnd?: string | null
  termEndReason?: string | null
  appointingAuthority?: string | null
  appointingAuthorityName?: string | null
  appointmentDate?: string | null
  biography?: unknown
  biographySummary?: string | null
  milestones?: BishopMilestone[] | null
  honors?: BishopHonor[] | null
  education?: Array<Record<string, unknown>> | null
  pastoralPriorities?: Array<Record<string, unknown>> | null
  galleries?: BishopGallery[] | null
  links?: BishopLink[] | null
  documents?: BishopDocument[] | null
  relatedMessages?: Array<{ slug?: string; title?: string; publishedAt?: string }> | null
  relatedPublications?: Array<{ slug?: string; title?: string }> | null
  relatedNews?: Array<{ slug?: string; title?: string; publishedAt?: string }> | null
  relatedEvents?: Array<{ slug?: string; title?: string; startDate?: string }> | null
  seo?: { metaTitle?: string; metaDescription?: string } | null
}

/**
 * Reads here return safe empties so a page still renders when the database is
 * unavailable — but a genuine bug must not be indistinguishable from "no
 * bishop yet", so surface it before returning the fallback. Matches
 * src/lib/payload/queries.ts.
 */
function logQueryError(where: string, err: unknown): void {
  console.error(`[query:bishops.${where}]`, err)
  Sentry.captureException(err, { tags: { query: `bishops.${where}` } })
}

async function _getActiveBishop(locale?: string): Promise<BishopRecord | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishops',
      where: { isActive: { equals: true } },
      limit: 1,
      depth: DEPTH,
      locale: locale as never,
      overrideAccess: false,
    })
    return (result.docs[0] as unknown as BishopRecord) ?? null
  } catch (err) {
    logQueryError('getActiveBishop', err)
    return null
  }
}
/**
 * The sitting Eparch — the record every public surface names. Returns null
 * before one has been set, and every consumer must render without him rather
 * than substituting a placeholder name.
 */
export const getActiveBishop = cachedQuery(_getActiveBishop, 'getActiveBishop', ['bishops'])

async function _getBishopBySlug(slug: string, locale?: string): Promise<BishopRecord | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishops',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: DEPTH,
      locale: locale as never,
      overrideAccess: false,
    })
    return (result.docs[0] as unknown as BishopRecord) ?? null
  } catch (err) {
    logQueryError('getBishopBySlug', err)
    return null
  }
}
export const getBishopBySlug = cachedQuery(_getBishopBySlug, 'getBishopBySlug', ['bishops'])

export interface BishopSummary {
  slug: string
  fullName?: string | null
  formalTitle?: string | null
  isActive?: boolean | null
  termStart?: string | null
  termEnd?: string | null
  portrait?: { url?: string; alt?: string } | null
  biographySummary?: string | null
}

async function _getBishopSuccession(locale?: string): Promise<BishopSummary[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishops',
      // Earliest term first, so the succession reads top to bottom as it
      // happened. A record with no term start sorts last rather than first,
      // which is where an ascending null would otherwise put it.
      sort: 'termStart',
      limit: 100,
      depth: 1,
      locale: locale as never,
      overrideAccess: false,
    })
    const docs = result.docs as unknown as BishopSummary[]
    return docs.slice().sort((a, b) => {
      const aStart = a.termStart ? Date.parse(a.termStart) : Number.POSITIVE_INFINITY
      const bStart = b.termStart ? Date.parse(b.termStart) : Number.POSITIVE_INFINITY
      return aStart - bStart
    })
  } catch (err) {
    logQueryError('getBishopSuccession', err)
    return []
  }
}
/** Every published Eparch, earliest term first. */
export const getBishopSuccession = cachedQuery(_getBishopSuccession, 'getBishopSuccession', ['bishops'])

async function _getBishopSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishops',
      limit: 200,
      depth: 0,
      overrideAccess: false,
    })
    return (result.docs as unknown as { slug: string; updatedAt?: string }[]).map((d) => ({
      slug: d.slug,
      updatedAt: d.updatedAt,
    }))
  } catch (err) {
    logQueryError('getBishopSlugs', err)
    return []
  }
}
/** For the sitemap. */
export const getAllBishopSlugs = cachedQuery(_getBishopSlugs, 'getAllBishopSlugs', ['bishops'])
