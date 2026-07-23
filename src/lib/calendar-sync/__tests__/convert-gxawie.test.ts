import { describe, it, expect } from 'vitest'
import { convertGxawieBook, extractBookEntries } from '../convert-gxawie'

/** Minimal synthetic book: first 3 days of መስከረም 2019 anchored at 11-09-26. */
const book = {
  liturgical_calendar: [
    { date: '፩ መስከረም 2019', month: 'መስከረም', gregorian_date: '11-09-26 ፈረንጂ', readings: 'r1' },
    { date: '፪ መስከረም 2019', month: 'መስከረም', gregorian_date: '12-09-26 ፈረንጂ', events: 'በዓል' },
    { date: '፫ መስከረም 2019', month: 'መስከረም', gregorian_date: '13-09-26', deceased_clergy: 'ኣባ ገብረ' },
  ],
}

describe('extractBookEntries', () => {
  it('accepts the book object or a bare array, rejects anything else', () => {
    expect(extractBookEntries(book)).toHaveLength(3)
    expect(extractBookEntries(book.liturgical_calendar)).toHaveLength(3)
    expect(extractBookEntries({ nope: true })).toBeNull()
    expect(extractBookEntries('str')).toBeNull()
  })
})

describe('convertGxawieBook', () => {
  it('converts entries with canonical months and sequence-anchored dates', () => {
    const result = convertGxawieBook(book)
    expect(result.errors).toEqual([])
    expect(result.geezYear).toBe(2019)
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0]).toMatchObject({
      month: 'meskerem',
      day: 1,
      geezYear: 2019,
      gregorianDate: '2026-09-11',
      readings: 'r1',
    })
    expect(result.rows[2]).toMatchObject({ day: 3, gregorianDate: '2026-09-13', deceasedClergy: 'ኣባ ገብረ' })
  })

  it('trusts the sequence over typo\'d per-entry Gregorian dates, with a warning', () => {
    const typo = structuredClone(book)
    typo.liturgical_calendar[1]!.gregorian_date = '12-08-26'
    const result = convertGxawieBook(typo)
    expect(result.errors).toEqual([])
    expect(result.rows[1]!.gregorianDate).toBe('2026-09-12')
    expect(result.warnings.some((w) => w.includes('#1'))).toBe(true)
  })

  it('rebuilds broken day labels from the sequence, with a warning', () => {
    const broken = structuredClone(book)
    broken.liturgical_calendar[2]!.date = '፲፴ መስከረም 2019' // nonsense numeral
    const result = convertGxawieBook(broken)
    expect(result.rows[2]!.day).toBe(3)
    expect(result.rows[2]!.geezLabel).toBe('፫ መስከረም 2019')
    expect(result.warnings.some((w) => w.includes('sequence says 3'))).toBe(true)
  })

  it('fails cleanly on unusable input', () => {
    expect(convertGxawieBook({}).errors.length).toBeGreaterThan(0)
    expect(convertGxawieBook({ liturgical_calendar: [{ month: 'መስከረም' }] }).errors.length).toBeGreaterThan(0)
    const noYear = { liturgical_calendar: [{ date: 'x', month: 'መስከረም', gregorian_date: '11-09-26' }] }
    expect(convertGxawieBook(noYear).errors[0]).toContain("Ge'ez year")
  })

  it('round-trips the real 2018 seed shape: unknown months are fatal', () => {
    const bad = { liturgical_calendar: [{ date: '፩ Foo 2019', month: 'Foo', gregorian_date: '11-09-26' }] }
    const result = convertGxawieBook(bad)
    expect(result.errors.some((e) => e.includes('unknown month'))).toBe(true)
    expect(result.rows).toEqual([])
  })
})
