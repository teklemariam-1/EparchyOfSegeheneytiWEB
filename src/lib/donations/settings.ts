import { isStripeSupportedCurrency, normalizeCurrency } from './amounts'

/**
 * One resolution of donation-settings, shared by the donate page and by both
 * server actions.
 *
 * The point is that the page and the action can never disagree. If the form
 * offers a currency the action rejects, the donor hits an error after filling
 * everything in; if the action accepts one the page never offered, a crafted
 * POST gets to choose its own terms. Both call this.
 *
 * Pure — no payload, no env reads beyond what is passed in — so the same
 * function is unit-testable and safe to import from a Client Component for
 * types.
 */

export type PaymentMethod = 'manual' | 'stripe'

export interface RawDonationSettings {
  enabled?: boolean | null
  provider?: string | null
  preferManualForCountries?: string | null
  presetAmounts?: Array<{ amount?: number | null }> | null
  defaultCurrency?: string | null
  minAmount?: number | null
  maxAmount?: number | null
  currencies?: Array<{ code?: string | null; label?: string | null }> | null
  stripeCurrencies?: Array<{ code?: string | null; label?: string | null }> | null
  allowCustomAmount?: boolean | null
  allowRecurring?: boolean | null
  stripeStatementDescriptor?: string | null
  publicTransferDetails?: {
    accountHolder?: string | null
    bankName?: string | null
    accountNumber?: string | null
    swift?: string | null
  } | null
  manualInstructions?: string | null
  stripeAccountNotice?: string | null
  intro?: string | null
  thankYou?: string | null
}

export interface CurrencyOption {
  code: string
  label?: string
  /** Whether a card payment can be taken in this currency. */
  card: boolean
}

export interface ResolvedDonationConfig {
  enabled: boolean
  /** Methods a donor may actually use, after settings and server config. */
  methods: PaymentMethod[]
  currencies: CurrencyOption[]
  defaultCurrency: string
  presetAmounts: number[]
  allowCustomAmount: boolean
  allowRecurring: boolean
  minAmount?: number
  maxAmount?: number
  /** ISO country codes that should be shown manual transfer first. */
  preferManualCountries: string[]
  transferDetails: {
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    swift?: string
    extraInstructions?: string
  }
  /** True when staff have published enough for a donor to actually transfer. */
  hasTransferDetails: boolean
  stripeAccountNotice?: string
  statementDescriptor?: string
}

function cleanList(
  list: Array<{ code?: string | null; label?: string | null }> | null | undefined,
): CurrencyOption[] {
  if (!Array.isArray(list)) return []
  const seen = new Set<string>()
  const out: CurrencyOption[] = []
  for (const entry of list) {
    const code = normalizeCurrency(entry?.code)
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push({ code, label: entry?.label ?? undefined, card: false })
  }
  return out
}

function trimmed(value: unknown): string | undefined {
  const s = String(value ?? '').trim()
  return s === '' ? undefined : s
}

/**
 * @param settings  the donation-settings global, already localized
 * @param stripeReady  whether the server has STRIPE_SECRET_KEY. Passed in rather
 *   than read here so this stays pure, and so the card option disappears
 *   automatically on a deploy that lacks the key instead of sending donors to a
 *   checkout that cannot be created.
 */
export function resolveDonationConfig(
  settings: RawDonationSettings | null | undefined,
  stripeReady: boolean,
): ResolvedDonationConfig {
  const s = settings ?? {}
  const defaultCurrency = normalizeCurrency(s.defaultCurrency) || 'ERN'

  // The default currency is always offered, even if staff forgot to list it.
  const configured = cleanList(s.currencies)
  const currencyCodes = configured.some((c) => c.code === defaultCurrency)
    ? configured
    : [{ code: defaultCurrency, label: undefined, card: false }, ...configured]

  // Card currencies: what staff listed, filtered to what Stripe can actually
  // charge. An unsupported code in the settings is dropped rather than offered
  // and then rejected at checkout. Empty list falls back to USD, since offering
  // the card method with no chargeable currency would be a dead button.
  const stripeConfigured = cleanList(s.stripeCurrencies).filter((c) => isStripeSupportedCurrency(c.code))
  const stripeCodes = new Set(
    (stripeConfigured.length > 0 ? stripeConfigured : [{ code: 'USD' }]).map((c) => c.code),
  )

  const provider = String(s.provider ?? 'manual')
  const wantsStripe = provider === 'stripe' || provider === 'both'
  const wantsManual = provider === 'manual' || provider === 'both'

  const methods: PaymentMethod[] = []
  // Manual is listed first deliberately: it is the method that works for
  // everyone, including donors in Eritrea. See the country-aware ordering in
  // the donate page for how this is presented.
  if (wantsManual) methods.push('manual')
  if (wantsStripe && stripeReady) methods.push('stripe')
  // "Card only" with no key configured would leave the page with no way to
  // give at all. Fall back to manual rather than showing an empty page.
  if (methods.length === 0) methods.push('manual')

  const currencies: CurrencyOption[] = currencyCodes.map((c) => ({
    ...c,
    // Merge in any label staff set on the Stripe-side list.
    label: c.label ?? stripeConfigured.find((sc) => sc.code === c.code)?.label,
    card: methods.includes('stripe') && stripeCodes.has(c.code),
  }))

  // A currency staff enabled for cards but forgot to add to the main list would
  // otherwise be unreachable. Add it so the card option is not silently lost.
  if (methods.includes('stripe')) {
    for (const sc of stripeConfigured) {
      if (!currencies.some((c) => c.code === sc.code)) currencies.push({ ...sc, card: true })
    }
  }

  const details = s.publicTransferDetails ?? {}
  const transferDetails = {
    accountHolder: trimmed(details.accountHolder),
    bankName: trimmed(details.bankName),
    accountNumber: trimmed(details.accountNumber),
    swift: trimmed(details.swift),
    extraInstructions: trimmed(s.manualInstructions),
  }

  return {
    enabled: s.enabled === true,
    methods,
    currencies,
    defaultCurrency,
    presetAmounts: (s.presetAmounts ?? [])
      .map((p) => Number(p?.amount))
      .filter((n) => Number.isFinite(n) && n > 0),
    allowCustomAmount: s.allowCustomAmount !== false,
    allowRecurring: s.allowRecurring !== false,
    minAmount: s.minAmount == null ? undefined : Number(s.minAmount),
    maxAmount: s.maxAmount == null ? undefined : Number(s.maxAmount),
    preferManualCountries: String(s.preferManualForCountries ?? 'ER')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
    transferDetails,
    // An account number alone is enough to transfer to; a bank name alone is
    // not. This is what decides whether the donor sees instructions or a
    // "contact the chancery" fallback.
    hasTransferDetails: Boolean(transferDetails.accountNumber || transferDetails.extraInstructions),
    stripeAccountNotice: trimmed(s.stripeAccountNotice),
    statementDescriptor: trimmed(s.stripeStatementDescriptor),
  }
}

/** Whether a card payment may be taken in this currency under this config. */
export function canPayByCard(config: ResolvedDonationConfig, currency: string): boolean {
  if (!config.methods.includes('stripe')) return false
  const code = normalizeCurrency(currency)
  return config.currencies.some((c) => c.code === code && c.card)
}
