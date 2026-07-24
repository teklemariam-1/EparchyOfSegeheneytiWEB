/**
 * Map CMS documents to normalized CalendarEvents.
 *
 * Ge'ez recurrences are pre-expanded here rather than expressed as RRULEs:
 * an RRULE recurs by *Gregorian* rules, but ሚካኤል recurs on the 12th of each
 * *Ge'ez* month — only the imported day table knows which Gregorian date
 * that is. Every UID is derived from the Ge'ez date, never from titles, so
 * subscribed clients keep event identity across edits and re-imports.
 */

import type { GeezFeedDay, GeezMonthlyFeast, EventForFeed } from '@/lib/payload/queries'
import { GEEZ_MONTH_LABELS, type GeezMonth } from '@/lib/constants/geezMonths'
import { FIXED_SEASONS, type FixedSeason } from '@/lib/geez-liturgical'
import { CALENDAR_CONFIG, eventUid, localDateOf } from './config'
import type { CalendarEvent } from './ics'

const monthTi = (m: string): string => GEEZ_MONTH_LABELS[m as GeezMonth]?.ti ?? m

function calendarPageUrl(d: GeezFeedDay): string {
  return `${CALENDAR_CONFIG.siteUrl}/geez-calendar?year=${d.geezYear}&month=${d.month}`
}

/** Annual feast days: one all-day event per day row with a feast text. */
export function feastEvents(days: GeezFeedDay[]): CalendarEvent[] {
  return days
    .filter((d) => d.events)
    .map((d) => ({
      uid: eventUid(`geez-feast-${d.geezYear}-${d.month}-${d.day}`),
      title: d.events!,
      description: [d.geezLabel, d.readings && `ንባባት፡ ${d.readings}`]
        .filter(Boolean)
        .join('\n'),
      url: calendarPageUrl(d),
      start: d.gregorianDate,
      allDay: true,
      updatedAt: d.updatedAt,
    }))
}

/** Monthly commemorations expanded onto their day in every imported month. */
export function monthlyFeastEvents(
  days: GeezFeedDay[],
  monthlyFeasts: GeezMonthlyFeast[],
): CalendarEvent[] {
  const byDay = new Map<number, GeezMonthlyFeast>()
  for (const f of monthlyFeasts) byDay.set(f.day, f)
  return days
    // Monthly commemorations recur through the 12 regular months; ጳጉሜን is the
    // 5-6 day intercalary period, not a normal month, so a day-1..6 feast should
    // not also fire inside it.
    .filter((d) => byDay.has(d.day) && d.month !== 'paguemen')
    .map((d) => {
      const f = byDay.get(d.day)!
      return {
        uid: eventUid(`geez-monthly-${d.geezYear}-${d.month}-${d.day}`),
        title: f.name,
        description: d.geezLabel,
        url: calendarPageUrl(d),
        start: d.gregorianDate,
        allDay: true,
        updatedAt: d.updatedAt,
      }
    })
}

/** Fixed fasting windows resolved to Gregorian spans via the day table,
 *  one spanning all-day event per window per imported year. */
export function fastingSeasonEvents(days: GeezFeedDay[]): CalendarEvent[] {
  const byGeezDate = new Map<string, GeezFeedDay>()
  const years = new Set<number>()
  for (const d of days) {
    byGeezDate.set(`${d.geezYear}-${d.month}-${d.day}`, d)
    years.add(d.geezYear)
  }

  const events: CalendarEvent[] = []
  for (const year of [...years].sort()) {
    for (const s of FIXED_SEASONS.filter((s): s is FixedSeason => Boolean(s.fast))) {
      // A window may cross the month boundary but never the year boundary.
      const from = byGeezDate.get(`${year}-${s.from.month}-${s.from.day}`)
      const to = byGeezDate.get(`${year}-${s.to.month}-${s.to.day}`)
      if (!from || !to) continue
      events.push({
        uid: eventUid(`geez-fast-${year}-${s.from.month}-${s.from.day}`),
        title: s.ti,
        description: `${s.en} · ${monthTi(s.from.month)} ${s.from.day} – ${monthTi(s.to.month)} ${s.to.day} (${year} ዓ.ም.)`,
        url: `${CALENDAR_CONFIG.siteUrl}/geez-calendar?year=${year}&month=${s.from.month}`,
        start: from.gregorianDate,
        end: to.gregorianDate,
        allDay: true,
        updatedAt: from.updatedAt,
      })
    }
  }
  return events
}

/** An eparchy/parish event document as a CalendarEvent. */
export function eventDocToCalendarEvent(ev: EventForFeed): CalendarEvent {
  const location = [ev.locationName, ev.locationAddress].filter(Boolean).join(', ')
  return {
    uid: eventUid(`event-${ev.slug}`),
    title: ev.title,
    description: ev.excerpt,
    location: location || undefined,
    url: `${CALENDAR_CONFIG.siteUrl}/events/${ev.slug}`,
    // All-day dates are resolved in the eparchy's timezone (localDateOf), not a
    // raw UTC slice, so an event stored near the local-midnight boundary lands
    // on the correct day.
    start: ev.isAllDay ? localDateOf(ev.startDate) : ev.startDate,
    end: ev.endDate ? (ev.isAllDay ? localDateOf(ev.endDate) : ev.endDate) : undefined,
    allDay: Boolean(ev.isAllDay),
    cancelled: ev.isCancelled,
    updatedAt: ev.updatedAt,
  }
}
