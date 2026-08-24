import type { MetadataRoute } from 'next'
import {
  getAllNewsSlugs,
  getAllEventSlugs,
  getAllParishSlugs,
  getAllBishopMessageSlugs,
  getAllPopeMessageSlugs,
  getAllVicariateSlugs,
  getAllOfficeSlugs,
} from '@/lib/payload/queries'
import { getAllBishopSlugs } from '@/lib/bishops/queries'
import { getAllObituarySlugs } from '@/lib/obituary/queries'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()

const STATIC_ROUTES: Array<{
  url: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { url: '/', changeFrequency: 'daily', priority: 1.0 },
  { url: '/news', changeFrequency: 'daily', priority: 0.9 },
  { url: '/events', changeFrequency: 'daily', priority: 0.9 },
  { url: '/parishes', changeFrequency: 'weekly', priority: 0.8 },
  { url: '/vicariates', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/ministries', changeFrequency: 'weekly', priority: 0.7 },
  { url: '/bishop-messages', changeFrequency: 'weekly', priority: 0.8 },
  { url: '/pope-messages', changeFrequency: 'weekly', priority: 0.7 },
  { url: '/publications', changeFrequency: 'weekly', priority: 0.7 },
  { url: '/media', changeFrequency: 'weekly', priority: 0.6 },
  { url: '/apps', changeFrequency: 'monthly', priority: 0.5 },
  { url: '/geez-calendar', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/calendar-subscriptions', changeFrequency: 'monthly', priority: 0.5 },
  { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/bishop', changeFrequency: 'monthly', priority: 0.8 },
  // /eparchs 404s until there are two Eparchs to list, so it is deliberately
  // absent here — advertising a URL that returns 404 is a crawl error, not a
  // discovery aid. Individual profiles below are live from the first record.
  { url: '/obituaries', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/search', changeFrequency: 'monthly', priority: 0.4 },
  { url: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
]

/** Detail-page groups: each provides slugs with a real `updatedAt`. */
const DETAIL_GROUPS: Array<{
  prefix: string
  load: () => Promise<{ slug: string; updatedAt?: string }[]>
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { prefix: '/news', load: getAllNewsSlugs, changeFrequency: 'monthly', priority: 0.7 },
  { prefix: '/events', load: getAllEventSlugs, changeFrequency: 'monthly', priority: 0.6 },
  { prefix: '/parishes', load: getAllParishSlugs, changeFrequency: 'monthly', priority: 0.7 },
  { prefix: '/vicariates', load: getAllVicariateSlugs, changeFrequency: 'monthly', priority: 0.6 },
  { prefix: '/offices', load: getAllOfficeSlugs, changeFrequency: 'monthly', priority: 0.5 },
  { prefix: '/bishop-messages', load: getAllBishopMessageSlugs, changeFrequency: 'monthly', priority: 0.7 },
  { prefix: '/pope-messages', load: getAllPopeMessageSlugs, changeFrequency: 'monthly', priority: 0.6 },
  { prefix: '/eparchs', load: getAllBishopSlugs, changeFrequency: 'monthly', priority: 0.7 },
  { prefix: '/obituaries', load: getAllObituarySlugs, changeFrequency: 'monthly', priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const groups = await Promise.all(DETAIL_GROUPS.map((g) => g.load()))

  // Static routes carry no lastModified — a real, per-page date is better than
  // a fabricated "now" that trains crawlers to distrust the signal.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.url}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const detailEntries: MetadataRoute.Sitemap = DETAIL_GROUPS.flatMap((g, i) =>
    groups[i]!.map((s) => ({
      url: `${SITE_URL}${g.prefix}/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
      changeFrequency: g.changeFrequency,
      priority: g.priority,
    })),
  )

  return [...staticEntries, ...detailEntries]
}
