/**
 * Server-side port of scripts/convert-geez-calendar.mjs: turns the eparchy's
 * raw liturgical-book JSON (the Android app's gxawieCalander.json shape) into
 * clean geez-calendar-days rows for the admin New-Year import wizard.
 *
 * Same rules as the script: Tigrinya month names → canonical slugs, Ge'ez
 * numerals → day numbers, and the first entry's Gregorian date anchors the
 * whole day-by-day sequence (per-entry dates in the book contain sporadic
 * typos — the sequence wins, mismatches become warnings). Unlike the script
 * it never exits: problems come back in the result for the wizard's dry-run
 * report, and validateYearRows() delivers the authoritative verdict.
 */

import type { ImportRow } from './import-validation'

export interface RawBookEntry {
  date?: string
  month?: string
  gregorian_date?: string
  readings?: string
  antiphon?: string
  deceased_clergy?: string
  events?: string
}

export interface ConversionResult {
  rows: ImportRow[]
  /** Non-fatal oddities (label/sequence mismatches, source-date typos). */
  warnings: string[]
  /** Fatal problems that prevented conversion (empty result). */
  errors: string[]
  geezYear?: number
}

const MONTH_MAP: Record<string, string> = {
  'መስከረም': 'meskerem',
  'ጥቅምቲ': 'tikimit',
  'ሕዳር': 'hidar',
  'ታሕሳስ': 'tahsas',
  'ጥሪ': 'tir',
  'የካቲት': 'yekatit',
  'መጋቢት': 'megabit',
  'ሚያዝያ': 'miyazia',
  'ግንቦት': 'ginbot',
  'ሰነ': 'sene',
  'ሓምለ': 'hamle',
  'ሐምለ': 'hamle',
  'ነሓሰ': 'nehase',
  'ጳጉሜን': 'paguemen',
  'ነጳጉሜን': 'paguemen',
}

const GEEZ_DIGITS: Record<string, number> = {
  '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8, '፱': 9,
  '፲': 10, '፳': 20, '፴': 30,
}

function parseDay(dateStr: string): number {
  const arabic = dateStr.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)
  if (arabic) return Number(arabic[1])
  let total = 0
  for (const ch of dateStr) {
    const v = GEEZ_DIGITS[ch]
    if (v) total += v
    else if (total > 0) break
  }
  return total
}

function parseYear(dateStr: string, fallback: number): number {
  const m = dateStr.match(/20\d{2}/)
  return m ? Number(m[0]) : fallback
}

function parseGregorian(str: string | undefined): string | null {
  const m = (str ?? '').match(/(\d{2})-(\d{2})-(\d{2})/)
  if (!m) return null
  return `20${m[3]}-${m[2]}-${m[1]}`
}

function toGeezNumeral(n: number): string {
  const tens = ['', '፲', '፳', '፴']
  const units = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱']
  return (tens[Math.floor(n / 10)] ?? '') + (units[n % 10] ?? '')
}

/** Extract the raw entry list from either the full book object or an array. */
export function extractBookEntries(input: unknown): RawBookEntry[] | null {
  if (Array.isArray(input)) return input as RawBookEntry[]
  if (input && typeof input === 'object') {
    const list = (input as { liturgical_calendar?: unknown }).liturgical_calendar
    if (Array.isArray(list)) return list as RawBookEntry[]
  }
  return null
}

export function convertGxawieBook(input: unknown): ConversionResult {
  const warnings: string[] = []
  const errors: string[] = []

  const source = extractBookEntries(input)
  if (!source || source.length === 0) {
    return {
      rows: [],
      warnings,
      errors: ['Expected the book JSON: a top-level "liturgical_calendar" array (or a plain array of day entries).'],
    }
  }

  // Most-common year = fallback for entries whose date string omits it.
  const yearCounts: Record<string, number> = {}
  for (const e of source) {
    const m = (e.date ?? '').match(/20\d{2}/)
    if (m) yearCounts[m[0]] = (yearCounts[m[0]] ?? 0) + 1
  }
  const fallbackYear = Number(
    Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0,
  )
  if (!fallbackYear) {
    return { rows: [], warnings, errors: ["Could not infer the Ge'ez year from the data."] }
  }

  const baseGreg = parseGregorian(source[0]?.gregorian_date)
  if (!baseGreg) {
    return {
      rows: [],
      warnings,
      errors: ['First entry has no parsable gregorian_date (DD-MM-YY) to anchor the sequence.'],
      geezYear: fallbackYear,
    }
  }
  const baseMs = Date.parse(`${baseGreg}T00:00:00Z`)
  const isoAt = (i: number) => new Date(baseMs + i * 86_400_000).toISOString().slice(0, 10)

  const rows: ImportRow[] = []
  let prev: ImportRow | null = null

  source.forEach((e, i) => {
    const month = MONTH_MAP[(e.month ?? '').trim()]
    if (!month) {
      errors.push(`#${i}: unknown month "${e.month}"`)
      return
    }

    const gregorianDate = isoAt(i)
    const parsedGreg = parseGregorian(e.gregorian_date)
    if (parsedGreg !== gregorianDate) {
      warnings.push(`#${i}: source Gregorian "${e.gregorian_date}" ≠ sequence ${gregorianDate} — using the sequence.`)
    }

    const day = prev && prev.month === month ? prev.day + 1 : 1
    const parsed = parseDay(e.date ?? '')
    const geezYear = parseYear(e.date ?? '', fallbackYear)

    let geezLabel = (e.date ?? '').replace(/ግ$/, '').trim()
    if (parsed !== day || !geezLabel) {
      const rebuilt = `${toGeezNumeral(day)} ${(e.month ?? '').trim()} ${geezYear}`.trim()
      warnings.push(`#${i}: label "${e.date}" parsed as day ${parsed}, sequence says ${day} — using "${rebuilt}".`)
      geezLabel = rebuilt
    }

    const row: ImportRow = {
      geezLabel,
      month,
      day,
      geezYear,
      gregorianDate,
      readings: (e.readings ?? '').trim(),
      antiphon: (e.antiphon ?? '').trim(),
      deceasedClergy: (e.deceased_clergy ?? '').trim(),
      events: (e.events ?? '').trim(),
    }
    rows.push(row)
    prev = row
  })

  return { rows: errors.length ? [] : rows, warnings, errors, geezYear: fallbackYear }
}
