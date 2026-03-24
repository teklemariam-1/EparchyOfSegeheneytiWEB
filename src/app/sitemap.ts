import type { MetadataRoute } from 'next'
import {
  getAllNewsSlugs,
  getAllEventSlugs,
  getAllParishSlugs,
  getAllBishopMessageSlugs,
} from '@/lib/payload/queries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const STATIC_ROUTES: Array<{
  url: string
  lastModified?: Date
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { url: '/', changeFrequency: 'daily', priority: 1.0 },
  { url: '/news', changeFrequency: 'daily', priority: 0.9 },
  { url: '/events', changeFrequency: 'daily', priority: 0.9 },
  { url: '/parishes', changeFrequency: 'weekly', priority: 0.8 },
  { url: '/ministries', changeFrequency: 'weekly', priority: 0.7 },
  { url: '/bishop-messages', changeFrequency: 'weekly', priority: 0.8 },
  { url: '/publications', changeFrequency: 'weekly', priority: 0.7 },
  { url: '/media', changeFrequency: 'weekly', priority: 0.6 },
  { url: '/geez-calendar', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/search', changeFrequency: 'monthly', priority: 0.4 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsSlugs, eventSlugs, parishSlugs, bishopSlugs] = await Promise.all([
    getAllNewsSlugs(),
    getAllEventSlugs(),
    getAllParishSlugs(),
    getAllBishopMessageSlugs(),
  ])

  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const newsEntries: MetadataRoute.Sitemap = newsSlugs.map((s) => ({
    url: `${SITE_URL}/news/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const eventEntries: MetadataRoute.Sitemap = eventSlugs.map((s) => ({
    url: `${SITE_URL}/events/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const parishEntries: MetadataRoute.Sitemap = parishSlugs.map((s) => ({
    url: `${SITE_URL}/parishes/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const bishopEntries: MetadataRoute.Sitemap = bishopSlugs.map((s) => ({
    url: `${SITE_URL}/bishop-messages/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    ...staticEntries,
    ...newsEntries,
    ...eventEntries,
    ...parishEntries,
    ...bishopEntries,
  ]
}
