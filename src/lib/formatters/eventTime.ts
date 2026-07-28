import { CALENDAR_CONFIG } from '../calendar-sync/config'

/**
 * Event times, resolved in the eparchy's own timezone.
 *
 * The events on this site happen in Eritrea, but most of the people reading
 * about them do not live there. Two failures follow from that, and both were
 * live before this module existed:
 *
 *  1. `new Date(iso).getDate()` returns the day in whatever zone the code
 *     happens to run in — UTC on the server, the viewer's zone in the browser.
 *     A liturgy at 01:00 Asmara is 22:00 UTC the PREVIOUS day, so the date
 *     badge showed the wrong day, and showed a different wrong day depending on
 *     where the reader was.
 *  2. The ICS feed pins `Africa/Asmara` (calendar-sync/mappers), so the
 *     subscription and the website could name different days for one event.
 *
 * Everything here reads `CALENDAR_CONFIG.timeZone` — the same constant the feed
 * uses. That shared source is what makes the two agree by construction rather
 * than by two people remembering to keep them in step.
 */

/** The zone the eparchy lives in. Re-exported so callers need not know where it lives. */
export const EPARCHY_TIME_ZONE = CALENDAR_CONFIG.timeZone

/** Locale used when the caller has none — matches the site's default. */
const FALLBACK_LOCALE = 'en'

function safeDate(iso: string): Date | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Date parts as they read in a given zone.
 *
 * Returned as strings straight from `formatToParts` rather than as numbers,
 * because the point is to display them: converting to a number and back would
 * discard the locale's own digits.
 */
export function dateParts(
  iso: string,
  locale: string = FALLBACK_LOCALE,
  timeZone: string = EPARCHY_TIME_ZONE,
): { day: string; month: string; year: string } | null {
  const date = safeDate(iso)
  if (!date) return null
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).formatToParts(date)
    const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
    return { day: get('day'), month: get('month'), year: get('year') }
  } catch {
    return null
  }
}

/** Clock time in a zone, e.g. "18:00". 24-hour, which is how service times are published. */
export function timeInZone(
  iso: string,
  locale: string = FALLBACK_LOCALE,
  timeZone: string = EPARCHY_TIME_ZONE,
): string {
  const date = safeDate(iso)
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return ''
  }
}

/**
 * The calendar day in a zone, as `YYYY-MM-DD`.
 *
 * Deliberately the same shape and the same mechanism as `localDateOf` in the
 * calendar-sync config: comparing this to the feed's value is how the tests
 * prove the page and the subscription agree.
 */
export function dayInZone(iso: string, timeZone: string = EPARCHY_TIME_ZONE): string {
  const date = safeDate(iso)
  if (!date) return ''
  try {
    // en-CA yields ISO-ordered YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
  } catch {
    return ''
  }
}

/**
 * The viewer's own timezone, or the eparchy's if it cannot be determined.
 *
 * Only meaningful in a browser. On the server this always returns the eparchy
 * zone, which is what keeps server and client output identical on first render
 * — see EventTime for why that matters.
 */
export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || EPARCHY_TIME_ZONE
  } catch {
    return EPARCHY_TIME_ZONE
  }
}

/**
 * Whether a viewer in `timeZone` would see this instant as a different wall
 * clock than someone in Asmara.
 *
 * Compares the rendered time rather than the zone NAME: `Africa/Nairobi` is a
 * different identifier from `Africa/Asmara` but the same UTC+3 offset, and
 * telling that reader "18:00 Asmara · 18:00 your time" is noise.
 */
export function differsFromEparchy(iso: string, timeZone: string): boolean {
  if (!timeZone || timeZone === EPARCHY_TIME_ZONE) return false
  const here = `${dayInZone(iso, EPARCHY_TIME_ZONE)} ${timeInZone(iso, FALLBACK_LOCALE, EPARCHY_TIME_ZONE)}`
  const there = `${dayInZone(iso, timeZone)} ${timeInZone(iso, FALLBACK_LOCALE, timeZone)}`
  return here !== there && there.trim() !== ''
}

/**
 * `true` when an event should be shown as a whole day with no clock time.
 *
 * All-day events carry no meaningful instant, so they must never be converted
 * to a viewer's zone — doing so is what shifts "Fasika, 12 April" to the 11th
 * for readers west of Asmara. This repo has fixed that bug once already on the
 * feed side; the rule is the same here.
 */
export function isAllDayEvent(event: { isAllDay?: boolean | null }): boolean {
  return Boolean(event.isAllDay)
}
