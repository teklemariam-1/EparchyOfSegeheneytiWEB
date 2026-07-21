import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'

// TEMPORARY diagnostic — surfaces why getVicariatesList returns empty on live.
// Remove after diagnosis.
export const dynamic = 'force-dynamic'

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    const payload = await getPayload()
    out.gotPayload = true

    try {
      const noLocale = await payload.find({ collection: 'vicariates', limit: 100, depth: 0 } as any)
      out.find_noLocale = noLocale.totalDocs
    } catch (e) {
      out.find_noLocale_error = String((e as Error)?.message ?? e).slice(0, 300)
    }

    try {
      const withSort = await payload.find({
        collection: 'vicariates',
        sort: 'order',
        limit: 100,
        depth: 1,
        locale: 'en',
      } as any)
      out.find_sorted_depth1_en = withSort.totalDocs
      out.slugs = (withSort.docs as any[]).map((d) => d.slug)
    } catch (e) {
      out.find_sorted_error = String((e as Error)?.message ?? e).slice(0, 300)
    }

    try {
      const c = await payload.count({
        collection: 'parishes',
        where: { 'vicariate.slug': { equals: 'senafe' } },
      } as any)
      out.count_join = c.totalDocs
    } catch (e) {
      out.count_join_error = String((e as Error)?.message ?? e).slice(0, 300)
    }

    // The actual wrapped query the pages call — this is what returns [] on live.
    try {
      const { getVicariatesList } = await import('@/lib/payload/queries')
      const list = await getVicariatesList('en')
      out.getVicariatesList_en = Array.isArray(list) ? list.length : 'not-array'
      out.getVicariatesList_slugs = Array.isArray(list) ? list.map((v: any) => v.slug) : null
    } catch (e) {
      out.getVicariatesList_error = String((e as Error)?.message ?? e).slice(0, 300)
    }
  } catch (e) {
    out.fatal = String((e as Error)?.message ?? e).slice(0, 300)
  }
  return NextResponse.json(out)
}
