import { normalizeCurrency, resolveAmount, type AmountRejection } from './amounts'
import { canPayByCard, type PaymentMethod, type ResolvedDonationConfig } from './settings'
import { normalizeLocale, type DonationLocale } from './messages'

/**
 * Validation shared by both donate actions.
 *
 * Everything a donor submits passes through here, server-side, and is checked
 * against the settings loaded from the database — never against limits or
 * currency lists sent by the browser. The amount the caller gets back is an
 * integer in minor units produced by `resolveAmount`; callers must charge and
 * store *that*, not the raw input, which is what keeps a hand-crafted POST from
 * setting its own price.
 */

export const MAX_LEN = { name: 120, email: 254, message: 2000, currency: 8 }

/** Deliberately permissive — real addresses fail strict RFC patterns. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ValidationError =
  | { field: 'name'; code: 'required' }
  | { field: 'email'; code: 'invalid' }
  | { field: 'message'; code: 'too-long' }
  | { field: 'amount'; code: AmountRejection; limit?: number }
  | { field: 'currency'; code: 'invalid' }
  | { field: 'method'; code: 'unavailable' | 'currency-not-supported' }
  | { field: 'frequency'; code: 'unavailable' }
  | { field: 'form'; code: 'disabled' }

export interface ValidatedDonation {
  name: string
  email: string
  message: string
  anonymous: boolean
  frequency: 'one-time' | 'monthly'
  locale: DonationLocale
  currency: string
  /** Integer minor units — the canonical amount. */
  amountMinor: number
  /** Major-unit decimal, derived, for display only. */
  amount: number
  method: PaymentMethod
}

export type ValidationResult =
  | { ok: true; value: ValidatedDonation }
  | { ok: false; error: ValidationError }

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

export function parseDonation(
  formData: FormData,
  config: ResolvedDonationConfig,
  requestedMethod: PaymentMethod,
): ValidationResult {
  if (!config.enabled) return { ok: false, error: { field: 'form', code: 'disabled' } }

  const name = sanitize(formData.get('name'))
  const email = sanitize(formData.get('email'))
  const message = sanitize(formData.get('message'))
  const anonymousRaw = sanitize(formData.get('anonymous'))
  const anonymous = anonymousRaw === 'on' || anonymousRaw === 'true'
  const frequency = sanitize(formData.get('frequency')) === 'monthly' ? 'monthly' : 'one-time'
  const locale = normalizeLocale(sanitize(formData.get('locale')))
  const currencyRaw = normalizeCurrency(formData.get('currency'))

  if (!name || name.length > MAX_LEN.name) return { ok: false, error: { field: 'name', code: 'required' } }
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_LEN.email) {
    return { ok: false, error: { field: 'email', code: 'invalid' } }
  }
  if (message.length > MAX_LEN.message) return { ok: false, error: { field: 'message', code: 'too-long' } }
  if (currencyRaw.length > MAX_LEN.currency) return { ok: false, error: { field: 'currency', code: 'invalid' } }

  // Fall back to the default rather than erroring, matching the previous
  // behaviour: a stale cached form should not block a gift.
  const currency = config.currencies.some((c) => c.code === currencyRaw) ? currencyRaw : config.defaultCurrency

  if (!config.methods.includes(requestedMethod)) {
    return { ok: false, error: { field: 'method', code: 'unavailable' } }
  }
  // Cards cannot be charged in every currency the Eparchy accepts — ERN in
  // particular. Reject here rather than letting Stripe reject it later, when
  // the donor has already been redirected.
  if (requestedMethod === 'stripe' && !canPayByCard(config, currency)) {
    return { ok: false, error: { field: 'method', code: 'currency-not-supported' } }
  }

  // Recurring giving is not wired to Stripe Billing yet, so a monthly card gift
  // would take one payment and silently never repeat. Only manual pledges may
  // be monthly.
  if (frequency === 'monthly' && (!config.allowRecurring || requestedMethod === 'stripe')) {
    return { ok: false, error: { field: 'frequency', code: 'unavailable' } }
  }

  const amountResult = resolveAmount(sanitize(formData.get('amount')), currency, {
    minAmount: config.minAmount,
    maxAmount: config.maxAmount,
  })
  if (!amountResult.ok) {
    return { ok: false, error: { field: 'amount', code: amountResult.reason, limit: amountResult.limit } }
  }

  return {
    ok: true,
    value: {
      name,
      email,
      message,
      anonymous,
      frequency,
      locale,
      currency,
      amountMinor: amountResult.minor,
      amount: amountResult.major,
      method: requestedMethod,
    },
  }
}

/**
 * Map a validation error to a key in the `donate.errors` message catalogue so
 * the form can show it in the donor's language. `limit` is interpolated by the
 * client where the message needs it.
 */
export function errorMessageKey(error: ValidationError): string {
  switch (error.field) {
    case 'name':
      return 'nameRequired'
    case 'email':
      return 'emailInvalid'
    case 'message':
      return 'messageTooLong'
    case 'currency':
      return 'currencyInvalid'
    case 'frequency':
      return 'recurringUnavailable'
    case 'form':
      return 'donationsDisabled'
    case 'method':
      return error.code === 'currency-not-supported' ? 'cardCurrencyUnsupported' : 'methodUnavailable'
    case 'amount':
      if (error.code === 'below-min') return 'amountBelowMin'
      if (error.code === 'above-max') return 'amountAboveMax'
      return 'amountInvalid'
  }
}
