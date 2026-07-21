import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'

export const dynamic = 'force-dynamic'

/**
 * Anonymous visit counter.
 *
 * Called once per browser session by a small client component. It stores
 * nothing about the visitor — it reads only the country Vercel derives at the
 * edge (x-vercel-ip-country) and increments a single (country, day) counter.
 * No IP, no user agent, no identifier is persisted.
 *
 * The client throttles to one call per session; this endpoint is best-effort
 * and always returns 204 so it can never surface an error to visitors.
 */
export async function POST(req: Request) {
  try {
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'Unknown'

    // Normalise to a bare day so counts aggregate per date.
    const now = new Date()
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

    const payload = await getPayload()
    const existing = await payload.find({
      collection: 'visitor-stats',
      where: { and: [{ country: { equals: country } }, { date: { equals: day } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    } as any)

    const doc = existing.docs[0] as any
    if (doc) {
      await payload.update({
        collection: 'visitor-stats',
        id: doc.id,
        overrideAccess: true,
        data: { count: (Number(doc.count) || 0) + 1 } as any,
      })
    } else {
      await payload.create({
        collection: 'visitor-stats',
        overrideAccess: true,
        data: { country, date: day, count: 1 } as any,
      })
    }
  } catch {
    // Never let analytics break a page view.
  }
  return new NextResponse(null, { status: 204 })
}
