import { NextResponse } from 'next/server'
import { issueFormToken } from '@/lib/security/formToken'
import { getTurnstileConfig } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'

/**
 * Issues a freshly-signed form token plus the public Turnstile config.
 *
 * Why a request rather than a prop from the rendering page: the public pages are
 * cached, so a token embedded at render time would be minted once and then
 * served to every visitor for the life of that cache entry — expiring for
 * everyone at the same moment. Fetching on mount guarantees the timestamp
 * belongs to this visitor's session.
 *
 * The token is not a secret and grants nothing: it only carries a signed "the
 * form was rendered at T" so the server can reject sub-second submissions. An
 * automated sender can of course request one and wait — this raises the cost of
 * mass submission, it does not make it impossible.
 */
export async function GET() {
  const turnstile = await getTurnstileConfig()
  return NextResponse.json(
    {
      token: issueFormToken(),
      turnstile: { enabled: turnstile.enabled, siteKey: turnstile.siteKey ?? null },
    },
    {
      // Must never be cached — a shared token is a token everyone submits with.
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  )
}
