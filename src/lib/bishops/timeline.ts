import {
  LIFE_PERIODS,
  MILESTONE_PERIOD,
  type DatePrecision,
  type LifePeriod,
  type MilestoneType,
} from '../../collections/Bishops/terminology'

/**
 * Rendering and ordering for milestones whose dates are only partly known.
 *
 * Historical and rural Eritrean records are frequently imprecise. The database
 * has to store a full timestamp — Postgres has nowhere to put "sometime in
 * 1998" — so the precision flag records how much of that timestamp staff
 * actually vouched for, and everything here renders and sorts only that much.
 * The alternative, printing the stored value, publishes 1 January 1998 as a
 * fact about a man's life when nobody ever claimed it.
 */

export interface DatedMilestone {
  milestoneType?: MilestoneType | string | null
  date?: string | null
  datePrecision?: DatePrecision | string | null
  endDate?: string | null
  endDatePrecision?: DatePrecision | string | null
  order?: number | null
}

/** Locale-aware month names, resolved once per call rather than per entry. */
function monthName(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ti' ? 'ti-ER' : 'en-GB', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date)
}

function fullDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ti' ? 'ti-ER' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Render a date to exactly the precision it was recorded at.
 *
 * `circa` is passed in already translated rather than hardcoded, because the
 * Tigrinya for "approximately" belongs in the message catalog with every other
 * user-facing string.
 */
export function formatPreciseDate(
  value: string | null | undefined,
  precision: string | null | undefined,
  locale = 'en',
  labels: { circa?: string; ongoing?: string } = {},
): string | null {
  if (precision === 'ongoing') return labels.ongoing ?? 'Ongoing'
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = String(date.getUTCFullYear())

  switch (precision) {
    case 'year':
      return year
    case 'approximate':
      return `${labels.circa ?? 'circa'} ${year}`
    case 'month':
      return `${monthName(date, locale)} ${year}`
    case 'exact':
    default:
      return fullDate(date, locale)
  }
}

/**
 * Render a milestone's date span — "1998", "circa 1998", "March 2004",
 * "2004 – 2009", "2019 – ongoing".
 */
export function formatMilestoneRange(
  milestone: DatedMilestone,
  locale = 'en',
  labels: { circa?: string; ongoing?: string; dash?: string } = {},
): string | null {
  const start = formatPreciseDate(milestone.date, milestone.datePrecision, locale, labels)
  const end =
    milestone.endDatePrecision === 'ongoing'
      ? (labels.ongoing ?? 'ongoing')
      : formatPreciseDate(milestone.endDate, milestone.endDatePrecision, locale, labels)

  if (start && end) return `${start} ${labels.dash ?? '–'} ${end}`
  return start ?? end ?? null
}

/**
 * Sort key for a partly-known date.
 *
 * A year-only or approximate entry sorts to the START of its year, so "1998"
 * precedes "March 1998" — which is the honest reading: we know the second
 * happened in March and only that the first happened sometime that year, so
 * placing it before rather than after asserts the least. Entries with no date
 * at all sort last rather than to 1970, which is where a raw timestamp
 * comparison would put them.
 */
export function milestoneSortKey(milestone: DatedMilestone): number {
  if (!milestone.date) return Number.POSITIVE_INFINITY

  const date = new Date(milestone.date)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY

  if (milestone.datePrecision === 'year' || milestone.datePrecision === 'approximate') {
    return Date.UTC(date.getUTCFullYear(), 0, 1)
  }
  if (milestone.datePrecision === 'month') {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  }
  return date.getTime()
}

/**
 * Chronological order, with `order` breaking ties between entries that share a
 * date — an ordination and the first assignment recorded on the same day, for
 * instance. Entries without a manual order keep their stored sequence, so a
 * tie never reshuffles on re-render.
 */
export function sortMilestones<T extends DatedMilestone>(milestones: T[]): T[] {
  return milestones
    .map((milestone, index) => ({ milestone, index }))
    .sort((a, b) => {
      const byDate = milestoneSortKey(a.milestone) - milestoneSortKey(b.milestone)
      if (byDate !== 0) return byDate

      const orderA = a.milestone.order ?? Number.POSITIVE_INFINITY
      const orderB = b.milestone.order ?? Number.POSITIVE_INFINITY
      if (orderA !== orderB) return orderA - orderB

      return a.index - b.index
    })
    .map(({ milestone }) => milestone)
}

export interface PeriodGroup<T> {
  period: LifePeriod
  milestones: T[]
}

/**
 * Group a sorted timeline into the four arcs of a life — origins, formation,
 * priesthood, episcopacy. Forty flat entries is a wall of text; four labelled
 * arcs is a life. Empty groups are dropped so a record that only reaches
 * formation does not render two empty headings.
 */
export function groupByPeriod<T extends DatedMilestone>(milestones: T[]): PeriodGroup<T>[] {
  const buckets = new Map<LifePeriod, T[]>(LIFE_PERIODS.map((p) => [p, []]))

  for (const milestone of milestones) {
    const type = milestone.milestoneType as MilestoneType | undefined
    const period = (type && MILESTONE_PERIOD[type]) || 'episcopacy'
    buckets.get(period)!.push(milestone)
  }

  return LIFE_PERIODS.map((period) => ({ period, milestones: buckets.get(period)! })).filter(
    (group) => group.milestones.length > 0,
  )
}

/** Sorted, grouped, and ready to render. */
export function buildTimeline<T extends DatedMilestone>(milestones: T[]): PeriodGroup<T>[] {
  return groupByPeriod(sortMilestones(milestones))
}
