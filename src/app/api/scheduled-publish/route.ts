import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import { hasAnyPermission, type AuthUser } from '@/lib/permissions/resolve'
import { publishDueDrafts, SCHEDULABLE_COLLECTIONS } from '@/lib/payload/scheduledPublish'

/**
 * Publishes every draft whose `publishAt` has passed. See
 * lib/payload/scheduledPublish for the model and the permission story.
 *
 * Auth mirrors the Vatican News ingest exactly:
 *  - Vercel Cron calls with `Authorization: Bearer $CRON_SECRET` (compared in
 *    constant time; the route FAILS CLOSED when the secret is unset).
 *  - A signed-in staff member holding any publish permission may also trigger
 *    it — "the daily run already went, push my message out now" is a
 *    legitimate need, and the sweep can only publish what a publish-holder
 *    scheduled in the first place.
 *
 * The vercel.json entry is DAILY because this plan has rejected finer
 * schedules before (see deploy.yml's history). Anyone wanting hourly precision
 * can point an external scheduler at this endpoint with the same bearer.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function timingSafeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function GET(req: Request) {
  const payload = await getPayload()

  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  const viaCron = Boolean(secret) && timingSafeStrEqual(auth, `Bearer ${secret}`)

  let authorized = viaCron
  if (!authorized) {
    const { user } = await payload.auth({ headers: req.headers as Headers })
    authorized = hasAnyPermission(
      user as AuthUser | null,
      SCHEDULABLE_COLLECTIONS.map((c) => c.publishPermission),
    )
  }
  if (!authorized) {
    if (!secret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured on the server.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await publishDueDrafts(payload, new Date())

  if (result.published.length > 0 || result.errors.length > 0) {
    payload.logger?.info?.(
      `[scheduled-publish] published ${result.published.length}, errors ${result.errors.length}`,
    )
  }

  return NextResponse.json({
    published: result.published,
    // Error strings can carry document internals; the count is enough for the
    // caller, the detail is in the server log.
    errorCount: result.errors.length,
  })
}
