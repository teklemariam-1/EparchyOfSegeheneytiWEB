'use client'

import { useMemo, useState } from 'react'

export interface CountryRow {
  code: string
  name: string
  flag: string
  count: number
  pct: number
  daily: Array<{ date: string; count: number }>
}

/** Tiny inline sparkline for a country's daily visits. */
function Sparkline({ daily }: { daily: CountryRow['daily'] }) {
  const w = 320
  const h = 48
  const max = Math.max(1, ...daily.map((d) => d.count))
  const n = Math.max(daily.length, 2)
  const pts = daily
    .map((d, i) => `${(i / (n - 1)) * (w - 4) + 2},${h - 4 - (d.count / max) * (h - 10)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 340, height: 48 }} role="img">
      <polyline points={pts} fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Visitors-by-country table: full country names with flags, totals and share
 * of traffic, a search filter, and a click-to-expand daily trend per country.
 */
export function CountryTable({ rows }: { rows: CountryRow[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
  }, [rows, query])

  const cell: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 13,
    borderBottom: '1px solid var(--theme-elevation-100)',
    textAlign: 'left',
    color: 'var(--theme-elevation-650)',
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search countries…"
        aria-label="Search countries"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          maxWidth: 280,
          marginBottom: 10,
          padding: '7px 10px',
          borderRadius: 6,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg, var(--theme-elevation-0))',
          color: 'var(--theme-elevation-800)',
          fontSize: 13,
        }}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...cell, fontWeight: 700 }}>Country</th>
              <th style={{ ...cell, fontWeight: 700, textAlign: 'right' }}>Visitors</th>
              <th style={{ ...cell, fontWeight: 700, textAlign: 'right' }}>Share</th>
              <th style={{ ...cell, fontWeight: 700, width: '30%' }} aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <>
                <tr
                  key={r.code}
                  onClick={() => setExpanded(expanded === r.code ? null : r.code)}
                  style={{ cursor: 'pointer' }}
                  aria-expanded={expanded === r.code}
                >
                  <td style={cell}>
                    <span style={{ marginRight: 8 }} aria-hidden="true">{r.flag}</span>
                    {r.name}
                  </td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 600, color: 'var(--theme-elevation-800)' }}>
                    {r.count.toLocaleString()}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>{r.pct}%</td>
                  <td style={cell}>
                    <div style={{ height: 8, borderRadius: 999, background: 'var(--theme-elevation-100)' }}>
                      <div style={{ width: `${r.pct}%`, height: '100%', borderRadius: 999, background: '#2e7d32' }} />
                    </div>
                  </td>
                </tr>
                {expanded === r.code && (
                  <tr key={`${r.code}-detail`}>
                    <td colSpan={4} style={{ ...cell, background: 'var(--theme-elevation-50)' }}>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>Daily visitors · {r.name}</div>
                          <Sparkline daily={r.daily} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--theme-elevation-650)' }}>
                          <div>Days with visits: {r.daily.length}</div>
                          <div>
                            Busiest day:{' '}
                            {r.daily.length
                              ? (() => {
                                  const top = r.daily.reduce((a, b) => (b.count > a.count ? b : a))
                                  return `${top.date} (${top.count.toLocaleString()})`
                                })()
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...cell, fontStyle: 'italic' }}>
                  No countries match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CountryTable
