import { headers } from 'next/headers'
import { incrementStat } from './track'
import { isBot } from '../security/bots'
import { clientKey } from '../security/clientId'
import { consume } from '../security/rateLimit'

/**
 * Record an on-site search term for the anonymous search analytics.
 *
 * This is the one analytics write driven by a plain GET, which made it the
 * cheapest way to grow `visitor-stats`: every distinct `?q=` value created a
 * row, unauthenticated and unlimited. It is now filtered the same way
 * /api/track is — crawlers excluded, per-client rate limited, term capped.
 *
 * Fire-and-forget: callers `void` this, and every failure is swallowed so a
 * search page never fails because a counter could not be written.
 */

/** Distinct terms one client may register per window. */
const RATE_LIMIT = { limit: 20, windowSeconds: 60, failOpen: true } as const

/** Search keys are short by nature; the dimension cap is 200. */
const MAX_TERM_LENGTH = 80

export async function recordSearchTerm(term: string, hadResults: boolean): Promise<void> {
  try {
    const key = term.trim().toLowerCase().slice(0, MAX_TERM_LENGTH)
    if (!key) return

    const h = await headers()
    // Crawlers walking every search link would otherwise write a row per link.
    if (isBot(h.get('user-agent'))) return

    const limit = await consume(`search:${clientKey(h)}`, RATE_LIMIT)
    if (!limit.allowed) return

    await incrementStat(hadResults ? 'search' : 'search-empty', key)
  } catch {
    // Analytics must never break the search page.
  }
}
