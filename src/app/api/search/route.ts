import { NextResponse } from 'next/server'
import { globalSearch } from '@/lib/payload/queries'
import { CATEGORY_BY_TYPE } from '@/lib/search/registry'
import { consume } from '@/lib/security/rateLimit'
import { clientKey } from '@/lib/security/clientId'
import { isBot } from '@/lib/security/bots'

export const dynamic = 'force-dynamic'

/**
 * Typeahead suggestions for the header search box.
 *
 * This is the one search path that a visitor can trigger repeatedly without
 * meaning to — a dropdown fires as they type, so what is one query on the
 * results page becomes several here. That shapes every decision below.
 *
 * It returns a SMALL payload on purpose. A meaningful share of visitors are on
 * slow or metered Eritrean connections, and a suggestion list that ships full
 * excerpts per keystroke costs them real money for text they will never read.
 * Anything the dropdown does not display is not sent.
 *
 * The results page remains the source of truth: this endpoint exists only to
 * shorten the path to it, and the header works without it.
 */

/** Suggestions are a glance, not a page. */
const MAX_SUGGESTIONS = 8

/** Matches the minimum the results page enforces. */
const MIN_QUERY_LENGTH = 2

/**
 * Long queries are not real searches. Capping the length also caps the work the
 * Ge'ez variant expansion and the trigram scan can be asked to do.
 */
const MAX_QUERY_LENGTH = 100

/**
 * Generous for a person typing, restrictive for a script. A debounced box emits
 * roughly one request per pause, so a determined human searching hard might
 * reach thirty in a minute; anything far beyond that is automated.
 */
const RATE_LIMIT = { limit: 40, windowSeconds: 60 }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)
  const scope = searchParams.get('scope') ?? 'all'
  const locale = searchParams.get('locale') === 'ti' ? 'ti' : 'en'

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Bots get the empty set rather than a block: crawlers have no business
  // driving a typeahead, and there is nothing here they cannot reach by
  // crawling the pages themselves.
  if (isBot(request.headers.get('user-agent'))) {
    return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Fails CLOSED. Unlike analytics, dropping this request costs a visitor one
  // dropdown they can replace by pressing Enter — while serving it uncounted
  // would leave an unauthenticated, database-backed endpoint with no ceiling.
  const limit = await consume(`search-suggest:${clientKey(request.headers)}`, {
    ...RATE_LIMIT,
    failOpen: false,
  })

  if (!limit.allowed) {
    return NextResponse.json(
      { results: [] },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  try {
    // A small pool: this renders eight rows and runs per keystroke.
    const found = await globalSearch(q, scope, locale, { perCategory: 5 })

    const results = found.slice(0, MAX_SUGGESTIONS).map((item) => ({
      title: item.title,
      href: CATEGORY_BY_TYPE[item.type]!.href(item.slug),
      type: item.type,
      icon: CATEGORY_BY_TYPE[item.type]!.icon,
    }))

    return NextResponse.json(
      { results },
      {
        headers: {
          // Private only: a shared cache keyed on the URL would serve one
          // visitor's suggestions to another, and search terms are the most
          // revealing thing an anonymous visitor produces.
          'Cache-Control': 'private, max-age=30',
        },
      },
    )
  } catch {
    // The dropdown degrades to nothing; the form underneath still submits.
    return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
