/**
 * RSS 2.0 for the news listing.
 *
 * The site INGESTS Vatican News by RSS but published none of its own — so
 * readers' feed apps, aggregators, and the automation tools people use to
 * mirror content into WhatsApp channels had nothing to follow. This is the
 * other half.
 *
 * Kept as a pure builder so escaping is testable: titles here are routinely
 * Ge'ez, and an unescaped `&` or `<` in any title corrupts the whole document
 * for every subscriber, not just one entry.
 */

export interface RssItem {
  title: string
  /** Absolute URL — feed readers resolve nothing relative. */
  url: string
  description?: string | null
  /** ISO date. */
  publishedAt?: string | null
}

export interface RssChannel {
  title: string
  description: string
  /** Absolute site URL. */
  siteUrl: string
  /** Absolute URL of the feed itself. */
  feedUrl: string
  language: string
  items: RssItem[]
}

/** The five characters XML cannot carry raw. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RFC 822 date, the format RSS 2.0 requires. Invalid input renders nothing. */
function rfc822(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toUTCString()
}

export function buildRssXml(channel: RssChannel): string {
  const items = channel.items
    .map((item) => {
      const pubDate = rfc822(item.publishedAt)
      return [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.url)}</link>`,
        // The URL is the stable identity of an article; explicit isPermaLink
        // so readers dedupe on it across feed regenerations.
        `      <guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
        item.description ? `      <description>${escapeXml(item.description)}</description>` : null,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.siteUrl)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}
