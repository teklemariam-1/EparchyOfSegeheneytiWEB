import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { GEEZ_MONTH_LABELS, type GeezMonth } from '@/lib/constants/geezMonths'

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: "Ge'ez Calendar",
  description:
    "Liturgical calendar of feasts, fasts, and saints' days in the Ge'ez tradition of the Catholic Eparchy of Segeneyti.",
  path: '/geez-calendar',
})

// ─── Types ────────────────────────────────────────────────────────────────────
type FeastRank = 'solemnity' | 'feast' | 'memorial' | 'fasting' | 'ferial'

type CalendarEntry = {
  day: number
  title: string
  rank: FeastRank
  liturgicalColor: string
  isFasting?: boolean
  gospel?: string
}

type GeezMonthData = {
  month: GeezMonth
  geezYear: number
  /** Approximate Gregorian month span */
  gregorianSpan: string
  days: 30 | 5 | 6
  entries: CalendarEntry[]
}

// ─── Mock calendar data for the current Ge'ez year ───────────────────────────
// Ge'ez year 2017 E.C. corresponds roughly to Sep 2024 – Sep 2025 Gregorian
const CURRENT_YEAR = 2017

const MONTHS_DATA: GeezMonthData[] = [
  {
    month: 'meskerem', geezYear: CURRENT_YEAR, gregorianSpan: 'Sep 11 – Oct 10, 2024', days: 30,
    entries: [
      { day: 1, title: 'Ethiopian New Year (Enkutatash)', rank: 'solemnity', liturgicalColor: 'white' },
      { day: 11, title: 'Feast of the Holy Cross (Meskel)', rank: 'solemnity', liturgicalColor: 'red' },
      { day: 29, title: 'Feast of Saint Michael', rank: 'feast', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'tikimit', geezYear: CURRENT_YEAR, gregorianSpan: 'Oct 11 – Nov 9, 2024', days: 30,
    entries: [
      { day: 5, title: 'Fast of the Apostles ends', rank: 'memorial', liturgicalColor: 'green' },
      { day: 24, title: 'Feast of Our Lady (Lideta)', rank: 'feast', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'hidar', geezYear: CURRENT_YEAR, gregorianSpan: 'Nov 10 – Dec 9, 2024', days: 30,
    entries: [
      { day: 1, title: "Feast of All Saints", rank: 'feast', liturgicalColor: 'white' },
      { day: 21, title: 'Feast of Our Lady (Hidar Mariam)', rank: 'solemnity', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'tahsas', geezYear: CURRENT_YEAR, gregorianSpan: 'Dec 10, 2024 – Jan 8, 2025', days: 30,
    entries: [
      { day: 1, title: 'Advent Season begins', rank: 'memorial', liturgicalColor: 'violet', isFasting: true },
      { day: 29, title: 'Christmas Vigil (Gena)', rank: 'solemnity', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'tir', geezYear: CURRENT_YEAR, gregorianSpan: 'Jan 9 – Feb 7, 2025', days: 30,
    entries: [
      { day: 1, title: 'Christmas Day (Gena)', rank: 'solemnity', liturgicalColor: 'white' },
      { day: 11, title: 'Feast of Baptism of the Lord (Timkat)', rank: 'solemnity', liturgicalColor: 'white' },
      { day: 21, title: 'Feast of Saint Gabriel', rank: 'feast', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'yekatit', geezYear: CURRENT_YEAR, gregorianSpan: 'Feb 8 – Mar 9, 2025', days: 30,
    entries: [
      { day: 1, title: 'Fast of the Ninevites (Abiye Tsom) begins', rank: 'memorial', liturgicalColor: 'violet', isFasting: true },
      { day: 16, title: 'Feast of Our Lady (Kidane Mihret)', rank: 'solemnity', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'megabit', geezYear: CURRENT_YEAR, gregorianSpan: 'Mar 10 – Apr 8, 2025', days: 30,
    entries: [
      { day: 1, title: 'Great Lent (Abiye Tsom) begins', rank: 'memorial', liturgicalColor: 'violet', isFasting: true },
      { day: 29, title: 'Palm Sunday', rank: 'solemnity', liturgicalColor: 'red' },
    ],
  },
  {
    month: 'miyazia', geezYear: CURRENT_YEAR, gregorianSpan: 'Apr 9 – May 8, 2025', days: 30,
    entries: [
      { day: 5, title: 'Holy Thursday', rank: 'solemnity', liturgicalColor: 'white' },
      { day: 6, title: 'Good Friday', rank: 'solemnity', liturgicalColor: 'black' },
      { day: 7, title: 'Holy Saturday (Sebt)', rank: 'solemnity', liturgicalColor: 'violet' },
      { day: 8, title: 'Easter Sunday (Fasika)', rank: 'solemnity', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'ginbot', geezYear: CURRENT_YEAR, gregorianSpan: 'May 9 – Jun 7, 2025', days: 30,
    entries: [
      { day: 17, title: 'Ascension of the Lord', rank: 'solemnity', liturgicalColor: 'white' },
      { day: 27, title: 'Pentecost Sunday', rank: 'solemnity', liturgicalColor: 'red' },
    ],
  },
  {
    month: 'sene', geezYear: CURRENT_YEAR, gregorianSpan: 'Jun 8 – Jul 7, 2025', days: 30,
    entries: [
      { day: 5, title: 'Fast of the Apostles begins', rank: 'memorial', liturgicalColor: 'violet', isFasting: true },
      { day: 26, title: 'Feast of the Apostles (Peter & Paul)', rank: 'feast', liturgicalColor: 'red' },
    ],
  },
  {
    month: 'hamle', geezYear: CURRENT_YEAR, gregorianSpan: 'Jul 8 – Aug 6, 2025', days: 30,
    entries: [
      { day: 19, title: 'Feast of Abune Zara Yaqob', rank: 'memorial', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'nehase', geezYear: CURRENT_YEAR, gregorianSpan: 'Aug 7 – Sep 5, 2025', days: 30,
    entries: [
      { day: 1, title: 'Fast of the Assumption begins', rank: 'memorial', liturgicalColor: 'violet', isFasting: true },
      { day: 16, title: 'Assumption of Our Lady (Filseta)', rank: 'solemnity', liturgicalColor: 'white' },
    ],
  },
  {
    month: 'paguemen', geezYear: CURRENT_YEAR, gregorianSpan: 'Sep 6 – 10, 2025', days: 5,
    entries: [
      { day: 5, title: 'New Year Eve', rank: 'ferial', liturgicalColor: 'green' },
    ],
  },
]

// ─── Colour helpers ───────────────────────────────────────────────────────────
const RANK_COLORS: Record<FeastRank, string> = {
  solemnity: 'bg-gold-100 border-gold-400 text-gold-900',
  feast:     'bg-maroon-50 border-maroon-300 text-maroon-900',
  memorial:  'bg-charcoal-50 border-charcoal-300 text-charcoal-700',
  fasting:   'bg-violet-50 border-violet-300 text-violet-900',
  ferial:    'bg-white border-charcoal-100 text-charcoal-600',
}

const LITURGICAL_DOT: Record<string, string> = {
  white:  'bg-white border border-charcoal-300',
  red:    'bg-red-500',
  green:  'bg-green-600',
  violet: 'bg-violet-600',
  gold:   'bg-gold-500',
  black:  'bg-charcoal-800',
}

const RANK_BADGE: Record<FeastRank, { label: string; variant: 'maroon' | 'gold' | 'neutral' | 'green' | 'red' }> = {
  solemnity: { label: 'Solemnity', variant: 'gold' },
  feast:     { label: 'Feast',     variant: 'maroon' },
  memorial:  { label: 'Memorial',  variant: 'neutral' },
  fasting:   { label: 'Fasting',   variant: 'red' },
  ferial:    { label: 'Ferial',    variant: 'neutral' },
}

export default function GeezCalendarPage() {
  // Approximate current Ge'ez month (rough: offset 7 years + 8 months from Gregorian)
  const now = new Date()
  const currentMonthIndex = Math.floor(((now.getMonth() + 4) % 12))
  const currentMonthData = MONTHS_DATA[currentMonthIndex] ?? MONTHS_DATA[0]

  return (
    <>
      <PageHeader
        title="ግጻዌ — Ge'ez Calendar"
        subtitle={`Liturgical feasts, fasts, and saints' days · Year ${CURRENT_YEAR} E.C.`}
        breadcrumbs={[{ label: "Ge'ez Calendar" }]}
      />

      {/* ── Legend ─────────────────────────────────────────────────── */}
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

      {/* ── Current month highlight ─────────────────────────────────── */}
      <Section className="bg-parchment-50">
        <Container>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-serif font-bold text-charcoal-900">
              {GEEZ_MONTH_LABELS[currentMonthData.month].en}
              <span className="ml-3 text-lg text-charcoal-400 font-normal">
                {GEEZ_MONTH_LABELS[currentMonthData.month].ti}
              </span>
            </h2>
            <Badge variant="maroon" size="sm">Current Month</Badge>
          </div>
          <p className="text-sm text-charcoal-500 mb-6">
            Gregorian equivalent: {currentMonthData.gregorianSpan} · {currentMonthData.days} days
          </p>

          {/* Day grid */}
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2">
            {Array.from({ length: currentMonthData.days }, (_, i) => {
              const day = i + 1
              const entry = currentMonthData.entries.find((e) => e.day === day)
              return (
                <div
                  key={day}
                  className={`relative flex flex-col items-center justify-start rounded-lg border p-1.5 min-h-[56px] text-center text-xs transition-shadow hover:shadow-sm cursor-default ${
                    entry ? RANK_COLORS[entry.rank] : 'bg-white border-charcoal-100 text-charcoal-500'
                  }`}
                  title={entry?.title}
                >
                  <span className="font-semibold text-sm">{day}</span>
                  {entry && (
                    <>
                      <span
                        className={`mt-0.5 h-2 w-2 rounded-full ${LITURGICAL_DOT[entry.liturgicalColor] ?? 'bg-charcoal-200'}`}
                        title={entry.liturgicalColor}
                      />
                      <span className="mt-1 text-[9px] leading-tight line-clamp-2 hidden sm:block">
                        {entry.title}
                      </span>
                    </>
                  )}
                  {entry?.isFasting && (
                    <span className="absolute top-0.5 right-0.5 text-[8px]" title="Fasting day">🌙</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Current month feast list */}
          {currentMonthData.entries.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-4">
                This Month's Celebrations
              </h3>
              <ul className="space-y-3">
                {currentMonthData.entries.map((entry) => (
                  <li
                    key={`${entry.day}-${entry.title}`}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${RANK_COLORS[entry.rank]}`}
                  >
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-maroon-800 text-white px-2.5 py-1 min-w-[44px] text-center">
                      <span className="text-xs text-maroon-200 uppercase tracking-wide">Day</span>
                      <span className="text-xl font-bold leading-none">{entry.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{entry.title}</p>
                        <Badge variant={RANK_BADGE[entry.rank].variant} size="sm">
                          {RANK_BADGE[entry.rank].label}
                        </Badge>
                        {entry.isFasting && <Badge variant="red" size="sm">Fasting</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${LITURGICAL_DOT[entry.liturgicalColor] ?? 'bg-charcoal-200'}`} />
                        <span className="text-xs capitalize">{entry.liturgicalColor} vestments</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      {/* ── Full year overview ──────────────────────────────────────── */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2">
            Year {CURRENT_YEAR} E.C. — All Months
          </h2>
          <div className="mt-2 h-1 w-14 rounded-full bg-gold-400 mb-8" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MONTHS_DATA.map((monthData, idx) => (
              <div
                key={monthData.month}
                className={`card p-5 ${idx === currentMonthIndex ? 'ring-2 ring-maroon-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-serif font-semibold text-charcoal-900">
                      {GEEZ_MONTH_LABELS[monthData.month].en}
                    </h3>
                    <p className="text-xs text-charcoal-400">{GEEZ_MONTH_LABELS[monthData.month].ti}</p>
                  </div>
                  {idx === currentMonthIndex && (
                    <Badge variant="maroon" size="sm">Now</Badge>
                  )}
                </div>
                <p className="text-xs text-charcoal-400 mb-3">{monthData.gregorianSpan}</p>

                {monthData.entries.length > 0 ? (
                  <ul className="space-y-1.5">
                    {monthData.entries.map((entry) => (
                      <li key={`${entry.day}-${entry.title}`} className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-maroon-700 shrink-0 w-5">{entry.day}</span>
                        <span className="text-charcoal-700 leading-snug">{entry.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-charcoal-400 italic">No major feasts recorded</p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-charcoal-400">
            Full calendar entries — including liturgical readings and fasting guides — will be
            available once connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
