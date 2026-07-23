import { dayPayload, isIsoDate, jsonResponse } from '@/lib/calendar-sync/facade'

/** One liturgical day by Gregorian date: /api/calendar/date/2026-01-07 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params
  if (!isIsoDate(date)) {
    return jsonResponse({ error: 'Invalid date — expected yyyy-mm-dd' }, 400)
  }
  const day = await dayPayload(date)
  if (!day) {
    return jsonResponse({ error: 'No calendar data for this date', gregorianDate: date }, 404)
  }
  return jsonResponse(day)
}
