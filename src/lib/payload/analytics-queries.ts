import { getPayload } from './client'
import { contentBucket } from '../analytics'

/**
 * Aggregation queries for the superadmin analytics dashboard.
 * Not cached: administrators should always see fresh numbers.
 * All data is anonymous daily aggregates (see VisitorStats collection).
 */

export interface DailyPoint {
  date: string
  count: number
}

export interface VisitorAnalytics {
  sessions: number
  pageViews: number
  /** One entry per day in range (zero-filled) */
  daily: Array<{ date: string; sessions: number; views: number }>
  byCountry: Array<{ code: string; count: number; daily: DailyPoint[] }>
  byDevice: Array<{ key: string; count: number }>
  bySource: Array<{ key: string; count: number }>
  byLanguage: Array<{ key: string; count: number }>
  topPaths: Array<{ path: string; count: number }>
  byBucket: Array<{ bucket: string; count: number }>
  topSearches: Array<{ term: string; count: number }>
  emptySearches: Array<{ term: string; count: number }>
}

function toDayIso(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function sortDesc<T extends { count: number }>(arr: T[]): T[] {
  return arr.sort((a, b) => b.count - a.count)
}

export async function getVisitorAnalytics(from: string | null, to: string): Promise<VisitorAnalytics> {
  const payload = await getPayload()
  const and: Record<string, unknown>[] = [{ date: { less_than_equal: `${to}T23:59:59.999Z` } }]
  if (from) and.push({ date: { greater_than_equal: `${from}T00:00:00.000Z` } })

  const rows: Array<{ dimension?: string; key?: string; country?: string; date: string; count: number }> = []
  let page = 1
  // Paginate defensively; daily aggregates stay small but never truncate silently.
  for (;;) {
    const res = await payload.find({
      collection: 'visitor-stats',
      where: { and },
      limit: 5000,
      page,
      depth: 0,
      overrideAccess: true,
    } as any)
    rows.push(...(res.docs as any[]))
    if (!res.hasNextPage || page >= 10) break
    page += 1
  }

  const daily = new Map<string, { sessions: number; views: number }>()
  const byCountry = new Map<string, { count: number; daily: Map<string, number> }>()
  const counters: Record<'device' | 'source' | 'language', Map<string, number>> = {
    device: new Map(),
    source: new Map(),
    language: new Map(),
  }
  const paths = new Map<string, number>()
  const searches = new Map<string, number>()
  const emptySearches = new Map<string, number>()

  let sessions = 0
  let pageViews = 0

  for (const r of rows) {
    const day = toDayIso(r.date)
    const n = Number(r.count) || 0
    // Legacy rows predate the dimension column: they are country rows.
    const dimension = r.dimension || 'country'
    const key = r.key || r.country || 'Unknown'

    if (dimension === 'country') {
      sessions += n
      const entry = byCountry.get(key) ?? { count: 0, daily: new Map() }
      entry.count += n
      entry.daily.set(day, (entry.daily.get(day) ?? 0) + n)
      byCountry.set(key, entry)
      const d = daily.get(day) ?? { sessions: 0, views: 0 }
      d.sessions += n
      daily.set(day, d)
    } else if (dimension === 'path') {
      pageViews += n
      paths.set(key, (paths.get(key) ?? 0) + n)
      const d = daily.get(day) ?? { sessions: 0, views: 0 }
      d.views += n
      daily.set(day, d)
    } else if (dimension === 'device' || dimension === 'source' || dimension === 'language') {
      counters[dimension].set(key, (counters[dimension].get(key) ?? 0) + n)
    } else if (dimension === 'search') {
      searches.set(key, (searches.get(key) ?? 0) + n)
    } else if (dimension === 'search-empty') {
      emptySearches.set(key, (emptySearches.get(key) ?? 0) + n)
    }
  }

  // Zero-filled daily series across the range (bounded to a year of points).
  const series: VisitorAnalytics['daily'] = []
  const start = from ?? [...daily.keys()].sort()[0] ?? to
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${to}T00:00:00Z`)
  if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
    for (let t = startMs; t <= endMs && series.length < 366; t += 86_400_000) {
      const day = new Date(t).toISOString().slice(0, 10)
      const d = daily.get(day)
      series.push({ date: day, sessions: d?.sessions ?? 0, views: d?.views ?? 0 })
    }
  }

  const bucketTotals = new Map<string, number>()
  for (const [path, count] of paths) {
    const bucket = contentBucket(path)
    bucketTotals.set(bucket, (bucketTotals.get(bucket) ?? 0) + count)
  }

  const mapToArr = (m: Map<string, number>) =>
    sortDesc([...m.entries()].map(([key, count]) => ({ key, count })))

  return {
    sessions,
    pageViews,
    daily: series,
    byCountry: sortDesc(
      [...byCountry.entries()].map(([code, v]) => ({
        code,
        count: v.count,
        daily: [...v.daily.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      })),
    ),
    byDevice: mapToArr(counters.device),
    bySource: mapToArr(counters.source),
    byLanguage: mapToArr(counters.language),
    topPaths: sortDesc([...paths.entries()].map(([path, count]) => ({ path, count }))).slice(0, 25),
    byBucket: sortDesc([...bucketTotals.entries()].map(([bucket, count]) => ({ bucket, count }))),
    topSearches: sortDesc([...searches.entries()].map(([term, count]) => ({ term, count }))).slice(0, 15),
    emptySearches: sortDesc([...emptySearches.entries()].map(([term, count]) => ({ term, count }))).slice(0, 10),
  }
}

// ─── Content, engagement, media, users ───────────────────────────────────────

async function safeCount(collection: string, where?: Record<string, unknown>): Promise<number> {
  try {
    const payload = await getPayload()
    const r = await payload.count({ collection, ...(where ? { where } : {}), overrideAccess: true } as any)
    return r.totalDocs ?? 0
  } catch {
    return -1
  }
}

export interface ContentStats {
  groups: Array<{ title: string; items: Array<{ label: string; value: number; href: string }> }>
}

export async function getContentStats(): Promise<ContentStats> {
  const c = (slug: string, where?: Record<string, unknown>) => safeCount(slug, where)
  const [
    news, newsDrafts, events, media, pages,
    parishes, vicariates, priests, ministries, offices,
    popeMsgs, bishopMsgs, publications, magazines, archives, apps,
    schools, clinics, childrenPrograms, sccs, geezDays, monthlyFeasts,
  ] = await Promise.all([
    c('news'), c('news', { _status: { equals: 'draft' } }), c('events'), c('media'), c('pages'),
    c('parishes'), c('vicariates'), c('priests'), c('ministries'), c('offices'),
    c('pope-messages'), c('bishop-messages'), c('publications'), c('magazines'), c('archives'), c('apps'),
    c('schools'), c('clinics'), c('children-programs'), c('small-christian-communities'),
    c('geez-calendar-days'), c('geez-monthly-feasts'),
  ])

  const l = (label: string, value: number, slug: string) => ({
    label,
    value,
    href: `/admin/collections/${slug}`,
  })

  return {
    groups: [
      {
        title: 'Content',
        items: [
          l('News articles', news, 'news'),
          l('News drafts', newsDrafts, 'news'),
          l('Events', events, 'events'),
          l('Media files', media, 'media'),
          l('Pages', pages, 'pages'),
        ],
      },
      {
        title: 'Church',
        items: [
          l('Parishes', parishes, 'parishes'),
          l('Vicariates', vicariates, 'vicariates'),
          l('Priests', priests, 'priests'),
          l('Ministries', ministries, 'ministries'),
          l('Offices', offices, 'offices'),
          l('Small Christian Communities', sccs, 'small-christian-communities'),
        ],
      },
      {
        title: 'Resources',
        items: [
          l('Pope messages', popeMsgs, 'pope-messages'),
          l('Bishop messages', bishopMsgs, 'bishop-messages'),
          l('Publications', publications, 'publications'),
          l('Magazines', magazines, 'magazines'),
          l('Archives', archives, 'archives'),
          l('Apps', apps, 'apps'),
        ],
      },
      {
        title: 'Education, Health & Calendar',
        items: [
          l('Schools', schools, 'schools'),
          l('Health centres', clinics, 'clinics'),
          l("Children's programs", childrenPrograms, 'children-programs'),
          l("Ge'ez calendar days", geezDays, 'geez-calendar-days'),
          l('Monthly feasts', monthlyFeasts, 'geez-monthly-feasts'),
        ],
      },
    ],
  }
}

export interface EngagementStats {
  contactTotal: number
  contactInRange: number
  contactUnread: number
  subscribersConfirmed: number
  subscribersInRange: number
}

export async function getEngagementStats(from: string | null, to: string): Promise<EngagementStats> {
  const createdRange: Record<string, unknown>[] = [
    { createdAt: { less_than_equal: `${to}T23:59:59.999Z` } },
  ]
  if (from) createdRange.push({ createdAt: { greater_than_equal: `${from}T00:00:00.000Z` } })

  const [contactTotal, contactInRange, contactUnread, subscribersConfirmed, subscribersInRange] =
    await Promise.all([
      safeCount('contact-submissions'),
      safeCount('contact-submissions', { and: createdRange }),
      safeCount('contact-submissions', { status: { equals: 'new' } }),
      safeCount('subscribers', { status: { equals: 'confirmed' } }),
      safeCount('subscribers', { and: createdRange }),
    ])

  return { contactTotal, contactInRange, contactUnread, subscribersConfirmed, subscribersInRange }
}

export interface MediaStats {
  total: number
  images: number
  documents: number
  other: number
  restricted: number
  storageBytes: number
  recentUploads: Array<{ filename: string; createdAt: string; mimeType?: string }>
}

export async function getMediaStats(): Promise<MediaStats> {
  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'media',
      limit: 2000,
      depth: 0,
      sort: '-createdAt',
      overrideAccess: true,
    } as any)
    const docs = res.docs as any[]
    let images = 0
    let documents = 0
    let other = 0
    let restricted = 0
    let storageBytes = 0
    for (const d of docs) {
      const mime = String(d.mimeType ?? '')
      if (mime.startsWith('image/')) images += 1
      else if (mime === 'application/pdf') documents += 1
      else other += 1
      if (d.accessLevel === 'restricted') restricted += 1
      storageBytes += Number(d.filesize) || 0
    }
    return {
      total: docs.length,
      images,
      documents,
      other,
      restricted,
      storageBytes,
      recentUploads: docs.slice(0, 5).map((d) => ({
        filename: d.filename ?? '(file)',
        createdAt: d.createdAt,
        mimeType: d.mimeType,
      })),
    }
  } catch {
    return { total: -1, images: 0, documents: 0, other: 0, restricted: 0, storageBytes: 0, recentUploads: [] }
  }
}

export interface UserSecurityStats {
  totalUsers: number
  byRole: Array<{ role: string; count: number }>
  lockedAccounts: number
  accountsWithFailedAttempts: number
  recentChanges: Array<{ type: string; title: string; updatedAt: string; href: string }>
}

export async function getUserSecurityStats(): Promise<UserSecurityStats> {
  try {
    const payload = await getPayload()
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    } as any)
    const now = Date.now()
    const byRole = new Map<string, number>()
    let locked = 0
    let failed = 0
    for (const u of users.docs as any[]) {
      const role = u.role ?? 'unknown'
      byRole.set(role, (byRole.get(role) ?? 0) + 1)
      if (u.lockUntil && Date.parse(u.lockUntil) > now) locked += 1
      if (Number(u.loginAttempts) > 0) failed += 1
    }

    const recent: UserSecurityStats['recentChanges'] = []
    for (const [slug, type] of [
      ['news', 'News'],
      ['events', 'Event'],
    ] as const) {
      try {
        const res = await payload.find({
          collection: slug,
          limit: 4,
          depth: 0,
          sort: '-updatedAt',
          overrideAccess: true,
        } as any)
        for (const d of res.docs as any[]) {
          recent.push({
            type,
            title: d.title ?? d.slug ?? '(untitled)',
            updatedAt: d.updatedAt,
            href: `/admin/collections/${slug}/${d.id}`,
          })
        }
      } catch {
        // skip collection on error
      }
    }
    recent.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

    return {
      totalUsers: users.totalDocs ?? users.docs.length,
      byRole: [...byRole.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count),
      lockedAccounts: locked,
      accountsWithFailedAttempts: failed,
      recentChanges: recent.slice(0, 6),
    }
  } catch {
    return { totalUsers: -1, byRole: [], lockedAccounts: 0, accountsWithFailedAttempts: 0, recentChanges: [] }
  }
}
