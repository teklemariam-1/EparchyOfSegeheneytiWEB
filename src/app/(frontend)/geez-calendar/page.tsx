import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS, type GeezMonth } from '@/lib/constants/geezMonths'
import { getTranslations } from 'next-intl/server'
import {
  getGeezCalendarDays,
  getGeezCalendarDaysFrom,
  getGeezCalendarEntries,
  getGeezMonthlyFeasts,
  getGeezAvailableYears,
  getGeezDayByDate,
  getEventsInRange,
} from '@/lib/payload/queries'
import { GeezCalendarView } from '@/features/calendar/GeezCalendarView'
import { buildUpcoming, eventsByDate } from '@/lib/calendar-sync/upcoming'
import { toGeezNumeral } from '@/lib/geez-liturgical'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: "Ge'ez Calendar",
  description:
    "The daily Ge'ez liturgical calendar of the Catholic Eparchy of Segeneyti — monthly view with feasts, readings, antiphons and commemorations, with corresponding Gregorian dates.",
  path: '/geez-calendar',
})

/** Today in the eparchy's timezone as yyyy-mm-dd. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Asmara' }).format(new Date())
}

function formatGregorianShort(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  )
}

/** Next Gregorian day after an ISO date (yyyy-mm-dd). */
function nextIso(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
}

export default async function GeezCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const { month: monthParam, year: yearParam } = await searchParams
  const today = todayIso()

  const [years, todayEntry, monthlyFeasts, feasts, upcomingDays, t] = await Promise.all([
    getGeezAvailableYears(),
    getGeezDayByDate(today),
    getGeezMonthlyFeasts(),
    getGeezCalendarEntries(),
    getGeezCalendarDaysFrom(today, 62),
    getTranslations('calendar'),
  ])

  // Selected year: URL param → today's Ge'ez year → latest imported year.
  const yearFromParam = Number(yearParam)
  const selectedYear: number | undefined =
    (years.includes(yearFromParam) ? yearFromParam : undefined) ??
    todayEntry?.geezYear ??
    years[years.length - 1]

  const days = selectedYear ? await getGeezCalendarDays(selectedYear) : []

  // Selected month: URL param → today's Ge'ez month (when viewing its year)
  // → first month with data.
  const monthsWithData = new Set(days.map((d) => d.month))
  const selectedMonth: GeezMonth =
    (GEEZ_MONTHS.includes(monthParam as GeezMonth) ? (monthParam as GeezMonth) : undefined) ??
    (todayEntry?.geezYear === selectedYear ? (todayEntry?.month as GeezMonth | undefined) : undefined) ??
    GEEZ_MONTHS.find((m) => monthsWithData.has(m)) ??
    'meskerem'

  const monthDays = days
    .filter((d) => d.month === selectedMonth)
    .sort((a, b) => a.day - b.day)
  const upcoming = buildUpcoming(upcomingDays, monthlyFeasts, today)

  const first = monthDays[0]
  const last = monthDays[monthDays.length - 1]

  // Eparchy events overlapping the visible month, keyed by Gregorian day.
  const monthEvents =
    first && last ? await getEventsInRange(first.gregorianDate, nextIso(last.gregorianDate)) : []
  const monthEventsByDate =
    first && last ? eventsByDate(monthEvents, first.gregorianDate, last.gregorianDate) : {}

  const href = (year: number, month?: GeezMonth) =>
    `/geez-calendar?year=${year}${month ? `&month=${month}` : ''}`

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      {days.length === 0 ? (
        <Section className="bg-white">
          <Container>
            <EmptyState
              title="No calendar data yet"
              description="Ge'ez calendar days will appear here once added in the admin panel."
            />
          </Container>
        </Section>
      ) : (
        <Section className="bg-parchment-50 dark:bg-charcoal-950">
          <Container>
            {/* ── Year navigation (only once several years are imported) ── */}
            {years.length > 1 && (
              <nav aria-label={t('year')} className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-300">
                  {t('year')}
                </span>
                {years.map((y) => (
                  <a
                    key={y}
                    href={href(y)}
                    aria-current={y === selectedYear ? 'page' : undefined}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-all duration-200',
                      y === selectedYear
                        ? 'border-gold-600 bg-gold-500 text-white shadow-sm'
                        : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-gold-400 dark:bg-charcoal-800 dark:text-charcoal-200 dark:border-charcoal-600',
                    )}
                  >
                    {y} ዓ.ም.
                  </a>
                ))}
              </nav>
            )}

            {/* ── Month navigation ─────────────────────────────────── */}
            <nav aria-label={t('month')} className="mb-6 flex flex-wrap gap-1.5">
              {GEEZ_MONTHS.map((m) => {
                const active = m === selectedMonth
                return (
                  <a
                    key={m}
                    href={href(selectedYear!, m)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-all duration-200',
                      active
                        ? 'border-maroon-800 bg-maroon-800 text-white shadow-sm'
                        : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-maroon-300 hover:text-maroon-800 dark:bg-charcoal-800 dark:text-charcoal-200 dark:border-charcoal-600',
                      !monthsWithData.has(m) && !active && 'opacity-40',
                    )}
                  >
                    <span className="font-geez">{GEEZ_MONTH_LABELS[m].ti}</span>
                  </a>
                )
              })}
            </nav>

            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-2xl font-serif font-bold text-charcoal-900 dark:text-white">
                <span className="font-geez">{GEEZ_MONTH_LABELS[selectedMonth].ti}</span>
                <span className="ml-3 text-lg text-charcoal-400 font-normal dark:text-charcoal-300">
                  {GEEZ_MONTH_LABELS[selectedMonth].en}
                  {selectedYear ? ` ${selectedYear}` : ''}
                </span>
              </h2>
              {first && last && (
                <span className="text-sm text-charcoal-400 dark:text-charcoal-300">
                  {formatGregorianShort(first.gregorianDate)} – {formatGregorianShort(last.gregorianDate)}
                </span>
              )}
              <a
                href="/calendar-subscriptions"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 px-3 py-1 text-xs font-medium text-charcoal-600 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800 dark:text-charcoal-200 dark:border-charcoal-600"
              >
                <span aria-hidden="true">🔔</span> {t('subscribe')}
              </a>
            </div>

            {/* ── Calendar + sidebar ───────────────────────────────── */}
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <GeezCalendarView
                monthDays={monthDays}
                monthlyFeasts={monthlyFeasts}
                todayIso={today}
                eventsByDate={monthEventsByDate}
                labels={{
                  today: t('today'),
                  feast: t('feast'),
                  readings: t('readings'),
                  antiphon: t('antiphon'),
                  deceasedClergy: t('deceasedClergy'),
                  monthlyFeast: t('monthlyFeast'),
                  season: t('season'),
                  noEntries: t('noEntries'),
                  gregorian: t('gregorian'),
                  events: t('events'),
                  addToCalendar: t('addToCalendar'),
                }}
              />

              {/* Upcoming feasts */}
              <aside aria-label={t('upcoming')}>
                <div className="lg:sticky lg:top-24 rounded-2xl border border-charcoal-100 bg-white p-5 shadow-soft dark:bg-charcoal-900 dark:border-charcoal-700">
                  <h3 className="font-serif font-semibold text-charcoal-900 dark:text-white">
                    {t('upcoming')}
                  </h3>
                  <div className="mt-1 h-1 w-10 rounded-full bg-gold-400 mb-4" />
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-charcoal-400 italic">{t('noEntries')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {upcoming.map((item) => (
                        <li key={item.key} className="flex items-start gap-2.5">
                          <span className="shrink-0 text-base leading-6" aria-hidden="true">
                            {item.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-geez text-sm font-medium text-charcoal-800 leading-snug dark:text-charcoal-100">
                              {item.name}
                            </p>
                            <p className="text-xs text-charcoal-400 dark:text-charcoal-300">
                              <span className="font-geez">{item.geezLabel}</span>
                              {' · '}
                              {formatGregorianShort(item.gregorianDate)}
                            </p>
                          </div>
                          <Badge variant={item.daysLeft === 0 ? 'maroon' : 'neutral'} size="sm">
                            {item.daysLeft === 0 ? t('today') : t('inDays', { days: item.daysLeft })}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Major feasts & fasts (curated entries) ───────────────── */}
      {feasts.length > 0 && (
        <Section className="bg-white dark:bg-charcoal-900">
          <Container>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2 dark:text-white">
              {t('majorFeasts')}
            </h2>
            <div className="mt-2 h-1 w-14 rounded-full bg-gold-400 mb-8" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {feasts.map((entry) => (
                <div key={entry.id} className="card p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-serif font-semibold text-charcoal-900">{entry.title}</h3>
                    {entry.fastingNotes && (
                      <Badge variant="red" size="sm">{t('fasting')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-500">
                    {entry.geezMonth && GEEZ_MONTH_LABELS[entry.geezMonth as GeezMonth]
                      ? `${GEEZ_MONTH_LABELS[entry.geezMonth as GeezMonth].ti} ${entry.geezDay ? toGeezNumeral(entry.geezDay) : ''}`
                      : null}
                    {entry.gregorianDate ? ` · ${entry.gregorianDate}` : null}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  )
}
