'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { viewerTimeZone } from '@/lib/formatters/eventTime'
import {
  localMassTime,
  viewerSharesEparchyClock,
  type Weekday,
  WEEKDAYS,
} from '@/lib/formatters/massTime'

/**
 * The parish Mass schedule, convertible to the viewer's clock.
 *
 * The row a diaspora viewer actually needs is the second line: "Sunday 02:00"
 * in Asmara is Saturday evening in Toronto, and showing the shifted WEEKDAY is
 * the whole point of structuring these times — a bare time conversion would
 * quietly tell them the wrong day.
 *
 * Same two-pass strategy as EventTime, for the same reason: the viewer's zone
 * exists only in the browser, so the first paint (server and client alike) is
 * the Asmara schedule, which is true everywhere and hydrates cleanly. Local
 * equivalents appear after mount. Rows with only free text ("after sunrise")
 * render that text unconverted — it is a real liturgical answer, not dirty data.
 */

export interface MassTimeRow {
  day?: string | null
  startTime?: string | null
  time?: string | null
  language?: string | null
  notes?: string | null
}

interface MassTimesTableProps {
  rows: MassTimeRow[]
  labels: {
    day: string
    time: string
    language: string
    /** e.g. "{weekday} {time} your time" — assembled here, translated by the caller. */
    yourTimeSuffix: string
  }
}

function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'string' && (WEEKDAYS as readonly string[]).includes(value)
}

export function MassTimesTable({ rows, labels }: MassTimesTableProps) {
  const [zone, setZone] = useState<string | null>(null)

  useEffect(() => {
    const viewer = viewerTimeZone()
    // A viewer on the Asmara clock gets no redundant "· your time" suffix.
    if (viewer && !viewerSharesEparchyClock(viewer)) setZone(viewer)
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-100">
      <table className="w-full text-sm">
        <thead className="bg-maroon-800 text-white">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{labels.day}</th>
            <th className="px-4 py-3 text-left font-medium">{labels.time}</th>
            <th className="px-4 py-3 text-left font-medium">{labels.language}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal-100">
          {rows.map((row, i) => {
            const local =
              zone && row.startTime && isWeekday(row.day)
                ? localMassTime(row.day, row.startTime, zone)
                : null
            return (
              <tr key={i} className="transition-colors hover:bg-parchment-50">
                <td className="px-4 py-3 font-medium text-charcoal-800">{row.day}</td>
                <td className="px-4 py-3 text-charcoal-700">
                  {/* Anchor first, always true; the structured form wins when set. */}
                  <span>{row.startTime ?? row.time ?? ''}</span>
                  {row.time && row.startTime && row.time !== row.startTime && (
                    <span className="ml-1 text-xs text-charcoal-400">({row.time})</span>
                  )}
                  {local && (
                    <span className="mt-0.5 block text-xs text-maroon-700">
                      {labels.yourTimeSuffix
                        .replace('{weekday}', local.dayShifted ? local.weekday : '')
                        .replace('{time}', local.time)
                        .replace(/\s+/g, ' ')
                        .trim()}
                    </span>
                  )}
                  {row.notes && <span className="mt-0.5 block text-xs text-charcoal-400">{row.notes}</span>}
                </td>
                <td className="px-4 py-3">
                  {row.language && (
                    <Badge variant="neutral" size="sm">
                      {row.language}
                    </Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
