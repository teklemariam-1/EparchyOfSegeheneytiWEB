import { getEventBySlug } from '@/lib/payload/queries'
import { eventDocToCalendarEvent } from '@/lib/calendar-sync/mappers'
import { buildICS } from '@/lib/calendar-sync/ics'
import { CALENDAR_CONFIG } from '@/lib/calendar-sync/config'
import { icsResponse } from '@/lib/calendar-sync/facade'

/**
 * Single-event ICS download: /api/calendar/event/<slug>.ics
 * Includes a 1-day-before display reminder (VALARM) — honored on downloaded
 * files, unlike subscribed feeds where clients apply their own defaults.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params
  const slug = raw.replace(/\.ics$/i, '')
  const ev = await getEventBySlug(slug)
  if (!ev) {
    return new Response('Event not found', { status: 404 })
  }

  const calendarEvent = {
    ...eventDocToCalendarEvent({
      slug,
      title: ev.title,
      startDate: ev.startDate,
      endDate: ev.endDate ?? undefined,
      isAllDay: ev.isAllDay ?? undefined,
      isCancelled: ev.isCancelled ?? undefined,
      excerpt: ev.excerpt ?? undefined,
      locationName: ev.location?.venue ?? undefined,
      locationAddress: ev.location?.address ?? undefined,
    }),
    alarmMinutesBefore: 24 * 60,
  }

  const body = buildICS(
    {
      name: `${ev.title} — ${CALENDAR_CONFIG.orgName}`,
      timeZone: CALENDAR_CONFIG.timeZone,
      prodId: CALENDAR_CONFIG.prodId,
    },
    [calendarEvent],
  )
  return icsResponse(body, `${slug}.ics`)
}
