import { describe, it, expect } from 'vitest'
import {
  buildTimeline,
  formatMilestoneRange,
  formatPreciseDate,
  milestoneSortKey,
  sortMilestones,
} from '../timeline'

/**
 * Mixed date precision is the hard case: historical and rural Eritrean records
 * routinely give a year and nothing more, and the database still has to store a
 * full timestamp. These assert that the stored day is never presented as fact
 * and that ordering stays honest across precisions.
 */
describe('formatPreciseDate', () => {
  it('renders only as much of the date as was actually recorded', () => {
    const iso = '1998-06-14T00:00:00.000Z'
    expect(formatPreciseDate(iso, 'exact')).toBe('14 June 1998')
    expect(formatPreciseDate(iso, 'month')).toBe('June 1998')
    expect(formatPreciseDate(iso, 'year')).toBe('1998')
  })

  it('marks an approximate date rather than implying a known day', () => {
    expect(formatPreciseDate('1998-01-01T00:00:00.000Z', 'approximate')).toBe('circa 1998')
    expect(
      formatPreciseDate('1998-01-01T00:00:00.000Z', 'approximate', 'en', { circa: 'ኣስታት' }),
    ).toBe('ኣስታት 1998')
  })

  it('never invents a day: a year-only entry stored as 1 January renders as the year', () => {
    // This is the whole point of the precision flag — the stored value below is
    // 1 Jan because Postgres needs one, not because anyone claimed that day.
    expect(formatPreciseDate('1998-01-01T00:00:00.000Z', 'year')).toBe('1998')
    expect(formatPreciseDate('1998-01-01T00:00:00.000Z', 'year')).not.toContain('January')
  })

  it('returns null for a missing or unparseable date', () => {
    expect(formatPreciseDate(null, 'exact')).toBeNull()
    expect(formatPreciseDate(undefined, 'exact')).toBeNull()
    expect(formatPreciseDate('not-a-date', 'exact')).toBeNull()
  })

  it('renders "ongoing" without needing a date at all', () => {
    expect(formatPreciseDate(null, 'ongoing')).toBe('Ongoing')
  })
})

describe('formatMilestoneRange', () => {
  it('renders a span across two precisions', () => {
    expect(
      formatMilestoneRange({
        date: '2004-09-01T00:00:00.000Z',
        datePrecision: 'year',
        endDate: '2009-06-01T00:00:00.000Z',
        endDatePrecision: 'year',
      }),
    ).toBe('2004 – 2009')
  })

  it('renders an open-ended assignment as ongoing', () => {
    expect(
      formatMilestoneRange({
        date: '2019-03-01T00:00:00.000Z',
        datePrecision: 'month',
        endDatePrecision: 'ongoing',
      }),
    ).toBe('March 2019 – ongoing')
  })

  it('falls back to the start alone when there is no end', () => {
    expect(
      formatMilestoneRange({ date: '1998-06-14T00:00:00.000Z', datePrecision: 'exact' }),
    ).toBe('14 June 1998')
  })
})

describe('milestone sorting with mixed precision', () => {
  it('sorts a year-only entry to the start of its year, before a dated entry in the same year', () => {
    // We know the March entry happened in March; we know only that the
    // year-only entry happened sometime in 1998. Placing it first asserts less.
    const yearOnly = { date: '1998-08-01T00:00:00.000Z', datePrecision: 'year' }
    const exact = { date: '1998-03-04T00:00:00.000Z', datePrecision: 'exact' }
    expect(milestoneSortKey(yearOnly)).toBeLessThan(milestoneSortKey(exact))
  })

  it('produces correct chronological order across every precision', () => {
    const sorted = sortMilestones([
      { title: 'ordination', date: '1998-06-14T00:00:00.000Z', datePrecision: 'exact' },
      { title: 'birth', date: '1968-01-01T00:00:00.000Z', datePrecision: 'approximate' },
      { title: 'consecration', date: '2024-02-11T00:00:00.000Z', datePrecision: 'exact' },
      { title: 'seminary', date: '1990-09-01T00:00:00.000Z', datePrecision: 'month' },
      { title: 'studies', date: '1986-06-01T00:00:00.000Z', datePrecision: 'year' },
    ] as never[])

    expect(sorted.map((m) => (m as { title: string }).title)).toEqual([
      'birth',
      'studies',
      'seminary',
      'ordination',
      'consecration',
    ])
  })

  it('sorts undated entries last rather than to the epoch', () => {
    const sorted = sortMilestones([
      { title: 'undated' },
      { title: 'dated', date: '2001-01-01T00:00:00.000Z', datePrecision: 'year' },
    ] as never[])
    expect(sorted.map((m) => (m as { title: string }).title)).toEqual(['dated', 'undated'])
  })

  it('breaks a same-date tie with the manual order, then with entry order', () => {
    const sameDay = '2024-02-11T00:00:00.000Z'
    const sorted = sortMilestones([
      { title: 'second', date: sameDay, datePrecision: 'exact', order: 2 },
      { title: 'first', date: sameDay, datePrecision: 'exact', order: 1 },
      { title: 'unordered', date: sameDay, datePrecision: 'exact' },
    ] as never[])
    expect(sorted.map((m) => (m as { title: string }).title)).toEqual([
      'first',
      'second',
      'unordered',
    ])
  })
})

describe('buildTimeline', () => {
  it('groups milestones into life periods in chronological order', () => {
    const groups = buildTimeline([
      { milestoneType: 'enthronement', date: '2024-04-01T00:00:00.000Z', datePrecision: 'exact' },
      { milestoneType: 'birth', date: '1968-01-01T00:00:00.000Z', datePrecision: 'year' },
      { milestoneType: 'major-seminary', date: '1990-01-01T00:00:00.000Z', datePrecision: 'year' },
      { milestoneType: 'priestly-ordination', date: '1998-01-01T00:00:00.000Z', datePrecision: 'year' },
    ] as never[])

    expect(groups.map((g) => g.period)).toEqual([
      'origins',
      'formation',
      'priesthood',
      'episcopacy',
    ])
  })

  it('drops empty periods so a young record shows no hollow headings', () => {
    const groups = buildTimeline([
      { milestoneType: 'birth', date: '1968-01-01T00:00:00.000Z', datePrecision: 'year' },
    ] as never[])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.period).toBe('origins')
  })

  it('files an unrecognised milestone type without dropping it', () => {
    const groups = buildTimeline([{ milestoneType: 'not-a-real-type', title: 'kept' }] as never[])
    expect(groups.flatMap((g) => g.milestones)).toHaveLength(1)
  })
})
