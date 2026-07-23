import { describe, it, expect } from 'vitest'
import { escapeText, foldLine, buildICS, type CalendarEvent } from '../ics'

const META = { name: 'Test Calendar', timeZone: 'Africa/Asmara', prodId: '-//Test//EN' }

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  uid: 'x@example.org',
  title: 'Feast',
  start: '2026-01-07',
  allDay: true,
  ...over,
})

describe('escapeText', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })
})

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short')
  })

  it('folds long ASCII lines at 75 octets with a leading space', () => {
    const folded = foldLine('SUMMARY:' + 'a'.repeat(200))
    const lines = folded.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[0]!.length).toBeLessThanOrEqual(75)
    for (const l of lines.slice(1)) expect(l.startsWith(' ')).toBe(true)
  })

  it('folds by octets, not characters, without splitting a Ge\'ez code point', () => {
    const folded = foldLine('SUMMARY:' + 'ጳ'.repeat(60)) // 3 octets each
    const encoder = new TextEncoder()
    for (const l of folded.split('\r\n')) {
      expect(encoder.encode(l).length).toBeLessThanOrEqual(75)
    }
    // Re-joining continuation lines must reproduce the original characters.
    expect(folded.split('\r\n').map((l, i) => (i === 0 ? l : l.slice(1))).join('')).toBe(
      'SUMMARY:' + 'ጳ'.repeat(60),
    )
  })
})

describe('buildICS', () => {
  it('emits an all-day event with exclusive DTEND', () => {
    const out = buildICS(META, [ev({ start: '2026-01-07', end: '2026-01-08' })])
    expect(out).toContain('DTSTART;VALUE=DATE:20260107')
    expect(out).toContain('DTEND;VALUE=DATE:20260109') // day after inclusive end
    expect(out).toContain('STATUS:CONFIRMED')
    expect(out.endsWith('\r\n')).toBe(true)
  })

  it('single all-day event spans exactly one day', () => {
    const out = buildICS(META, [ev({})])
    expect(out).toContain('DTSTART;VALUE=DATE:20260107')
    expect(out).toContain('DTEND;VALUE=DATE:20260108')
  })

  it('emits timed events in UTC basic format', () => {
    const out = buildICS(META, [
      ev({ allDay: false, start: '2026-03-01T09:30:00.000Z', end: '2026-03-01T11:00:00.000Z' }),
    ])
    expect(out).toContain('DTSTART:20260301T093000Z')
    expect(out).toContain('DTEND:20260301T110000Z')
  })

  it('marks cancelled events and includes VALARM when requested', () => {
    const out = buildICS(META, [ev({ cancelled: true, alarmMinutesBefore: 1440 })])
    expect(out).toContain('STATUS:CANCELLED')
    expect(out).toContain('BEGIN:VALARM')
    expect(out).toContain('TRIGGER:-PT1440M')
  })

  it('wraps events in a VCALENDAR with calendar metadata', () => {
    const out = buildICS({ ...META, description: 'All feasts' }, [ev({})])
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(out).toContain('X-WR-CALNAME:Test Calendar')
    expect(out).toContain('X-WR-CALDESC:All feasts')
    expect(out).toContain('X-WR-TIMEZONE:Africa/Asmara')
    expect(out.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('uses updatedAt for DTSTAMP so output is deterministic', () => {
    const out = buildICS(META, [ev({ updatedAt: '2026-02-01T10:00:00.000Z' })])
    expect(out).toContain('DTSTAMP:20260201T100000Z')
    expect(out).toContain('LAST-MODIFIED:20260201T100000Z')
  })
})
