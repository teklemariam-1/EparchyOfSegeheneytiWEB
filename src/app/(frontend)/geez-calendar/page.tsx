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
  getGeezCalendarEntries,
  type GeezCalendarDay,
} from '@/lib/payload/queries'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: "Ge'ez Calendar",
  description:
    "The daily Ge'ez liturgical calendar of the Catholic Eparchy of Segeneyti — readings, antiphons, feasts and commemorations, with corresponding Gregorian dates.",
  path: '/geez-calendar',
})

/** Today in the eparchy's timezone as yyyy-mm-dd. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Asmara' }).format(new Date())
}

function formatGregorian(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function DayRow({
  day,
  isToday,
  t,
}: {
  day: GeezCalendarDay
  isToday: boolean
  t: (key: string) => string
}) {
  const hasFeast = Boolean(day.events)
  return (
    <li
      className={cn(
        'rounded-xl border p-4',
        hasFeast ? 'bg-gold-50 border-gold-300' : 'bg-white border-charcoal-100',
        isToday && 'ring-2 ring-maroon-500',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-maroon-800 text-white px-2.5 py-1.5 min-w-[48px] text-center">
          <span className="text-xl font-bold leading-none">{day.day}</span>
          <span className="mt-0.5 text-[10px] text-maroon-200 leading-tight">
            {formatGregorian(day.gregorianDate).replace(/^[A-Za-z]+, /, '')}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm text-charcoal-900 font-geez">{day.geezLabel}</p>
            <span className="text-xs text-charcoal-400">{formatGregorian(day.gregorianDate)}</span>
            {isToday && <Badge variant="maroon" size="sm">{t('today')}</Badge>}
            {hasFeast && <Badge variant="gold" size="sm">{t('feast')}</Badge>}
          </div>

          {day.events && (
            <p className="mt-1.5 text-sm font-medium text-gold-900 font-geez leading-relaxed">
              {day.events}
            </p>
          )}

          {day.deceasedClergy && (
            <p className="mt-1.5 text-xs text-charcoal-600 font-geez leading-relaxed">
              <span className="font-semibold text-charcoal-500">✝ {t('deceasedClergy')}: </span>
              {day.deceasedClergy}
            </p>
          )}

          {day.readings && (
            <p className="mt-1.5 text-xs text-charcoal-600 font-geez leading-relaxed">
              <span className="font-semibold text-charcoal-500">{t('readings')}: </span>
              {day.readings}
            </p>
          )}

          {day.antiphon && (
            <details className="mt-1.5">
              <summary className="cursor-pointer text-xs font-semibold text-maroon-700 hover:text-maroon-900">
                {t('antiphon')}
              </summary>
              <p className="mt-1 text-xs text-charcoal-600 font-geez leading-relaxed border-l-2 border-gold-300 pl-3">
                {day.antiphon}
              </p>
            </details>
          )}
        </div>
      </div>
    </li>
  )
}

export default async function GeezCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const [days, feasts, t] = await Promise.all([
    getGeezCalendarDays(),
    getGeezCalendarEntries(),
    getTranslations('calendar'),
  ])

  const today = todayIso()
  const todayEntry = days.find((d) => d.gregorianDate === today)

  // Selected month: URL param → today's Ge'ez month → first month with data.
  const monthsWithData = new Set(days.map((d) => d.month))
  const selectedMonth: GeezMonth =
    (GEEZ_MONTHS.includes(monthParam as GeezMonth) ? (monthParam as GeezMonth) : undefined) ??
    (todayEntry?.month as GeezMonth | undefined) ??
    GEEZ_MONTHS.find((m) => monthsWithData.has(m)) ??
    'meskerem'

  const monthDays = days
    .filter((d) => d.month === selectedMonth)
    .sort((a, b) => a.day - b.day)
  const geezYear = monthDays[0]?.geezYear ?? todayEntry?.geezYear

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
        <>
          {/* ── Today ─────────────────────────────────────────────── */}
          {todayEntry && (
            <Section className="bg-parchment-50 py-10">
              <Container>
                <div className="rounded-2xl border border-gold-300 bg-white p-6 shadow-soft">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <Badge variant="maroon" size="sm">{t('today')}</Badge>
                    <h2 className="text-2xl font-serif font-bold text-charcoal-900 font-geez">
                      {todayEntry.geezLabel}
                    </h2>
                    <span className="text-sm text-charcoal-500">
                      {formatGregorian(todayEntry.gregorianDate)}
                    </span>
                  </div>

                  {todayEntry.events && (
                    <p className="mb-2 text-base font-medium text-gold-900 font-geez leading-relaxed">
                      🎉 {todayEntry.events}
                    </p>
                  )}
                  {todayEntry.readings && (
                    <p className="mb-2 text-sm text-charcoal-700 font-geez leading-relaxed">
                      <span className="font-semibold text-charcoal-500">{t('readings')}: </span>
                      {todayEntry.readings}
                    </p>
                  )}
                  {todayEntry.antiphon && (
                    <p className="mb-2 text-sm text-charcoal-700 font-geez leading-relaxed border-l-2 border-gold-300 pl-3 italic">
                      {todayEntry.antiphon}
                    </p>
                  )}
                  {todayEntry.deceasedClergy && (
                    <p className="text-sm text-charcoal-600 font-geez leading-relaxed">
                      <span className="font-semibold text-charcoal-500">
                        ✝ {t('deceasedClergy')}:{' '}
                      </span>
                      {todayEntry.deceasedClergy}
                    </p>
                  )}
                </div>
              </Container>
            </Section>
          )}

          {/* ── Month browser ─────────────────────────────────────── */}
          <Section className="bg-white">
            <Container>
              <nav aria-label={t('month')} className="mb-8 flex flex-wrap gap-2">
                {GEEZ_MONTHS.map((m) => {
                  const active = m === selectedMonth
                  return (
                    <a
                      key={m}
                      href={`/geez-calendar?month=${m}`}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-sm transition-colors',
                        active
                          ? 'border-maroon-800 bg-maroon-800 text-white'
                          : 'border-charcoal-200 text-charcoal-600 hover:border-maroon-300 hover:text-maroon-800',
                        !monthsWithData.has(m) && !active && 'opacity-50',
                      )}
                    >
                      <span className="font-geez">{GEEZ_MONTH_LABELS[m].ti}</span>
                      <span className="ml-1.5 text-xs opacity-75">{GEEZ_MONTH_LABELS[m].en}</span>
                    </a>
                  )
                })}
              </nav>

              <div className="flex items-baseline gap-3 mb-6">
                <h2 className="text-2xl font-serif font-bold text-charcoal-900">
                  <span className="font-geez">{GEEZ_MONTH_LABELS[selectedMonth].ti}</span>
                  <span className="ml-3 text-lg text-charcoal-400 font-normal">
                    {GEEZ_MONTH_LABELS[selectedMonth].en}
                    {geezYear ? ` ${geezYear}` : ''}
                  </span>
                </h2>
                {monthDays.length > 0 && (
                  <span className="text-sm text-charcoal-400">
                    {formatGregorian(monthDays[0]!.gregorianDate)} –{' '}
                    {formatGregorian(monthDays[monthDays.length - 1]!.gregorianDate)}
                  </span>
                )}
              </div>

              {monthDays.length > 0 ? (
                <ul className="space-y-3">
                  {monthDays.map((day) => (
                    <DayRow
                      key={day.id}
                      day={day}
                      isToday={day.gregorianDate === today}
                      t={t}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-400 italic">{t('noEntries')}</p>
              )}
            </Container>
          </Section>
        </>
      )}

      {/* ── Major feasts & fasts (curated entries) ───────────────── */}
      {feasts.length > 0 && (
        <Section className="bg-parchment-50">
          <Container>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2">
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
                      ? `${GEEZ_MONTH_LABELS[entry.geezMonth as GeezMonth].ti} ${entry.geezDay ?? ''}`
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
