'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DATE_RANGE_OPTIONS } from '@/lib/analytics'

/**
 * Date-range selector for the analytics dashboard. Changing the range
 * navigates with query params, so the server re-renders every widget for the
 * selected period.
 */
export function DateRangeControls({
  current,
  customFrom,
  customTo,
}: {
  current: string
  customFrom?: string
  customTo?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [from, setFrom] = useState(customFrom ?? '')
  const [to, setTo] = useState(customTo ?? '')
  const [showCustom, setShowCustom] = useState(current === 'custom')

  const apply = (range: string, f?: string, t?: string) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom') {
      if (f) params.set('from', f)
      if (t) params.set('to', t)
    }
    startTransition(() => {
      router.push(`/admin?${params.toString()}`)
    })
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--theme-elevation-150)',
    background: 'var(--theme-input-bg, var(--theme-elevation-0))',
    color: 'var(--theme-elevation-800)',
    fontSize: 13,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <select
        aria-label="Date range"
        value={current}
        onChange={(e) => {
          const v = e.target.value
          setShowCustom(v === 'custom')
          if (v !== 'custom') apply(v)
        }}
        style={inputStyle}
      >
        {DATE_RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {showCustom && (
        <>
          <input aria-label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>→</span>
          <input aria-label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          <button
            type="button"
            onClick={() => from && to && apply('custom', from, to)}
            disabled={!from || !to}
            style={{
              ...inputStyle,
              cursor: from && to ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              background: 'var(--theme-elevation-800)',
              color: 'var(--theme-elevation-0)',
              border: 'none',
            }}
          >
            Apply
          </button>
        </>
      )}

      {isPending && (
        <span
          aria-label="Loading"
          style={{
            width: 16,
            height: 16,
            border: '2px solid var(--theme-elevation-150)',
            borderTopColor: 'var(--theme-elevation-800)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'analytics-spin 0.8s linear infinite',
          }}
        />
      )}
      <style>{`@keyframes analytics-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default DateRangeControls
