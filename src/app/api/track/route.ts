import { NextResponse } from 'next/server'
import { incrementStat } from '@/lib/payload/track'
import {
  categorizeSource,
  deviceFromUserAgent,
  normalizePath,
  primaryLanguage,
} from '@/lib/analytics'
import { isBot, botLabel } from '@/lib/security/bots'
import { clientKey } from '@/lib/security/clientId'
import { consume } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'

/**
 * Anonymous visit counter.
 *
 * Called by a small client component. Nothing about the visitor is stored —
 * only daily aggregate counters are incremented:
 *
 *  - every page view:      (path, day)
 *  - once per session:     (country, day), (device, day), (source, day),
 *                          (language, day)
 *
 * The user agent, referrer and Accept-Language header are read to pick a
 * bucket and immediately discarded — no IP, no identifier, no raw values are
 * persisted. Best-effort: always returns 204 so it can never surface an error
 * to visitors.
 *
 * ── Integrity ────────────────────────────────────────────────────────────────
 * This endpoint is unauthenticated by necessity (it counts anonymous visits),
 * so it is guarded on behaviour instead:
 *
 *  1. A well-formed JSON body is REQUIRED. It used to treat an unparseable body
 *     as a session ping, which meant a bare `curl -X POST /api/track` counted
 *     as a visit — the likeliest source of the "unknown country" inflation.
 *  2. Same-origin only, so another site cannot drive counters from real browsers.
 *  3. Declared crawlers and scripted clients are counted under the `bot`
 *     dimension instead of the human ones.
 *  4. Per-client rate limit, keyed on a hashed IP that is never stored.
 *
 * What this does NOT stop: a headless browser sending a browser-like
 * user-agent at a human pace. That is the WAF's job — see docs/security.md.
 */

/** Generous enough for a real reader, low enough to stop a flood. */
const RATE_LIMIT = { limit: 60, windowSeconds: 60, failOpen: true } as const

/** A country is a 2-letter ISO code or nothing. Never a client-supplied string. */
function resolveCountry(headers: Headers): string {
  // Only `x-vercel-ip-country` is trusted: Vercel sets it at the edge and
  // overwrites any client-supplied value. `cf-ipcountry` used to be accepted
  // too, but this site is not behind Cloudflare, so that header was pure client
  // input — anyone could POST `cf-ipcountry: ZZ` and mint arbitrary country rows.
  const raw = headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : 'Unknown'
}

export async function POST(req: Request) {
  try {
    // A real ping always sends a JSON body. Anything else is not our tracker.
    let body: { path?: unknown; session?: unknown; ref?: unknown }
    try {
      body = await req.json()
    } catch {
      return new NextResponse(null, { status: 204 })
    }
    if (typeof body !== 'object' || body === null) {
      return new NextResponse(null, { status: 204 })
    }

    // Same-origin only. Our own fetch always sends Origin; a cross-site page
    // driving counters from a real browser would send a different one.
    const origin = req.headers.get('origin')
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()
    if (origin && siteUrl) {
      try {
        if (new URL(origin).host !== new URL(siteUrl).host) {
          return new NextResponse(null, { status: 204 })
        }
      } catch {
        return new NextResponse(null, { status: 204 })
      }
    }

    const userAgent = req.headers.get('user-agent')

    // Crawlers are counted, just not as people.
    if (isBot(userAgent)) {
      await incrementStat('bot', botLabel(userAgent))
      return new NextResponse(null, { status: 204 })
    }

    // Fails OPEN: an analytics counter must never break a page view, so a
    // database blip means the visit is counted rather than dropped.
    const limit = await consume(`track:${clientKey(req.headers)}`, RATE_LIMIT)
    if (!limit.allowed) {
      return new NextResponse(null, { status: 204 })
    }

    const tasks: Promise<void>[] = []

    const path = normalizePath(typeof body.path === 'string' ? body.path : null)
    if (path) tasks.push(incrementStat('path', path))

    // Session buckets require an EXPLICIT flag. Previously a body with no
    // `path` also counted as a session, so `{}` incremented four counters.
    if (body.session === true) {
      const country = resolveCountry(req.headers)
      const device = deviceFromUserAgent(userAgent)
      const ownHost = (() => {
        try {
          return new URL(siteUrl).hostname || undefined
        } catch {
          return undefined
        }
      })()
      const source = categorizeSource(typeof body.ref === 'string' ? body.ref : null, ownHost)
      const language = primaryLanguage(req.headers.get('accept-language'))

      tasks.push(
        incrementStat('country', country, { country }),
        incrementStat('device', device),
        incrementStat('source', source),
        incrementStat('language', language),
      )
    }

    await Promise.all(tasks)
  } catch {
    // Never let analytics break a page view.
  }
  return new NextResponse(null, { status: 204 })
}
