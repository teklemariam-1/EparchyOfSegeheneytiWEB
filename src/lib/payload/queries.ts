/**
 * Payload CMS data-fetching helpers.
 * All functions use the local Payload API (no HTTP round-trip).
 * Return types use lightweight interfaces — run `npm run generate:types` after
 * the database is seeded to get the full generated Payload types.
 */

import { getPayload } from './client'
import { cachedQuery } from './cache'
import type { BannerSettingsData } from '../banner-themes'

// ─── Shared helpers ────────────────────────────────────────────────────────────

function imgOf(doc: any): CMSImage | null {
  if (!doc) return null
  if (typeof doc === 'object' && doc.url) {
    return { url: doc.url, alt: doc.alt ?? '', width: doc.width, height: doc.height }
  }
  return null
}

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface CMSImage {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface PaginationMeta {
  page: number
  totalDocs: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface NewsListItem {
  id: string
  slug: string
  title: string
  excerpt?: string
  category?: string
  publishedAt?: string
  featuredImage?: CMSImage | null
  tags?: string[]
}

/** One entry of a photo gallery: the image plus an optional caption. */
export interface GalleryItem {
  image: CMSImage
  caption?: string
}

export interface NewsDetail extends NewsListItem {
  content?: unknown
  author?: string | null
  sourceUrl?: string
  sourceName?: string
  gallery?: GalleryItem[]
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

async function _getNewsList(opts: {
  limit?: number
  category?: string
  page?: number
  locale?: string
} = {}): Promise<{ docs: NewsListItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 12, category, page = 1, locale } = opts
    const where: Record<string, unknown> = { _status: { equals: 'published' } }
    if (category && category !== 'all') where.category = { equals: category }
    const result = await payload.find({
      collection: 'news',
      where,
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    const docs: NewsListItem[] = (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      category: d.category,
      publishedAt: d.publishedAt,
      featuredImage: imgOf(d.featuredImage),
      tags: Array.isArray(d.tags) ? d.tags.map((t: any) => t?.tag ?? t).filter(Boolean) : [],
    }))
    return {
      docs,
      meta: {
        page: result.page ?? 1,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    }
  } catch {
    return { docs: [], meta: { page: 1, totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false } }
  }
}
export const getNewsList = cachedQuery(_getNewsList, 'getNewsList', ['news'])

export async function getNewsBySlug(slug: string, locale?: string): Promise<NewsDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      category: d.category,
      publishedAt: d.publishedAt,
      featuredImage: imgOf(d.featuredImage),
      tags: Array.isArray(d.tags) ? d.tags.map((t: any) => t?.tag ?? t).filter(Boolean) : [],
      content: d.body,
      author: d.author?.firstName ? `${d.author.firstName} ${d.author.lastName ?? ''}`.trim() : null,
      sourceUrl: d.sourceUrl ?? undefined,
      sourceName: d.sourceName ?? undefined,
      gallery: (d.gallery ?? [])
        .map((g: any) => {
          const image = imgOf(g?.image)
          return image ? { image, caption: g?.caption || undefined } : null
        })
        .filter(Boolean) as GalleryItem[],
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined,
    }
  } catch {
    return null
  }
}

export async function getAllNewsSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'news', limit: 1000, depth: 0 } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface EventListItem {
  id: string
  slug: string
  title: string
  startDate: string
  endDate?: string
  isAllDay?: boolean
  eventType?: string
  location?: { venue?: string; city?: string; address?: string }
  parish?: { title?: string; slug?: string } | null
  featuredImage?: CMSImage | null
  excerpt?: string
}

export interface EventDetail extends EventListItem {
  description?: unknown
  cost?: string
  registrationUrl?: string
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

async function _getUpcomingEvents(limit = 5, locale?: string): Promise<EventListItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'events',
      where: { startDate: { greater_than: new Date().toISOString() }, _status: { equals: 'published' } },
      sort: 'startDate',
      limit,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return (result.docs as any[]).map(mapEvent)
  } catch {
    return []
  }
}
export const getUpcomingEvents = cachedQuery(_getUpcomingEvents, 'getUpcomingEvents', ['events'])

async function _getEventsList(opts: {
  limit?: number
  page?: number
  upcoming?: boolean
  eventType?: string
  locale?: string
} = {}): Promise<{ docs: EventListItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 12, page = 1, upcoming, eventType, locale } = opts
    const where: Record<string, unknown> = { _status: { equals: 'published' } }
    if (upcoming) where.startDate = { greater_than: new Date().toISOString() }
    if (eventType && eventType !== 'all') where.eventType = { equals: eventType }
    const result = await payload.find({
      collection: 'events',
      where,
      sort: upcoming ? 'startDate' : '-startDate',
      limit,
      page,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return {
      docs: (result.docs as any[]).map(mapEvent),
      meta: {
        page: result.page ?? 1,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    }
  } catch {
    return { docs: [], meta: { page: 1, totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false } }
  }
}
export const getEventsList = cachedQuery(_getEventsList, 'getEventsList', ['events'])

// ─── Taxonomies (admin-managed news categories / event types) ─────────────────

export interface TaxonomyOption {
  label: string
  value: string
}

async function _getTaxonomy(collection: string): Promise<TaxonomyOption[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection,
      limit: 200,
      sort: 'id',
      depth: 0,
    } as any)
    return (result.docs as any[])
      .filter((d) => typeof d?.value === 'string' && d.value)
      .map((d) => ({ label: String(d.label ?? d.value), value: d.value }))
  } catch {
    return []
  }
}

const _getNewsCategories = () => _getTaxonomy('news-categories')
export const getNewsCategories = cachedQuery(_getNewsCategories, 'getNewsCategories', ['taxonomies'])

const _getEventTypes = () => _getTaxonomy('event-types')
export const getEventTypes = cachedQuery(_getEventTypes, 'getEventTypes', ['taxonomies'])

function mapEvent(d: any): EventListItem {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    startDate: d.startDate,
    endDate: d.endDate,
    isAllDay: d.isAllDay,
    eventType: d.eventType,
    location: d.location ? { venue: d.location.name, address: d.location.address } : undefined,
    parish: d.parish ? { title: d.parish.name ?? d.parish.title, slug: d.parish.slug } : null,
    featuredImage: imgOf(d.featuredImage),
    excerpt: d.excerpt,
  }
}

export async function getEventBySlug(slug: string, locale?: string): Promise<EventDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return { ...mapEvent(d), description: d.description, cost: d.cost, registrationUrl: d.registrationUrl, seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined }
  } catch {
    return null
  }
}

export async function getAllEventSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'events', limit: 1000, depth: 0 } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Parishes ─────────────────────────────────────────────────────────────────

/** Light reference to the parent vicariate (Eparchy → Vicariate → Parish). */
export interface VicariateRef {
  id: string
  slug: string
  name: string
}

/** Normalize a populated vicariate relationship into a light reference. */
function vicariateRef(v: unknown): VicariateRef | null {
  if (!v || typeof v !== 'object') return null
  const d = v as Record<string, any>
  if (!d.slug) return null
  return { id: String(d.id), slug: d.slug, name: d.name ?? d.title ?? d.slug }
}

export interface ParishListItem {
  id: string
  slug: string
  title: string
  vicariate?: VicariateRef | null
  patronSaint?: string
  city?: string
  pastor?: string | null
  image?: CMSImage | null
}

export interface ParishDetail extends ParishListItem {
  history?: unknown
  massTimes?: Array<{ day: string; time: string; language?: string; notes?: string }>
  address?: string
  phone?: string
  email?: string
  gallery?: CMSImage[]
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

async function _getParishesList(
  limit = 100,
  vicariate?: string,
  locale?: string,
): Promise<ParishListItem[]> {
  try {
    const payload = await getPayload()
    const where: Record<string, unknown> = {}
    // vicariate is a relationship now — filter on the related document's slug
    if (vicariate && vicariate !== 'all') where['vicariate.slug'] = { equals: vicariate }
    const result = await payload.find({ collection: 'parishes', where, limit, depth: 1, ...(locale ? { locale } : {}) } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.name ?? d.title,
      vicariate: vicariateRef(d.vicariate),
      patronSaint: d.patron,
      city: d.region,
      pastor: d.pastor?.fullName ?? null,
      image: imgOf(d.featuredImage),
    }))
  } catch {
    return []
  }
}
export const getParishesList = cachedQuery(_getParishesList, 'getParishesList', ['parishes'])

export async function getParishBySlug(slug: string, locale?: string): Promise<ParishDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'parishes',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.name ?? d.title,
      vicariate: vicariateRef(d.vicariate),
      patronSaint: d.patron,
      city: d.region,
      pastor: d.pastor?.fullName ?? null,
      image: imgOf(d.featuredImage),
      history: d.history,
      massTimes: d.massTimes ?? [],
      address: d.contact?.address,
      phone: d.contact?.phone,
      email: d.contact?.email,
      gallery: (d.gallery ?? []).map((g: any) => imgOf(g?.image ?? g)).filter(Boolean),
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined,
    }
  } catch {
    return null
  }
}

export async function getAllParishSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'parishes', limit: 1000, depth: 0 } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Ministries ───────────────────────────────────────────────────────────────

export interface MinistryItem {
  id: string
  slug: string
  title: string
  ministryType?: string
  description?: unknown
  leader?: string | null
  parish?: { title?: string; slug?: string } | null
  image?: CMSImage | null
  meetingInfo?: string
}

async function _getMinistriesList(limit = 100): Promise<MinistryItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'ministries', limit, depth: 1 } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.name ?? d.title,
      ministryType: d.type,
      description: d.description,
      leader: d.leader?.name ?? null,
      parish: d.parish ? { title: d.parish.name ?? d.parish.title, slug: d.parish.slug } : null,
      image: imgOf(d.featuredImage),
      meetingInfo: d.meetingInfo?.schedule ?? undefined,
    }))
  } catch {
    return []
  }
}
export const getMinistriesList = cachedQuery(_getMinistriesList, 'getMinistriesList', ['ministries'])

// ─── Publications ─────────────────────────────────────────────────────────────

export interface PublicationItem {
  id: string
  slug: string
  title: string
  documentType?: string
  language?: string
  publishedYear?: number
  pageCount?: number
  isFeatured?: boolean
  coverImage?: CMSImage | null
  fileUrl?: string
  description?: string
}

export interface MagazineItem {
  id: string
  slug: string
  title: string
  volume?: number
  issue?: number
  year?: number
  coverImage?: CMSImage | null
  isFeatured?: boolean
  summary?: string
  fileUrl?: string | null
}

export interface ArchiveItem {
  id: string
  slug: string
  title: string
  accessTier?: string
  year?: number
  category?: string
  description?: string
  fileUrl?: string | null
}

async function _getPublicationsList(limit = 50): Promise<PublicationItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'publications', limit, depth: 1, sort: '-publishedAt' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      documentType: d.category,
      language: d.language,
      publishedYear: d.publishedAt ? new Date(d.publishedAt).getFullYear() : undefined,
      pageCount: d.pageCount,
      isFeatured: d.isFeatured,
      coverImage: imgOf(d.coverImage),
      fileUrl: d.file?.url ?? null,
      description: d.description,
    }))
  } catch {
    return []
  }
}
export const getPublicationsList = cachedQuery(_getPublicationsList, 'getPublicationsList', ['publications'])

async function _getMagazinesList(limit = 50): Promise<MagazineItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'magazines', limit, depth: 1, sort: '-year' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      volume: d.volume,
      issue: d.issueNumber,
      year: d.year,
      coverImage: imgOf(d.coverImage),
      isFeatured: d.isFeatured,
      summary: d.description,
      fileUrl: d.document?.url ?? null,
    }))
  } catch {
    return []
  }
}
export const getMagazinesList = cachedQuery(_getMagazinesList, 'getMagazinesList', ['magazines'])

async function _getArchivesList(limit = 50): Promise<ArchiveItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'archives', limit, depth: 1, sort: '-year' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      accessTier: d.accessLevel,
      year: d.year,
      category: d.category,
      description: d.description,
      // First attached file (public archives only expose a working link).
      fileUrl: Array.isArray(d.files) && d.files[0]?.file?.url ? d.files[0].file.url : null,
    }))
  } catch {
    return []
  }
}
export const getArchivesList = cachedQuery(_getArchivesList, 'getArchivesList', ['archives'])

// ─── Ge'ez Calendar ───────────────────────────────────────────────────────────

export interface GeezCalendarEntry {
  id: string
  slug: string
  title: string
  geezMonth?: string
  geezDay?: number
  gregorianDate?: string
  feastRank?: string
  liturgicalColor?: string
  description?: string
  fastingNotes?: string
}

async function _getGeezCalendarEntries(month?: string): Promise<GeezCalendarEntry[]> {
  try {
    const payload = await getPayload()
    const where: Record<string, unknown> = {}
    if (month) where['geezDate.month'] = { equals: month }
    const result = await payload.find({
      collection: 'geez-calendar-entries',
      where,
      sort: 'geezDate.day',
      limit: 365,
      depth: 0,
    } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug ?? d.id,
      title: d.title,
      geezMonth: d.geezDate?.month,
      geezDay: d.geezDate?.day,
      gregorianDate: d.gregorianEquivalent?.month && d.gregorianEquivalent?.day
        ? `${d.gregorianEquivalent.month}/${d.gregorianEquivalent.day}`
        : undefined,
      feastRank: d.feastRank,
      liturgicalColor: d.liturgicalColor,
      description: d.description,
      fastingNotes: d.fastingNotes,
    }))
  } catch {
    return []
  }
}
export const getGeezCalendarEntries = cachedQuery(_getGeezCalendarEntries, 'getGeezCalendarEntries', ['geez'])

// ─── Media / Gallery ──────────────────────────────────────────────────────────

export interface MediaItem {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
  category?: string
  filename?: string
  sizes?: { card?: { url?: string }; thumbnail?: { url?: string } }
}

async function _getMediaGallery(opts: {
  limit?: number
  category?: string
  page?: number
} = {}): Promise<{ docs: MediaItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 24, category, page = 1 } = opts
    const where: Record<string, unknown> = {}
    if (category && category !== 'all') where.category = { equals: category }
    const result = await payload.find({
      collection: 'media',
      where,
      sort: '-createdAt',
      limit,
      page,
      depth: 0,
    } as any)
    const docs: MediaItem[] = (result.docs as any[]).map((d) => ({
      id: d.id,
      url: d.url,
      alt: d.alt ?? d.filename ?? '',
      width: d.width,
      height: d.height,
      category: d.category,
      filename: d.filename,
      sizes: d.sizes,
    }))
    return {
      docs,
      meta: {
        page: result.page ?? 1,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    }
  } catch {
    return { docs: [], meta: { page: 1, totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false } }
  }
}
export const getMediaGallery = cachedQuery(_getMediaGallery, 'getMediaGallery', ['media'])

// ─── Pages (static CMS pages) ─────────────────────────────────────────────────

export interface CMSPage {
  id: string
  title: string
  slug: string
  hero?: {
    heading?: string
    subheading?: string
    image?: CMSImage | null
  }
  content?: unknown
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

export async function getPageBySlug(slug: string): Promise<CMSPage | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      title: d.title,
      slug: d.slug,
      hero: d.hero,
      content: d.content,
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined,
    }
  } catch {
    return null
  }
}

// ─── Globals ──────────────────────────────────────────────────────────────────

export interface HomepageGlobal {
  hero?: {
    enabled?: boolean
    // NOTE: these names must match the Homepage global's field names exactly.
    // They previously did not, so CMS values were silently ignored in favour of
    // the component's hardcoded fallbacks.
    headline?: string
    subheading?: string
    primaryCta?: { label?: string; url?: string }
    secondaryCta?: { label?: string; url?: string }
    backgroundImage?: CMSImage | null
    overlay?: {
      color?: 'maroon' | 'charcoal' | 'green' | 'navy' | 'gold' | 'custom' | 'none'
      customColor?: string
      opacity?: number
      darkenBottom?: boolean
    }
  }
  bishopMessage?: {
    enabled?: boolean
    bishopName?: string
    bishopTitle?: string
    messageExcerpt?: string
    photo?: CMSImage | null
    linkUrl?: string
    linkLabel?: string
  }
  latestNews?: { enabled?: boolean; heading?: string; limit?: number }
  upcomingEvents?: { enabled?: boolean; heading?: string; limit?: number }
  quickLinks?: {
    enabled?: boolean
    heading?: string
    links?: Array<{ label: string; url: string; icon?: string; description?: string }>
  }
}

async function _getHomepageGlobal(locale?: string): Promise<HomepageGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'homepage', ...(locale ? { locale } : {}) } as any)
    return data as unknown as HomepageGlobal
  } catch {
    return {}
  }
}
export const getHomepageGlobal = cachedQuery(_getHomepageGlobal, 'getHomepageGlobal', ['globals'])

export interface HeaderGlobal {
  announcement?: {
    enabled?: boolean
    style?: 'info' | 'warning' | 'success'
    message?: string
    linkLabel?: string
    linkUrl?: string
  }
  utilityLinks?: Array<{ label: string; url: string }>
}

async function _getHeaderGlobal(): Promise<HeaderGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'header' } as any)
    return data as unknown as HeaderGlobal
  } catch {
    return {}
  }
}
export const getHeaderGlobal = cachedQuery(_getHeaderGlobal, 'getHeaderGlobal', ['globals'])

export interface FooterGlobal {
  columns?: Array<{
    heading: string
    links: Array<{ label: string; url: string; newTab?: boolean }>
  }>
  newsletterSignup?: { enabled?: boolean; heading?: string; placeholder?: string }
  showSocialLinks?: boolean
  socialLinks?: {
    facebook?: string
    youtube?: string
    instagram?: string
    twitter?: string
  }
  copyrightText?: string
}

async function _getFooterGlobal(): Promise<FooterGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'footer' } as any)
    return data as unknown as FooterGlobal
  } catch {
    return {}
  }
}
export const getFooterGlobal = cachedQuery(_getFooterGlobal, 'getFooterGlobal', ['globals'])

export interface NavigationGlobal {
  items?: Array<{
    label: string
    url?: string
    openInNewTab?: boolean
    children?: Array<{ label: string; url: string }>
    mobileHighlight?: boolean
  }>
}

async function _getNavigationGlobal(): Promise<NavigationGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'navigation' } as any)
    return data as unknown as NavigationGlobal
  } catch {
    return {}
  }
}
export const getNavigationGlobal = cachedQuery(_getNavigationGlobal, 'getNavigationGlobal', ['globals'])

export interface OfficeContact {
  name: string
  role?: string
  address?: string
  phone?: string
  email?: string
  hours?: string
}

export interface SiteSettingsGlobal {
  siteName?: string
  tagline?: string
  // Must match the SiteSettings global's field names. `logoLight` never existed,
  // so the uploaded logo was silently ignored and the placeholder mark shown.
  logo?: CMSImage | null
  logoDark?: CMSImage | null
  contact?: {
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
  }
  offices?: OfficeContact[]
  analytics?: {
    ga4Id?: string
    gtmId?: string
  }
  maintenanceMode?: boolean
  maintenanceMessage?: string
}

async function _getSiteSettings(locale?: string): Promise<SiteSettingsGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'site-settings', ...(locale ? { locale } : {}) } as any)
    return data as unknown as SiteSettingsGlobal
  } catch {
    return {}
  }
}
export const getSiteSettings = cachedQuery(_getSiteSettings, 'getSiteSettings', ['globals'])

// ─── Banner theme settings ────────────────────────────────────────────────────

async function _getBannerSettings(): Promise<BannerSettingsData | null> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'banner-settings' } as any)
    return data as unknown as BannerSettingsData
  } catch {
    return null
  }
}
export const getBannerSettings = cachedQuery(_getBannerSettings, 'getBannerSettings', ['globals'])

// ─── About page global ──────────────────────────────────────────────────────────

export interface AboutPageGlobal {
  mission?: { heading?: string; intro?: string; body?: string }
  stats?: Array<{ value: string; label: string }>
  pillars?: { heading?: string; items?: Array<{ icon?: string; title: string; body?: string }> }
  timeline?: { heading?: string; items?: Array<{ year: string; label: string; description?: string }> }
  geez?: { heading?: string; body?: string; ctaLabel?: string }
}

async function _getAboutPageGlobal(locale?: string): Promise<AboutPageGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'about-page', ...(locale ? { locale } : {}) } as any)
    return data as unknown as AboutPageGlobal
  } catch {
    return {}
  }
}
export const getAboutPageGlobal = cachedQuery(_getAboutPageGlobal, 'getAboutPageGlobal', ['globals'])

// ─── Bishop Messages ──────────────────────────────────────────────────────────

export interface BishopMessageItem {
  id: string
  slug: string
  title: string
  messageType?: string
  excerpt?: string
  publishedAt?: string
  isFeatured?: boolean
  content?: unknown
  pdfUrl?: string
}

async function _getLatestBishopMessage(locale?: string): Promise<BishopMessageItem | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 1,
      depth: 0,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      messageType: d.messageType,
      excerpt: d.excerpt,
      publishedAt: d.publishedAt,
      isFeatured: d.isFeatured,
      content: d.body,
      pdfUrl: d.document?.url ?? null,
    }
  } catch {
    return null
  }
}
export const getLatestBishopMessage = cachedQuery(_getLatestBishopMessage, 'getLatestBishopMessage', ['bishop-messages'])

async function _getBishopMessagesList(limit = 20, locale?: string): Promise<BishopMessageItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      messageType: d.messageType,
      excerpt: d.excerpt,
      publishedAt: d.publishedAt,
      isFeatured: d.isFeatured,
      content: d.body,
      pdfUrl: d.document?.url ?? null,
    }))
  } catch {
    return []
  }
}
export const getBishopMessagesList = cachedQuery(_getBishopMessagesList, 'getBishopMessagesList', ['bishop-messages'])

export interface BishopMessageDetail extends BishopMessageItem {
  featuredImage?: CMSImage | null
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

export async function getBishopMessageBySlug(slug: string, locale?: string): Promise<BishopMessageDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      messageType: d.messageType,
      excerpt: d.excerpt,
      publishedAt: d.publishedAt,
      isFeatured: d.isFeatured,
      content: d.body,
      pdfUrl: d.document?.url ?? null,
      featuredImage: imgOf(d.featuredImage),
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined,
    }
  } catch {
    return null
  }
}

export async function getAllBishopMessageSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Pope messages ─────────────────────────────────────────────────────────────

export interface PopeMessageItem {
  id: string
  slug: string
  title: string
  documentType?: string
  excerpt?: string
  publishedAt?: string
  content?: unknown
  pdfUrl?: string | null
  sourceUrl?: string
}

async function _getPopeMessagesList(limit = 20, locale?: string): Promise<PopeMessageItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'pope-messages',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      documentType: d.documentType,
      excerpt: d.excerpt,
      publishedAt: d.publishedAt,
      content: d.body,
      pdfUrl: d.document?.url ?? null,
      sourceUrl: d.sourceUrl,
    }))
  } catch {
    return []
  }
}
export const getPopeMessagesList = cachedQuery(_getPopeMessagesList, 'getPopeMessagesList', ['pope-messages'])

export interface PopeMessageDetail extends PopeMessageItem {
  featuredImage?: CMSImage | null
  seo?: { title?: string; description?: string; ogImage?: CMSImage | null }
}

export async function getPopeMessageBySlug(slug: string, locale?: string): Promise<PopeMessageDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'pope-messages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      documentType: d.documentType,
      excerpt: d.excerpt,
      publishedAt: d.publishedAt,
      content: d.body,
      pdfUrl: d.document?.url ?? null,
      sourceUrl: d.sourceUrl,
      featuredImage: imgOf(d.featuredImage),
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription, ogImage: imgOf(d.seo.ogImage) } : undefined,
    }
  } catch {
    return null
  }
}

export async function getAllPopeMessageSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'pope-messages',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Vicariates ────────────────────────────────────────────────────────────────

export interface VicariateItem {
  id: string
  slug: string
  name: string
  seat?: string
  description?: string
  featuredImage?: CMSImage | null
  parishCount?: number
}

export interface VicariateDetail extends VicariateItem {
  about?: unknown
  vicar?: string | null
  contact?: { phone?: string; email?: string; address?: string }
}

function mapVicariate(d: any): VicariateItem {
  return {
    id: String(d.id),
    slug: d.slug,
    name: d.name ?? d.title ?? d.slug,
    seat: d.seat,
    description: d.description,
    featuredImage: imgOf(d.featuredImage),
  }
}

async function _getVicariatesList(locale?: string): Promise<VicariateItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'vicariates',
      sort: 'order',
      limit: 100,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)

    // Count parishes per vicariate so the listing can show "N parishes".
    const vicariates = (result.docs as any[]).map(mapVicariate)
    await Promise.all(
      vicariates.map(async (v) => {
        try {
          const c = await payload.count({
            collection: 'parishes',
            where: { 'vicariate.slug': { equals: v.slug } },
          } as any)
          v.parishCount = c.totalDocs
        } catch {
          v.parishCount = 0
        }
      }),
    )
    return vicariates
  } catch {
    return []
  }
}
// 60s TTL (vs the 300s default): the vicariate list drives the parishes filter
// buttons, and a stale EMPTY cache here hides every button. A shorter window
// means any transient empty result self-heals within a minute instead of five.
// Admin edits still bust it immediately via the 'vicariates' tag.
export const getVicariatesList = cachedQuery(_getVicariatesList, 'getVicariatesList', ['vicariates'], 60)

export async function getVicariateBySlug(
  slug: string,
  locale?: string,
): Promise<VicariateDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'vicariates',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      ...mapVicariate(d),
      about: d.about,
      vicar: d.vicar?.fullName ?? null,
      contact: d.contact
        ? { phone: d.contact.phone, email: d.contact.email, address: d.contact.address }
        : undefined,
    }
  } catch {
    return null
  }
}

export async function getAllVicariateSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'vicariates', limit: 200, depth: 0 } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}

// ─── Apps & downloadable resources ─────────────────────────────────────────────

export interface AppItem {
  id: string
  slug: string
  title: string
  description?: string
  resourceType?: 'android-app' | 'ios-app' | 'download'
  version?: string
  bannerImage?: CMSImage | null
  icon?: CMSImage | null
  fileUrl?: string | null
  fileName?: string | null
  fileSizeLabel?: string
  playStoreUrl?: string
  appStoreUrl?: string
  publishedAt?: string
}

async function _getAppsList(limit = 50, locale?: string): Promise<AppItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'apps',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      description: d.description,
      resourceType: d.resourceType,
      version: d.version,
      bannerImage: imgOf(d.bannerImage),
      icon: imgOf(d.icon),
      fileUrl: d.file?.url ?? null,
      fileName: d.file?.filename ?? null,
      fileSizeLabel: d.fileSizeLabel,
      playStoreUrl: d.playStoreUrl,
      appStoreUrl: d.appStoreUrl,
      publishedAt: d.publishedAt,
    }))
  } catch {
    return []
  }
}
export const getAppsList = cachedQuery(_getAppsList, 'getAppsList', ['apps'])

// ─── Global search ─────────────────────────────────────────────────────────────

export interface SearchResult {
  type: 'news' | 'event' | 'parish' | 'ministry' | 'publication' | 'bishop-message' | 'pope-message'
  slug: string
  title: string
  excerpt?: string
  category?: string
  date?: string
}

export async function globalSearch(
  q: string,
  scope?: string,
): Promise<SearchResult[]> {
  try {
  if (!q || q.trim().length < 2) return []
  const payload = await getPayload()
  const term = q.trim()
  const results: SearchResult[] = []

  const run = async (
    collection: string,
    type: SearchResult['type'],
    titleFields: string[],
    extraFields: string[],
    toResult: (d: any) => SearchResult,
    // Only draft-enabled collections have a `_status` field. Applying the
    // published filter to a non-draft collection matches nothing, which is why
    // parishes/ministries/publications previously returned zero results.
    hasDrafts = false,
  ) => {
    try {
      const whereOr = [
        ...titleFields.map((f) => ({ [f]: { like: term } })),
        ...extraFields.map((f) => ({ [f]: { like: term } })),
      ]
      const andClauses: any[] = [{ or: whereOr }]
      if (hasDrafts) {
        andClauses.unshift({ _status: { equals: 'published' } })
      }
      const res = await payload.find({
        collection,
        where: { and: andClauses },
        limit: 10,
        depth: 0,
      } as any)
      ;(res.docs as any[]).forEach((d) => results.push(toResult(d)))
    } catch {
      // non-fatal per collection
    }
  }

  const all = !scope || scope === 'all'

  if (all || scope === 'news') {
    await run(
      'news', 'news', ['title'], ['excerpt'],
      (d) => ({ type: 'news', slug: d.slug, title: d.title, excerpt: d.excerpt, category: d.category, date: d.publishedAt }),
      true,
    )
  }
  if (all || scope === 'events') {
    await run(
      'events', 'event', ['title'], ['description', 'location'],
      (d) => ({ type: 'event', slug: d.slug, title: d.title, excerpt: d.description, date: d.startDate }),
      true,
    )
  }
  if (all || scope === 'bishop-messages') {
    await run(
      'bishop-messages', 'bishop-message', ['title'], ['excerpt'],
      (d) => ({ type: 'bishop-message', slug: d.slug, title: d.title, excerpt: d.excerpt, date: d.publishedAt }),
      true,
    )
  }
  if (all || scope === 'pope-messages') {
    await run(
      'pope-messages', 'pope-message', ['title'], ['excerpt'],
      (d) => ({ type: 'pope-message', slug: d.slug, title: d.title, excerpt: d.excerpt, date: d.publishedAt }),
      true,
    )
  }
  if (all || scope === 'parishes') {
    await run(
      'parishes', 'parish', ['name'], ['region'],
      (d) => ({ type: 'parish', slug: d.slug, title: d.name ?? d.title, excerpt: d.region ? `${d.region}` : undefined }),
    )
  }
  if (all || scope === 'ministries') {
    await run(
      'ministries', 'ministry', ['name'], [],
      (d) => ({ type: 'ministry', slug: d.slug, title: d.name ?? d.title }),
    )
  }
  if (all || scope === 'publications') {
    await run(
      'publications', 'publication', ['title'], ['excerpt'],
      (d) => ({ type: 'publication', slug: d.slug, title: d.title, excerpt: d.excerpt }),
    )
  }

  return results
  } catch {
    return []
  }
}

// ─── Public Q&A (answered contact questions) ──────────────────────────────────

export interface PublicQAItem {
  id: string
  subject?: string
  question: string
  answer: unknown
  publishedAt?: string
}

/**
 * Answered questions the chancery has chosen to publish.
 *
 * The collection itself stays readable only by staff; this runs with
 * overrideAccess and hand-picks the fields that may leave the building. The
 * submitter's name, email, phone and original message are deliberately absent —
 * visitors see the rewritten question and the official answer, nothing else.
 */
async function _getPublicQA(limit = 50, locale?: string): Promise<PublicQAItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'contact-submissions',
      where: { 'publicQA.isPublic': { equals: true } },
      sort: '-publicQA.publishedAt',
      limit,
      depth: 0,
      overrideAccess: true,
      ...(locale ? { locale } : {}),
    } as any)

    return (result.docs as any[])
      .map((d) => {
        const question = String(d?.publicQA?.publicQuestion ?? '').trim()
        if (!question) return null
        return {
          id: String(d.id),
          subject: d.subject ?? undefined,
          question,
          answer: d?.publicQA?.answer,
          publishedAt: d?.publicQA?.publishedAt ?? undefined,
        }
      })
      .filter(Boolean) as PublicQAItem[]
  } catch {
    return []
  }
}
export const getPublicQA = cachedQuery(_getPublicQA, 'getPublicQA', ['contact-qa'])

// ─── Offices & councils (e.g. Youth Council) ──────────────────────────────────

export interface OfficeAnnouncement {
  title: string
  date?: string
  body?: string
}
export interface OfficeUpdate {
  title: string
  date?: string
  image?: CMSImage | null
  excerpt?: string
  body?: unknown
}
export interface OfficeEvent {
  title: string
  startDate: string
  endDate?: string
  location?: string
  description?: string
}
export interface OfficeListItem {
  id: string
  slug: string
  name: string
  tagline?: string
  featuredImage?: CMSImage | null
}
export interface OfficeDetail extends OfficeListItem {
  about?: unknown
  leader?: { name?: string; role?: string; phone?: string; email?: string }
  announcements: OfficeAnnouncement[]
  updates: OfficeUpdate[]
  events: OfficeEvent[]
}

function mapOfficeBase(d: any): OfficeListItem {
  return {
    id: String(d.id),
    slug: d.slug,
    name: d.name ?? d.slug,
    tagline: d.tagline ?? undefined,
    featuredImage: imgOf(d.featuredImage),
  }
}

async function _getOfficesList(locale?: string): Promise<OfficeListItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'offices',
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
      depth: 1,
      ...(locale ? { locale } : {}),
    } as any)
    return (result.docs as any[]).map(mapOfficeBase)
  } catch {
    return []
  }
}
// Short TTL: an office's list drives its navigation presence; keep it fresh.
export const getOfficesList = cachedQuery(_getOfficesList, 'getOfficesList', ['offices'], 60)

export async function getOfficeBySlug(slug: string, locale?: string): Promise<OfficeDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'offices',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
      ...(locale ? { locale } : {}),
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null

    const announcements: OfficeAnnouncement[] = (d.announcements ?? [])
      .map((a: any) => ({ title: a?.title, date: a?.date ?? undefined, body: a?.body ?? undefined }))
      .filter((a: OfficeAnnouncement) => a.title)
      // Newest first; undated items sort last.
      .sort((a: OfficeAnnouncement, b: OfficeAnnouncement) => (b.date ?? '').localeCompare(a.date ?? ''))

    const updates: OfficeUpdate[] = (d.updates ?? [])
      .map((u: any) => ({
        title: u?.title,
        date: u?.date ?? undefined,
        image: imgOf(u?.image),
        excerpt: u?.excerpt ?? undefined,
        body: u?.body,
      }))
      .filter((u: OfficeUpdate) => u.title)
      .sort((a: OfficeUpdate, b: OfficeUpdate) => (b.date ?? '').localeCompare(a.date ?? ''))

    const events: OfficeEvent[] = (d.events ?? [])
      .map((e: any) => ({
        title: e?.title,
        startDate: e?.startDate,
        endDate: e?.endDate ?? undefined,
        location: e?.location ?? undefined,
        description: e?.description ?? undefined,
      }))
      .filter((e: OfficeEvent) => e.title && e.startDate)
      .sort((a: OfficeEvent, b: OfficeEvent) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

    return {
      ...mapOfficeBase(d),
      about: d.about,
      leader: d.leader
        ? { name: d.leader.name, role: d.leader.role, phone: d.leader.phone, email: d.leader.email }
        : undefined,
      announcements,
      updates,
      events,
    }
  } catch {
    return null
  }
}

export async function getAllOfficeSlugs(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'offices', limit: 100, depth: 0 } as any)
    return (result.docs as any[]).map((d) => ({ slug: d.slug as string }))
  } catch {
    return []
  }
}
