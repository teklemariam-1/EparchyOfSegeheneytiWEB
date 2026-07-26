import { describe, it, expect } from 'vitest'
import { formatShortDate } from '../date'

/**
 * The listing shows DD/MM/YYYY, matching the reference design.
 *
 * The subtle part is Tigrinya: ICU resolves the `ti` locale to a MONTH-FIRST
 * short pattern, so handing the locale straight to Intl renders 07/19/2026 —
 * day and month swapped, and wrong in a way that only becomes visible after the
 * 12th of a month. These tests pin the day-first order for both languages.
 */

const JULY_19 = '2026-07-19T10:30:00.000Z'
const MARCH_05 = '2026-03-05T08:00:00.000Z'

describe('day-first ordering', () => {
  it('formats English as DD/MM/YYYY', () => {
    expect(formatShortDate(JULY_19, 'en')).toBe('19/07/2026')
  })

  it('formats Tigrinya as DD/MM/YYYY, not the locale’s month-first default', () => {
    expect(formatShortDate(JULY_19, 'ti')).toBe('19/07/2026')
  })

  it('agrees across locales — the same day reads the same way', () => {
    expect(formatShortDate(JULY_19, 'ti')).toBe(formatShortDate(JULY_19, 'en'))
  })

  it('is unambiguous on a date where the order would otherwise be invisible', () => {
    // 05/03 vs 03/05 — the case that silently hides a swapped format.
    expect(formatShortDate(MARCH_05, 'en')).toBe('05/03/2026')
    expect(formatShortDate(MARCH_05, 'ti')).toBe('05/03/2026')
  })
})

describe('zero padding', () => {
  it('pads single-digit days and months to two digits', () => {
    expect(formatShortDate('2026-01-02T00:00:00.000Z', 'en')).toBe('02/01/2026')
  })
})

describe('resilience', () => {
  it('returns an empty string for an unparseable date rather than "Invalid Date"', () => {
    expect(formatShortDate('not-a-date', 'en')).toBe('')
  })

  it('returns an empty string for an empty input', () => {
    expect(formatShortDate('', 'en')).toBe('')
  })

  it('falls back to English for an unknown locale instead of throwing', () => {
    expect(() => formatShortDate(JULY_19, 'zz-XX')).not.toThrow()
  })

  it('still formats when only a date is given, with no time', () => {
    expect(formatShortDate('2026-07-19', 'en')).toBe('19/07/2026')
  })
})
