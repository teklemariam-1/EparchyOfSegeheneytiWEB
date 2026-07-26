/**
 * Money handling for donations.
 *
 * One rule underpins this file: **a donation amount is an integer count of the
 * currency's minor unit** (cents, santim, …) from the moment it is validated
 * until it is rendered. Floats are never used for arithmetic — `0.1 + 0.2` is
 * not `0.3`, and a church ledger that is off by a cent per row is a ledger
 * nobody trusts. The major-unit decimal we keep alongside it (`amount`) exists
 * only so the pre-existing admin list and "Amount raised" aggregation keep
 * working; it is derived from the minor value, never the other way round.
 *
 * Deliberately free of server-only imports so the donate form and unit tests can
 * use the same formatting and validation the server enforces.
 */

/**
 * Currencies Stripe charges without a minor unit — ¥100 is `100`, not `10000`.
 * Sending `10000` for JPY would charge a hundred times the intended gift.
 * Source: Stripe "Zero-decimal currencies".
 */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

/**
 * Currencies Stripe bills with three decimal places. Stripe additionally
 * requires the minor amount to be evenly divisible by 10 for these, which
 * `toMinorUnits` enforces by rounding.
 */
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])

/**
 * Presentment currencies Stripe accepts. Used to decide whether the card option
 * can be offered at all — the Eparchy's default currency (ERN, Eritrean Nakfa)
 * is deliberately absent, which is exactly why manual transfer cannot go away.
 *
 * This gates the UI and the Checkout Session; it is not a claim about what any
 * particular Stripe account is enabled for. An account may support fewer.
 */
const STRIPE_CURRENCIES = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM',
  'BBD', 'BDT', 'BGN', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BWP', 'BYN',
  'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CVE', 'CZK', 'DJF',
  'DKK', 'DOP', 'DZD', 'EGP', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GIP',
  'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'ISK', 'JMD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KRW', 'KYD', 'KZT', 'LAK',
  'LBP', 'LKR', 'LRD', 'LSL', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP',
  'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR',
  'NZD', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
  'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD',
  'STD', 'SZL', 'THB', 'TJS', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX',
  'USD', 'UYU', 'UZS', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER',
  'ZAR', 'ZMW',
])

/** Normalize any caller-supplied currency to the uppercase ISO form. */
export function normalizeCurrency(code: unknown): string {
  return String(code ?? '').trim().toUpperCase()
}

/** Number of decimal places the currency is billed with (0, 2, or 3). */
export function currencyExponent(code: string): number {
  const c = normalizeCurrency(code)
  if (ZERO_DECIMAL.has(c)) return 0
  if (THREE_DECIMAL.has(c)) return 3
  return 2
}

/** Whether Stripe can charge in this currency at all. */
export function isStripeSupportedCurrency(code: string): boolean {
  return STRIPE_CURRENCIES.has(normalizeCurrency(code))
}

/** Plain decimal notation — the only shape we shift digits on directly. */
const DECIMAL_RE = /^(\d+)(?:\.(\d+))?$/

/**
 * Shift a plain decimal string left by `exponent` places, rounding half up.
 *
 * Done on the digits rather than by multiplying, because neither
 * `Math.round(v * 100)` nor `v.toFixed(2)` is trustworthy here. `1.005` is
 * stored as 1.00499999999999989, so `(1.005).toFixed(2)` is `"1.00"` and
 * `1.005 * 100` is `100.49999999999999` — both quietly round a donor's gift
 * *down*. Moving the decimal point in the text the donor actually typed has no
 * such failure mode.
 */
function shiftDecimalString(text: string, exponent: number): number | null {
  const match = DECIMAL_RE.exec(text)
  if (!match) return null

  const whole = match[1] ?? '0'
  const fraction = match[2] ?? ''
  const padded = fraction.padEnd(exponent, '0')
  const kept = padded.slice(0, exponent)
  const remainder = padded.slice(exponent)

  let minor = Number(`${whole}${kept}`)
  if (!Number.isFinite(minor)) return null
  // Round half away from zero on the first discarded digit.
  if (remainder && Number(remainder[0]) >= 5) minor += 1
  return minor
}

/**
 * Convert a major-unit amount (what the donor typed) to integer minor units.
 *
 * Returns null for anything that is not a finite, positive, representable
 * amount, so callers must handle rejection rather than receive a silent 0.
 */
export function toMinorUnits(major: number | string, currency: string): number | null {
  const text = String(major).trim()
  const value = Number(text)
  if (!Number.isFinite(value) || value <= 0) return null

  const exponent = currencyExponent(currency)
  // Prefer exact digit shifting; fall back to the float path only for inputs
  // that are not plain decimals (exponential notation, say), where there are no
  // digits to shift.
  const minor = shiftDecimalString(text, exponent) ?? Math.round(value * 10 ** exponent)
  if (!Number.isSafeInteger(minor) || minor <= 0) return null

  // Stripe rejects three-decimal amounts that are not a multiple of 10.
  if (exponent === 3) return Math.round(minor / 10) * 10
  return minor
}

/** Convert integer minor units back to a major-unit number (for display only). */
export function toMajorUnits(minor: number, currency: string): number {
  const exponent = currencyExponent(currency)
  return exponent === 0 ? minor : minor / 10 ** exponent
}

/**
 * Format an amount for a donor or a receipt.
 *
 * Falls back to `1,234.50 USD` when the runtime has no data for the locale or
 * currency — an unformatted number next to a currency code is still correct,
 * whereas throwing inside a receipt loses the receipt.
 */
export function formatAmount(minor: number, currency: string, locale = 'en'): string {
  const code = normalizeCurrency(currency)
  const major = toMajorUnits(minor, code)
  const exponent = currencyExponent(code)
  try {
    return new Intl.NumberFormat(locale === 'ti' ? 'ti-ER' : locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(major)
  } catch {
    return `${major.toFixed(exponent)} ${code}`
  }
}

export interface AmountLimits {
  /** Inclusive minimum in major units, as configured by staff. */
  minAmount?: number | null
  /** Inclusive maximum in major units. Falsy means no cap. */
  maxAmount?: number | null
}

export type AmountRejection = 'invalid' | 'below-min' | 'above-max'

export type AmountResult =
  | { ok: true; minor: number; major: number }
  | { ok: false; reason: AmountRejection; limit?: number }

/**
 * The single place a donation amount is validated, for BOTH payment methods.
 *
 * Called server-side with the limits loaded from donation-settings, never with
 * limits sent by the browser. The returned `minor` is what gets charged and
 * what gets stored; the caller must not re-derive it from the raw input.
 */
export function resolveAmount(
  raw: number | string,
  currency: string,
  limits: AmountLimits,
): AmountResult {
  const minor = toMinorUnits(raw, currency)
  if (minor === null) return { ok: false, reason: 'invalid' }

  const exponent = currencyExponent(currency)
  const min = Number(limits.minAmount ?? 0)
  const max = Number(limits.maxAmount ?? 0)

  // Compare in minor units so the limit check uses the same integers as the
  // charge — comparing floats here could admit an amount the charge rejects.
  if (min > 0) {
    const minMinor = toMinorUnits(min, currency)
    if (minMinor !== null && minor < minMinor) return { ok: false, reason: 'below-min', limit: min }
  }
  if (max > 0) {
    const maxMinor = toMinorUnits(max, currency)
    if (maxMinor !== null && minor > maxMinor) return { ok: false, reason: 'above-max', limit: max }
  }

  return { ok: true, minor, major: Number(toMajorUnits(minor, currency).toFixed(exponent)) }
}
