/**
 * Payload CMS data-fetching helpers.
 * All functions use the local Payload API (no HTTP round-trip).
 * Return types use lightweight interfaces — run `npm run generate:types` after
 * the database is seeded to get the full generated Payload types.
 */

import { getPayload } from './client'

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

export interface NewsDetail extends NewsListItem {
  content?: unknown
  author?: string | null
  seo?: { title?: string; description?: string }
}

export async function getNewsList(opts: {
  limit?: number
  category?: string
  page?: number
} = {}): Promise<{ docs: NewsListItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 12, category, page = 1 } = opts
    const where: Record<string, unknown> = { _status: { equals: 'published' } }
    if (category && category !== 'all') where.category = { equals: category }
    const result = await payload.find({
      collection: 'news',
      where,
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    } as any)
    const docs: NewsListItem[] = (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      category: d.category,
      publishedAt: d.publishedAt,
      featuredImage: imgOf(d.featuredImage),
      tags: d.tags,
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

export async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
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
      tags: d.tags,
      content: d.content,
      author: d.author?.name ?? d.author ?? null,
      seo: d.seo,
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
  seo?: { title?: string; description?: string }
}

export async function getUpcomingEvents(limit = 5): Promise<EventListItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'events',
      where: { startDate: { greater_than: new Date().toISOString() }, _status: { equals: 'published' } },
      sort: 'startDate',
      limit,
      depth: 1,
    } as any)
    return (result.docs as any[]).map(mapEvent)
  } catch {
    return []
  }
}

export async function getEventsList(opts: {
  limit?: number
  page?: number
  upcoming?: boolean
} = {}): Promise<{ docs: EventListItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 12, page = 1, upcoming } = opts
    const where: Record<string, unknown> = { _status: { equals: 'published' } }
    if (upcoming) where.startDate = { greater_than: new Date().toISOString() }
    const result = await payload.find({
      collection: 'events',
      where,
      sort: upcoming ? 'startDate' : '-startDate',
      limit,
      page,
      depth: 1,
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

function mapEvent(d: any): EventListItem {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    startDate: d.startDate,
    endDate: d.endDate,
    isAllDay: d.isAllDay,
    eventType: d.eventType,
    location: d.location,
    parish: d.parish ? { title: d.parish.title, slug: d.parish.slug } : null,
    featuredImage: imgOf(d.featuredImage),
    excerpt: d.excerpt,
  }
}

export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      depth: 2,
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return { ...mapEvent(d), description: d.description, cost: d.cost, registrationUrl: d.registrationUrl, seo: d.seo }
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

export interface ParishListItem {
  id: string
  slug: string
  title: string
  vicariate?: string
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
  seo?: { title?: string; description?: string }
}

export async function getParishesList(
  limit = 100,
  vicariate?: string,
): Promise<ParishListItem[]> {
  try {
    const payload = await getPayload()
    const where: Record<string, unknown> = {}
    if (vicariate && vicariate !== 'all') where.vicariate = { equals: vicariate }
    const result = await payload.find({ collection: 'parishes', where, limit, depth: 1 } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      vicariate: d.vicariate,
      patronSaint: d.patronSaint,
      city: d.city,
      pastor: d.priest?.name ?? null,
      image: imgOf(d.featuredImage ?? d.image),
    }))
  } catch {
    return []
  }
}

export async function getParishBySlug(slug: string): Promise<ParishDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'parishes',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    } as any)
    const d = (result.docs as any[])[0]
    if (!d) return null
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      vicariate: d.vicariate,
      patronSaint: d.patronSaint,
      city: d.city,
      pastor: d.priest?.name ?? null,
      image: imgOf(d.featuredImage ?? d.image),
      history: d.history,
      massTimes: d.massTimes ?? [],
      address: d.address,
      phone: d.phone,
      email: d.email,
      gallery: (d.gallery ?? []).map((g: any) => imgOf(g)).filter(Boolean),
      seo: d.seo,
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

export async function getMinistriesList(limit = 100): Promise<MinistryItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'ministries', limit, depth: 1 } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      ministryType: d.ministryType,
      description: d.description,
      leader: d.leader?.name ?? d.leaderName ?? null,
      parish: d.assignedParish ? { title: d.assignedParish.title, slug: d.assignedParish.slug } : null,
      image: imgOf(d.image),
      meetingInfo: d.meetingInfo,
    }))
  } catch {
    return []
  }
}

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
}

export interface ArchiveItem {
  id: string
  slug: string
  title: string
  accessTier?: string
  year?: number
  category?: string
  description?: string
}

export async function getPublicationsList(limit = 50): Promise<PublicationItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'publications', limit, depth: 1, sort: '-publishedYear' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      documentType: d.documentType,
      language: d.language,
      publishedYear: d.publishedYear,
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

export async function getMagazinesList(limit = 50): Promise<MagazineItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'magazines', limit, depth: 1, sort: '-year' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      volume: d.volume,
      issue: d.issue,
      year: d.year,
      coverImage: imgOf(d.coverImage),
      isFeatured: d.isFeatured,
      summary: d.summary,
    }))
  } catch {
    return []
  }
}

export async function getArchivesList(limit = 50): Promise<ArchiveItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({ collection: 'archives', limit, depth: 0, sort: '-year' } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      accessTier: d.accessTier,
      year: d.year,
      category: d.category,
      description: d.description,
    }))
  } catch {
    return []
  }
}

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

export async function getGeezCalendarEntries(month?: string): Promise<GeezCalendarEntry[]> {
  try {
    const payload = await getPayload()
    const where: Record<string, unknown> = {}
    if (month) where['geezDate.geezMonth'] = { equals: month }
    const result = await payload.find({
      collection: 'geez-calendar-entries',
      where,
      sort: 'geezDate.geezDay',
      limit: 365,
      depth: 0,
    } as any)
    return (result.docs as any[]).map((d) => ({
      id: d.id,
      slug: d.slug ?? d.id,
      title: d.title,
      geezMonth: d.geezDate?.geezMonth,
      geezDay: d.geezDate?.geezDay,
      gregorianDate: d.gregorianDate,
      feastRank: d.feastRank,
      liturgicalColor: d.liturgicalColor,
      description: d.description,
      fastingNotes: d.fastingNotes,
    }))
  } catch {
    return []
  }
}

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

export async function getMediaGallery(opts: {
  limit?: number
  category?: string
  page?: number
} = {}): Promise<{ docs: MediaItem[]; meta: PaginationMeta }> {
  try {
    const payload = await getPayload()
    const { limit = 24, category, page = 1 } = opts
    const where: Record<string, unknown> = {}
    if (category) where.category = { equals: category }
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
  seo?: { title?: string; description?: string }
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
      seo: d.seo,
    }
  } catch {
    return null
  }
}

// ─── Globals ──────────────────────────────────────────────────────────────────

export interface HomepageGlobal {
  hero?: {
    enabled?: boolean
    heading?: string
    subheading?: string
    ctaPrimary?: { label?: string; url?: string }
    ctaSecondary?: { label?: string; url?: string }
    backgroundImage?: CMSImage | null
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

export async function getHomepageGlobal(): Promise<HomepageGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'homepage' } as any)
    return data as unknown as HomepageGlobal
  } catch {
    return {}
  }
}

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

export async function getHeaderGlobal(): Promise<HeaderGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'header' } as any)
    return data as unknown as HeaderGlobal
  } catch {
    return {}
  }
}

export interface FooterGlobal {
  columns?: Array<{
    heading: string
    links: Array<{ label: string; url: string }>
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

export async function getFooterGlobal(): Promise<FooterGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'footer' } as any)
    return data as unknown as FooterGlobal
  } catch {
    return {}
  }
}

export interface NavigationGlobal {
  items?: Array<{
    label: string
    url?: string
    openInNewTab?: boolean
    children?: Array<{ label: string; url: string }>
    mobileHighlight?: boolean
  }>
}

export async function getNavigationGlobal(): Promise<NavigationGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'navigation' } as any)
    return data as unknown as NavigationGlobal
  } catch {
    return {}
  }
}

export interface SiteSettingsGlobal {
  siteName?: string
  tagline?: string
  logoDark?: CMSImage | null
  logoLight?: CMSImage | null
  contact?: {
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
  }
  analytics?: {
    ga4Id?: string
    gtmId?: string
  }
  maintenanceMode?: boolean
  maintenanceMessage?: string
}

export async function getSiteSettings(): Promise<SiteSettingsGlobal> {
  try {
    const payload = await getPayload()
    const data = await payload.findGlobal({ slug: 'site-settings' } as any)
    return data as unknown as SiteSettingsGlobal
  } catch {
    return {}
  }
}

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

export async function getLatestBishopMessage(): Promise<BishopMessageItem | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 1,
      depth: 0,
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
      content: d.content,
      pdfUrl: d.pdf?.url ?? null,
    }
  } catch {
    return null
  }
}

export async function getBishopMessagesList(limit = 20): Promise<BishopMessageItem[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
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

export interface BishopMessageDetail extends BishopMessageItem {
  featuredImage?: CMSImage | null
  seo?: { title?: string; description?: string }
}

export async function getBishopMessageBySlug(slug: string): Promise<BishopMessageDetail | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'bishop-messages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
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
      seo: d.seo ? { title: d.seo.metaTitle, description: d.seo.metaDescription } : undefined,
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

// ─── Global search ─────────────────────────────────────────────────────────────

export interface SearchResult {
  type: 'news' | 'event' | 'parish' | 'ministry' | 'publication' | 'bishop-message'
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
  ) => {
    try {
      const whereOr = [
        ...titleFields.map((f) => ({ [f]: { like: term } })),
        ...extraFields.map((f) => ({ [f]: { like: term } })),
      ]
      const res = await payload.find({
        collection,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { or: whereOr },
          ],
        },
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
    )
  }
  if (all || scope === 'events') {
    await run(
      'events', 'event', ['title'], ['description', 'location'],
      (d) => ({ type: 'event', slug: d.slug, title: d.title, excerpt: d.description, date: d.startDate }),
    )
  }
  if (all || scope === 'parishes') {
    await run(
      'parishes', 'parish', ['title'], ['city', 'vicariate'],
      (d) => ({ type: 'parish', slug: d.slug, title: d.title, excerpt: d.city ? `${d.city}` : undefined }),
    )
  }
  if (all || scope === 'ministries') {
    await run(
      'ministries', 'ministry', ['title'], [],
      (d) => ({ type: 'ministry', slug: d.slug, title: d.title }),
    )
  }
  if (all || scope === 'publications') {
    await run(
      'publications', 'publication', ['title'], ['excerpt'],
      (d) => ({ type: 'publication', slug: d.slug, title: d.title, excerpt: d.excerpt }),
    )
  }

  return results
}
