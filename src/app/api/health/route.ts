import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'

export const dynamic = 'force-dynamic'

/**
 * Readiness probe. A liveness-only "ok" hid the failure mode that matters most
 * in production — the app process is up but its database is unreachable — so
 * this actually pings the DB (bounded to 5s) and returns 503 when it can't be
 * reached. The payload stays minimal: no version or environment disclosure.
 */
export async function GET() {
  let dbOk = false
  try {
    const payload = await getPayload()
    await Promise.race([
      payload.count({ collection: 'users' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('db timeout')), 5000)),
    ])
    dbOk = true
  } catch {
    dbOk = false
  }

  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      service: 'eparchy-segeneyti-web',
      db: dbOk ? 'ok' : 'down',
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  )
}
