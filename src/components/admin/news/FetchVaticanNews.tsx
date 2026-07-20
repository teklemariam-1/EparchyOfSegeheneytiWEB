'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * "Fetch latest news" control shown above the News list in /admin.
 *
 * The scheduled cron only runs every 6 hours, so staff had no way to pull new
 * articles on demand. This calls the same ingest endpoint the cron does — same
 * dedupe rules, same draft + pending-review state — authenticating with the
 * session cookie rather than CRON_SECRET, which must never reach the browser.
 */

interface IngestResult {
  ok?: boolean
  fetched?: number
  created?: number
  skipped?: number
  errors?: string[]
  error?: string
}

export function FetchVaticanNews() {
  const router = useRouter()
  const [limit, setLimit] = useState(15)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)

  async function run() {
    setBusy(true)
    setResult(null)
    try {
      const params = new URLSearchParams({ feed: 'all', limit: String(limit) })
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/ingest/vatican-news?${params}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data: IngestResult = await res.json()
      setResult(res.ok ? data : { error: data.error ?? `Request failed (${res.status})` })
      // Reveal the new drafts without a manual page reload.
      if (res.ok && (data.created ?? 0) > 0) router.refresh()
    } catch (err) {
      setResult({ error: String(err).slice(0, 200) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        padding: '1rem',
        marginBottom: '1.5rem',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <label htmlFor="vn-limit" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
            How many
          </label>
          <input
            id="vn-limit"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Math.min(Math.max(Number(e.target.value) || 1, 1), 50))}
            style={{ width: 80 }}
          />
        </div>
        <div>
          <label htmlFor="vn-from" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
            From (optional)
          </label>
          <input id="vn-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="vn-to" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
            To (optional)
          </label>
          <input id="vn-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <button type="button" className="btn btn--style-primary" onClick={run} disabled={busy}>
          {busy ? 'Fetching…' : 'Fetch latest news'}
        </button>

        {(from || to) && (
          <button
            type="button"
            className="btn btn--style-secondary"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
            disabled={busy}
          >
            Clear dates
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, opacity: 0.7, marginTop: '0.75rem', marginBottom: 0 }}>
        Imports headlines, summaries and a link back to Vatican News as <strong>drafts</strong> for
        review — nothing is published automatically. Articles already imported are skipped, so it is
        safe to run repeatedly. Leave the dates empty for the most recent articles.
      </p>

      {result && (
        <div style={{ marginTop: '0.75rem', fontSize: 13 }}>
          {result.error ? (
            <span style={{ color: 'var(--theme-error-500)' }}>Failed: {result.error}</span>
          ) : (
            <>
              <strong>
                {result.created ?? 0} new draft{result.created === 1 ? '' : 's'} created
              </strong>{' '}
              · {result.skipped ?? 0} already imported · {result.fetched ?? 0} checked
              {(result.created ?? 0) === 0 && (
                <span style={{ opacity: 0.7 }}>
                  {' '}
                  — nothing new in this range.
                </span>
              )}
              {result.errors?.length ? (
                <ul style={{ marginTop: 6, color: 'var(--theme-error-500)' }}>
                  {result.errors.slice(0, 5).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FetchVaticanNews
