/**
 * Analytics helpers: date-range resolution, country names/flags, and the
 * privacy-safe categorizers used by the anonymous visit tracker.
 *
 * Everything here operates on aggregate, non-personal values only.
 */

// ─── Date ranges ──────────────────────────────────────────────────────────────

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'last-90-days', label: 'Last 90 Days' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range…' },
] as const

export type DateRangeKey = (typeof DATE_RANGE_OPTIONS)[number]['value']

export interface ResolvedRange {
  /** Inclusive ISO day, or null for unbounded (all-time) */
  from: string | null
  /** Inclusive ISO day */
  to: string
  label: string
}

const DAY_MS = 86_400_000

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(isoDay: string, days: number): string {
  return iso(new Date(Date.parse(`${isoDay}T00:00:00Z`) + days * DAY_MS))
}

/** Monday-based start of week for an ISO day. */
function startOfWeek(isoDay: string): string {
  const d = new Date(`${isoDay}T00:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7 // 0 = Monday
  return addDays(isoDay, -dow)
}

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Resolve a range key to inclusive from/to ISO days.
 * `todayIso` is the current day in the site's timezone.
 */
export function resolveDateRange(
  key: string | undefined,
  todayIso: string,
  customFrom?: string,
  customTo?: string,
): ResolvedRange & { key: DateRangeKey } {
  const today = ISO_DAY_RE.test(todayIso ?? '') ? todayIso : iso(new Date())
  const year = today.slice(0, 4)
  const month = today.slice(0, 7)

  switch (key) {
    case 'today':
      return { key, from: today, to: today, label: 'Today' }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { key, from: y, to: y, label: 'Yesterday' }
    }
    case 'last-7-days':
      return { key, from: addDays(today, -6), to: today, label: 'Last 7 Days' }
    case 'this-week':
      return { key, from: startOfWeek(today), to: today, label: 'This Week' }
    case 'last-week': {
      const start = addDays(startOfWeek(today), -7)
      return { key, from: start, to: addDays(start, 6), label: 'Last Week' }
    }
    case 'this-month':
      return { key, from: `${month}-01`, to: today, label: 'This Month' }
    case 'last-month': {
      const firstThis = `${month}-01`
      const lastPrev = addDays(firstThis, -1)
      return { key, from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev, label: 'Last Month' }
    }
    case 'last-90-days':
      return { key, from: addDays(today, -89), to: today, label: 'Last 90 Days' }
    case 'this-year':
      return { key, from: `${year}-01-01`, to: today, label: 'This Year' }
    case 'last-year': {
      const prev = String(Number(year) - 1)
      return { key, from: `${prev}-01-01`, to: `${prev}-12-31`, label: 'Last Year' }
    }
    case 'all-time':
      return { key, from: null, to: today, label: 'All Time' }
    case 'custom': {
      const from = ISO_DAY_RE.test(customFrom ?? '') ? customFrom! : addDays(today, -29)
      const toRaw = ISO_DAY_RE.test(customTo ?? '') ? customTo! : today
      const to = toRaw < from ? from : toRaw
      return { key, from, to, label: `${from} → ${to}` }
    }
    case 'last-30-days':
    default:
      return { key: 'last-30-days', from: addDays(today, -29), to: today, label: 'Last 30 Days' }
  }
}

// ─── Countries ────────────────────────────────────────────────────────────────

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

/** Full English country name from a 2-letter code; falls back to the code. */
export function countryName(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code === 'Unknown' ? 'Unknown' : code
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** Flag emoji from a 2-letter country code (regional indicator symbols). */
export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🏳️'
  const base = 0x1f1e6
  const a = 'a'.charCodeAt(0)
  const chars = code.toLowerCase()
  return (
    String.fromCodePoint(base + chars.charCodeAt(0) - a) +
    String.fromCodePoint(base + chars.charCodeAt(1) - a)
  )
}

// ─── Tracker categorizers (nothing raw is ever stored) ───────────────────────

export type DeviceClass = 'mobile' | 'tablet' | 'desktop'

export function deviceFromUserAgent(ua: string | null | undefined): DeviceClass {
  const s = (ua ?? '').toLowerCase()
  if (/ipad|tablet|kindle|silk|playbook/.test(s)) return 'tablet'
  if (/android(?!.*mobile)/.test(s)) return 'tablet'
  if (/mobi|iphone|ipod|android|blackberry|opera mini|windows phone/.test(s)) return 'mobile'
  return 'desktop'
}

export type TrafficSource =
  | 'direct'
  | 'google'
  | 'bing'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'telegram'
  | 'instagram'
  | 'x-twitter'
  | 'referral'

/** Bucket a referrer URL into a coarse traffic source. Only the bucket is stored. */
export function categorizeSource(referrer: string | null | undefined, ownHost?: string): TrafficSource {
  const ref = (referrer ?? '').trim()
  if (!ref) return 'direct'
  let host: string
  try {
    host = new URL(ref).hostname.toLowerCase()
  } catch {
    return 'direct'
  }
  if (ownHost && (host === ownHost || host.endsWith(`.${ownHost}`))) return 'direct'
  if (/(^|\.)google\./.test(host)) return 'google'
  if (/(^|\.)bing\.com$/.test(host)) return 'bing'
  if (/(^|\.)(facebook\.com|fb\.com|m\.facebook\.com|l\.facebook\.com)$/.test(host)) return 'facebook'
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube'
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return 'whatsapp'
  if (/(^|\.)(telegram\.org|telegram\.me|t\.me)$/.test(host)) return 'telegram'
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram'
  if (/(^|\.)(twitter\.com|x\.com|t\.co)$/.test(host)) return 'x-twitter'
  return 'referral'
}

export const SOURCE_LABELS: Record<TrafficSource, string> = {
  direct: 'Direct',
  google: 'Google Search',
  bing: 'Bing',
  facebook: 'Facebook',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
  'x-twitter': 'X (Twitter)',
  referral: 'Other websites',
}

/** Primary language subtag from an Accept-Language header, e.g. "ti", "en". */
export function primaryLanguage(acceptLanguage: string | null | undefined): string {
  const first = (acceptLanguage ?? '').split(',')[0]?.trim() ?? ''
  const tag = first.split(';')[0]?.split('-')[0]?.toLowerCase() ?? ''
  return /^[a-z]{2,3}$/.test(tag) ? tag : 'unknown'
}

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ti: 'Tigrinya',
  ar: 'Arabic',
  it: 'Italian',
  de: 'German',
  fr: 'French',
  sv: 'Swedish',
  nl: 'Dutch',
  no: 'Norwegian',
  nb: 'Norwegian',
  am: 'Amharic',
  unknown: 'Unknown',
}

/** Normalize a tracked path: same-origin pathname only, trimmed, capped. */
/**
 * Top-level route segments the site actually serves. Paths outside this set
 * are not tracked, so an attacker POSTing arbitrary distinct paths (/x1, /x2…)
 * to /api/track cannot grow the visitor-stats table without bound — cardinality
 * stays within these routes plus their content slugs.
 */
const KNOWN_ROUTE_SEGMENTS = new Set([
  'about', 'news', 'events', 'parishes', 'vicariates', 'ministries', 'offices',
  'bishop-messages', 'pope-messages', 'publications', 'apps', 'media',
  'bishop', 'eparchs',
  'geez-calendar', 'calendar-subscriptions', 'search', 'contact', 'settings', 'privacy',
])

export function normalizePath(path: string | null | undefined): string | null {
  if (typeof path !== 'string') return null
  let p = path.trim()
  if (!p.startsWith('/')) return null
  p = p.split('?')[0]!.split('#')[0]!
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  if (p.startsWith('/admin') || p.startsWith('/api')) return null
  if (p.length > 200) p = p.slice(0, 200)
  if (p === '' || p === '/') return '/'
  const first = p.slice(1).split('/')[0]!
  if (!KNOWN_ROUTE_SEGMENTS.has(first)) return null
  return p
}

/** Group a path into a content bucket for "popular content" reporting. */
export function contentBucket(path: string): string {
  if (path === '/') return 'Home'
  if (path.startsWith('/news')) return 'News'
  if (path.startsWith('/events')) return 'Events'
  if (path.startsWith('/parishes')) return 'Parishes'
  // Order matters: '/bishop-messages' also starts with '/bishop', so the more
  // specific prefix has to be tested first or every message would be bucketed
  // as an Eparch profile view.
  if (path.startsWith('/bishop-messages')) return 'Bishop Messages'
  if (path.startsWith('/bishop') || path.startsWith('/eparchs')) return 'The Eparch'
  if (path.startsWith('/pope-messages')) return 'Pope Messages'
  if (path.startsWith('/publications')) return 'Publications'
  if (path.startsWith('/media')) return 'Media Gallery'
  if (path.startsWith('/geez-calendar')) return "Ge'ez Calendar"
  if (path.startsWith('/ministries')) return 'Ministries'
  if (path.startsWith('/offices')) return 'Offices'
  if (path.startsWith('/about')) return 'About'
  if (path.startsWith('/vicariates')) return 'Vicariates'
  if (path.startsWith('/apps')) return 'Apps'
  if (path.startsWith('/contact')) return 'Contact'
  if (path.startsWith('/search')) return 'Search'
  return 'Other pages'
}
