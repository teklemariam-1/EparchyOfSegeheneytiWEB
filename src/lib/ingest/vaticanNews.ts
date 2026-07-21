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

/** Minimal Lexical text node. */
function textNode(text: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text, version: 1 }
}

/**
 * Build the draft body: the feed's own summary, followed by a clear attribution
 * line linking to the original article.
 *
 * We intentionally do NOT copy the full article text — the RSS feed publishes a
 * summary and a "read more" link, and that is what we reproduce, credited. The
 * editor expands this with the Eparchy's own commentary before publishing.
 */
export function buildDraftBody(summary: string, link: string, sourceName = 'Vatican News') {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [textNode(summary)],
        },
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            textNode('Read the full article at '),
            {
              type: 'link',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              fields: { url: link, newTab: true, linkType: 'custom' },
              children: [textNode(sourceName)],
            },
            textNode('.'),
          ],
        },
      ],
    },
  }
}

/**
 * Optional publication-date window. Bounds are inclusive and either may be
 * omitted. Items with no parseable pubDate are kept only when no window is
 * requested — if staff asked for a specific period, an item we cannot date
 * does not demonstrably fall inside it.
 */
export interface DateBounds {
  from?: string
  to?: string
}

/**
 * Fetch and parse any RSS feed by URL.
 *
 * Feed URLs are configurable content now (see the FeedSources collection), so
 * the parser can no longer assume one of the three built-in Vatican News URLs.
 * `fetchVaticanNews` is kept as a thin wrapper over this for the named feeds.
 */
export async function fetchFeedByUrl(
  feedUrl: string,
  limit = 20,
  bounds: DateBounds = {},
): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      // Identify ourselves honestly rather than masquerading as a browser.
      'User-Agent': 'EparchyOfSegeneyti-NewsBot/1.0 (+https://eparchy-of-segeheneyti-web.vercel.app)',
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Feed responded ${res.status}`)
  }

  const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
  const xml = await res.text()

  // Catch the most common misconfiguration — pointing a source at a normal web
  // page instead of its RSS feed — with a message that says what to do, rather
  // than letting the XML parser fail deep inside with "Maximum nested tags
  // exceeded". An HTML document is not a feed.
  const looksLikeHtml =
    contentType.includes('text/html') || /^\s*<!doctype html|^\s*<html[\s>]/i.test(xml)
  const looksLikeFeed = /<rss[\s>]|<feed[\s>]|<channel[\s>]/i.test(xml)
  if (looksLikeHtml && !looksLikeFeed) {
    throw new Error('Not an RSS feed (looks like a web page). Use the feed URL, e.g. one ending in .rss.xml')
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    cdataPropName: '#cdata',
  })

  let parsed: any
  try {
    parsed = parser.parse(xml)
  } catch (err) {
    throw new Error(`Could not parse feed as XML: ${String((err as Error)?.message ?? err).slice(0, 80)}`)
  }

  // RSS 2.0 nests items under rss.channel; Atom lists them as feed.entry.
  const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry
  const items: unknown[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  // Parse the window once. An unparseable bound is treated as absent rather
  // than silently excluding everything.
  const fromMs = bounds.from ? Date.parse(bounds.from) : NaN
  // A bare "YYYY-MM-DD" parses to midnight, which would exclude that whole day
  // from an inclusive upper bound. Push it to the end of the named day.
  const toMs = bounds.to
    ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(bounds.to) ? `${bounds.to}T23:59:59.999Z` : bounds.to)
    : NaN
  const hasWindow = !Number.isNaN(fromMs) || !Number.isNaN(toMs)

  const out: FeedItem[] = []
  // Filter by date BEFORE applying `limit`. Slicing first would mean a request
  // for an older window returned nothing, because the newest `limit` items
  // would already have been discarded.
  for (const raw of items) {
    if (out.length >= limit) break
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

    if (hasWindow) {
      // No usable date means we cannot prove the item is inside the requested
      // window, so leave it out rather than guessing.
      if (!publishedAt) continue
      const ms = Date.parse(publishedAt)
      if (!Number.isNaN(fromMs) && ms < fromMs) continue
      if (!Number.isNaN(toMs) && ms > toMs) continue
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

/**
 * Fetch one of the three built-in Vatican News feeds.
 *
 * Retained so existing callers (and the seeded default sources) keep working
 * now that feed URLs live in the CMS.
 */
export async function fetchVaticanNews(
  feed: VaticanFeedKey = 'all',
  limit = 20,
  bounds: DateBounds = {},
): Promise<FeedItem[]> {
  return fetchFeedByUrl(VATICAN_NEWS_FEEDS[feed], limit, bounds)
}
