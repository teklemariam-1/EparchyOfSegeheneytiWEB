'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AGGREGATIONS,
  BUCKETS,
  type Bucket,
  type GroupByResult,
  type GroupFilter,
} from '@/lib/payload/aggregationConfig'
import { buildTree, flattenTree, toCsv } from '@/lib/admin/groupedTable'

/**
 * Reusable server-aggregated grouped table for admin pages (Visitor Stats, News).
 *
 * The user picks one or more columns to group by (and a date bucket for date
 * columns); aggregation runs in Postgres via /api/admin/aggregate. Groups are
 * collapsible, a grand-total row is always shown, and the result exports to CSV.
 */

interface GroupedTableProps {
  collection: keyof typeof AGGREGATIONS | string
  /** Group-by keys selected on first render. */
  initialGroupBy?: string[]
  initialBucket?: Bucket
  /** Filters merged into every request (e.g. the dashboard date range). */
  baseFilters?: GroupFilter[]
}

const cell: React.CSSProperties = { padding: '6px 10px', textAlign: 'left', fontSize: 13 }
const num: React.CSSProperties = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

export function GroupedTable({
  collection,
  initialGroupBy = [],
  initialBucket = 'month',
  baseFilters,
}: GroupedTableProps) {
  const config = AGGREGATIONS[collection as string]
  const [groupBy, setGroupBy] = useState<string[]>(initialGroupBy)
  const [bucket, setBucket] = useState<Bucket>(initialBucket)
  const [result, setResult] = useState<GroupByResult | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const columnLabels = useMemo(
    () => Object.fromEntries((config?.columns ?? []).map((c) => [c.key, c.label])),
    [config],
  )
  const measureLabels = useMemo(
    () => Object.fromEntries((config?.measures ?? []).map((m) => [m.key, m.label])),
    [config],
  )
  const hasDateGroup = useMemo(
    () => groupBy.some((k) => config?.columns.find((c) => c.key === k)?.kind === 'date'),
    [groupBy, config],
  )

  const baseFilterKey = JSON.stringify(baseFilters ?? [])

  const load = useCallback(async () => {
    if (!config) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/aggregate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection, groupBy, bucket, filters: baseFilters ?? [] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      setResult(data as GroupByResult)
    } catch (err) {
      setError(String((err as Error)?.message ?? err))
      setResult(null)
    } finally {
      setBusy(false)
    }
  }, [collection, config, groupBy, bucket, baseFilters, baseFilterKey])

  useEffect(() => {
    load()
  }, [load])

  const toggleGroup = (key: string) => {
    setGroupBy((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const tree = useMemo(() => (result ? buildTree(result.rows, result.groupBy) : []), [result])
  const flat = useMemo(() => flattenTree(tree, collapsed), [tree, collapsed])

  const exportCsv = () => {
    if (!result) return
    const csv = toCsv(result, result.groupBy, columnLabels, measureLabels)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection}-grouped-${result.groupBy.join('-') || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!config) return <p style={{ fontSize: 13 }}>Unknown collection.</p>

  const measures = config.measures

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Group-by controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Group by:</span>
        {config.columns
          .filter((c) => c.groupable !== false)
          .map((c) => {
            const active = groupBy.includes(c.key)
            const order = groupBy.indexOf(c.key)
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleGroup(c.key)}
                className={`btn btn--size-small ${active ? 'btn--style-primary' : 'btn--style-secondary'}`}
                style={{ margin: 0 }}
              >
                {active ? `${order + 1}. ` : ''}
                {c.label}
              </button>
            )
          })}

        {hasDateGroup && (
          <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Bucket:
            <select value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn--size-small btn--style-secondary" onClick={exportCsv} disabled={!result}>
          Export CSV
        </button>
      </div>

      {error && <p style={{ color: 'var(--theme-error-500)', fontSize: 13 }}>{error}</p>}
      {busy && <p style={{ fontSize: 12, opacity: 0.6 }}>Loading…</p>}

      {result && groupBy.length === 0 && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>Pick one or more columns above to group the data.</p>
      )}

      {result && groupBy.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--theme-elevation-150)' }}>
                <th style={cell}>Group</th>
                <th style={num}>Rows</th>
                {measures.map((m) => (
                  <th key={m.key} style={num}>
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flat.map((node) => (
                <tr
                  key={node.path}
                  style={{ borderBottom: '1px solid var(--theme-elevation-50)' }}
                >
                  <td style={{ ...cell, paddingLeft: 10 + node.depth * 18 }}>
                    {node.hasChildren ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((prev) => {
                            const next = new Set(prev)
                            if (next.has(node.path)) next.delete(node.path)
                            else next.add(node.path)
                            return next
                          })
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          marginRight: 6,
                          color: 'inherit',
                          fontSize: 11,
                        }}
                        aria-label={collapsed.has(node.path) ? 'Expand' : 'Collapse'}
                      >
                        {collapsed.has(node.path) ? '▶' : '▼'}
                      </button>
                    ) : (
                      <span style={{ display: 'inline-block', width: 17 }} />
                    )}
                    <span style={{ fontWeight: node.depth === 0 ? 600 : 400 }}>{node.value}</span>
                  </td>
                  <td style={num}>{node.rowCount.toLocaleString()}</td>
                  {measures.map((m) => (
                    <td key={m.key} style={num}>
                      {(node.sums[m.key] ?? 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--theme-elevation-150)', fontWeight: 700 }}>
                <td style={cell}>Grand total</td>
                <td style={num}>{result.grandTotal.rowCount.toLocaleString()}</td>
                {measures.map((m) => (
                  <td key={m.key} style={num}>
                    {(result.grandTotal.sums[m.key] ?? 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default GroupedTable
