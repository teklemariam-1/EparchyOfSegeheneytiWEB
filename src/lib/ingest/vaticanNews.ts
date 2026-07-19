import { XMLParser } from 'fast-xml-parser'

/**
 * Vatican News RSS ingestion.
 *
 * We read their public RSS feed rather than scraping HTML: it is the interface
 * they publish for syndication, it is stable across site redesigns, and it
 * carries only a headline plus a short summary. We deliberately store that
 * summary and a link back to the original — never the full article text — so
 * republished items always credit and drive traffic to Vatican News.
 */

export interface FeedItem {
  title: string
  summary: string
  link: string
  publishedAt?: string
  imageUrl?: string
}

export const VATICAN_NEWS_FEEDS = {
  all: 'https://www.vaticannews.va/en.rss.xml',
  pope: 'https://www.vaticannews.va/en/pope.rss.xml',
  world: 'https://www.vaticannews.va/en/world.rss.xml',
} as const

export type VaticanFeedKey = keyof typeof VATICAN_NEWS_FEEDS

/** Strip HTML tags and collapse whitespace/entities into plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<a\b[^>]*>\s*Read all\s*<\/a>/gi, '') // drop the feed's own "Read all" link
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Payload's excerpt guidance is ~160 chars; keep summaries tight but whole-worded. */
function truncate(text: string, max = 300): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return firstString(value[0])
  if (value && typeof value === 'object') {
    const t = (value as Record<string, unknown>)['#text']
    if (typeof t === 'string') return t
  }
  return undefined
}

/** Pull the image URL out of <media:content url="..."> (single or array). */
function extractImage(media: unknown): string | undefined {
  const pick = (m: unknown): string | undefined => {
    if (!m || typeof m !== 'object') return undefined
    const url = (m as Record<string, unknown>)['@_url']
    return typeof url === 'string' ? url : undefined
  }
  if (Array.isArray(media)) {
    for (const m of media) {
      const u = pick(m)
      if (u) return u
    }
    return undefined
  }
  return pick(media)
}

export async function fetchVaticanNews(
  feed: VaticanFeedKey = 'all',
  limit = 20,
): Promise<FeedItem[]> {
  const res = await fetch(VATICAN_NEWS_FEEDS[feed], {
    headers: {
      // Identify ourselves honestly rather than masquerading as a browser.
      'User-Agent': 'EparchyOfSegeneyti-NewsBot/1.0 (+https://eparchy-of-segeheneyti-web.vercel.app)',
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Vatican News feed responded ${res.status}`)
  }

  const xml = await res.text()
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    cdataPropName: '#cdata',
  })
  const parsed = parser.parse(xml)

  const rawItems = parsed?.rss?.channel?.item
  const items: unknown[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  const out: FeedItem[] = []
  for (const raw of items.slice(0, limit)) {
    const it = raw as Record<string, unknown>

    const title = toPlainText(firstString(it.title) ?? firstString((it.title as any)?.['#cdata']) ?? '')
    const link = (firstString(it.link) ?? '').trim()
    if (!title || !link) continue // an item without these is not usable

    const descRaw =
      firstString((it.description as any)?.['#cdata']) ?? firstString(it.description) ?? ''
    const summary = truncate(toPlainText(descRaw))

    let publishedAt: string | undefined
    const pub = firstString(it.pubDate)
    if (pub) {
      const d = new Date(pub)
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString()
    }

    out.push({
      title,
      summary,
      link,
      publishedAt,
      imageUrl: extractImage(it['media:content']),
    })
  }

  return out
}
