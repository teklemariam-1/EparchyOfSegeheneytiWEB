'use client'

/**
 * Interactive Ge'ez month calendar: a 7-column grid of the month's 30 days
 * aligned by Gregorian weekday, with a Day Details panel that updates
 * instantly on selection. Feast days, Sundays, today and the selected day
 * are visually distinguished. Dark-theme styles are included (class strategy).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { GeezCalendarDay, GeezMonthlyFeast } from '@/lib/payload/queries'
import type { DayEventRef } from '@/lib/calendar-sync/upcoming'
import { googleEventUrl } from '@/lib/calendar-sync/providers'
import { toGeezNumeral, weekdayOf, fixedSeasonOf } from '@/lib/geez-liturgical'
import { cn } from '@/lib/utils'

export interface CalendarLabels {
  today: string
  feast: string
  readings: string
  antiphon: string
  deceasedClergy: string
  monthlyFeast: string
  season: string
  noEntries: string
  gregorian: string
  events: string
  addToCalendar: string
}

const WEEKDAYS = [
  { en: 'Sun', ti: 'ሰን' },
  { en: 'Mon', ti: 'ሰኑ' },
  { en: 'Tue', ti: 'ሰሉ' },
  { en: 'Wed', ti: 'ረቡ' },
  { en: 'Thu', ti: 'ሓሙ' },
  { en: 'Fri', ti: 'ዓር' },
  { en: 'Sat', ti: 'ቀዳ' },
]

function formatGregorianLong(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00`))
}

export function GeezCalendarView({
  monthDays,
  monthlyFeasts,
  todayIso,
  labels,
  eventsByDate = {},
}: {
  monthDays: GeezCalendarDay[]
  monthlyFeasts: GeezMonthlyFeast[]
  todayIso: string
  labels: CalendarLabels
  /** yyyy-mm-dd → eparchy events on that day (multi-day events repeated). */
  eventsByDate?: Record<string, DayEventRef[]>
}) {
  const days = useMemo(() => [...monthDays].sort((a, b) => a.day - b.day), [monthDays])
  const feastsByDay = useMemo(() => {
    const m = new Map<number, GeezMonthlyFeast>()
    for (const f of monthlyFeasts) m.set(f.day, f)
    return m
  }, [monthlyFeasts])

  const todayInMonth = days.find((d) => d.gregorianDate === todayIso)
  const [selectedId, setSelectedId] = useState<string | null>(todayInMonth?.id ?? days[0]?.id ?? null)
  const selected = days.find((d) => d.id === selectedId) ?? days[0]

  if (days.length === 0) {
    return <p className="text-sm text-charcoal-400 italic dark:text-charcoal-300">{labels.noEntries}</p>
  }

  const leadingBlanks = weekdayOf(days[0]!.gregorianDate)
  const season = selected ? fixedSeasonOf(selected.month, selected.day) : null
  const selectedMonthly = selected ? feastsByDay.get(selected.day) : undefined

  return (
    <div>
      {/* ── Month grid ─────────────────────────────────────────────── */}
      <div
        key={days[0]!.gregorianDate}
        className="animate-fade-in rounded-2xl border border-charcoal-100 bg-white p-3 sm:p-4 shadow-soft dark:bg-charcoal-900 dark:border-charcoal-700"
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w.en}
              className={cn(
                'pb-2 text-center text-[11px] sm:text-xs font-semibold uppercase tracking-wider',
                i === 0 ? 'text-maroon-700 dark:text-maroon-400' : 'text-charcoal-400 dark:text-charcoal-300',
              )}
            >
              <span className="hidden sm:inline">{w.en}</span>
              <span className="sm:hidden font-geez normal-case">{w.ti}</span>
            </div>
          ))}

          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} aria-hidden="true" />
          ))}

          {days.map((d) => {
            const isToday = d.gregorianDate === todayIso
            const isSelected = d.id === selected?.id
            const isSunday = weekdayOf(d.gregorianDate) === 0
            const hasFeast = Boolean(d.events)
            const monthly = feastsByDay.get(d.day)
            const dayEvents = eventsByDate[d.gregorianDate]
            const gregDay = Number(d.gregorianDate.slice(8, 10))
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                aria-pressed={isSelected}
                aria-label={`${d.geezLabel} — ${formatGregorianLong(d.gregorianDate)}`}
                className={cn(
                  'relative flex min-h-[3.4rem] sm:min-h-[4.2rem] flex-col items-center justify-start rounded-xl border p-1 sm:p-1.5 text-center transition-all duration-200 ease-out',
                  'hover:scale-[1.04] hover:shadow-md focus-visible:ring-2 focus-visible:ring-maroon-600 focus-visible:outline-none',
                  isSelected
                    ? 'border-maroon-700 bg-maroon-800 text-white shadow-md scale-[1.02] dark:bg-maroon-700 dark:border-maroon-500'
                    : hasFeast
                      ? 'border-gold-300 bg-gold-50 dark:bg-gold-950 dark:border-gold-800'
                      : 'border-charcoal-100 bg-white hover:border-maroon-200 dark:bg-charcoal-800 dark:border-charcoal-700',
                  isToday && !isSelected && 'ring-2 ring-maroon-500',
                )}
              >
                <span
                  className={cn(
                    'font-geez text-base sm:text-lg font-bold leading-tight',
                    isSelected
                      ? 'text-white'
                      : isSunday
                        ? 'text-maroon-700 dark:text-maroon-400'
                        : 'text-charcoal-800 dark:text-charcoal-100',
                  )}
                >
                  {toGeezNumeral(d.day)}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    isSelected ? 'text-maroon-200' : 'text-charcoal-400 dark:text-charcoal-300',
                  )}
                >
                  {gregDay}
                </span>
                <span className="mt-auto flex items-center gap-0.5 text-[10px] leading-none pb-0.5">
                  {hasFeast && (
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-gold-300' : 'bg-gold-500')}
                      aria-hidden="true"
                    />
                  )}
                  {dayEvents && dayEvents.length > 0 && (
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-maroon-600')}
                      aria-hidden="true"
                    />
                  )}
                  {monthly && <span aria-hidden="true">{monthly.icon ?? '✝'}</span>}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-charcoal-100 pt-3 text-[11px] text-charcoal-500 dark:border-charcoal-700 dark:text-charcoal-300">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-maroon-500" /> {labels.today}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {labels.feast}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-maroon-600" /> {labels.events}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">✝</span> {labels.monthlyFeast}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-maroon-700 dark:text-maroon-400">S</span> Sunday
          </span>
        </div>
      </div>

      {/* ── Day details ────────────────────────────────────────────── */}
      {selected && (
        <div
          key={selected.id}
          className="animate-fade-in mt-6 rounded-2xl border border-gold-300 bg-white p-5 sm:p-6 shadow-soft dark:bg-charcoal-900 dark:border-gold-700"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-geez text-xl sm:text-2xl font-bold text-charcoal-900 dark:text-white">
              {selected.geezLabel}
            </h3>
            <span className="text-sm text-charcoal-500 dark:text-charcoal-300">
              {formatGregorianLong(selected.gregorianDate)}
            </span>
            {selected.gregorianDate === todayIso && (
              <span className="rounded-full bg-maroon-800 px-2.5 py-0.5 text-xs font-medium text-white">
                {labels.today}
              </span>
            )}
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            {selected.events && (
              <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 dark:bg-gold-950 dark:border-gold-800">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gold-800 dark:text-gold-300">
                  🎉 {labels.feast}
                </dt>
                <dd className="mt-1 font-geez font-medium text-gold-900 leading-relaxed dark:text-gold-100">
                  {selected.events}
                </dd>
                <a
                  href={googleEventUrl({
                    title: selected.events,
                    start: selected.gregorianDate,
                    allDay: true,
                    description: selected.geezLabel,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-800 hover:text-gold-900 hover:underline dark:text-gold-300"
                >
                  <span aria-hidden="true">📅</span> {labels.addToCalendar}
                </a>
              </div>
            )}

            {(eventsByDate[selected.gregorianDate]?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-maroon-50 border border-maroon-100 p-3 dark:bg-charcoal-800 dark:border-maroon-800">
                <dt className="text-xs font-semibold uppercase tracking-wider text-maroon-800 dark:text-maroon-300">
                  📅 {labels.events}
                </dt>
                <dd className="mt-1">
                  <ul className="space-y-1">
                    {eventsByDate[selected.gregorianDate]!.map((ev) => (
                      <li key={ev.slug}>
                        <Link
                          href={`/events/${ev.slug}`}
                          className={cn(
                            'text-sm font-medium text-maroon-800 hover:text-maroon-900 hover:underline transition-colors dark:text-maroon-300',
                            ev.isCancelled && 'line-through opacity-60',
                          )}
                        >
                          {ev.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}

            {selectedMonthly && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  {selectedMonthly.icon ?? '✝'} {labels.monthlyFeast}
                </dt>
                <dd className="mt-0.5 font-geez text-charcoal-700 leading-relaxed dark:text-charcoal-100">
                  {selectedMonthly.name}
                </dd>
              </div>
            )}

            {season && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  {labels.season}
                </dt>
                <dd className="mt-0.5 font-geez text-charcoal-700 leading-relaxed dark:text-charcoal-100">
                  {season.ti} <span className="text-charcoal-400 dark:text-charcoal-300">· {season.en}</span>
                </dd>
              </div>
            )}

            {selected.readings && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  📖 {labels.readings}
                </dt>
                <dd className="mt-0.5 font-geez text-charcoal-700 leading-relaxed dark:text-charcoal-100">
                  {selected.readings}
                </dd>
              </div>
            )}

            {selected.antiphon && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  {labels.antiphon}
                </dt>
                <dd className="mt-0.5 border-l-2 border-gold-300 pl-3 font-geez italic text-charcoal-700 leading-relaxed dark:text-charcoal-100">
                  {selected.antiphon}
                </dd>
              </div>
            )}

            {selected.deceasedClergy && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  ✝ {labels.deceasedClergy}
                </dt>
                <dd className="mt-0.5 font-geez text-charcoal-700 leading-relaxed dark:text-charcoal-100">
                  {selected.deceasedClergy}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
