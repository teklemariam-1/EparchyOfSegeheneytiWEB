import { describe, it, expect } from 'vitest'
import {
  parseTimeOfDay,
  isValidTimeOfDay,
  nextOccurrence,
  localMassTime,
  viewerSharesEparchyClock,
} from '../massTime'

/**
 * The property this module exists for: "Sunday 02:00 in Asmara" is SATURDAY
 * evening in Toronto, and a viewer planning to join remotely needs to see the
 * shifted weekday, not just a converted time.
 */

// A Wednesday, 12:00 UTC (15:00 Asmara).
const NOW = new Date('2026-08-05T12:00:00.000Z')

describe('parseTimeOfDay — the backfill parser', () => {
  it.each([
    ['07:30', '07:30'],
    ['9:00', '09:00'],
    ['9.30', '09:30'],
    ['9:00 AM', '09:00'],
    ['9:00 PM', '21:00'],
    ['12:00 PM', '12:00'],
    ['12:00 AM', '00:00'],
    ['  17:00  ', '17:00'],
    ['11:45 a.m.', '11:45'],
  ])('parses %s as %s', (input, expected) => {
    expect(parseTimeOfDay(input)).toBe(expected)
  })

  it.each(['after sunrise', 'ንጉሆ', '25:00', '9:75', '13:00 PM', '', null, undefined])(
    'refuses %s rather than guessing',
    (input) => {
      expect(parseTimeOfDay(input)).toBeNull()
    },
  )
})

describe('isValidTimeOfDay', () => {
  it('accepts 24-hour HH:MM and rejects everything else', () => {
    expect(isValidTimeOfDay('07:30')).toBe(true)
    expect(isValidTimeOfDay('23:59')).toBe(true)
    expect(isValidTimeOfDay('24:00')).toBe(false)
    expect(isValidTimeOfDay('7:30 AM')).toBe(false)
    expect(isValidTimeOfDay(undefined)).toBe(false)
  })
})

describe('nextOccurrence', () => {
  it('lands on the requested Asmara weekday, in the future', () => {
    const instant = nextOccurrence('Sunday', '07:30', NOW)!
    // Sunday 07:30 Asmara == Sunday 04:30 UTC.
    expect(instant.toISOString()).toBe('2026-08-09T04:30:00.000Z')
  })

  it('handles an Asmara time whose UTC instant falls on the previous day', () => {
    // Sunday 02:00 Asmara == SATURDAY 23:00 UTC. The weekday must be judged on
    // the Asmara side of the offset, not the UTC side.
    const instant = nextOccurrence('Sunday', '02:00', NOW)!
    expect(instant.toISOString()).toBe('2026-08-08T23:00:00.000Z')
  })

  it("picks the NEXT occurrence when today's has already passed", () => {
    // NOW is Wednesday 15:00 Asmara; Wednesday 07:30 already went.
    const instant = nextOccurrence('Wednesday', '07:30', NOW)!
    expect(instant.toISOString()).toBe('2026-08-12T04:30:00.000Z')
  })

  it('returns null for garbage rather than a wrong instant', () => {
    expect(nextOccurrence('Sunday', 'after sunrise', NOW)).toBeNull()
    expect(nextOccurrence('Funday' as never, '07:30', NOW)).toBeNull()
  })
})

describe('localMassTime — the day-shift property', () => {
  it('shows Toronto a SATURDAY evening for an Asmara early-Sunday Mass', () => {
    const local = localMassTime('Sunday', '02:00', 'America/Toronto', NOW)!
    // 2026-08-08T23:00Z is 19:00 EDT, Saturday.
    expect(local.weekday).toBe('Saturday')
    expect(local.time).toBe('19:00')
    expect(local.dayShifted).toBe(true)
  })

  it('shows Dubai the same Sunday, one hour ahead', () => {
    const local = localMassTime('Sunday', '07:30', 'Asia/Dubai', NOW)!
    expect(local.weekday).toBe('Sunday')
    expect(local.time).toBe('08:30')
    expect(local.dayShifted).toBe(false)
  })

  it("respects the viewer's DST on the concrete date, not a yearly average", () => {
    // August: Toronto is EDT (UTC-4). Sunday 07:30 Asmara = 04:30 UTC = 00:30 EDT.
    const local = localMassTime('Sunday', '07:30', 'America/Toronto', NOW)!
    expect(local.time).toBe('00:30')
    expect(local.weekday).toBe('Sunday')
  })

  it('returns null for an unknown zone so the caller falls back to the anchor', () => {
    expect(localMassTime('Sunday', '07:30', 'Not/AZone', NOW)).toBeNull()
  })
})

describe('viewerSharesEparchyClock', () => {
  it('is true for zones on the Asmara clock and false elsewhere', () => {
    expect(viewerSharesEparchyClock('Africa/Asmara', NOW)).toBe(true)
    expect(viewerSharesEparchyClock('Africa/Nairobi', NOW)).toBe(true) // also UTC+3
    expect(viewerSharesEparchyClock('Europe/Berlin', NOW)).toBe(false)
  })
})
