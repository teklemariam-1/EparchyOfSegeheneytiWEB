'use client'

import { useEffect, useState } from 'react'
import type { GroupByResult, GroupFilter } from '@/lib/payload/aggregationConfig'

/**
 * Totals and health checks above the Donations list.
 *
 * Every number here comes from the existing server-side aggregation endpoint
 * (`/api/admin/aggregate`), which does COUNT/SUM in Postgres — nothing loads
 * the ledger into the browser to add it up.
 *
 * Two things are deliberate:
 *
 *  1. **Totals are per currency.** Adding 500 ERN to 500 USD produces a number
 *     that means nothing, so the panel groups by currency and shows each on its
 *     own line rather than inventing a combined figure.
 *  2. **Stale pending donations are surfaced, not buried.** A pending row older
 *     than a day is either a transfer that never arrived or a card payment
 *     whose webhook never landed. Both need a human, and neither announces
 *     itself.
 */

const STALE_HOURS = 24

interface Totals {
  /** Per currency: rows, summed amount, and the average gift. */
  byCurrency: Array<{ currency: string; count: number; total: number }>
  /** Unique donors across the period — only exact for an ungrouped query. */
  donors: number | null
  count: number
}

async function aggregate(filters: GroupFilter[], groupBy: string[]): Promise<GroupByResult | null> {
  try {
    const res = await fetch('/api/admin/aggregate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ collection: 'donations', groupBy, filters, limit: 200 }),
    })
    if (!res.ok) return null
    return (await res.json()) as GroupByResult
  } catch {
    return null
  }
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function startOf(unit: 'day' | 'month' | 'year'): string {
  const now = new Date()
  if (unit === 'day') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  if (unit === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString()
}

/** Only settled gifts count towards "raised". Pending money is not money. */
const SUCCEEDED: GroupFilter = { key: 'status', op: 'eq', value: 'succeeded' }

async function loadPeriod(since?: string): Promise<Totals> {
  const filters: GroupFilter[] = [SUCCEEDED]
  if (since) filters.push({ key: 'createdAt', op: 'gte', value: since })

  const [byCurrency, flat] = await Promise.all([
    aggregate(filters, ['currency']),
    // Ungrouped, so the distinct donor count is exact — see the note in
    // aggregationConfig on why it is not reported for grouped queries.
    aggregate(filters, []),
  ])

  return {
    byCurrency: (byCurrency?.rows ?? []).map((r) => ({
      currency: r.groups.currency ?? '—',
      count: r.rowCount,
      total: r.sums.amount ?? 0,
    })),
    donors: flat?.grandTotal.distincts?.donors ?? null,
    count: flat?.grandTotal.rowCount ?? 0,
  }
}

const PERIODS = [
  { key: 'today', label: 'Today', since: () => startOf('day') },
  { key: 'month', label: 'This month', since: () => startOf('month') },
  { key: 'year', label: 'This year', since: () => startOf('year') },
  { key: 'all', label: 'All time', since: () => undefined },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function DonationsSummary() {
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [stale, setStale] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const since = PERIODS.find((p) => p.key === period)!.since()
    loadPeriod(since).then((t) => {
      if (!cancelled) {
        setTotals(t)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period])

  useEffect(() => {
    let cancelled = false
    aggregate(
      [
        { key: 'status', op: 'eq', value: 'pending' },
        { key: 'createdAt', op: 'lte', value: isoDaysAgo(STALE_HOURS / 24) },
      ],
      [],
    ).then((r) => {
      if (!cancelled) setStale(r?.grandTotal.rowCount ?? 0)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const averageLine = totals?.byCurrency
    .filter((c) => c.count > 0)
    .map((c) => `${formatMoney(c.total / c.count, c.currency)}`)
    .join(' · ')

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        padding: '1rem',
        marginBottom: '1rem',
        background: 'var(--theme-elevation-50)',
      }}
    >
      {stale != null && stale > 0 && (
        <div
          role="status"
          style={{
            marginBottom: '1rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 4,
            border: '1px solid #e3b341',
            background: '#fdf6e3',
            color: '#6b4e00',
            fontSize: '0.85rem',
          }}
        >
          <strong>{stale}</strong> donation{stale === 1 ? '' : 's'} have been pending for more than{' '}
          {STALE_HOURS} hours. A manual transfer may never have arrived, or a card payment’s webhook may
          not have been delivered — check the Stripe events log before assuming the gift was received.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`btn btn--size-small ${period === p.key ? 'btn--style-primary' : 'btn--style-secondary'}`}
            style={{ margin: 0 }}
            onClick={() => setPeriod(p.key)}
            aria-pressed={period === p.key}
          >
            {p.label}
          </button>
        ))}

        <span style={{ flex: 1 }} />

        <a
          href="/api/admin/donations/export"
          className="btn btn--size-small btn--style-secondary"
          style={{ margin: 0 }}
          download
        >
          Export CSV
        </a>
      </div>

      {loading && <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Loading totals…</p>}

      {!loading && totals && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem' }}>
          <div>
            <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Received</div>
            {totals.byCurrency.length === 0 ? (
              <div style={{ fontWeight: 600 }}>—</div>
            ) : (
              totals.byCurrency.map((c) => (
                <div key={c.currency} style={{ fontWeight: 600 }}>
                  {formatMoney(c.total, c.currency)}
                </div>
              ))
            )}
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Gifts</div>
            <div style={{ fontWeight: 600 }}>{totals.count}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Average gift</div>
            <div style={{ fontWeight: 600 }}>{averageLine || '—'}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Unique donors</div>
            <div style={{ fontWeight: 600 }}>{totals.donors ?? '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DonationsSummary
