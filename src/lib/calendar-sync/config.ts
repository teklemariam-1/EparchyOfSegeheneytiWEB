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
