import { EPARCHY_TIME_ZONE } from './eventTime'

/**
 * Structured weekly Mass times, convertible to the viewer's clock.
 *
 * A Mass time is not an instant — it is "every Sunday at 07:30, Asmara time".
 * Converting that for a viewer abroad needs a concrete occurrence, and the
 * conversion can shift the WEEKDAY, which is the part people get wrong in
 * their heads: Sunday 02:00 in Asmara is still Saturday evening in Toronto.
 * The whole point of structuring these times is to surface that shift.
 *
 * ── The fixed +03:00 ─────────────────────────────────────────────────────────
 * Eritrea has observed UTC+3 with no daylight saving since 1959, and
 * Africa/Asmara has no transition rules. That makes "Asmara wall clock minus
 * three hours is UTC" exact, so a next-occurrence instant can be built by
 * arithmetic rather than by a zone-database search. The viewer's side is NOT
 * assumed fixed — their zone can have DST — so their rendering goes through
 * Intl with a real timezone, on a real date near now.
 */

const ASMARA_UTC_OFFSET_HOURS = 3

/** Matches the Parishes day select verbatim. */
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/

/** Validates the stored form: 24-hour "HH:MM". */
export function isValidTimeOfDay(value: unknown): boolean {
  return typeof value === 'string' && HHMM.test(value.trim())
}

/**
 * Best-effort parse of the free text staff have already entered — "9:00 AM",
 * "07.30", "17:00" — into "HH:MM". Returns null rather than guessing at
 * anything else ("after sunrise" stays free text, which is correct: it is a
 * real liturgical answer, not dirty data). Shared by the backfill migration
 * and admin validation so the two can never disagree about what parses.
 */
export function parseTimeOfDay(text: unknown): string | null {
  if (typeof text !== 'string') return null
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*([AaPp]\.?[Mm]\.?)?\s*$/.exec(text)
  if (!m) return null

  let hours = Number(m[1])
  const minutes = Number(m[2])
  const meridiem = m[3]?.toLowerCase()

  if (minutes > 59) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    if (meridiem.startsWith('p') && hours !== 12) hours += 12
    if (meridiem.startsWith('a') && hours === 12) hours = 0
  } else if (hours > 23) {
    return null
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * The next occurrence of `weekday` at `hhmm` Asmara time, as a real instant.
 *
 * "Near now" matters: the viewer's zone may observe DST, so converting a date
 * months away could show a time that is wrong THIS week. The next seven days
 * are the week the viewer is asking about.
 */
export function nextOccurrence(weekday: Weekday, hhmm: string, now: Date = new Date()): Date | null {
  const m = HHMM.exec(hhmm.trim())
  if (!m) return null
  const targetDow = WEEKDAYS.indexOf(weekday)
  if (targetDow === -1) return null

  const hours = Number(m[1])
  const minutes = Number(m[2])

  // Walk day by day from today (UTC calendar) and take the first date whose
  // ASMARA weekday matches and whose instant is still ahead. At most 8 steps.
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offset,
      hours - ASMARA_UTC_OFFSET_HOURS,
      minutes,
    ))
    // The subtraction can cross midnight, so derive the Asmara-side weekday
    // from the instant itself rather than from the loop date.
    const asmaraDow = new Date(candidate.getTime() + ASMARA_UTC_OFFSET_HOURS * 3_600_000).getUTCDay()
    if (asmaraDow === targetDow && candidate.getTime() > now.getTime()) return candidate
  }
  return null
}

export interface LocalMassTime {
  /** "HH:MM" on the viewer's clock. */
  time: string
  /** The viewer's weekday for that occurrence — may differ from the Asmara day. */
  weekday: string
  /** True when the conversion crossed midnight and the weekday moved. */
  dayShifted: boolean
}

/**
 * A weekly Mass time on the viewer's clock, weekday shift included.
 * Returns null for unparseable input or an unknown zone — the caller falls
 * back to showing the Asmara time alone, which is always true.
 */
export function localMassTime(
  weekday: Weekday,
  hhmm: string,
  viewerZone: string,
  now: Date = new Date(),
): LocalMassTime | null {
  const instant = nextOccurrence(weekday, hhmm, now)
  if (!instant) return null

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: viewerZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(instant)
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
    const localWeekday = get('weekday')
    const time = `${get('hour')}:${get('minute')}`
    if (!localWeekday || !HHMM.test(time)) return null

    return { time, weekday: localWeekday, dayShifted: localWeekday !== weekday }
  } catch {
    // Unknown zone string — fall back to the anchor time.
    return null
  }
}

/** Whether the viewer's zone shows the same wall clock as the eparchy. */
export function viewerSharesEparchyClock(viewerZone: string, now: Date = new Date()): boolean {
  try {
    const fmt = (zone: string) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now)
    return fmt(viewerZone) === fmt(EPARCHY_TIME_ZONE)
  } catch {
    return true // unknown zone: suppress the redundant suffix rather than crash
  }
}
