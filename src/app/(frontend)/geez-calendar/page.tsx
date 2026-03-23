import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS, type GeezMonth } from '@/lib/constants/geezMonths'
import { getGeezCalendarEntries } from '@/lib/payload/queries'

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: "Ge'ez Calendar",
  description:
    "Liturgical calendar of feasts, fasts, and saints' days in the Ge'ez tradition of the Catholic Eparchy of Segeneyti.",
  path: '/geez-calendar',
})

const RANK_COLORS: Record<string, string> = {
  solemnity:        'bg-gold-100 border-gold-400 text-gold-900',
  feast:            'bg-maroon-50 border-maroon-300 text-maroon-900',
  memorial:         'bg-charcoal-50 border-charcoal-300 text-charcoal-700',
  'optional-memorial': 'bg-charcoal-50 border-charcoal-200 text-charcoal-600',
  ferial:           'bg-white border-charcoal-100 text-charcoal-600',
}
const DEFAULT_RANK_COLOR = 'bg-white border-charcoal-100 text-charcoal-600'

const RANK_BADGE: Record<string, { label: string; variant: 'maroon' | 'gold' | 'neutral' | 'green' | 'red' }> = {
  solemnity:        { label: 'Solemnity',        variant: 'gold' },
  feast:            { label: 'Feast',            variant: 'maroon' },
  memorial:         { label: 'Memorial',         variant: 'neutral' },
  'optional-memorial': { label: 'Opt. Memorial', variant: 'neutral' },
  ferial:           { label: 'Ferial',           variant: 'neutral' },
}

const LITURGICAL_DOT: Record<string, string> = {
  white:  'bg-white border border-charcoal-300',
  red:    'bg-red-500',
  green:  'bg-green-600',
  violet: 'bg-violet-600',
  gold:   'bg-gold-500',
  black:  'bg-charcoal-800',
}

export default async function GeezCalendarPage() {
  const entries = await getGeezCalendarEntries()

  // Group entries by geezMonth
  const byMonth = new Map<GeezMonth, typeof entries>()
  for (const e of entries) {
    const m = (e.geezMonth ?? 'meskerem') as GeezMonth
    if (!byMonth.has(m)) byMonth.set(m, [])
    byMonth.get(m)!.push(e)
  }

  // Determine current Ge'ez month by approximate index
  const now = new Date()
  const currentMonthIndex = Math.floor(((now.getMonth() + 4) % 12))
  const currentMonthKey = GEEZ_MONTHS[currentMonthIndex] ?? 'meskerem'
  const currentMonthEntries = byMonth.get(currentMonthKey) ?? []

  const hasAnyData = entries.length > 0

  return (
    <>
      <PageHeader
        title="ግጻዌ — Ge'ez Calendar"
        subtitle="Liturgical feasts, fasts, and saints' days in the Ge'ez tradition."
        breadcrumbs={[{ label: "Ge'ez Calendar" }]}
      />

      {/* Legend */}
      <Section className="bg-white py-6">
        <Container>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Legend:</span>
            {Object.entries(RANK_BADGE).map(([rank, { label, variant }]) => (
              <Badge key={rank} variant={variant} size="sm">{label}</Badge>
            ))}
            <span className="text-xs text-charcoal-400">|</span>
            {Object.entries(LITURGICAL_DOT).map(([color, cls]) => (
              <span key={color} className="flex items-center gap-1 text-xs text-charcoal-600">
                <span className={`h-3 w-3 rounded-full ${cls} shrink-0`} />
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </span>
            ))}
          </div>
        </Container>
      </Section>

      {!hasAnyData ? (
        <Section className="bg-white">
          <Container>
            <EmptyState
              title="No calendar entries yet"
              description="Ge'ez calendar data will appear here once added to the CMS."
            />
          </Container>
        </Section>
      ) : (
        <>
          {/* Current month highlight */}
          <Section className="bg-parchment-50">
            <Container>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-serif font-bold text-charcoal-900">
                  {GEEZ_MONTH_LABELS[currentMonthKey].en}
                  <span className="ml-3 text-lg text-charcoal-400 font-normal">
                    {GEEZ_MONTH_LABELS[currentMonthKey].ti}
                  </span>
                </h2>
                <Badge variant="maroon" size="sm">Current Month</Badge>
              </div>

              {currentMonthEntries.length > 0 ? (
                <ul className="space-y-3">
                  {currentMonthEntries.map((entry) => {
                    const rankMeta = RANK_BADGE[entry.feastRank ?? 'ferial'] ?? RANK_BADGE.ferial
                    const rankColor = RANK_COLORS[entry.feastRank ?? 'ferial'] ?? DEFAULT_RANK_COLOR
                    return (
                      <li
                        key={entry.id}
                        className={`flex items-start gap-3 rounded-xl border p-4 ${rankColor}`}
                      >
                        <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-maroon-800 text-white px-2.5 py-1 min-w-[44px] text-center">
                          <span className="text-xs text-maroon-200 uppercase tracking-wide">Day</span>
                          <span className="text-xl font-bold leading-none">{entry.geezDay ?? '—'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{entry.title}</p>
                            <Badge variant={rankMeta.variant} size="sm">{rankMeta.label}</Badge>
                            {entry.fastingNotes && <Badge variant="red" size="sm">Fasting</Badge>}
                          </div>
                          {entry.liturgicalColor && (
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${LITURGICAL_DOT[entry.liturgicalColor] ?? 'bg-charcoal-200'}`} />
                              <span className="text-xs capitalize">{entry.liturgicalColor} vestments</span>
                            </div>
                          )}
                          {entry.description && (
                            <p className="text-xs mt-1 text-charcoal-500">{entry.description}</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-400 italic">No major feasts recorded for this month.</p>
              )}
            </Container>
          </Section>

          {/* Full year overview */}
          <Section className="bg-white">
            <Container>
              <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2">All Months</h2>
              <div className="mt-2 h-1 w-14 rounded-full bg-gold-400 mb-8" />

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {GEEZ_MONTHS.map((month, idx) => {
                  const monthEntries = byMonth.get(month) ?? []
                  const isCurrentMonth = idx === currentMonthIndex
                  return (
                    <div key={month} className={`card p-5 ${isCurrentMonth ? 'ring-2 ring-maroon-400' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-serif font-semibold text-charcoal-900">
                            {GEEZ_MONTH_LABELS[month].en}
                          </h3>
                          <p className="text-xs text-charcoal-400">{GEEZ_MONTH_LABELS[month].ti}</p>
                        </div>
                        {isCurrentMonth && <Badge variant="maroon" size="sm">Now</Badge>}
                      </div>

                      {monthEntries.length > 0 ? (
                        <ul className="space-y-1.5">
                          {monthEntries.map((entry) => (
                            <li key={entry.id} className="flex items-start gap-2 text-xs">
                              <span className="font-semibold text-maroon-700 shrink-0 w-5">{entry.geezDay}</span>
                              <span className="text-charcoal-700 leading-snug">{entry.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-charcoal-400 italic">No entries recorded</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Container>
          </Section>
        </>
      )}
    </>
  )
}

