/**
 * Date formatting utilities.
 * Supports both Gregorian calendar display and Ge'ez/Ethiopic calendar.
 */

/** Format a Gregorian ISO date string for display */
export function formatDate(
  isoString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale = 'en-US',
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(isoString))
  } catch {
    return isoString
  }
}

/**
 * Numeric DD/MM/YYYY for article cards, in the reader's locale.
 *
 * Assembled from `formatToParts` rather than taken from the locale's own short
 * pattern, because those patterns disagree with the design. ICU resolves BOTH
 * `en` and `ti` to a MONTH-FIRST order (verified: `ti` → "07/19/2026"), so
 * handing the locale straight to Intl would render Tigrinya dates as
 * 07/19/2026 — the opposite of the day-first format the layout calls for, and
 * wrong in a way nobody would notice until the 13th of a month.
 *
 * Taking the parts and ordering them ourselves keeps the day-first layout
 * everywhere while still honouring the locale's digits and numbering system.
 */
export function formatShortDate(isoString: string, locale = 'en'): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''

    const parts = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(date)

    const find = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
    const day = find('day')
    const month = find('month')
    const year = find('year')
    if (!day || !month || !year) return ''

    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

/** Format a date as relative time — "3 days ago", "in 2 hours" */
export function formatRelativeTime(isoString: string, locale = 'en'): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.round(diff / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  const weeks = Math.round(days / 7)
  const months = Math.round(days / 30)
  const years = Math.round(days / 365)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(seconds) < 60) return rtf.format(-seconds, 'second')
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour')
  if (Math.abs(days) < 7) return rtf.format(-days, 'day')
  if (Math.abs(weeks) < 4) return rtf.format(-weeks, 'week')
  if (Math.abs(months) < 12) return rtf.format(-months, 'month')
  return rtf.format(-years, 'year')
}

/** Format a date range, e.g. "March 1–5, 2026" */
export function formatDateRange(startIso: string, endIso?: string, locale = 'en-US'): string {
  const start = new Date(startIso)
  if (!endIso) return formatDate(startIso, undefined, locale)

  const end = new Date(endIso)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    const startDay = start.getDate()
    const endDay = end.getDate()
    const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(start)
    const year = start.getFullYear()
    return `${month} ${startDay}–${endDay}, ${year}`
  }

  return `${formatDate(startIso, { month: 'short', day: 'numeric' }, locale)} – ${formatDate(endIso, { month: 'short', day: 'numeric', year: 'numeric' }, locale)}`
}

/**
 * Approximate Ge'ez to Gregorian date conversion.
 *
 * The Ge'ez (Ethiopic) calendar is ~7 years and ~8 months behind the
 * Gregorian calendar. This utility provides a best-effort conversion
 * for display purposes. Precision calendar operations should use a
 * dedicated library or stored gregorianDate field.
 *
 * Offset: Ge'ez year starts on ~September 11 (Meskerem 1).
 * Ge'ez Year = Gregorian Year - 7 (after Sep 11) or - 8 (before Sep 11).
 */
export function geezToGregorian(
  geezYear: number,
  geezMonth: number, // 1-indexed: 1=Meskerem ... 13=Paguemen
  geezDay: number,
): Date {
  // Each Ge'ez month starts ~11 Sep + (monthIndex * 30) days
  const geezEpoch = new Date(`${geezYear + 7}-09-11`)
  const dayOffset = (geezMonth - 1) * 30 + (geezDay - 1)
  const result = new Date(geezEpoch)
  result.setDate(result.getDate() + dayOffset)
  return result
}

/**
 * Approximate Gregorian → Ge'ez conversion — the inverse of `geezToGregorian`,
 * built on the same ~11 September anchor and 30-day months, so the two agree
 * with each other even where both drift a day or two from the true calendar.
 * Display/hint purposes only, same caveat as above.
 */
export function gregorianToGeezApprox(
  isoDate: string,
): { year: number; monthIndex: number; day: number } | null {
  const time = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(time)) return null

  const gregorianYear = new Date(time).getUTCFullYear()
  let anchorYear = gregorianYear
  let anchor = Date.parse(`${anchorYear}-09-11T00:00:00Z`)
  if (time < anchor) {
    anchorYear -= 1
    anchor = Date.parse(`${anchorYear}-09-11T00:00:00Z`)
  }

  const days = Math.round((time - anchor) / 86_400_000)
  const monthIndex = Math.min(Math.floor(days / 30), 12) // 0=Meskerem … 12=Paguemen
  const day = monthIndex === 12 ? days - 12 * 30 + 1 : (days % 30) + 1
  return { year: anchorYear - 7, monthIndex, day }
}

/** Format a Ge'ez date as a human-readable string */
export function formatGeezDate(
  geezYear: number,
  geezMonthLabel: string,
  geezDay: number,
): string {
  return `${geezMonthLabel} ${geezDay}, ${geezYear} (E.C.)`
}
