/**
 * Pure calendar-sync helpers shared by the Ge'ez calendar page, widgets and
 * (later) the ICS feeds. Everything here is provider- and framework-agnostic.
 */

import type { GeezCalendarDay, GeezMonthlyFeast, EventInRange } from '@/lib/payload/queries'
import { daysBetween } from '@/lib/geez-liturgical'
import { localDateOf } from './config'

export interface UpcomingItem {
  key: string
  icon: string
  name: string
  geezLabel: string
  gregorianDate: string
  daysLeft: number
}

/** Next feast occurrences (annual feast days + monthly commemorations),
 *  chronological from `today` (yyyy-mm-dd). `days` may span year boundaries. */
export function buildUpcoming(
  days: GeezCalendarDay[],
  monthlyFeasts: GeezMonthlyFeast[],
  today: string,
  limit = 8,
): UpcomingItem[] {
  const byDay = new Map<number, GeezMonthlyFeast>()
  for (const f of monthlyFeasts) byDay.set(f.day, f)

  const items: UpcomingItem[] = []
  for (const d of [...days].sort((a, b) => (a.gregorianDate < b.gregorianDate ? -1 : 1))) {
    if (d.gregorianDate < today) continue
    const daysLeft = daysBetween(today, d.gregorianDate)
    if (d.events) {
      items.push({
        key: `${d.id}-annual`,
        icon: '🎉',
        name: d.events,
        geezLabel: d.geezLabel,
        gregorianDate: d.gregorianDate,
        daysLeft,
      })
    }
    const monthly = byDay.get(d.day)
    if (monthly) {
      items.push({
        key: `${d.id}-monthly`,
        icon: monthly.icon ?? '✝',
        name: monthly.name,
        geezLabel: d.geezLabel,
        gregorianDate: d.gregorianDate,
        daysLeft,
      })
    }
    if (items.length >= limit * 2) break
  }
  return items.slice(0, limit)
}

/** Reference to an event shown on a calendar day cell. */
export interface DayEventRef {
  slug: string
  title: string
  isCancelled?: boolean
}

/**
 * Expand events (possibly multi-day) into a yyyy-mm-dd → events map, clamped
 * to [fromIso, toIso]. Days are resolved in the eparchy's timezone (localDateOf)
 * so an instant near local midnight isn't placed a day early; an event running
 * to 14:00 on its last day still appears on that day.
 */
export function eventsByDate(
  events: EventInRange[],
  fromIso: string,
  toIso: string,
): Record<string, DayEventRef[]> {
  const map: Record<string, DayEventRef[]> = {}
  for (const ev of events) {
    const start = localDateOf(ev.startDate)
    const end = localDateOf(ev.endDate ?? ev.startDate)
    let day = start < fromIso ? fromIso : start
    const last = end > toIso ? toIso : end
    while (day <= last) {
      ;(map[day] ??= []).push({ slug: ev.slug, title: ev.title, isCancelled: ev.isCancelled })
      day = new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
    }
  }
  return map
}
