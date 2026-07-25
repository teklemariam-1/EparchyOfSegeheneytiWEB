/**
 * Format-agnostic feed parsing.
 *
 * A configured source can be RSS 2.0, Atom, or JSON Feed, and the same site may
 * change shape over time. Rather than assume RSS 2.0 (as the original Vatican
 * News parser did — which silently dropped every Atom item because Atom links
 * live in an @href attribute, not text), we detect the format and extract the
 * fields each one actually uses.
 *
 * Everything here is pure and synchronous so it can be unit-tested against
 * captured feed bodies without a network. Fetching, retries and date-window
 * filtering live in the callers.
 */

import { XMLParser } from 'fast-xml-parser'

export interface FeedItem {
  title: string
  summary: string
  link: string
  publishedAt?: string
  imageUrl?: string
}

export type FeedFormat = 'rss' | 'atom' | 'json' | 'html' | 'unknown'

// ---------------------------------------------------------------------------
// Entity / text handling
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

/**
 * Decode HTML/XML entities, including numeric character references.
 *
 * Ge'ez (Tigrinya) text is frequently delivered as decimal numeric references
 * (e.g. `&#4768;` → ጠ) or hex (`&#x12A0;`). The original parser only decoded a
 * fixed handful of named entities, so Tigrinya titles survived as literal
 * `&#4768;` garbage. `String.fromCodePoint` handles the full range.
 */
export function decodeEntities(input: string): string {
  if (!input) return ''
  return input.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10)
      if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return match
      try {
        return String.fromCodePoint(code)
      } catch {
        return match
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()]
    return named ?? match
  })
}

/** Strip HTML tags, decode entities, and collapse whitespace into plain text. */
export function toPlainText(html: string): string {
  return decodeEntities(
    String(html ?? '')
      .replace(/<a\b[^>]*>\s*Read all\s*<\/a>/gi, '') // drop the feed's own "Read all" link
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

/** Keep summaries tight but whole-worded (Payload's excerpt guidance is ~160). */
export function truncate(text: string, max = 300): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// ---------------------------------------------------------------------------
// Value extraction helpers (tolerant of string | {#text} | {#cdata} | array)
// ---------------------------------------------------------------------------

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    for (const v of value) {
      const s = firstString(v)
      if (s) return s
    }
    return undefined
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const cdata = firstString(obj['#cdata'])
    if (cdata) return cdata
    const text = firstString(obj['#text'])
    if (text) return text
  }
  return undefined
}

/** Try several possible field names in order, returning the first non-empty. */
function pickText(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const s = firstString(obj[k])
    if (s && s.trim()) return s
  }
  return undefined
}

/**
 * Extract a usable link across formats.
 *  - RSS: <link> is text.
 *  - Atom: <link href="…" rel="alternate"> — may be a single object or an array
 *    of them; prefer rel="alternate" (or no rel) over "self"/"enclosure".
 */
function extractLink(link: unknown): string {
  if (typeof link === 'string') return link.trim()
  if (Array.isArray(link)) {
    const preferred =
      link.find(
        (l) =>
          l &&
          typeof l === 'object' &&
          ((l as Record<string, unknown>)['@_rel'] === 'alternate' ||
            (l as Record<string, unknown>)['@_rel'] === undefined),
      ) ?? link[0]
    return extractLink(preferred)
  }
  if (link && typeof link === 'object') {
    const obj = link as Record<string, unknown>
    const href = obj['@_href']
    if (typeof href === 'string') return href.trim()
    const text = firstString(obj)
    if (text) return text.trim()
  }
  return ''
}

/** Pull an image URL from media:content / media:thumbnail / enclosure. */
function extractImage(item: Record<string, unknown>): string | undefined {
  const fromUrlAttr = (m: unknown): string | undefined => {
    if (Array.isArray(m)) {
      for (const one of m) {
        const u = fromUrlAttr(one)
        if (u) return u
      }
      return undefined
    }
    if (m && typeof m === 'object') {
      const url = (m as Record<string, unknown>)['@_url']
      if (typeof url === 'string') return url
    }
    return undefined
  }
  const enclosure = item['enclosure']
  const enclosureUrl = (() => {
    const pick = (e: unknown): string | undefined => {
      if (Array.isArray(e)) return e.map(pick).find(Boolean)
      if (e && typeof e === 'object') {
        const o = e as Record<string, unknown>
        const type = String(o['@_type'] ?? '')
        if (!type || type.startsWith('image/')) {
          const url = o['@_url']
          if (typeof url === 'string') return url
        }
      }
      return undefined
    }
    return pick(enclosure)
  })()
  return (
    fromUrlAttr(item['media:content']) ??
    fromUrlAttr(item['media:thumbnail']) ??
    enclosureUrl
  )
}

function toIso(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

// ---------------------------------------------------------------------------
// Format detection + top-level parse
// ---------------------------------------------------------------------------

export function detectFeedFormat(text: string, contentType = ''): FeedFormat {
  const ct = contentType.toLowerCase()
  const head = text.slice(0, 2000)
  const trimmed = text.trimStart()

  if (ct.includes('json') || trimmed.startsWith('{')) {
    if (/"version"\s*:\s*"https?:\/\/jsonfeed\.org/i.test(head) || /"items"\s*:/.test(head)) {
      return 'json'
    }
  }
  if (/<\?xml|<rss[\s>]|<feed[\s>]|<channel[\s>]/i.test(head)) {
    if (/<feed[\s>]/i.test(head) && !/<rss[\s>]/i.test(head)) return 'atom'
    if (/<rss[\s>]|<channel[\s>]/i.test(head)) return 'rss'
    if (/<feed[\s>]/i.test(head)) return 'atom'
  }
  if (ct.includes('text/html') || /^\s*<!doctype html|^\s*<html[\s>]/i.test(trimmed)) {
    return 'html'
  }
  return 'unknown'
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  cdataPropName: '#cdata',
})

function parseJsonFeed(text: string): FeedItem[] {
  const data = JSON.parse(text) as { items?: unknown[] }
  const items = Array.isArray(data.items) ? data.items : []
  const out: FeedItem[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const it = raw as Record<string, unknown>
    const title = toPlainText(String(it['title'] ?? ''))
    const link = String(it['url'] ?? it['external_url'] ?? '').trim()
    if (!title || !link) continue
    const summaryRaw = String(it['content_text'] ?? it['summary'] ?? it['content_html'] ?? '')
    out.push({
      title,
      summary: truncate(toPlainText(summaryRaw)),
      link,
      publishedAt: toIso(firstString(it['date_published'])),
      imageUrl:
        typeof it['image'] === 'string'
          ? (it['image'] as string)
          : typeof it['banner_image'] === 'string'
            ? (it['banner_image'] as string)
            : undefined,
    })
  }
  return out
}

function parseXmlFeed(text: string): { format: FeedFormat; items: FeedItem[] } {
  const parsed = xmlParser.parse(text)
  const isAtom = !!parsed?.feed && !parsed?.rss
  const rawItems = isAtom ? parsed?.feed?.entry : parsed?.rss?.channel?.item
  const list: unknown[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  const items: FeedItem[] = []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const it = raw as Record<string, unknown>

    const title = toPlainText(pickText(it, ['title']) ?? '')
    const link = extractLink(it['link'])
    if (!title || !link) continue

    const summaryRaw =
      pickText(it, ['content:encoded', 'description', 'summary', 'content']) ?? ''

    const publishedAt = toIso(
      pickText(it, ['pubDate', 'published', 'updated', 'dc:date', 'date']),
    )

    items.push({
      title,
      summary: truncate(toPlainText(summaryRaw)),
      link,
      publishedAt,
      imageUrl: extractImage(it),
    })
  }
  return { format: isAtom ? 'atom' : 'rss', items }
}

/**
 * Parse a feed body of any supported format into normalized items.
 *
 * Never throws for an unrecognized body — returns `format: 'html' | 'unknown'`
 * with an empty item list so callers can report a clear, source-specific error
 * instead of crashing the whole ingest run.
 */
export function parseFeed(
  text: string,
  contentType = '',
): { format: FeedFormat; items: FeedItem[] } {
  const format = detectFeedFormat(text, contentType)
  try {
    if (format === 'json') return { format, items: parseJsonFeed(text) }
    if (format === 'rss' || format === 'atom') return parseXmlFeed(text)
  } catch {
    return { format, items: [] }
  }
  return { format, items: [] }
}
