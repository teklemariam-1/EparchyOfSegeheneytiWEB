import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import { groupByAggregate, AggregationError } from '@/lib/payload/aggregation'
import { AGGREGATIONS, type GroupByRequest } from '@/lib/payload/aggregationConfig'

export const dynamic = 'force-dynamic'

/**
 * Grouped aggregation for admin grouped tables (Visitor Stats, News).
 *
 * Auth mirrors the collections' own read access (chancery-or-above): the caller
 * is the logged-in admin's browser, authenticating with the Payload session
 * cookie. The collection/columns are validated inside groupByAggregate against
 * the AGGREGATIONS whitelist.
 */
export async function POST(req: Request) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers as Headers })
  const role = (user as { role?: string } | null)?.role
  if (role !== 'super-admin' && role !== 'chancery-editor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: GroupByRequest
  try {
    body = (await req.json()) as GroupByRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.collection || !AGGREGATIONS[body.collection]) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 400 })
  }

  try {
    const result = await groupByAggregate({
      collection: body.collection,
      groupBy: Array.isArray(body.groupBy) ? body.groupBy.slice(0, 4) : [],
      bucket: body.bucket,
      filters: Array.isArray(body.filters) ? body.filters.slice(0, 10) : [],
      limit: body.limit,
    })

    // News groups by author_id — replace ids with display names for readability.
    if (body.collection === 'news' && result.groupBy.includes('author')) {
      const ids = new Set<string>()
      for (const r of result.rows) {
        const v = r.groups.author
        if (v) ids.add(v)
      }
      if (ids.size) {
        const users = await payload.find({
          collection: 'users',
          where: { id: { in: [...ids] } },
          limit: 200,
          depth: 0,
          overrideAccess: true,
        } as any)
        const names = new Map<string, string>(
          (users.docs as any[]).map((u) => [String(u.id), u.name || u.email || `User #${u.id}`]),
        )
        for (const r of result.rows) {
          if (r.groups.author) r.groups.author = names.get(r.groups.author) ?? `User #${r.groups.author}`
        }
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AggregationError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: String(err).slice(0, 200) }, { status: 500 })
  }
}
