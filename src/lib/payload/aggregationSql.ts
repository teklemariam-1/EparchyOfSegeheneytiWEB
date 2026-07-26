import {
  AGGREGATIONS,
  BUCKETS,
  type Bucket,
  type GroupByRequest,
  type GroupedRow,
  type GroupColumn,
} from './aggregationConfig'

/**
 * Pure SQL construction for grouped aggregation — no DB or Payload imports, so
 * it can be unit tested directly. See ./aggregation.ts for execution.
 *
 * Everything reaching SQL (table, column identifiers, date-bucket keyword) is
 * validated against the AGGREGATIONS whitelist; only filter *values* are
 * user-controlled and those are returned as bound `$n` parameters.
 */

const OP_SQL: Record<string, string> = { eq: '=', gte: '>=', lte: '<=' }

export class AggregationError extends Error {}

export function dedupeGroupBy(groupBy: string[]): string[] {
  return groupBy.filter((k, i) => groupBy.indexOf(k) === i)
}

export function buildAggregateSql(req: GroupByRequest): { text: string; values: unknown[] } {
  const config = AGGREGATIONS[req.collection]
  if (!config) throw new AggregationError(`Unknown collection: ${req.collection}`)

  const byKey = new Map<string, GroupColumn>(config.columns.map((c) => [c.key, c]))
  const bucket: Bucket = req.bucket && BUCKETS.includes(req.bucket) ? req.bucket : 'month'

  const groupCols: GroupColumn[] = []
  for (const key of dedupeGroupBy(req.groupBy ?? [])) {
    const col = byKey.get(key)
    if (!col || col.groupable === false) throw new AggregationError(`Cannot group by: ${key}`)
    groupCols.push(col)
  }

  const quoted = (c: string) => `"${c.replace(/"/g, '')}"` // whitelisted, defensive
  const selectParts: string[] = []
  const groupByParts: string[] = []

  groupCols.forEach((col, i) => {
    const expr =
      col.kind === 'date' ? `date_trunc('${bucket}', ${quoted(col.column)})::date` : quoted(col.column)
    selectParts.push(`${expr} AS g${i}`)
    groupByParts.push(`g${i}`)
  })

  config.measures.forEach((m, j) => {
    selectParts.push(`COALESCE(SUM(${quoted(m.column)}), 0)::float8 AS m${j}`)
  })
  // Distinct counts ("how many unique donors"). Only the count is selected —
  // the underlying values never leave the database.
  ;(config.distinctMeasures ?? []).forEach((m, j) => {
    selectParts.push(`COUNT(DISTINCT ${quoted(m.column)})::int AS d${j}`)
  })
  selectParts.push('COUNT(*)::int AS row_count')

  const whereParts: string[] = []
  const values: unknown[] = []
  for (const f of req.filters ?? []) {
    const col = byKey.get(f.key)
    if (!col || col.filterable === false) throw new AggregationError(`Cannot filter by: ${f.key}`)
    const op = OP_SQL[f.op]
    if (!op) throw new AggregationError(`Bad operator: ${f.op}`)
    values.push(f.value)
    whereParts.push(`${quoted(col.column)} ${op} $${values.length}`)
  }

  const limit = Math.min(Math.max(Number(req.limit) || 1000, 1), 5000)

  let text = `SELECT ${selectParts.join(', ')} FROM "${config.table}"`
  if (whereParts.length) text += ` WHERE ${whereParts.join(' AND ')}`
  if (groupByParts.length) text += ` GROUP BY ${groupByParts.join(', ')}`
  text += ` ORDER BY row_count DESC LIMIT ${limit}`

  return { text, values }
}

/** Coerce a raw grouped DB row into display strings + typed sums. */
export function shapeRow(raw: Record<string, unknown>, req: GroupByRequest): GroupedRow {
  const config = AGGREGATIONS[req.collection]!
  const byKey = new Map(config.columns.map((c) => [c.key, c]))
  const groups: Record<string, string | null> = {}
  dedupeGroupBy(req.groupBy).forEach((key, i) => {
    const col = byKey.get(key)
    const v = raw[`g${i}`]
    if (v == null) groups[key] = null
    else if (col?.kind === 'boolean') groups[key] = v ? 'Yes' : 'No'
    else if (col?.kind === 'date' && v instanceof Date) groups[key] = v.toISOString().slice(0, 10)
    else groups[key] = String(v)
  })
  const sums: Record<string, number> = {}
  config.measures.forEach((m, j) => {
    sums[m.key] = Number(raw[`m${j}`] ?? 0)
  })

  const distinctMeasures = config.distinctMeasures ?? []
  if (distinctMeasures.length === 0) return { groups, rowCount: Number(raw.row_count ?? 0), sums }

  const distincts: Record<string, number> = {}
  distinctMeasures.forEach((m, j) => {
    distincts[m.key] = Number(raw[`d${j}`] ?? 0)
  })
  return { groups, rowCount: Number(raw.row_count ?? 0), sums, distincts }
}
