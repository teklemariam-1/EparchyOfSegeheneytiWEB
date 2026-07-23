import React from 'react'

/**
 * Lightweight server-rendered SVG charts for the admin analytics dashboard.
 * No client JS, no chart library — they inherit Payload's theme variables so
 * they work in both the light and dark admin themes.
 */

export const CHART_COLORS = [
  '#2e7d32', '#1565c0', '#b45309', '#6d28d9', '#b3261e',
  '#0e7490', '#7b1d37', '#4b5563', '#9d174d', '#374151',
]

const AXIS = 'var(--theme-elevation-150)'
const TEXT = 'var(--theme-elevation-500)'

/** Multi-series daily line/area chart. */
export function LineChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[]
  series: Array<{ label: string; color: string; points: number[] }>
  height?: number
}) {
  const width = 760
  const padL = 44
  const padB = 26
  const padT = 12
  const innerW = width - padL - 10
  const innerH = height - padT - padB
  const max = Math.max(1, ...series.flatMap((s) => s.points))
  const n = Math.max(labels.length, 2)

  const x = (i: number) => padL + (i / (n - 1)) * innerW
  const y = (v: number) => padT + innerH - (v / max) * innerH

  const gridLines = 4
  const labelEvery = Math.max(1, Math.ceil(n / 8))

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const v = (max / gridLines) * i
          return (
            <g key={i}>
              <line x1={padL} x2={width - 10} y1={y(v)} y2={y(v)} stroke={AXIS} strokeWidth="1" />
              <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill={TEXT}>
                {Math.round(v).toLocaleString()}
              </text>
            </g>
          )
        })}
        {labels.map((label, i) =>
          i % labelEvery === 0 ? (
            <text key={label} x={x(i)} y={height - 8} textAnchor="middle" fontSize="9" fill={TEXT}>
              {label.slice(5)}
            </text>
          ) : null,
        )}
        {series.map((s) => {
          const pts = s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          const area = `${x(0)},${y(0) + 0} ${pts} ${x(s.points.length - 1)},${padT + innerH} ${x(0)},${padT + innerH}`
          return (
            <g key={s.label}>
              <polygon points={area} fill={s.color} opacity="0.08" />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
              {s.points.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="2.4" fill={s.color}>
                  <title>{`${labels[i]}: ${v.toLocaleString()} ${s.label}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Donut chart with legend. */
export function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const R = 54
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }} role="img">
        <circle cx="70" cy="70" r={R} fill="none" stroke={AXIS} strokeWidth="18" />
        {total > 0 &&
          data.map((d, i) => {
            const frac = d.value / total
            const dash = `${frac * C} ${C}`
            const el = (
              <circle
                key={d.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="18"
                strokeDasharray={dash}
                strokeDashoffset={-offset * C}
                transform="rotate(-90 70 70)"
              >
                <title>{`${d.label}: ${d.value.toLocaleString()} (${Math.round(frac * 100)}%)`}</title>
              </circle>
            )
            offset += frac
            return el
          })}
        <text x="70" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--theme-elevation-800)">
          {total.toLocaleString()}
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="9" fill={TEXT}>
          total
        </text>
      </svg>
      <div style={{ display: 'grid', gap: 4 }}>
        {data.map((d, i) => (
          <span key={d.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--theme-elevation-650)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
            {d.label} · {d.value.toLocaleString()}
            {total > 0 ? ` (${Math.round((d.value / total) * 100)}%)` : ''}
          </span>
        ))}
        {total === 0 && <span style={{ fontSize: 12, color: TEXT }}>No data in this range yet.</span>}
      </div>
    </div>
  )
}

/** Horizontal bar list (top pages, languages, searches, …). */
export function BarList({
  items,
  color = CHART_COLORS[0],
  emptyText = 'No data in this range yet.',
}: {
  items: Array<{ label: string; value: number; hint?: string }>
  color?: string
  emptyText?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p style={{ fontSize: 12, color: TEXT, margin: 0 }}>{emptyText}</p>
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 40%) 1fr 64px', gap: 10, alignItems: 'center' }}>
          <span
            title={item.hint ?? item.label}
            style={{ fontSize: 12, color: 'var(--theme-elevation-650)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </span>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--theme-elevation-100)' }}>
            <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', borderRadius: 999, background: color }} />
          </div>
          <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--theme-elevation-650)' }}>
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
