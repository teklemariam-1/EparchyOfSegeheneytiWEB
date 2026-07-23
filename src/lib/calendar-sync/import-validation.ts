/**
 * Validation for Ge'ez calendar year imports and live-data integrity checks.
 *
 * Pure functions — shared by the admin import/integrity endpoints and unit
 * tests, and mirroring the rules enforced by scripts/convert-geez-calendar.mjs.
 * These rules exist because a single surplus or missing row silently shifts
 * every Gregorian correspondence after it (the 2018 E.C. book shipped six
 * Paguemen texts in a five-day Paguemen year).
 */

import { GEEZ_MONTHS, type GeezMonth } from '@/lib/constants/geezMonths'
import { paguemenDaysIn } from '@/lib/geez-liturgical'

export interface ImportRow {
  geezLabel: string
  month: string
  day: number
  geezYear: number
  gregorianDate: string
  readings?: string
  antiphon?: string
  deceasedClergy?: string
  events?: string
}

export interface IntegrityIssue {
  level: 'error' | 'warning'
  code: string
  message: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const isoAddDays = (iso: string, n: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

/** Validate one complete E.C. year of rows (sorted or not). */
export function validateYearRows(rows: ImportRow[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const err = (code: string, message: string) => issues.push({ level: 'error', code, message })

  if (rows.length === 0) {
    err('empty', 'No rows to import.')
    return issues
  }

  // ── Field sanity ──────────────────────────────────────────────────────────
  rows.forEach((r, i) => {
    if (!GEEZ_MONTHS.includes(r.month as GeezMonth)) err('bad-month', `#${i}: unknown month "${r.month}"`)
    if (!Number.isInteger(r.day) || r.day < 1 || r.day > 30) err('bad-day', `#${i}: day ${r.day} out of range`)
    if (!ISO_DATE.test(r.gregorianDate ?? '')) err('bad-date', `#${i}: gregorianDate "${r.gregorianDate}" is not yyyy-mm-dd`)
    if (!r.geezLabel?.trim()) err('bad-label', `#${i}: empty geezLabel`)
  })
  if (issues.length) return issues

  // ── One year per import ───────────────────────────────────────────────────
  const years = [...new Set(rows.map((r) => r.geezYear))]
  if (years.length > 1) {
    err('mixed-years', `Rows span multiple Ge'ez years: ${years.join(', ')}. Import one year at a time.`)
    return issues
  }
  const year = years[0]!

  // ── Year length and month lengths ─────────────────────────────────────────
  const expected = 360 + paguemenDaysIn(year)
  if (rows.length !== expected) {
    err(
      'year-length',
      `${year} E.C. must have ${expected} days (ጳጉሜን ${paguemenDaysIn(year)}), got ${rows.length}.`,
    )
  }
  const byMonth = new Map<string, number>()
  for (const r of rows) byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + 1)
  for (const m of GEEZ_MONTHS) {
    const count = byMonth.get(m) ?? 0
    const want = m === 'paguemen' ? paguemenDaysIn(year) : 30
    if (count !== want) err('month-length', `${m}: ${count} days, expected ${want}.`)
  }

  // ── Duplicates and Gregorian continuity ───────────────────────────────────
  const sorted = [...rows].sort((a, b) => (a.gregorianDate < b.gregorianDate ? -1 : 1))
  const seenGeez = new Set<string>()
  const seenGreg = new Set<string>()
  for (const r of rows) {
    const key = `${r.month}-${r.day}`
    if (seenGeez.has(key)) err('dup-geez-date', `Duplicate Ge'ez date ${key}.`)
    seenGeez.add(key)
    if (seenGreg.has(r.gregorianDate)) err('dup-greg-date', `Duplicate Gregorian date ${r.gregorianDate}.`)
    seenGreg.add(r.gregorianDate)
  }
  for (let i = 1; i < sorted.length; i++) {
    const want = isoAddDays(sorted[i - 1]!.gregorianDate, 1)
    if (sorted[i]!.gregorianDate !== want) {
      err(
        'greg-gap',
        `Gap in Gregorian sequence: ${sorted[i - 1]!.gregorianDate} is followed by ${sorted[i]!.gregorianDate} (expected ${want}).`,
      )
    }
  }

  return issues
}

export interface ExistingDay {
  month: string
  day: number
  geezYear: number
  gregorianDate: string
}

export interface IntegrityReport {
  years: Array<{
    geezYear: number
    days: number
    expected: number
    issues: IntegrityIssue[]
  }>
  /** Issues that span years (Gregorian overlaps between imports). */
  global: IntegrityIssue[]
}

/** Integrity check over the live geez-calendar-days data, grouped by year. */
export function checkExistingDays(days: ExistingDay[]): IntegrityReport {
  const byYear = new Map<number, ExistingDay[]>()
  for (const d of days) {
    const list = byYear.get(d.geezYear) ?? []
    list.push(d)
    byYear.set(d.geezYear, list)
  }

  const global: IntegrityIssue[] = []
  const seenGreg = new Map<string, number>()
  for (const d of days) {
    const prior = seenGreg.get(d.gregorianDate)
    if (prior !== undefined && prior !== d.geezYear) {
      global.push({
        level: 'error',
        code: 'cross-year-overlap',
        message: `${d.gregorianDate} exists in both ${prior} and ${d.geezYear} E.C.`,
      })
    }
    seenGreg.set(d.gregorianDate, d.geezYear)
  }

  return {
    years: [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([geezYear, yearDays]) => ({
        geezYear,
        days: yearDays.length,
        expected: 360 + paguemenDaysIn(geezYear),
        issues: validateYearRows(
          yearDays.map((d) => ({ ...d, geezLabel: `${d.month} ${d.day}` })),
        ),
      })),
    global,
  }
}
