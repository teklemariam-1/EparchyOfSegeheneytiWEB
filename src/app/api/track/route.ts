import { NextResponse } from 'next/server'
import { incrementStat } from '@/lib/payload/track'
import {
  categorizeSource,
  deviceFromUserAgent,
  normalizePath,
  primaryLanguage,
} from '@/lib/analytics'

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
 */
export async function POST(req: Request) {
  try {
    let body: { path?: unknown; session?: unknown; ref?: unknown } = {}
    try {
      body = await req.json()
    } catch {
      // empty body (legacy pings) — still counts as a session below
      body = { session: true }
    }

    const tasks: Promise<void>[] = []

    const path = normalizePath(typeof body.path === 'string' ? body.path : null)
    if (path) tasks.push(incrementStat('path', path))

    if (body.session === true || body.path === undefined) {
      const country =
        req.headers.get('x-vercel-ip-country') ||
        req.headers.get('cf-ipcountry') ||
        'Unknown'
      const device = deviceFromUserAgent(req.headers.get('user-agent'))
      const ownHost = (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname || undefined
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
