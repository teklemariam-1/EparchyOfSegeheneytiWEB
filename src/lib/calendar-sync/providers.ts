/**
 * Subscribe/add links for external calendar clients.
 *
 * In a stateless-ICS architecture this is the entire "provider layer":
 * every client consumes the same feed URL and only the link format varies.
 * (Samsung Calendar has no integration surface of its own — it syncs the
 * Google/Exchange account on the device, so the Google link covers it.)
 *
 * Pure string builders — safe to import from client components.
 */

/** https feed URL → webcal:// (Apple Calendar, Outlook desktop). */
export function webcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://')
}

/** Google Calendar "add by URL" deep link (must be opened on the web). */
export function googleSubscribeUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(feedUrl))}`
}

/** Outlook.com "subscribe" deep link. */
export function outlookSubscribeUrl(feedUrl: string, name: string): string {
  const params = new URLSearchParams({ url: feedUrl, name })
  return `https://outlook.live.com/calendar/0/addfromweb?${params.toString()}`
}

export interface TemplateEvent {
  title: string
  /** All-day: yyyy-mm-dd. Timed: ISO datetime. */
  start: string
  /** All-day: inclusive last day. Timed: ISO end datetime. */
  end?: string
  allDay: boolean
  description?: string
  location?: string
}

function googleDates(ev: TemplateEvent): string {
  if (ev.allDay) {
    const startBasic = ev.start.slice(0, 10).replace(/-/g, '')
    // Google's all-day range end is exclusive, like DTEND.
    const endExclusive = new Date(
      Date.parse(`${(ev.end ?? ev.start).slice(0, 10)}T00:00:00Z`) + 86_400_000,
    )
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')
    return `${startBasic}/${endExclusive}`
  }
  const toBasic = (iso: string) =>
    new Date(iso).toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
  // A timed event without an end still needs a range; default to +1 hour.
  const end = ev.end ?? new Date(Date.parse(ev.start) + 3_600_000).toISOString()
  return `${toBasic(ev.start)}/${toBasic(end)}`
}

/** One-click "Add to Google Calendar" template link for a single event. */
export function googleEventUrl(ev: TemplateEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: googleDates(ev),
  })
  if (ev.description) params.set('details', ev.description)
  if (ev.location) params.set('location', ev.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
