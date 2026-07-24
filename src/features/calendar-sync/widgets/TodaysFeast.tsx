import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/layout/Container'
import { getGeezDayByDate, getGeezMonthlyFeasts } from '@/lib/payload/queries'
import { fixedSeasonOf } from '@/lib/geez-liturgical'

/**
 * Compact "today in the Ge'ez calendar" strip: today's Ge'ez date with its
 * feast, monthly commemoration and season, linking to the full calendar.
 * Self-fetching server component; renders nothing when today's day is not
 * imported (e.g. before the next liturgical year is loaded).
 */

/** Today in the eparchy's timezone as yyyy-mm-dd. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Asmara' }).format(new Date())
}

export async function TodaysFeast() {
  const today = todayIso()
  const [day, monthlyFeasts, t] = await Promise.all([
    getGeezDayByDate(today),
    getGeezMonthlyFeasts(),
    getTranslations('calendar'),
  ])
  if (!day) return null

  const monthly = monthlyFeasts.find((f) => f.day === day.day)
  const season = fixedSeasonOf(day.month, day.day)
  const gregorian = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${day.gregorianDate}T00:00:00`))

  return (
    <section aria-label={t('title')} className="border-y border-gold-200 bg-parchment-50">
      <Container>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              {t('today')}
            </span>
            <span className="font-geez text-lg font-bold text-charcoal-900">
              {day.geezLabel}
            </span>
            <span className="text-sm text-charcoal-500">{gregorian}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {day.events && (
              <span className="font-geez font-medium text-gold-800">
                🎉 {day.events}
              </span>
            )}
            {monthly && (
              <span className="font-geez text-charcoal-700">
                {monthly.icon ?? '✝'} {monthly.name}
              </span>
            )}
            {season && !day.events && (
              <span className="font-geez text-charcoal-500">{season.ti}</span>
            )}
          </div>

          <Link
            href="/geez-calendar"
            className="ml-auto shrink-0 text-sm font-semibold text-maroon-700 hover:text-maroon-900 transition-colors"
          >
            {t('title')} →
          </Link>
        </div>
      </Container>
    </section>
  )
}
