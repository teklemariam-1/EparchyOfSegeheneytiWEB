import { getPayload } from './client'

/**
 * Increment an anonymous daily aggregate counter (visitor-stats collection).
 * Best-effort: analytics must never break a page view, so all errors are
 * swallowed. See src/collections/VisitorStats for the dimension model.
 */
export async function incrementStat(
  dimension: string,
  key: string,
  opts: { country?: string } = {},
): Promise<void> {
  try {
    const now = new Date()
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
    const payload = await getPayload()
    const existing = await payload.find({
      collection: 'visitor-stats',
      where: {
        and: [{ dimension: { equals: dimension } }, { key: { equals: key } }, { date: { equals: day } }],
      },
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
        data: { dimension, key, date: day, count: 1, ...(opts.country ? { country: opts.country } : {}) } as any,
      })
    }
  } catch {
    // never surface analytics failures
  }
}
