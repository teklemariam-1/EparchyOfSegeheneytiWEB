import { isStripeConfigured, isStripeTestMode } from '../../../lib/donations/stripe'

/**
 * Server-rendered readiness panel on the Donation Settings page.
 *
 * Stripe credentials are environment variables, not fields — a key stored in a
 * globals row ends up in every database backup, and rotating a compromised key
 * should never require a database write. The cost of that decision is that an
 * admin setting "Payment methods offered" to Card sees… nothing happen, with no
 * explanation, because `isStripeConfigured()` is false on the server.
 *
 * This closes that gap: it reports what the server actually has, so the setting
 * above it can be understood rather than guessed at. It is a Server Component,
 * so it reads the environment directly — the values themselves are never sent
 * to the browser, only whether they are present and which mode they imply.
 */

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '0.9rem 1rem',
  marginBottom: '1.5rem',
  background: 'var(--theme-elevation-50)',
  fontSize: '0.85rem',
  lineHeight: 1.55,
}

const code: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  background: 'var(--theme-elevation-100)',
  padding: '0.1rem 0.3rem',
  borderRadius: 3,
}

function Dot({ tone }: { tone: 'good' | 'warn' | 'off' }) {
  const color = tone === 'good' ? '#1f883d' : tone === 'warn' ? '#bf8700' : 'var(--theme-elevation-400)'
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        marginRight: 8,
        verticalAlign: 'middle',
      }}
    />
  )
}

export function StripeStatus() {
  const hasSecret = isStripeConfigured()
  const testMode = isStripeTestMode()
  const hasWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim())

  const tone: 'good' | 'warn' | 'off' = !hasSecret ? 'off' : hasWebhook ? (testMode ? 'warn' : 'good') : 'warn'

  const headline = !hasSecret
    ? 'Card payments are OFF — no Stripe key on the server'
    : testMode
      ? 'Stripe is in TEST mode — no real money will move'
      : hasWebhook
        ? 'Stripe is LIVE'
        : 'Stripe key present, but the webhook secret is missing'

  return (
    <div style={box}>
      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
        <Dot tone={tone} />
        {headline}
      </strong>

      <div style={{ marginBottom: '0.6rem' }}>
        <Dot tone={hasSecret ? (testMode ? 'warn' : 'good') : 'off'} />
        <code style={code}>STRIPE_SECRET_KEY</code>{' '}
        {hasSecret ? (testMode ? 'set (test key)' : 'set (live key)') : 'not set'}
        <br />
        <Dot tone={hasWebhook ? 'good' : 'off'} />
        <code style={code}>STRIPE_WEBHOOK_SECRET</code> {hasWebhook ? 'set' : 'not set'}
      </div>

      {!hasSecret && (
        <p style={{ margin: 0 }}>
          Choosing a card option in <em>Payment methods offered</em> below will have no effect until
          this key exists — the donate page falls back to manual transfer on its own, so donors are
          never shown a button that cannot work. These are environment variables, not fields: set
          them in the Vercel project settings (or <code style={code}>.env.local</code> for local
          development) and redeploy. Keys are deliberately never stored in the database.
        </p>
      )}

      {hasSecret && !hasWebhook && (
        <p style={{ margin: 0 }}>
          Payments can be started but <strong>never confirmed</strong>: a donation is only marked
          succeeded by a signature-verified webhook, and without this secret{' '}
          <code style={code}>/api/webhooks/stripe</code> rejects every delivery. Gifts would sit at
          Pending forever. Add the signing secret from the Stripe webhook endpoint before accepting
          real donations.
        </p>
      )}

      {hasSecret && hasWebhook && testMode && (
        <p style={{ margin: 0 }}>
          Donors see a “test mode” notice and only Stripe’s test cards will work. Swap both values
          for live keys when the receiving entity is ready — see{' '}
          <code style={code}>docs/stripe-entity-options.md</code>.
        </p>
      )}

      <p style={{ margin: '0.6rem 0 0', color: 'var(--theme-elevation-600)' }}>
        <strong>No publishable key is needed.</strong> Card details are entered on Stripe’s own
        hosted Checkout page, so no Stripe script runs on this site and{' '}
        <code style={code}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is never read. It only becomes
        relevant if the embedded Payment Element is adopted later. The two keys above are the only
        ones that do anything.
      </p>

      <p style={{ margin: '0.6rem 0 0', color: 'var(--theme-elevation-600)' }}>
        Manual bank transfer works regardless of any of this, and is the only method available to
        donors inside Eritrea — Stripe cannot charge in ERN. Do not switch it off.
      </p>
    </div>
  )
}

export default StripeStatus
