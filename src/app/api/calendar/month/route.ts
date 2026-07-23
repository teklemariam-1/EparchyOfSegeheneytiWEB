import {
  getGeezCalendarDays,
  getGeezAvailableYears,
  getGeezMonthlyFeasts,
  getEventsInRange,
} from '@/lib/payload/queries'
import { GEEZ_MONTHS, type GeezMonth } from '@/lib/constants/geezMonths'
import { toDayPayload, jsonResponse } from '@/lib/calendar-sync/facade'
import { eventsByDate } from '@/lib/calendar-sync/upcoming'

function nextIso(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
}

/**
 * A full Ge'ez month: /api/calendar/month?year=2018&month=meskerem
 * Returns every day of the month in the façade day shape.
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const year = Number(searchParams.get('year'))
  const month = searchParams.get('month') as GeezMonth | null

  const years = await getGeezAvailableYears()
  if (!years.includes(year)) {
    return jsonResponse({ error: 'Unknown year', availableYears: years }, 400)
  }
  if (!month || !GEEZ_MONTHS.includes(month)) {
    return jsonResponse({ error: 'Unknown month', months: GEEZ_MONTHS }, 400)
  }

  const [days, monthlyFeasts] = await Promise.all([
    getGeezCalendarDays(year),
    getGeezMonthlyFeasts(),
  ])
  const monthDays = days.filter((d) => d.month === month).sort((a, b) => a.day - b.day)
  if (monthDays.length === 0) {
    return jsonResponse({ error: 'No data for this month', year, month }, 404)
  }

  const first = monthDays[0]!
  const last = monthDays[monthDays.length - 1]!
  const events = await getEventsInRange(first.gregorianDate, nextIso(last.gregorianDate))
  const byDate = eventsByDate(events, first.gregorianDate, last.gregorianDate)
  const monthlyByDay = new Map(monthlyFeasts.map((f) => [f.day, f]))

  return jsonResponse({
    year,
    month,
    days: monthDays.map((d) => toDayPayload(d, monthlyByDay, byDate[d.gregorianDate] ?? [])),
  })
}
