/**
 * Minimal RFC 5545 iCalendar generator.
 *
 * Deliberately dependency-free and source-agnostic: it takes normalized
 * `CalendarEvent` objects and knows nothing about feasts, parishes or
 * Payload. All feed and export routes share this one serializer.
 *
 * Scope: PUBLISH-only calendars of all-day and UTC-timed events — no
 * RRULEs (Ge'ez recurrences are pre-expanded from the day table, see
 * mappers.ts) and no VTIMEZONE (timed events are emitted in UTC `Z` form,
 * which every consumer converts to local time).
 */

export interface CalendarEvent {
  /** Stable unique id (use eventUid()); clients dedupe by this across polls. */
  uid: string
  title: string
  description?: string
  location?: string
  /** Absolute URL back to the website. */
  url?: string
  /** All-day: yyyy-mm-dd. Timed: ISO datetime (any zone; emitted as UTC). */
  start: string
  /** All-day: inclusive last day (yyyy-mm-dd). Timed: ISO end datetime. */
  end?: string
  allDay: boolean
  cancelled?: boolean
  /** ISO datetime for DTSTAMP/LAST-MODIFIED; keeps output deterministic. */
  updatedAt?: string
  /** Emit a display VALARM this many minutes before start (single-event
   *  downloads only — subscribed feeds get client-side default reminders). */
  alarmMinutesBefore?: number
}

export interface CalendarMeta {
  /** Calendar display name (X-WR-CALNAME). */
  name: string
  description?: string
  timeZone: string
  prodId: string
}

/** RFC 5545 §3.3.11 TEXT escaping. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Fold a content line to lines of at most 75 octets (RFC 5545 §3.1),
 * breaking on UTF-8 character boundaries — Ge'ez characters are 3 octets
 * each, so folding must count bytes, not characters.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const out: string[] = []
  let current = ''
  let currentBytes = 0
  // Continuation lines start with a space, leaving 74 octets of payload.
  let budget = 75
  for (const ch of line) {
    const chBytes = encoder.encode(ch).length
    if (currentBytes + chBytes > budget) {
      out.push(current)
      current = ' '
      currentBytes = 1
      budget = 75
    }
    current += ch
    currentBytes += chBytes
  }
  if (current) out.push(current)
  return out.join('\r\n')
}

/** yyyy-mm-dd → YYYYMMDD. */
function dateBasic(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '')
}

/** ISO datetime → UTC basic format YYYYMMDDTHHMMSSZ. */
function dateTimeUtc(iso: string): string {
  const d = new Date(iso)
  return (
    d.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
  ).replace('T', 'T')
}

/** yyyy-mm-dd plus n days, as YYYYMMDD. */
function datePlusDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')
}

const FALLBACK_STAMP = '20260101T000000Z'

function eventLines(ev: CalendarEvent): string[] {
  const stamp = ev.updatedAt ? dateTimeUtc(ev.updatedAt) : FALLBACK_STAMP
  const lines = ['BEGIN:VEVENT', `UID:${escapeText(ev.uid)}`, `DTSTAMP:${stamp}`]

  if (ev.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateBasic(ev.start)}`)
    // DTEND is exclusive: the day after the (inclusive) last day.
    lines.push(`DTEND;VALUE=DATE:${datePlusDays(ev.end ?? ev.start, 1)}`)
  } else {
    lines.push(`DTSTART:${dateTimeUtc(ev.start)}`)
    if (ev.end) lines.push(`DTEND:${dateTimeUtc(ev.end)}`)
  }

  lines.push(`SUMMARY:${escapeText(ev.title)}`)
  if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
  if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
  if (ev.url) lines.push(`URL:${escapeText(ev.url)}`)
  if (ev.updatedAt) lines.push(`LAST-MODIFIED:${stamp}`)
  lines.push(`STATUS:${ev.cancelled ? 'CANCELLED' : 'CONFIRMED'}`)
  if (ev.alarmMinutesBefore && ev.alarmMinutesBefore > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(ev.title)}`,
      `TRIGGER:-PT${Math.round(ev.alarmMinutesBefore)}M`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/** Serialize a complete iCalendar document (CRLF line endings, folded). */
export function buildICS(meta: CalendarMeta, events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${meta.prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(meta.name)}`,
    ...(meta.description ? [`X-WR-CALDESC:${escapeText(meta.description)}`] : []),
    `X-WR-TIMEZONE:${meta.timeZone}`,
    ...events.flatMap(eventLines),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
