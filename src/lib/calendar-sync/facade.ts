/**
 * Shared assembly for the public calendar JSON API (/api/calendar/*).
 *
 * One stable, app-friendly shape per day — the website widgets and the
 * mobile app consume this instead of raw Payload REST, so CMS internals
 * can change without breaking clients.
 */

import {
  getGeezDayByDate,
  getGeezMonthlyFeasts,
  getEventsInRange,
  type GeezCalendarDay,
} from '@/lib/payload/queries'
import { GEEZ_MONTH_LABELS, type GeezMonth } from '@/lib/constants/geezMonths'
import { fixedSeasonOf, toGeezNumeral } from '@/lib/geez-liturgical'
import { CALENDAR_CONFIG } from './config'

export interface CalendarDayPayload {
  gregorianDate: string
  geez: {
    label: string
    day: number
    dayGeez: string
    month: string
    monthLabel: { en: string; ti: string }
    year: number
  }
  feast: string | null
  monthlyFeast: { name: string; icon?: string } | null
  season: { en: string; ti: string } | null
  readings: string | null
  antiphon: string | null
  deceasedClergy: string | null
  events: Array<{ slug: string; title: string; url: string; isCancelled?: boolean }>
}

/** Today in the eparchy's timezone as yyyy-mm-dd. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CALENDAR_CONFIG.timeZone }).format(new Date())
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function nextIso(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
}

export function toDayPayload(
  d: GeezCalendarDay,
  monthlyByDay: Map<number, { name: string; icon?: string }>,
  events: Array<{ slug: string; title: string; isCancelled?: boolean }>,
): CalendarDayPayload {
  const monthly = monthlyByDay.get(d.day) ?? null
  return {
    gregorianDate: d.gregorianDate,
    geez: {
      label: d.geezLabel,
      day: d.day,
      dayGeez: toGeezNumeral(d.day),
      month: d.month,
      monthLabel: GEEZ_MONTH_LABELS[d.month as GeezMonth] ?? { en: d.month, ti: d.month },
      year: d.geezYear,
    },
    feast: d.events ?? null,
    monthlyFeast: monthly ? { name: monthly.name, icon: monthly.icon } : null,
    season: fixedSeasonOf(d.month, d.day),
    readings: d.readings ?? null,
    antiphon: d.antiphon ?? null,
    deceasedClergy: d.deceasedClergy ?? null,
    events: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      url: `${CALENDAR_CONFIG.siteUrl}/events/${e.slug}`,
      isCancelled: e.isCancelled,
    })),
  }
}

/** Full payload for one Gregorian date, or null when the date isn't imported. */
export async function dayPayload(iso: string): Promise<CalendarDayPayload | null> {
  const [day, monthlyFeasts, events] = await Promise.all([
    getGeezDayByDate(iso),
    getGeezMonthlyFeasts(),
    getEventsInRange(iso, nextIso(iso)),
  ])
  if (!day) return null
  const monthlyByDay = new Map(monthlyFeasts.map((f) => [f.day, f]))
  return toDayPayload(day, monthlyByDay, events)
}

const JSON_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600'
const ICS_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400'

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(status === 200 ? { 'Cache-Control': JSON_CACHE } : {}),
    },
  })
}

export function icsResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': ICS_CACHE,
    },
  })
}
