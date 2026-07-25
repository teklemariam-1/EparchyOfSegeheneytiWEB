/**
 * Resolve a URL a human pasted into a Feed Source to an actual RSS/Atom feed.
 *
 * Staff naturally paste the page they read (…/ti.html), not its feed. Rather
 * than reject that, we try to find the real feed:
 *
 *   1. If it already looks/behaves like a feed, keep it.
 *   2. Vatican News publishes a feed beside every page at the same path with
 *      `.rss.xml` instead of `.html`, so try that transform first (cheap).
 *   3. Otherwise fetch the page and read its <link rel="alternate"
 *      type="application/rss+xml"> autodiscovery tag.
 *
 * Returns the resolved feed URL, or throws with a message the admin can act on.
 */

import { safeFetchWithRetry, DEFAULT_USER_AGENT } from './safeFetch'

const UA = DEFAULT_USER_AGENT

async function looksLikeFeed(url: string): Promise<boolean> {
  try {
    const res = await safeFetchWithRetry(url, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' },
      cache: 'no-store',
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type')?.toLowerCase() ?? ''
    const body = (await res.text()).slice(0, 4000)
    const isXmlType = ct.includes('xml') || ct.includes('rss')
    const hasFeedRoot = /<rss[\s>]|<feed[\s>]|<channel[\s>]/i.test(body)
    return (isXmlType || hasFeedRoot) && hasFeedRoot
  } catch {
    return false
  }
}

/** Extract the first RSS/Atom autodiscovery link from an HTML document. */
export function discoverFromHtml(html: string, baseUrl: string): string | null {
  // Match <link ... rel="alternate" ... type="application/rss+xml|atom+xml" ... href="...">
  // in either attribute order.
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    const isAlternate = /rel\s*=\s*["']?[^"'>]*alternate/i.test(tag)
    const isFeedType = /type\s*=\s*["']application\/(rss|atom)\+xml["']/i.test(tag)
    if (!isAlternate || !isFeedType) continue
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]
    if (href) {
      try {
        return new URL(href, baseUrl).toString()
      } catch {
        // ignore malformed href, keep scanning
      }
    }
  }
  return null
}

export async function resolveFeedUrl(input: string): Promise<{ url: string; changed: boolean }> {
  const raw = input.trim()
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Enter a full URL, including https://')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Feed URL must start with http:// or https://')
  }

  // 1. Already a feed? Keep it.
  if (/\.(rss|atom|xml)(\?|$)/i.test(parsed.pathname) || (await looksLikeFeed(raw))) {
    return { url: raw, changed: false }
  }

  // 2. Vatican News (and similar) .html → .rss.xml at the same path.
  if (/\.html?$/i.test(parsed.pathname)) {
    const guess = raw.replace(/\.html?(\?|$)/i, '.rss.xml$1')
    if (await looksLikeFeed(guess)) {
      return { url: guess, changed: true }
    }
  }

  // 3. Autodiscovery: read the page and follow its declared feed link.
  try {
    const res = await safeFetchWithRetry(raw, { headers: { 'User-Agent': UA }, cache: 'no-store' })
    if (res.ok) {
      const html = (await res.text()).slice(0, 200_000)
      const discovered = discoverFromHtml(html, raw)
      if (discovered && (await looksLikeFeed(discovered))) {
        return { url: discovered, changed: discovered !== raw }
      }
    }
  } catch {
    // fall through to the error below
  }

  throw new Error(
    'That URL is not an RSS feed and no feed link was found on the page. Paste the feed URL directly (often ending in .rss.xml).',
  )
}
