import { describe, it, expect } from 'vitest'
import { buildAggregateSql, AggregationError } from '../aggregationSql'
import { buildTree, flattenTree, toCsv } from '../../admin/groupedTable'
import type { GroupByResult } from '../aggregationConfig'

describe('buildAggregateSql', () => {
  it('groups visitor-stats by dimension with a COUNT and SUM measure', () => {
    const { text, values } = buildAggregateSql({
      collection: 'visitor-stats',
      groupBy: ['dimension'],
    })
    expect(text).toContain('FROM "visitor_stats"')
    expect(text).toContain('"dimension" AS g0')
    expect(text).toContain('COALESCE(SUM("count"), 0)::float8 AS m0')
    expect(text).toContain('COUNT(*)::int AS row_count')
    expect(text).toContain('GROUP BY g0')
    expect(text).toContain('ORDER BY row_count DESC')
    expect(values).toEqual([])
  })

  it('applies a date bucket to date group columns', () => {
    const { text } = buildAggregateSql({
      collection: 'visitor-stats',
      groupBy: ['date'],
      bucket: 'week',
    })
    expect(text).toContain(`date_trunc('week', "date")::date AS g0`)
  })

  it('binds filter values as parameters (no interpolation)', () => {
    const { text, values } = buildAggregateSql({
      collection: 'visitor-stats',
      groupBy: ['key'],
      filters: [
        { key: 'dimension', op: 'eq', value: 'country' },
        { key: 'date', op: 'gte', value: '2026-01-01T00:00:00.000Z' },
      ],
    })
    expect(text).toContain('"dimension" = $1')
    expect(text).toContain('"date" >= $2')
    expect(values).toEqual(['country', '2026-01-01T00:00:00.000Z'])
  })

  it('supports multi-column grouping and news COUNT-only (no measures)', () => {
    const { text } = buildAggregateSql({
      collection: 'news',
      groupBy: ['category', 'status'],
    })
    expect(text).toContain('"category" AS g0')
    expect(text).toContain('"_status" AS g1')
    expect(text).toContain('GROUP BY g0, g1')
    expect(text).not.toContain('SUM(') // news has no numeric measure
  })

  it('rejects unknown collections, columns, and operators', () => {
    expect(() => buildAggregateSql({ collection: 'users', groupBy: ['id'] })).toThrow(AggregationError)
    expect(() => buildAggregateSql({ collection: 'news', groupBy: ['title'] })).toThrow(AggregationError)
    expect(() =>
      buildAggregateSql({
        collection: 'news',
        groupBy: ['category'],
        filters: [{ key: 'category', op: 'like' as any, value: 'x' }],
      }),
    ).toThrow(AggregationError)
  })

  it('deduplicates repeated group columns and clamps the limit', () => {
    const { text } = buildAggregateSql({
      collection: 'news',
      groupBy: ['category', 'category'],
      limit: 99999,
    })
    expect(text).toContain('"category" AS g0')
    expect(text).not.toContain('AS g1')
    expect(text).toContain('LIMIT 5000')
  })
})

// ── Tree + CSV helpers ────────────────────────────────────────────────────────

const RESULT: GroupByResult = {
  collection: 'visitor-stats',
  groupBy: ['dimension', 'key'],
  measures: [{ key: 'count', column: 'count', label: 'Visits / views' }],
  rows: [
    { groups: { dimension: 'country', key: 'ER' }, rowCount: 3, sums: { count: 120 } },
    { groups: { dimension: 'country', key: 'IT' }, rowCount: 2, sums: { count: 40 } },
    { groups: { dimension: 'path', key: '/news' }, rowCount: 1, sums: { count: 25 } },
  ],
  grandTotal: { rowCount: 6, sums: { count: 185 } },
}

describe('buildTree', () => {
  it('nests rows by group order and aggregates parents', () => {
    const tree = buildTree(RESULT.rows, RESULT.groupBy)
    expect(tree).toHaveLength(2) // country, path
    const country = tree.find((n) => n.value === 'country')!
    expect(country.rowCount).toBe(5)
    expect(country.sums.count).toBe(160)
    expect(country.children.map((c) => c.value).sort()).toEqual(['ER', 'IT'])
    const path = tree.find((n) => n.value === 'path')!
    expect(path.sums.count).toBe(25)
  })

  it('labels missing group values as (none)', () => {
    const tree = buildTree([{ groups: { dimension: null }, rowCount: 1, sums: { count: 5 } }], ['dimension'])
    expect(tree[0].value).toBe('(none)')
  })
})

describe('flattenTree', () => {
  it('hides children of collapsed nodes', () => {
    const tree = buildTree(RESULT.rows, RESULT.groupBy)
    const full = flattenTree(tree, new Set())
    expect(full.length).toBe(5) // 2 parents + 3 leaves
    const collapsed = flattenTree(tree, new Set([' country']))
    // country's two children hidden → 5 - 2 = 3
    expect(collapsed.length).toBe(3)
  })
})

describe('toCsv', () => {
  it('emits a header, one line per row, and a TOTAL line', () => {
    const csv = toCsv(RESULT, RESULT.groupBy, { dimension: 'Dimension', key: 'Key' }, { count: 'Visits' })
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Dimension,Key,Rows,Visits')
    expect(lines[1]).toBe('country,ER,3,120')
    expect(lines[lines.length - 1]).toBe('TOTAL,,6,185')
  })

  it('quotes cells containing commas or quotes', () => {
    const csv = toCsv(
      { ...RESULT, rows: [{ groups: { dimension: 'a,b', key: 'x"y' }, rowCount: 1, sums: { count: 1 } }] },
      ['dimension', 'key'],
      { dimension: 'D', key: 'K' },
      { count: 'V' },
    )
    expect(csv).toContain('"a,b","x""y",1,1')
  })
})
