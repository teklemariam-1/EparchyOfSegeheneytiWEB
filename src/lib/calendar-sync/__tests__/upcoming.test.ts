import { describe, it, expect } from 'vitest'
import { buildUpcoming, eventsByDate } from '../upcoming'
import type { GeezCalendarDay, GeezMonthlyFeast, EventInRange } from '@/lib/payload/queries'

const day = (over: Partial<GeezCalendarDay>): GeezCalendarDay => ({
  id: 'x',
  geezLabel: '፩ መስከረም 2018',
  month: 'meskerem',
  day: 1,
  geezYear: 2018,
  gregorianDate: '2025-09-11',
  ...over,
})

describe('buildUpcoming', () => {
  const monthly: GeezMonthlyFeast[] = [{ day: 12, name: 'ሚካኤል', icon: '😇' }]

  it('skips past days and orders chronologically across year boundaries', () => {
    const days = [
      day({ id: 'c', month: 'meskerem', day: 1, geezYear: 2019, gregorianDate: '2026-09-11', events: 'ርእሰ ዓውደ ዓመት' }),
      day({ id: 'a', month: 'paguemen', day: 5, geezYear: 2018, gregorianDate: '2026-09-10', events: 'ዮሓንስ መጥምቅ' }),
      day({ id: 'b', month: 'paguemen', day: 3, geezYear: 2018, gregorianDate: '2026-09-08' }),
      day({ id: 'z', month: 'nehase', day: 30, geezYear: 2018, gregorianDate: '2026-09-05', events: 'past' }),
    ]
    const items = buildUpcoming(days, [], '2026-09-06')
    expect(items.map((i) => i.name)).toEqual(['ዮሓንስ መጥምቅ', 'ርእሰ ዓውደ ዓመት'])
    expect(items[0]!.daysLeft).toBe(4)
  })

  it('includes monthly commemorations on their day in any month', () => {
    const days = [day({ id: 'm', month: 'tikimit', day: 12, gregorianDate: '2025-10-22' })]
    const items = buildUpcoming(days, monthly, '2025-10-01')
    expect(items).toHaveLength(1)
    expect(items[0]!.name).toBe('ሚካኤል')
    expect(items[0]!.icon).toBe('😇')
  })

  it('emits both annual feast and monthly commemoration for the same day', () => {
    const days = [day({ id: 'd', day: 12, events: 'በዓል', gregorianDate: '2025-09-22' })]
    const items = buildUpcoming(days, monthly, '2025-09-22')
    expect(items.map((i) => i.key)).toEqual(['d-annual', 'd-monthly'])
    expect(items[0]!.daysLeft).toBe(0)
  })

  it('caps the list at the limit', () => {
    const days = Array.from({ length: 20 }, (_, i) =>
      day({
        id: `d${i}`,
        day: i + 1,
        gregorianDate: `2025-10-${String(i + 1).padStart(2, '0')}`,
        events: `feast ${i}`,
      }),
    )
    expect(buildUpcoming(days, [], '2025-10-01', 8)).toHaveLength(8)
  })
})

describe('eventsByDate', () => {
  const ev = (over: Partial<EventInRange>): EventInRange => ({
    slug: 'ev',
    title: 'Event',
    startDate: '2025-10-05T09:00:00.000Z',
    ...over,
  })

  it('maps a single-day event to its day only', () => {
    const map = eventsByDate([ev({})], '2025-10-01', '2025-10-30')
    expect(Object.keys(map)).toEqual(['2025-10-05'])
    expect(map['2025-10-05']![0]!.slug).toBe('ev')
  })

  it('expands multi-day events across every covered day', () => {
    const map = eventsByDate(
      [ev({ endDate: '2025-10-07T14:00:00.000Z' })],
      '2025-10-01',
      '2025-10-30',
    )
    expect(Object.keys(map).sort()).toEqual(['2025-10-05', '2025-10-06', '2025-10-07'])
  })

  it('clamps events extending beyond the window', () => {
    const map = eventsByDate(
      [ev({ startDate: '2025-09-28T00:00:00.000Z', endDate: '2025-10-02T00:00:00.000Z' })],
      '2025-10-01',
      '2025-10-30',
    )
    expect(Object.keys(map).sort()).toEqual(['2025-10-01', '2025-10-02'])
  })

  it('drops events wholly outside the window and keeps cancelled flag', () => {
    const map = eventsByDate(
      [
        ev({ slug: 'out', startDate: '2025-11-05T00:00:00.000Z' }),
        ev({ slug: 'cancelled', isCancelled: true }),
      ],
      '2025-10-01',
      '2025-10-30',
    )
    expect(map['2025-10-05']).toHaveLength(1)
    expect(map['2025-10-05']![0]).toMatchObject({ slug: 'cancelled', isCancelled: true })
    expect(Object.values(map).flat().some((e) => e.slug === 'out')).toBe(false)
  })
})
