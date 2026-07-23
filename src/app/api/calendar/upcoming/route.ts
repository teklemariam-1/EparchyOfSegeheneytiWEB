import { getGeezCalendarDaysFrom, getGeezMonthlyFeasts } from '@/lib/payload/queries'
import { buildUpcoming } from '@/lib/calendar-sync/upcoming'
import { todayIso, jsonResponse } from '@/lib/calendar-sync/facade'

/**
 * Upcoming feasts and commemorations from today onward:
 * /api/calendar/upcoming?limit=8 (limit 1–50, default 8)
 */
export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get('limit'))
  const limit = Number.isInteger(raw) && raw >= 1 && raw <= 50 ? raw : 8

  const today = todayIso()
  const [days, monthlyFeasts] = await Promise.all([
    // Look ahead far enough to fill the limit even in feast-sparse stretches.
    getGeezCalendarDaysFrom(today, Math.max(62, limit * 8)),
    getGeezMonthlyFeasts(),
  ])
  return jsonResponse({
    today,
    items: buildUpcoming(days, monthlyFeasts, today, limit),
  })
}
