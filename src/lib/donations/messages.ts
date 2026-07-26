/**
 * Locale-aware message lookup for donation email.
 *
 * next-intl's `getTranslations` resolves the locale from the request cookie
 * (see src/i18n/request.ts), which is exactly wrong here: the receipt for a
 * Tigrinya-speaking donor is sent from a Stripe webhook, a request that carries
 * no cookie and belongs to no visitor. Reading the catalogue directly lets the
 * email be written in the language the donor chose on the form, which is stored
 * on the donation record.
 *
 * The strings themselves still live in messages/en.json and messages/ti.json —
 * there is no second catalogue to keep in sync.
 */

export type DonationLocale = 'en' | 'ti'

export function normalizeLocale(value: unknown): DonationLocale {
  return String(value ?? '') === 'ti' ? 'ti' : 'en'
}

type Catalogue = Record<string, unknown>

const cache = new Map<DonationLocale, Catalogue>()

async function loadCatalogue(locale: DonationLocale): Promise<Catalogue> {
  const cached = cache.get(locale)
  if (cached) return cached
  const messages = (await import(`../../../messages/${locale}.json`)).default as Catalogue
  cache.set(locale, messages)
  return messages
}

/** Resolve a dotted path such as `donate.email.greeting`. */
function lookup(catalogue: Catalogue, path: string): string | undefined {
  let node: unknown = catalogue
  for (const segment of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[segment]
  }
  return typeof node === 'string' ? node : undefined
}

/** Substitute `{name}`-style placeholders, matching next-intl's syntax. */
function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

export type Translator = (key: string, values?: Record<string, string | number>) => string

/**
 * Build a translator for one locale.
 *
 * A missing key falls back to English and then to the key itself rather than
 * throwing — an untranslated line in a receipt is a blemish, a thrown error is
 * a receipt the donor never gets.
 */
export async function getDonationTranslator(locale: DonationLocale): Promise<Translator> {
  const [primary, fallback] = await Promise.all([
    loadCatalogue(locale),
    locale === 'en' ? Promise.resolve(null) : loadCatalogue('en'),
  ])

  return (key, values) => {
    const template = lookup(primary, key) ?? (fallback ? lookup(fallback, key) : undefined) ?? key
    return values ? interpolate(template, values) : template
  }
}
