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

interface SourceRow {
  source: string
  url?: string
  finalUrl?: string
  httpStatus?: number | null
  format?: string
  items?: number
  created?: number
  skipped?: number
  ok?: boolean
  error?: string
}

interface IngestResult {
  ok?: boolean
  diagnose?: boolean
  fetched?: number
  created?: number
  skipped?: number
  sources?: SourceRow[]
  errors?: string[]
  error?: string
}

export function FetchVaticanNews() {
  const router = useRouter()
  const [limit, setLimit] = useState(15)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState<false | 'fetch' | 'diagnose'>(false)
  const [result, setResult] = useState<IngestResult | null>(null)

  async function call(diagnose: boolean) {
    setBusy(diagnose ? 'diagnose' : 'fetch')
    setResult(null)
    try {
      const params = new URLSearchParams({ feed: 'all', limit: String(limit) })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (diagnose) params.set('diagnose', '1')

      const res = await fetch(`/api/ingest/vatican-news?${params}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data: IngestResult = await res.json()
      setResult(res.ok ? data : { error: data.error ?? `Request failed (${res.status})` })
      // Reveal the new drafts without a manual page reload.
      if (res.ok && !diagnose && (data.created ?? 0) > 0) router.refresh()
    } catch (err) {
      setResult({ error: String(err).slice(0, 200) })
    } finally {
      setBusy(false)
    }
  }
  const run = () => call(false)
  const diagnose = () => call(true)

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

        <button type="button" className="btn btn--style-primary" onClick={run} disabled={!!busy}>
          {busy === 'fetch' ? 'Fetching…' : 'Fetch latest news'}
        </button>

        <button type="button" className="btn btn--style-secondary" onClick={diagnose} disabled={!!busy}>
          {busy === 'diagnose' ? 'Testing…' : 'Test sources'}
        </button>

        {(from || to) && (
          <button
            type="button"
            className="btn btn--style-secondary"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
            disabled={!!busy}
          >
            Clear dates
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, opacity: 0.7, marginTop: '0.75rem', marginBottom: 0 }}>
        Imports headlines, summaries and a link back to the source as <strong>drafts</strong> for
        review — nothing is published automatically. Reads every enabled Feed Source. Already-imported
        articles are skipped, so it is safe to run repeatedly. Use <strong>Test sources</strong> to
        check each feed without importing.
      </p>

      {result && (
        <div style={{ marginTop: '0.75rem', fontSize: 13 }}>
          {result.error ? (
            <span style={{ color: 'var(--theme-error-500)' }}>Failed: {result.error}</span>
          ) : (
            <>
              {!result.diagnose && (
                <div style={{ marginBottom: 8 }}>
                  <strong>
                    {result.created ?? 0} new draft{result.created === 1 ? '' : 's'} created
                  </strong>{' '}
                  · {result.skipped ?? 0} already imported · {result.fetched ?? 0} source
                  {result.fetched === 1 ? '' : 's'} checked
                </div>
              )}
              {result.sources?.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', opacity: 0.7 }}>
                      <th style={{ padding: '2px 6px' }}>Source</th>
                      <th style={{ padding: '2px 6px' }}>Status</th>
                      <th style={{ padding: '2px 6px' }}>Format</th>
                      <th style={{ padding: '2px 6px' }}>Items</th>
                      {!result.diagnose && <th style={{ padding: '2px 6px' }}>Created</th>}
                      <th style={{ padding: '2px 6px' }}>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sources.map((s, i) => {
                      const good = s.error == null && s.ok !== false
                      return (
                        <tr key={`${s.source}-${i}`} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                          <td style={{ padding: '3px 6px' }}>{s.source}</td>
                          <td style={{ padding: '3px 6px', color: good ? 'var(--theme-success-500)' : 'var(--theme-error-500)' }}>
                            {good ? '✓' : '✕'} {s.httpStatus ?? '—'}
                          </td>
                          <td style={{ padding: '3px 6px' }}>{(s.format ?? '—').toUpperCase()}</td>
                          <td style={{ padding: '3px 6px' }}>{s.items ?? 0}</td>
                          {!result.diagnose && <td style={{ padding: '3px 6px' }}>{s.created ?? 0}</td>}
                          <td style={{ padding: '3px 6px', color: s.error ? 'var(--theme-error-500)' : undefined }}>
                            {s.error ?? (s.finalUrl ? `→ ${s.finalUrl}` : 'ok')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FetchVaticanNews
