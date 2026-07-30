'use client'

import { useEffect, useState } from 'react'
import {
  EPARCHY_TIME_ZONE,
  differsFromEparchy,
  timeInZone,
  viewerTimeZone,
} from '@/lib/formatters/eventTime'

/**
 * An event's time, anchored in the eparchy's zone and — for a reader elsewhere
 * — followed by their own.
 *
 * ── Why this is a client component, and why it renders in two passes ─────────
 * The viewer's timezone only exists in the browser. Rendering it on the server
 * is impossible, and rendering a GUESS produces a hydration mismatch: the
 * server would emit one string and the browser another for the same node.
 *
 * So the first paint — server and client alike — is the Asmara time alone,
 * which is identical everywhere and therefore hydrates cleanly. The local
 * equivalent is appended only after mount, once `viewerTimeZone()` can actually
 * be read. A reader in Asmara, or anywhere sharing its clock, never sees a
 * redundant "· 18:00 your time".
 *
 * All-day events are not rendered here at all: they carry no meaningful
 * instant, and converting one to a reader's zone is what moves a feast to the
 * wrong date. The caller checks `isAllDay` first.
 */

interface EventTimeProps {
  /** ISO instant of the event's start. */
  iso: string
  locale: string
  /**
   * Translated TEMPLATES with a literal `{time}` placeholder, e.g.
   * "{time} Asmara". Client components can only receive serializable props —
   * the previous function props ((time) => string) crashed every event detail
   * page with "Functions cannot be passed directly to Client Components".
   */
  anchorTemplate: string
  /** Translated: the reader's own time, e.g. "{time} your time". */
  viewerTemplate: string
  className?: string
}

const fill = (template: string, time: string) => template.replace('{time}', time)

export function EventTime({ iso, locale, anchorTemplate, viewerTemplate, className }: EventTimeProps) {
  const [localTime, setLocalTime] = useState<string | null>(null)

  useEffect(() => {
    const zone = viewerTimeZone()
    // Only worth showing when it actually differs — compared on the rendered
    // clock, not the zone name, so Africa/Nairobi (same offset) stays quiet.
    if (!differsFromEparchy(iso, zone)) return
    setLocalTime(timeInZone(iso, locale, zone))
  }, [iso, locale])

  const anchor = timeInZone(iso, locale, EPARCHY_TIME_ZONE)
  if (!anchor) return null

  return (
    <span className={className}>
      {/* `dateTime` carries the unambiguous instant for machines and for
          copy-paste into a calendar, whatever the visible text says. */}
      <time dateTime={iso}>{fill(anchorTemplate, anchor)}</time>
      {localTime ? <> · {fill(viewerTemplate, localTime)}</> : null}
    </span>
  )
}
