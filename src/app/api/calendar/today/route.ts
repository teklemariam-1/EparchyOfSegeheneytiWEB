import { dayPayload, todayIso, jsonResponse } from '@/lib/calendar-sync/facade'

/** Today's liturgical day (Africa/Asmara) as stable JSON. */
export async function GET() {
  const iso = todayIso()
  const day = await dayPayload(iso)
  if (!day) {
    return jsonResponse({ error: 'No calendar data for this date', gregorianDate: iso }, 404)
  }
  return jsonResponse(day)
}
