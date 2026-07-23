import { describe, it, expect } from 'vitest'
import { validateYearRows, checkExistingDays, type ImportRow } from '../import-validation'
import { GEEZ_MONTHS } from '@/lib/constants/geezMonths'

/** A complete, correct 2018 E.C. (365 days from 2025-09-11). */
function validYear(): ImportRow[] {
  const rows: ImportRow[] = []
  let iso = Date.parse('2025-09-11T00:00:00Z')
  for (const month of GEEZ_MONTHS) {
    const len = month === 'paguemen' ? 5 : 30
    for (let day = 1; day <= len; day++) {
      rows.push({
        geezLabel: `${day} ${month} 2018`,
        month,
        day,
        geezYear: 2018,
        gregorianDate: new Date(iso).toISOString().slice(0, 10),
      })
      iso += 86_400_000
    }
  }
  return rows
}

describe('validateYearRows', () => {
  it('accepts a complete, sequential year', () => {
    expect(validateYearRows(validYear())).toEqual([])
  })

  it('rejects the wrong Paguemen length for a non-leap year', () => {
    const rows = validYear()
    rows.push({
      geezLabel: '6 paguemen 2018',
      month: 'paguemen',
      day: 6,
      geezYear: 2018,
      gregorianDate: '2026-09-11',
    })
    const codes = validateYearRows(rows).map((i) => i.code)
    expect(codes).toContain('year-length')
    expect(codes).toContain('month-length')
  })

  it('accepts a 6-day Paguemen in an Ethiopic leap year', () => {
    const rows = validYear().map((r) => ({
      ...r,
      geezYear: 2019,
      // Shift the whole year forward 365 days so dates stay sequential.
      gregorianDate: new Date(Date.parse(`${r.gregorianDate}T00:00:00Z`) + 365 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    }))
    const last = rows[rows.length - 1]!
    rows.push({
      ...last,
      day: 6,
      gregorianDate: new Date(Date.parse(`${last.gregorianDate}T00:00:00Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10),
    })
    expect(validateYearRows(rows)).toEqual([])
  })

  it('detects gaps in the Gregorian sequence', () => {
    const rows = validYear()
    rows[100] = { ...rows[100]!, gregorianDate: '2027-01-01' }
    const codes = validateYearRows(rows).map((i) => i.code)
    expect(codes).toContain('greg-gap')
  })

  it('detects duplicate Ge\'ez and Gregorian dates', () => {
    const rows = validYear()
    rows[10] = { ...rows[9]! }
    const codes = validateYearRows(rows).map((i) => i.code)
    expect(codes).toContain('dup-geez-date')
    expect(codes).toContain('dup-greg-date')
  })

  it('rejects mixed years and bad months', () => {
    const rows = validYear()
    rows[0] = { ...rows[0]!, geezYear: 2017 }
    expect(validateYearRows(rows).map((i) => i.code)).toContain('mixed-years')
    expect(
      validateYearRows([
        { geezLabel: 'x', month: 'nope', day: 1, geezYear: 2018, gregorianDate: '2025-09-11' },
      ]).map((i) => i.code),
    ).toContain('bad-month')
  })
})

describe('checkExistingDays', () => {
  it('reports per-year health and cross-year overlaps', () => {
    const year = validYear()
    const report = checkExistingDays(year)
    expect(report.years).toHaveLength(1)
    expect(report.years[0]!).toMatchObject({ geezYear: 2018, days: 365, expected: 365 })
    expect(report.years[0]!.issues).toEqual([])
    expect(report.global).toEqual([])

    const overlapping = [
      ...year,
      { geezLabel: 'x', month: 'meskerem', day: 1, geezYear: 2019, gregorianDate: year[year.length - 1]!.gregorianDate },
    ]
    const bad = checkExistingDays(overlapping)
    expect(bad.global.map((i) => i.code)).toContain('cross-year-overlap')
  })
})
