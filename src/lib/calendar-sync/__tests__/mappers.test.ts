import { describe, it, expect } from 'vitest'
import {
  eventDocToCalendarEvent,
  feastEvents,
  monthlyFeastEvents,
} from '../mappers'
import type { EventForFeed, GeezFeedDay, GeezMonthlyFeast } from '@/lib/payload/queries'

const ev = (over: Partial<EventForFeed>): EventForFeed => ({
  slug: 'vespers',
  title: 'Solemn Vespers',
  startDate: '2025-10-05T16:00:00.000Z',
  ...over,
})

describe('eventDocToCalendarEvent', () => {
  it('keeps timed events as full instants and builds a stable UID', () => {
    const c = eventDocToCalendarEvent(ev({}))
    expect(c.allDay).toBe(false)
    expect(c.start).toBe('2025-10-05T16:00:00.000Z')
    expect(c.uid).toBe('event-vespers@eparchyofsegheneyti.org')
  })

  it('resolves all-day dates in Africa/Asmara, not raw UTC (off-by-one fix)', () => {
    // 21:00Z is 00:00 next day in Asmara (UTC+3) — must land on Oct 5, not Oct 4.
    const c = eventDocToCalendarEvent(ev({ isAllDay: true, startDate: '2025-10-04T21:00:00.000Z' }))
    expect(c.allDay).toBe(true)
    expect(c.start).toBe('2025-10-05')
  })

  it('carries an all-day end date, cancelled flag, and joined location', () => {
    const c = eventDocToCalendarEvent(
      ev({
        isAllDay: true,
        startDate: '2025-10-05T00:00:00.000Z',
        endDate: '2025-10-07T00:00:00.000Z',
        isCancelled: true,
        locationName: 'Cathedral',
        locationAddress: 'Segeneyti',
      }),
    )
    expect(c.end).toBe('2025-10-07')
    expect(c.cancelled).toBe(true)
    expect(c.location).toBe('Cathedral, Segeneyti')
  })
})

const day = (over: Partial<GeezFeedDay>): GeezFeedDay => ({
  id: 'd',
  geezLabel: '፲፪ መስከረም 2018',
  month: 'meskerem',
  day: 12,
  geezYear: 2018,
  gregorianDate: '2025-09-22',
  ...over,
})

describe('feast + monthly-feast mappers', () => {
  it('emits annual feasts only for days carrying a feast, with date-derived UID', () => {
    const events = feastEvents([
      day({ id: 'a', events: 'መስቀል', gregorianDate: '2025-09-27', day: 17 }),
      day({ id: 'b', events: undefined }),
    ])
    expect(events).toHaveLength(1)
    expect(events[0]!.title).toBe('መስቀል')
    expect(events[0]!.uid).toBe('geez-feast-2018-meskerem-17@eparchyofsegheneyti.org')
    expect(events[0]!.allDay).toBe(true)
  })

  it('pre-expands a monthly commemoration onto each matching day', () => {
    const feasts: GeezMonthlyFeast[] = [{ day: 12, name: 'ሚካኤል', icon: '😇' }]
    const events = monthlyFeastEvents(
      [day({ id: 'x', day: 12, gregorianDate: '2025-09-22' }), day({ id: 'y', day: 13 })],
      feasts,
    )
    expect(events).toHaveLength(1)
    expect(events[0]!.title).toBe('ሚካኤል')
    expect(events[0]!.uid).toContain('geez-monthly-2018-meskerem-12')
  })
})
