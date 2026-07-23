import { getFeed } from '@/lib/calendar-sync/feeds'
import { buildICS } from '@/lib/calendar-sync/ics'
import { CALENDAR_CONFIG } from '@/lib/calendar-sync/config'
import { icsResponse } from '@/lib/calendar-sync/facade'

/**
 * Subscribable ICS feeds: /api/calendar/<feed-id>.ics
 * Feed ids come from the registry (lib/calendar-sync/feeds.ts) and are
 * permanent — subscribed clients poll these URLs for years.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ feed: string }> },
) {
  const { feed } = await params
  const id = feed.replace(/\.ics$/i, '')
  const def = getFeed(id)
  if (!def) {
    return new Response('Unknown calendar feed', { status: 404 })
  }

  const searchParams = new URL(request.url).searchParams
  const parish = def.supportsParish ? (searchParams.get('parish') ?? undefined) : undefined

  const events = await def.build({ parish })
  const body = buildICS(
    {
      name: `${def.title.en} — ${CALENDAR_CONFIG.orgName}`,
      description: def.description.en,
      timeZone: CALENDAR_CONFIG.timeZone,
      prodId: CALENDAR_CONFIG.prodId,
    },
    events,
  )
  return icsResponse(body, `${id}.ics`)
}
