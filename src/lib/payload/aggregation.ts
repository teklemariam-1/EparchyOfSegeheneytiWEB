import { getPayload } from './client'
import { AGGREGATIONS, type GroupByRequest, type GroupByResult } from './aggregationConfig'
import { buildAggregateSql, shapeRow, dedupeGroupBy, AggregationError } from './aggregationSql'

/**
 * Server-side GROUP BY aggregation for admin grouped tables (Visitor Stats, News).
 *
 * Aggregation runs in Postgres (COUNT(*) + SUM per group), never by loading rows
 * into memory. SQL construction and validation live in ./aggregationSql (pure,
 * unit-tested); this module only executes and shapes the result.
 */

export { AggregationError, buildAggregateSql } from './aggregationSql'

/** Execute a grouped aggregation and return rows plus a grand total. */
export async function groupByAggregate(req: GroupByRequest): Promise<GroupByResult> {
  const config = AGGREGATIONS[req.collection]
  if (!config) throw new AggregationError(`Unknown collection: ${req.collection}`)

  const { text, values } = buildAggregateSql(req)
  const payload = await getPayload()

  const db = payload.db as unknown as {
    pool?: { query: (t: string, v: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
  }
  if (!db.pool?.query) throw new AggregationError('No database pool available for aggregation')

  const res = await db.pool.query(text, values)
  const groupBy = dedupeGroupBy(req.groupBy)
  const rows = res.rows.map((r) => shapeRow(r, { ...req, groupBy }))

  const grandTotal = { rowCount: 0, sums: {} as Record<string, number> }
  for (const m of config.measures) grandTotal.sums[m.key] = 0
  for (const row of rows) {
    grandTotal.rowCount += row.rowCount
    for (const m of config.measures) grandTotal.sums[m.key] += row.sums[m.key] ?? 0
  }

  return {
    collection: req.collection,
    groupBy,
    bucket: req.bucket,
    measures: config.measures,
    rows,
    grandTotal,
  }
}
