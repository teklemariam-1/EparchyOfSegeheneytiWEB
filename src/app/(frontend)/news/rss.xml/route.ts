import { NextResponse } from 'next/server'
import { getNewsList } from '@/lib/payload/queries'
import { buildRssXml } from '@/lib/feeds/rss'

/**
 * GET /news/rss.xml — the site's own news feed.
 *
 * English titles: RSS has no per-item language mechanism worth trusting across
 * readers, and en is the localization default every article is guaranteed to
 * have. Twenty items covers well over a month of publishing here; readers keep
 * their own history.
 */

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eparchy-of-segeheneyti-web.vercel.app').replace(/\/$/, '')

export async function GET() {
  const { docs } = await getNewsList({ limit: 20, locale: 'en' })

  const xml = buildRssXml({
    title: 'Catholic Eparchy of Segheneyti — News',
    description: 'News and announcements from the Catholic Eparchy of Segheneyti, Eritrea.',
    siteUrl: `${SITE_URL}/news`,
    feedUrl: `${SITE_URL}/news/rss.xml`,
    language: 'en',
    items: docs.map((item) => ({
      title: item.title,
      url: `${SITE_URL}/news/${item.slug}`,
      description: item.excerpt ?? null,
      publishedAt: item.publishedAt ?? null,
    })),
  })

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      // Readers poll on their own schedule; five minutes keeps the DB out of
      // every poll without making publication feel delayed.
      'cache-control': 'public, max-age=300',
    },
  })
}
