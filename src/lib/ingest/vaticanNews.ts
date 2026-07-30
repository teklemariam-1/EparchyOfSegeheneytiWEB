import { safeFetchWithRetry } from './safeFetch'
import { parseFeed, type FeedItem, type FeedFormat } from './feedParser'
import { discoverFromHtml } from './resolveFeedUrl'

/**
 * Feed ingestion.
 *
 * We read publishers' syndication feeds rather than scraping HTML: they are the
 * interface published for reuse, stable across redesigns, and carry only a
 * headline plus a short summary. We deliberately store that summary and a link
 * back to the original — never the full article text — so republished items
 * always credit and drive traffic to the source.
 *
 * Format handling (RSS 2.0 / Atom / JSON Feed), entity decoding and field
 * extraction live in ./feedParser; fetching, retries and autodiscovery live
 * here.
 */

export type { FeedItem, FeedFormat }

export const VATICAN_NEWS_FEEDS = {
  all: 'https://www.vaticannews.va/en.rss.xml',
  pope: 'https://www.vaticannews.va/en/pope.rss.xml',
  world: 'https://www.vaticannews.va/en/world.rss.xml',
} as const

export type VaticanFeedKey = keyof typeof VATICAN_NEWS_FEEDS

/** Minimal Lexical text node. */
function textNode(text: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text, version: 1 }
}

/**
 * Attribution sentence around the source link: `{before}{source link}{after}`.
 * Overridable per language so machine-translated drafts carry a Tigrinya
 * attribution instead of an English one.
 */
export interface Attribution {
  before: string
  after: string
}

export const ATTRIBUTION_EN: Attribution = { before: 'Read the full article at ', after: '.' }
export const ATTRIBUTION_TI: Attribution = { before: 'ምሉእ ጽሑፍ ኣብ ', after: ' ኣንብቡ።' }

/**
 * Build the draft body: the feed's own summary, followed by a clear attribution
 * line linking to the original article. We never copy full article text.
 */
export function buildDraftBody(
  summary: string,
  link: string,
  sourceName = 'Vatican News',
  attribution: Attribution = ATTRIBUTION_EN,
) {
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
            textNode(attribution.before),
            {
              type: 'link',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              fields: { url: link, newTab: true, linkType: 'custom' },
              children: [textNode(sourceName)],
            },
            textNode(attribution.after),
          ],
        },
      ],
    },
  }
}

/**
 * Optional publication-date window. Bounds are inclusive and either may be
 * omitted. Items with no parseable date are kept only when no window is
 * requested — if staff asked for a period, an item we cannot date does not
 * demonstrably fall inside it.
 */
export interface DateBounds {
  from?: string
  to?: string
}

const FEED_HEADERS = {
  Accept:
    'application/rss+xml, application/atom+xml;q=0.9, application/feed+json;q=0.9, application/json;q=0.8, application/xml;q=0.7, */*;q=0.5',
} as const

/** Apply an inclusive publication-date window and a max item count. */
function applyWindow(items: FeedItem[], limit: number, bounds: DateBounds): FeedItem[] {
  const fromMs = bounds.from ? Date.parse(bounds.from) : NaN
  // A bare "YYYY-MM-DD" upper bound parses to midnight, which would exclude that
  // whole day; push it to the end of the named day.
  const toMs = bounds.to
    ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(bounds.to) ? `${bounds.to}T23:59:59.999Z` : bounds.to)
    : NaN
  const hasWindow = !Number.isNaN(fromMs) || !Number.isNaN(toMs)

  const out: FeedItem[] = []
  for (const item of items) {
    if (out.length >= limit) break
    if (hasWindow) {
      if (!item.publishedAt) continue
      const ms = Date.parse(item.publishedAt)
      if (!Number.isNaN(fromMs) && ms < fromMs) continue
      if (!Number.isNaN(toMs) && ms > toMs) continue
    }
    out.push(item)
  }
  return out
}

export interface FeedProbe {
  ok: boolean
  httpStatus: number | null
  format: FeedFormat
  itemCount: number
  items: FeedItem[]
  finalUrl: string
  error?: string
}

/**
 * Fetch, parse and diagnose a feed without throwing for expected failures.
 *
 * Returns a structured result (HTTP status, detected format, item count, error)
 * used both by the ingest run and by the "test source" diagnostics. If the URL
 * returns HTML, it attempts one round of feed autodiscovery (following a
 * <link rel="alternate"> tag) before giving up — so a homepage URL that slipped
 * through still resolves at fetch time.
 */
export async function probeFeed(
  feedUrl: string,
  limit = 20,
  bounds: DateBounds = {},
): Promise<FeedProbe> {
  const base: FeedProbe = {
    ok: false,
    httpStatus: null,
    format: 'unknown',
    itemCount: 0,
    items: [],
    finalUrl: feedUrl,
  }

  let res: Response
  try {
    res = await safeFetchWithRetry(feedUrl, { headers: { ...FEED_HEADERS }, cache: 'no-store' })
  } catch (err) {
    return { ...base, error: String((err as Error)?.message ?? err).slice(0, 160) }
  }

  base.httpStatus = res.status
  base.finalUrl = res.url || feedUrl
  if (!res.ok) return { ...base, error: `Feed responded ${res.status}` }

  const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
  let text = await res.text()
  let { format, items } = parseFeed(text, contentType)

  // Given a web page instead of a feed, try to discover its feed link once.
  if (format === 'html' || (items.length === 0 && format === 'unknown')) {
    const discovered = discoverFromHtml(text, base.finalUrl)
    if (discovered && discovered !== base.finalUrl) {
      try {
        const res2 = await safeFetchWithRetry(discovered, { headers: { ...FEED_HEADERS }, cache: 'no-store' })
        if (res2.ok) {
          base.httpStatus = res2.status
          base.finalUrl = res2.url || discovered
          text = await res2.text()
          ;({ format, items } = parseFeed(text, res2.headers.get('content-type')?.toLowerCase() ?? ''))
        }
      } catch {
        // keep the original HTML result and report below
      }
    }
  }

  base.format = format
  if (format === 'html') {
    return {
      ...base,
      error: 'Not a feed (looks like a web page). Use the feed URL, e.g. one ending in .rss.xml',
    }
  }
  if (items.length === 0) {
    return { ...base, error: 'No items found in the feed (empty or unrecognized format).' }
  }

  const windowed = applyWindow(items, limit, bounds)
  return { ...base, ok: true, items: windowed, itemCount: windowed.length }
}

/**
 * Fetch and parse any feed by URL, returning items or throwing a clear message.
 *
 * Thin wrapper over `probeFeed` for callers that want the items directly.
 */
export async function fetchFeedByUrl(
  feedUrl: string,
  limit = 20,
  bounds: DateBounds = {},
): Promise<FeedItem[]> {
  const probe = await probeFeed(feedUrl, limit, bounds)
  if (!probe.ok) throw new Error(probe.error ?? 'Feed could not be read')
  return probe.items
}

/** Fetch one of the built-in Vatican News feeds (used as a fallback default). */
export async function fetchVaticanNews(
  feed: VaticanFeedKey = 'all',
  limit = 20,
  bounds: DateBounds = {},
): Promise<FeedItem[]> {
  return fetchFeedByUrl(VATICAN_NEWS_FEEDS[feed], limit, bounds)
}
