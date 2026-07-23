import { googleEventUrl, type TemplateEvent } from '@/lib/calendar-sync/providers'

/**
 * "Add to Google Calendar" + ".ics download" row for a single event.
 * Pure links — renders on the server, no client JS.
 */
export function AddToCalendar({
  event,
  icsHref,
  labels,
}: {
  event: TemplateEvent
  /** Path to the per-event .ics download, e.g. /api/calendar/event/foo.ics */
  icsHref: string
  labels: { google: string; ics: string }
}) {
  const pill =
    'inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-600 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800 dark:text-charcoal-200 dark:border-charcoal-600'
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <a href={googleEventUrl(event)} target="_blank" rel="noopener noreferrer" className={pill}>
        <span aria-hidden="true">📅</span> {labels.google}
      </a>
      <a href={icsHref} className={pill} download>
        <span aria-hidden="true">⬇</span> {labels.ics}
      </a>
    </div>
  )
}
