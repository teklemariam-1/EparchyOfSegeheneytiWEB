'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@payloadcms/ui'

interface Issue {
  level: 'error' | 'warning'
  code: string
  message: string
}

interface DryRunReport {
  ok: boolean
  dryRun?: boolean
  year?: number
  rows?: number
  issues?: Issue[]
  preview?: {
    first?: { geezLabel: string; gregorianDate: string }
    last?: { geezLabel: string; gregorianDate: string }
  }
  // Conversion-stage failures
  stage?: string
  errors?: string[]
  warnings?: string[]
  imported?: number
  error?: string
}

interface IntegrityReport {
  years: Array<{ geezYear: number; days: number; expected: number; issues: Issue[] }>
  global: Issue[]
}

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  padding: '16px 18px',
  marginTop: 20,
  background: 'var(--theme-elevation-50)',
}

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12 }

function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null
  const shown = issues.slice(0, 30)
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
      {shown.map((i, idx) => (
        <li
          key={idx}
          style={{
            ...mono,
            color: i.level === 'error' ? 'var(--theme-error-500)' : 'var(--theme-warning-600, #b45309)',
            marginBottom: 4,
          }}
        >
          [{i.level}] {i.message}
        </li>
      ))}
      {issues.length > shown.length && (
        <li style={mono}>… and {issues.length - shown.length} more</li>
      )}
    </ul>
  )
}

/**
 * Three-step wizard: choose the book JSON file → server-side dry run
 * (conversion + validation report) → import. State resets when a new file
 * is chosen, so a fixed file can be re-checked immediately.
 */
export function CalendarImportWizard() {
  const [integrity, setIntegrity] = useState<IntegrityReport | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [report, setReport] = useState<DryRunReport | null>(null)
  const [busy, setBusy] = useState<'check' | 'import' | null>(null)
  const [done, setDone] = useState<DryRunReport | null>(null)

  const loadIntegrity = async () => {
    try {
      const res = await fetch('/api/geez-calendar-days/integrity', { credentials: 'include' })
      if (res.ok) setIntegrity(await res.json())
    } catch {
      // Leave the summary empty — the wizard still works without it.
    }
  }
  useEffect(() => {
    void loadIntegrity()
  }, [])

  const onFile = async (file: File | undefined) => {
    setReport(null)
    setDone(null)
    setRaw(null)
    setFileName(file?.name ?? null)
    if (!file) return
    try {
      setRaw(JSON.parse(await file.text()))
    } catch {
      setReport({ ok: false, stage: 'parse', errors: ['This file is not valid JSON.'] })
    }
  }

  const post = async (dryRun: boolean): Promise<DryRunReport> => {
    const res = await fetch('/api/geez-calendar-days/import', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw, dryRun }),
    })
    return (await res.json()) as DryRunReport
  }

  const check = async () => {
    setBusy('check')
    try {
      setReport(await post(true))
    } catch {
      setReport({ ok: false, errors: ['Request failed — check your connection and try again.'] })
    } finally {
      setBusy(null)
    }
  }

  const doImport = async () => {
    setBusy('import')
    try {
      const result = await post(false)
      setDone(result)
      if (result.ok) {
        setReport(null)
        void loadIntegrity()
      }
    } catch {
      setDone({ ok: false, errors: ['Import request failed — the year was NOT imported.'] })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p style={{ color: 'var(--theme-elevation-600)', marginTop: 8 }}>
        Upload the liturgical-book JSON for the next E.C. year (the same file the mobile app uses,
        e.g. <span style={mono}>gxawieCalander.json</span>). Nothing is written until the dry-run
        report is clean and you confirm the import.
      </p>

      {/* ── Current data ──────────────────────────────────────────────── */}
      <div style={box}>
        <strong>Imported years</strong>
        {integrity === null ? (
          <p style={{ margin: '8px 0 0' }}>Loading…</p>
        ) : integrity.years.length === 0 ? (
          <p style={{ margin: '8px 0 0' }}>No calendar data yet.</p>
        ) : (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {integrity.years.map((y) => {
              const healthy = y.days === y.expected && y.issues.length === 0
              return (
                <li key={y.geezYear} style={{ marginBottom: 4 }}>
                  {y.geezYear} E.C. — {y.days}/{y.expected} days {healthy ? '✓' : '⚠ issues found'}
                  {!healthy && <IssueList issues={y.issues} />}
                </li>
              )
            })}
          </ul>
        )}
        {integrity && integrity.global.length > 0 && <IssueList issues={integrity.global} />}
      </div>

      {/* ── Step 1: file ──────────────────────────────────────────────── */}
      <div style={box}>
        <strong>1 · Choose the year&apos;s JSON file</strong>
        <div style={{ marginTop: 10 }}>
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        {fileName && raw !== null && (
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => void check()} disabled={busy !== null}>
              {busy === 'check' ? 'Checking…' : '2 · Run dry-run check'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Step 2: report ────────────────────────────────────────────── */}
      {report && (
        <div style={box}>
          <strong>
            Dry-run report{report.year ? ` — ${report.year} E.C.` : ''}
            {typeof report.rows === 'number' ? ` (${report.rows} days)` : ''}
          </strong>
          {report.preview?.first && report.preview.last && (
            <p style={{ ...mono, margin: '8px 0 0' }}>
              {report.preview.first.geezLabel} → {report.preview.first.gregorianDate}
              {'  ···  '}
              {report.preview.last.geezLabel} → {report.preview.last.gregorianDate}
            </p>
          )}
          {(report.errors ?? []).map((e, i) => (
            <p key={i} style={{ ...mono, color: 'var(--theme-error-500)', margin: '8px 0 0' }}>
              {e}
            </p>
          ))}
          <IssueList issues={report.issues ?? []} />
          {report.ok ? (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 10px' }}>
                ✓ Validation passed. Importing adds {report.rows} days for {report.year} E.C.
              </p>
              <Button onClick={() => void doImport()} disabled={busy !== null}>
                {busy === 'import' ? 'Importing…' : `3 · Import ${report.year} E.C.`}
              </Button>
            </div>
          ) : (
            <p style={{ marginTop: 12 }}>
              Fix the input file and choose it again — nothing was imported.
            </p>
          )}
        </div>
      )}

      {/* ── Step 3: result ────────────────────────────────────────────── */}
      {done && (
        <div style={box}>
          {done.ok ? (
            <strong>✓ Imported {done.imported} days for {done.year} E.C.</strong>
          ) : (
            <>
              <strong style={{ color: 'var(--theme-error-500)' }}>Import failed</strong>
              {(done.errors ?? [done.error ?? 'Unknown error']).map((e, i) => (
                <p key={i} style={{ ...mono, margin: '8px 0 0' }}>{e}</p>
              ))}
              <IssueList issues={done.issues ?? []} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
