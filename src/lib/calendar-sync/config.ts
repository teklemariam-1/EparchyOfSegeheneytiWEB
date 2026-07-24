/**
 * Tenant configuration for calendar synchronization.
 *
 * Everything provider-facing (feed names, UID domain, timezone) is defined
 * here and only here, so another eparchy or diocese could adopt the
 * calendar-sync module by editing this single file.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eparchyofsegheneyti.org'

export const CALENDAR_CONFIG = {
  /** Organization name used in calendar titles and PRODID. */
  orgName: 'Catholic Eparchy of Segheneyti',
  orgNameTi: 'ካቶሊካዊት ኤጳርቅና ሰገነይቲ',
  /** Absolute site origin used for event URLs and feed URLs. */
  siteUrl,
  /** Domain part of every VEVENT UID. Stable forever — subscribed clients
   *  key events by UID, so changing this duplicates every event. */
  uidDomain: 'eparchyofsegheneyti.org',
  /** IANA timezone the eparchy lives in. */
  timeZone: 'Africa/Asmara',
  /** RFC 5545 PRODID. */
  prodId: '-//Catholic Eparchy of Segheneyti//Calendar Sync//EN',
} as const

/** Absolute URL of a calendar feed, e.g. feedUrl('liturgical'). */
export function feedUrl(feedId: string, params?: Record<string, string>): string {
  const url = new URL(`/api/calendar/${feedId}.ics`, CALENDAR_CONFIG.siteUrl)
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
  return url.toString()
}

/** UID for a VEVENT: `${localPart}@${uidDomain}`. */
export function eventUid(localPart: string): string {
  return `${localPart}@${CALENDAR_CONFIG.uidDomain}`
}

/**
 * The calendar date (yyyy-mm-dd) an instant falls on **in the eparchy's
 * timezone**. All-day events must use this, not a raw UTC `slice(0,10)`: an
 * instant like `2025-10-04T21:00:00Z` is Oct 5 in Asmara (UTC+3), and slicing
 * the UTC string would place it a day early. A plain `yyyy-mm-dd` input is
 * returned unchanged (UTC midnight + 3h stays the same day).
 */
export function localDateOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CALENDAR_CONFIG.timeZone }).format(new Date(iso))
}
