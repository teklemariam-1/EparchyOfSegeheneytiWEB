import { describe, it, expect } from 'vitest'
import {
  EPARCHY_TIME_ZONE,
  dateParts,
  timeInZone,
  dayInZone,
  differsFromEparchy,
  isAllDayEvent,
} from '../eventTime'
import { localDateOf } from '../../calendar-sync/config'

/**
 * The events on this site happen in Eritrea; most readers do not live there.
 * These tests pin the two failures that produced the wrong day on screen, and
 * the agreement between the website and the calendar subscription.
 */

// 01:00 on 16 March in Asmara (UTC+3) is 22:00 on the 15th in UTC. Rendering
// this instant without an explicit zone gives "15" on a UTC server and "15" or
// "16" in the browser depending on the reader — the exact bug.
const LATE_NIGHT_ASMARA = '2026-03-15T22:00:00.000Z'

// 18:00 on 15 March in Asmara — an ordinary evening liturgy, same day in UTC.
const EVENING_ASMARA = '2026-03-15T15:00:00.000Z'

describe('the 01:00 Asmara case', () => {
  it('resolves to 16 March, not 15', () => {
    expect(dayInZone(LATE_NIGHT_ASMARA)).toBe('2026-03-16')
    expect(dateParts(LATE_NIGHT_ASMARA)?.day).toBe('16')
  })

  it('shows 01:00 as the clock time', () => {
    expect(timeInZone(LATE_NIGHT_ASMARA)).toBe('01:00')
  })

  it('agrees with the ICS feed, which is the whole point', () => {
    // The feed resolves all-day dates with localDateOf. If these two ever
    // disagree, a subscriber's calendar and the website name different days for
    // the same liturgy.
    expect(dayInZone(LATE_NIGHT_ASMARA)).toBe(localDateOf(LATE_NIGHT_ASMARA))
    expect(dayInZone(EVENING_ASMARA)).toBe(localDateOf(EVENING_ASMARA))
  })

  it('does not depend on the machine running the test', () => {
    // Both are computed with an explicit timeZone, so a developer in Toronto and
    // a CI runner in UTC get the same answer.
    expect(dayInZone(LATE_NIGHT_ASMARA, EPARCHY_TIME_ZONE)).toBe('2026-03-16')
  })
})

describe('readers in other time zones', () => {
  // Real diaspora zones, with the values Intl actually produces for this
  // instant — including the DST boundaries in mid-March, which is exactly the
  // period where hand-reasoning about offsets goes wrong.
  it.each([
    ['America/Toronto', '2026-03-15'], // 18:00, still the 15th
    ['Asia/Dubai', '2026-03-16'], //     02:00, already the 16th
    ['Europe/Berlin', '2026-03-15'], //  23:00, before EU DST begins
    ['Asia/Jerusalem', '2026-03-16'], // 00:00, just over the line
  ])('%s sees its own local day, while Asmara stays 16 March', (zone, expectedLocalDay) => {
    expect(dayInZone(LATE_NIGHT_ASMARA, zone)).toBe(expectedLocalDay)
    // The anchor never moves, whoever is reading.
    expect(dayInZone(LATE_NIGHT_ASMARA)).toBe('2026-03-16')
  })

  it('flags that a Toronto reader sees a different wall clock', () => {
    expect(differsFromEparchy(EVENING_ASMARA, 'America/Toronto')).toBe(true)
  })

  it('does not flag a reader already on Asmara time', () => {
    expect(differsFromEparchy(EVENING_ASMARA, EPARCHY_TIME_ZONE)).toBe(false)
  })

  it('does not flag a different zone name that is the same clock', () => {
    // Africa/Nairobi is UTC+3 like Asmara. Telling that reader
    // "18:00 Asmara · 18:00 your time" is noise, not information.
    expect(differsFromEparchy(EVENING_ASMARA, 'Africa/Nairobi')).toBe(false)
  })
})

describe('all-day events', () => {
  it('are identified from the collection flag', () => {
    expect(isAllDayEvent({ isAllDay: true })).toBe(true)
    expect(isAllDayEvent({ isAllDay: false })).toBe(false)
    expect(isAllDayEvent({})).toBe(false)
    expect(isAllDayEvent({ isAllDay: null })).toBe(false)
  })

  it('keep their stored day when read in the eparchy zone', () => {
    // A feast stored at local midnight must stay on its own date. This is the
    // bug the calendar feed already had once; the rule is the same here.
    const fasika = '2026-04-11T21:00:00.000Z' // 00:00 on 12 April in Asmara
    expect(dayInZone(fasika)).toBe('2026-04-12')
    expect(dayInZone(fasika)).toBe(localDateOf(fasika))
  })
})

describe('resilience', () => {
  it.each(['', 'not-a-date', '2026-13-45T99:99:99Z'])('returns empty for %o', (bad) => {
    expect(dayInZone(bad)).toBe('')
    expect(timeInZone(bad)).toBe('')
    expect(dateParts(bad)).toBeNull()
  })

  it('does not throw on an unknown timezone', () => {
    // Not hypothetical: "Europe/Frankfurt" reads like a zone and is not one —
    // it cost a wrong test expectation while writing these. Intl throws a
    // RangeError, which must not reach a page render.
    expect(() => dayInZone(EVENING_ASMARA, 'Europe/Frankfurt')).not.toThrow()
    expect(() => timeInZone(EVENING_ASMARA, 'en', 'Not/AZone')).not.toThrow()
    expect(dayInZone(EVENING_ASMARA, 'Europe/Frankfurt')).toBe('')
  })

  it('treats an invalid viewer zone as "no difference" rather than guessing', () => {
    // A garbage zone must not produce a bogus "· 00:00 your time" label.
    expect(differsFromEparchy(EVENING_ASMARA, 'Not/AZone')).toBe(false)
  })

  it('formats a whole day and time for a normal evening event', () => {
    expect(timeInZone(EVENING_ASMARA)).toBe('18:00')
    const parts = dateParts(EVENING_ASMARA)
    expect(parts?.day).toBe('15')
    expect(parts?.year).toBe('2026')
  })
})
