import Stripe from 'stripe'

/**
 * The Stripe client. **Server-only — never import this from a Client Component.**
 *
 * STRIPE_SECRET_KEY grants full control of the account (issuing refunds, reading
 * every donor's details, moving money), so it must never be bundled for the
 * browser. Three things keep it out:
 *
 *  1. This module is imported only from server actions and route handlers.
 *  2. The key is read lazily inside `getStripe()`, so merely importing a helper
 *     from this file does not embed the value.
 *  3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is the only Stripe value with a
 *     NEXT_PUBLIC_ prefix, so Next.js inlines nothing else.
 *
 * ── Account assumption ──────────────────────────────────────────────────────
 * Stripe does not support Eritrea as a business or payout country. This
 * integration therefore assumes an account held by a legal entity registered in
 * a Stripe-supported country (a diaspora support association, a partner
 * diocese, or a fiscal sponsor) collecting on the Eparchy's behalf. That
 * entity, its country, its settlement currency and its payout schedule are all
 * properties of the secret key and of donation-settings — none of them is
 * hardcoded here. Changing the entity is an env-var change, not a code change.
 */

/**
 * Pinned so a Stripe-side API change can never alter behaviour without a
 * deploy. Must match the version this SDK release ships against — bump both
 * together, and re-run the webhook tests when you do.
 */
const API_VERSION: Stripe.LatestApiVersion = '2026-06-24.dahlia'

let cached: Stripe | null = null

/** True when the server has a secret key configured. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

/** True when the configured key is a test-mode key (`sk_test_…`). */
export function isStripeTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').trim().startsWith('sk_test_')
}

/**
 * Lazily construct the Stripe client.
 *
 * Throws when the key is missing rather than returning a dud client, so a
 * misconfigured deploy fails at the point of use with a clear message instead
 * of producing Checkout Sessions against nothing.
 */
export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error(
      '[stripe] STRIPE_SECRET_KEY is not set. Card donations cannot be created; ' +
        'switch donation-settings.provider to "manual" or configure the key.',
    )
  }
  cached = new Stripe(key, {
    apiVersion: API_VERSION,
    // Identifies this integration in the Stripe dashboard's request logs.
    appInfo: { name: 'Eparchy of Segheneyti', url: 'https://segeneyti.org' },
    // Two retries on network/5xx. Stripe's SDK attaches an idempotency key to
    // retried writes automatically, so a retried Checkout Session cannot become
    // two sessions (and therefore cannot become two charges).
    maxNetworkRetries: 2,
  })
  return cached
}

/** Reset the memoized client. Tests only. */
export function __resetStripeClient(): void {
  cached = null
}

/**
 * Metadata attached to every Checkout Session and PaymentIntent.
 *
 * This is what makes a row in our ledger reconcilable against the Stripe
 * dashboard without a spreadsheet: the donation id and reference are visible on
 * the Stripe side, and the Stripe ids are stored on ours. Deliberately carries
 * no donor email or message — Stripe already collects the email it needs for
 * its own receipt, and metadata is visible to everyone with dashboard access.
 */
export interface DonationMetadata extends Record<string, string> {
  donationId: string
  reference: string
  locale: string
  anonymous: string
}
