import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatRelativeTime,
  formatDateRange,
  geezToGregorian,
  formatGeezDate,
} from '../date'

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a valid ISO date string in en-US', () => {
    // Use time component to avoid UTC midnight edge-case in timezones
    const result = formatDate('2026-03-24T12:00:00Z')
    expect(result).toMatch(/March/)
    expect(result).toMatch(/2026/)
  })

  it('accepts custom DateTimeFormat options', () => {
    const result = formatDate('2026-03-24T12:00:00Z', { month: 'short', year: 'numeric' })
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2026/)
  })

  it('accepts a custom locale', () => {
    const result = formatDate('2026-03-24T12:00:00Z', undefined, 'fr-FR')
    expect(result).toMatch(/[mM]ars/)
  })

  it('falls back to the raw string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-03-24T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns seconds-ago wording for 30 s in the past', () => {
    const past = new Date(NOW.getTime() - 30_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/second/)
  })

  it('returns minutes-ago wording for 5 min in the past', () => {
    const past = new Date(NOW.getTime() - 5 * 60_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/minute/)
  })

  it('returns hours-ago wording for 2 h in the past', () => {
    const past = new Date(NOW.getTime() - 2 * 3_600_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/hour/)
  })

  it('returns days-ago wording for 3 days in the past', () => {
    const past = new Date(NOW.getTime() - 3 * 86_400_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/day/)
  })

  it('returns weeks-ago wording for 2 weeks in the past', () => {
    const past = new Date(NOW.getTime() - 14 * 86_400_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/week/)
  })

  it('returns months-ago wording for 2 months in the past', () => {
    const past = new Date(NOW.getTime() - 60 * 86_400_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/month/)
  })

  it('returns years-ago wording for 2 years in the past', () => {
    const past = new Date(NOW.getTime() - 730 * 86_400_000).toISOString()
    expect(formatRelativeTime(past)).toMatch(/year/)
  })
})

// ─── formatDateRange ──────────────────────────────────────────────────────────

describe('formatDateRange', () => {
  it('returns a single formatted date when no end is given', () => {
    const result = formatDateRange('2026-03-24T12:00:00Z')
    expect(result).toMatch(/March/)
    expect(result).toMatch(/2026/)
  })

  it('formats same-month range with an en-dash', () => {
    const result = formatDateRange('2026-03-01T12:00:00Z', '2026-03-05T12:00:00Z')
    expect(result).toMatch(/March/)
    expect(result).toMatch(/–/) // en-dash
    expect(result).toMatch(/2026/)
  })

  it('formats cross-month range with abbreviated month names', () => {
    const result = formatDateRange('2026-03-28T12:00:00Z', '2026-04-02T12:00:00Z')
    expect(result).toMatch(/–/)
    expect(result).toMatch(/2026/)
  })

  it('handles same-year cross-month range as a non-empty string', () => {
    const result = formatDateRange('2026-01-31T12:00:00Z', '2026-02-03T12:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─── geezToGregorian ─────────────────────────────────────────────────────────

describe('geezToGregorian', () => {
  it('returns a Date object', () => {
    expect(geezToGregorian(2018, 1, 1)).toBeInstanceOf(Date)
  })

  it('converts Meskerem 1 of year 2018 E.C. correctly', () => {
    // Meskerem (month 1) day 1 of year 2018 E.C. ≈ 11 Sep 2025 G.C.
    const d = geezToGregorian(2018, 1, 1)
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(8) // September (0-indexed)
  })

  it('advances by 30 days per month', () => {
    const m1 = geezToGregorian(2018, 1, 1)
    const m2 = geezToGregorian(2018, 2, 1)
    const diffDays = (m2.getTime() - m1.getTime()) / 86_400_000
    expect(diffDays).toBe(30)
  })
})

// ─── formatGeezDate ───────────────────────────────────────────────────────────

describe('formatGeezDate', () => {
  it('returns a string containing the year, month label, day, and E.C. marker', () => {
    expect(formatGeezDate(2018, 'Meskerem', 1)).toBe('Meskerem 1, 2018 (E.C.)')
  })
})
