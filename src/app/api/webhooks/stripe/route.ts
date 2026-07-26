import { NextResponse } from 'next/server'
import { after } from 'next/server'
import type Stripe from 'stripe'
import { getPayload } from '@/lib/payload/client'
import { getStripe, isStripeConfigured } from '@/lib/donations/stripe'
import { sendDonorReceipt, sendEparchyNotification } from '@/lib/donations/receipts'
import { normalizeLocale } from '@/lib/donations/messages'

/**
 * Stripe webhook — the ONLY thing in this codebase that may mark a donation paid.
 *
 * The browser landing on /donate/complete proves nothing: anyone can type that
 * URL, and a donor whose connection drops after paying never loads it at all.
 * Payment truth arrives here, signed by Stripe, or it does not arrive.
 *
 * Four properties this handler has to get right:
 *
 *  1. **Signature over the raw body.** `await req.text()` — the exact bytes
 *     Stripe signed. Parsing to JSON first and re-serialising changes key order
 *     and whitespace, so the computed HMAC no longer matches and every event is
 *     rejected. This is the classic App Router mistake.
 *  2. **Idempotency.** Stripe delivers at least once and retries on any non-2xx.
 *     The event id is inserted into `stripe-events` under a UNIQUE constraint
 *     *before* anything else happens; a replay loses that insert and returns
 *     without touching the ledger. A duplicated row in a church's donation
 *     record is worse than a missing one — it will be reconciled against a bank
 *     statement and found wrong.
 *  3. **Fast 2xx.** Stripe times out at 20 seconds and retries. Receipt email
 *     is handed to `after()` so it runs once the response is already sent; a
 *     slow SMTP server can no longer cause a replayed payment event.
 *  4. **No card data, ever.** Nothing here reads or stores a PAN, and the only
 *     card detail persisted is Stripe's own decline reason string.
 */

// Must run on Node: signature verification needs the raw body and the crypto
// primitives Stripe's SDK uses, and Payload's Postgres pool is not edge-safe.
export const runtime = 'nodejs'
// Never cached, never statically analysed — every delivery must reach the handler.
export const dynamic = 'force-dynamic'

/** Events we act on. Anything else is acknowledged and recorded as ignored. */
const HANDLED = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
])

/**
 * Subscription lifecycle. Recurring giving via Stripe Billing is NOT enabled
 * yet (see the `frequency` guard in lib/donations/submission.ts), so these are
 * acknowledged and recorded rather than dropped: if the endpoint is subscribed
 * to them by mistake, staff can see that in the event log instead of wondering
 * where the money went.
 */
const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

type DonationDoc = {
  id: string | number
  status: string
  donorName: string
  donorEmail: string
  /** Postgres `numeric` — arrives as a string. Always read it through `minorOf`. */
  amountMinor: number | string
  currency: string
  reference?: string | null
  message?: string | null
  locale?: string | null
  provider?: string | null
  adminNotes?: string | null
}

/**
 * The stored amount as a number.
 *
 * `amount_minor` is a Postgres `numeric`, which the driver returns as a string.
 * Comparing that string to Stripe's integer with `!==` is always true, so
 * without this every single payment would look like an amount mismatch and get
 * flagged in the admin notes.
 */
function minorOf(donation: Pick<DonationDoc, 'amountMinor'>): number {
  return Number(donation.amountMinor ?? 0)
}

/** What the handler decided to do with an event, for the ledger and the log. */
interface Outcome {
  status: 'processed' | 'ignored' | 'failed'
  donationId?: string | number
  error?: string
  /** Queued for after the response is sent. */
  email?: { donation: DonationDoc; kind: 'succeeded' | 'refunded'; notify: 'succeeded' | 'refunded' | 'disputed' }
}

/**
 * Find the donation an event belongs to.
 *
 * `metadata.donationId` is set on both the Checkout Session and the
 * PaymentIntent when the session is created, so it is present on every event we
 * handle. The id lookups are fallbacks for events that predate the metadata or
 * arrive from a manually created payment.
 */
async function findDonation(
  payload: any,
  opts: { donationId?: string; sessionId?: string; paymentIntentId?: string },
): Promise<DonationDoc | null> {
  if (opts.donationId) {
    try {
      const doc = await payload.findByID({
        collection: 'donations',
        id: opts.donationId,
        depth: 0,
        overrideAccess: true,
      })
      if (doc) return doc as DonationDoc
    } catch {
      // Falls through to the id lookups below — a metadata value pointing at a
      // deleted record should not abandon an otherwise resolvable event.
    }
  }

  const or: Array<Record<string, unknown>> = []
  if (opts.sessionId) or.push({ stripeSessionId: { equals: opts.sessionId } })
  if (opts.paymentIntentId) or.push({ stripePaymentIntentId: { equals: opts.paymentIntentId } })
  if (or.length === 0) return null

  const found = await payload.find({
    collection: 'donations',
    where: { or },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (found.docs?.[0] as DonationDoc) ?? null
}

/**
 * Write a status change. `context.stripeWebhook` is what satisfies the guard in
 * the donations collection — the only place it is ever set.
 */
async function updateDonation(payload: any, id: string | number, data: Record<string, unknown>) {
  await payload.update({
    collection: 'donations',
    id,
    overrideAccess: true,
    context: { stripeWebhook: true },
    data,
  })
}

/** Extract the PaymentIntent id whether it is expanded or a bare string. */
function idOf(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined
  return typeof value === 'string' ? value : value.id
}

async function handleEvent(payload: any, event: Stripe.Event): Promise<Outcome> {
  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    return {
      status: 'ignored',
      error: 'Recurring giving is not enabled; subscription events are not processed.',
    }
  }
  if (!HANDLED.has(event.type)) return { status: 'ignored' }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      const donation = await findDonation(payload, {
        donationId: session.metadata?.donationId,
        sessionId: session.id,
        paymentIntentId: idOf(session.payment_intent),
      })
      if (!donation) return { status: 'failed', error: `No donation for session ${session.id}` }

      // Bank debits and vouchers complete asynchronously: the session is
      // "complete" while the money is still in flight. Only `paid` is paid.
      if (session.payment_status !== 'paid') {
        await updateDonation(payload, donation.id, {
          stripePaymentIntentId: idOf(session.payment_intent),
          stripeEventId: event.id,
        })
        return { status: 'processed', donationId: donation.id }
      }

      return markSucceeded(payload, donation, event, {
        paymentIntentId: idOf(session.payment_intent),
        customerId: idOf(session.customer as string | { id: string } | null),
        // What Stripe actually collected, which is the authoritative number.
        amountMinor: session.amount_total ?? undefined,
        currency: session.currency ?? undefined,
      })
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const donation = await findDonation(payload, {
        donationId: intent.metadata?.donationId,
        paymentIntentId: intent.id,
      })
      if (!donation) return { status: 'failed', error: `No donation for payment intent ${intent.id}` }

      return markSucceeded(payload, donation, event, {
        paymentIntentId: intent.id,
        customerId: idOf(intent.customer as string | { id: string } | null),
        amountMinor: intent.amount_received || intent.amount,
        currency: intent.currency,
        chargeId: idOf((intent as unknown as { latest_charge?: string | { id: string } }).latest_charge),
      })
    }

    case 'checkout.session.async_payment_failed':
    case 'payment_intent.payment_failed': {
      const object = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session
      const isIntent = event.type === 'payment_intent.payment_failed'
      const intent = isIntent ? (object as Stripe.PaymentIntent) : null
      const session = isIntent ? null : (object as Stripe.Checkout.Session)

      const donation = await findDonation(payload, {
        donationId: object.metadata?.donationId ?? undefined,
        sessionId: session?.id,
        paymentIntentId: intent?.id ?? idOf(session?.payment_intent),
      })
      if (!donation) return { status: 'failed', error: `No donation for failed payment ${object.id}` }

      // A failure must never overwrite a success. Stripe can deliver events out
      // of order, and a late `payment_failed` for a retried attempt would
      // otherwise un-pay a confirmed gift.
      if (donation.status === 'succeeded' || donation.status === 'refunded') {
        return { status: 'ignored', donationId: donation.id, error: 'Donation already settled; failure ignored.' }
      }

      await updateDonation(payload, donation.id, {
        status: 'failed',
        stripeEventId: event.id,
        // Stripe's decline reason is a code and a sentence — never card data.
        failureReason: intent?.last_payment_error?.message?.slice(0, 250) ?? 'Payment was not completed.',
      })
      return { status: 'processed', donationId: donation.id }
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const donation = await findDonation(payload, {
        donationId: session.metadata?.donationId,
        sessionId: session.id,
      })
      if (!donation) return { status: 'ignored', error: `No donation for expired session ${session.id}` }
      if (donation.status !== 'pending') {
        return { status: 'ignored', donationId: donation.id, error: 'Donation already settled.' }
      }
      await updateDonation(payload, donation.id, {
        status: 'failed',
        stripeEventId: event.id,
        failureReason: 'Checkout was not completed before the session expired.',
      })
      return { status: 'processed', donationId: donation.id }
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const donation = await findDonation(payload, {
        donationId: charge.metadata?.donationId,
        paymentIntentId: idOf(charge.payment_intent),
      })
      if (!donation) return { status: 'failed', error: `No donation for refunded charge ${charge.id}` }

      // A partial refund is not a refunded gift — most of it was still given.
      // Record the refunded amount and leave the status alone so the ledger
      // total stays truthful; only a full refund flips the status.
      const fullyRefunded = charge.amount_refunded >= charge.amount
      await updateDonation(payload, donation.id, {
        ...(fullyRefunded ? { status: 'refunded' } : {}),
        refundedAmountMinor: charge.amount_refunded,
        stripeChargeId: charge.id,
        stripeEventId: event.id,
      })

      return {
        status: 'processed',
        donationId: donation.id,
        // Only tell the donor when the whole gift came back. A partial refund is
        // usually a correction staff already discussed with them.
        email: fullyRefunded
          ? { donation, kind: 'refunded', notify: 'refunded' }
          : undefined,
      }
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      const donation = await findDonation(payload, {
        donationId: (dispute.metadata as Record<string, string> | null)?.donationId,
        paymentIntentId: idOf(dispute.payment_intent),
      })
      if (!donation) return { status: 'failed', error: `No donation for dispute ${dispute.id}` }

      await updateDonation(payload, donation.id, {
        status: 'disputed',
        stripeEventId: event.id,
        adminNotes: [donation.adminNotes, `Dispute ${dispute.id} opened: ${dispute.reason}.`]
          .filter(Boolean)
          .join('\n'),
      })
      // Staff must act on a dispute within Stripe's evidence deadline, so this
      // one always notifies — but never the donor, who opened it.
      return {
        status: 'processed',
        donationId: donation.id,
        email: { donation, kind: 'refunded', notify: 'disputed' },
      }
    }

    default:
      return { status: 'ignored' }
  }
}

/** Shared success path for the session and payment-intent routes into it. */
async function markSucceeded(
  payload: any,
  donation: DonationDoc,
  event: Stripe.Event,
  details: {
    paymentIntentId?: string
    customerId?: string
    chargeId?: string
    amountMinor?: number
    currency?: string
  },
): Promise<Outcome> {
  // Already settled — a retry, or the sibling event for the same payment
  // (checkout.session.completed and payment_intent.succeeded both fire).
  if (donation.status === 'succeeded' || donation.status === 'refunded' || donation.status === 'disputed') {
    return { status: 'ignored', donationId: donation.id, error: 'Donation already settled.' }
  }

  const data: Record<string, unknown> = {
    status: 'succeeded',
    confirmedAt: new Date().toISOString(),
    stripeEventId: event.id,
  }
  if (details.paymentIntentId) data.stripePaymentIntentId = details.paymentIntentId
  if (details.customerId) data.stripeCustomerId = details.customerId
  if (details.chargeId) data.stripeChargeId = details.chargeId

  // Trust Stripe's number over ours: it is what the donor was actually charged.
  // A mismatch means something is wrong with our session creation, so it is
  // flagged in the record rather than silently accepted.
  const recorded = minorOf(donation)
  if (typeof details.amountMinor === 'number' && details.amountMinor !== recorded) {
    data.amountMinor = details.amountMinor
    data.adminNotes = [
      donation.adminNotes,
      `Amount reconciled from Stripe: recorded ${recorded}, charged ${details.amountMinor}.`,
    ]
      .filter(Boolean)
      .join('\n')
    console.warn('[stripe-webhook] amount mismatch', {
      donationId: donation.id,
      recorded,
      charged: details.amountMinor,
    })
  }
  if (details.currency) data.currency = details.currency.toUpperCase()

  await updateDonation(payload, donation.id, data)

  return {
    status: 'processed',
    donationId: donation.id,
    email: {
      donation: {
        ...donation,
        amountMinor: (data.amountMinor as number) ?? recorded,
        currency: (data.currency as string) ?? donation.currency,
      },
      kind: 'succeeded',
      notify: 'succeeded',
    },
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret || !isStripeConfigured()) {
    // 500, not 400: this is our misconfiguration, and Stripe retrying after we
    // fix it is exactly what we want.
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // THE RAW BODY. Do not replace with req.json() — see the header comment.
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret)
  } catch (err) {
    // An unverified body is not from Stripe. 400 so Stripe stops retrying, and
    // no detail is echoed back to whoever sent it.
    console.error('[stripe-webhook] signature verification failed', String(err).slice(0, 200))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = await getPayload()

  // ── Idempotency: claim the event before doing anything with it ────────────
  // Insert-first, so the UNIQUE index decides. A find-then-create check would
  // race between two concurrent deliveries, which is the exact case retries
  // produce.
  let eventRowId: string | number
  try {
    const row = (await payload.create({
      collection: 'stripe-events',
      overrideAccess: true,
      data: { eventId: event.id, type: event.type, status: 'received', livemode: event.livemode },
    })) as any
    eventRowId = row.id
  } catch {
    // Either a replay, or the database is unwell. Distinguish by looking: if the
    // row is there, this is a duplicate and we are done.
    try {
      const existing = await payload.find({
        collection: 'stripe-events',
        where: { eventId: { equals: event.id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        return NextResponse.json({ received: true, duplicate: true })
      }
    } catch (lookupErr) {
      console.error('[stripe-webhook] idempotency lookup failed', lookupErr)
    }
    // Could not claim the event and could not prove it was a duplicate. 500 so
    // Stripe retries rather than the payment being lost.
    return NextResponse.json({ error: 'Could not record event' }, { status: 500 })
  }

  let outcome: Outcome
  try {
    outcome = await handleEvent(payload, event)
  } catch (err) {
    console.error('[stripe-webhook] handler error', { type: event.type, id: event.id, err })
    outcome = { status: 'failed', error: String(err).slice(0, 500) }
  }

  try {
    await payload.update({
      collection: 'stripe-events',
      id: eventRowId,
      overrideAccess: true,
      data: {
        status: outcome.status,
        // Donation ids are numeric in Postgres; the relationship field is typed
        // to match.
        donation: outcome.donationId != null ? Number(outcome.donationId) : undefined,
        error: outcome.error,
      },
    })
  } catch (err) {
    console.error('[stripe-webhook] could not update event row', err)
  }

  // Receipts run after the response is flushed. Stripe's 20-second timeout is
  // for acknowledgement, not for our mail server.
  if (outcome.email) {
    const { donation, kind, notify } = outcome.email
    after(async () => {
      const record = {
        id: donation.id,
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        amountMinor: minorOf(donation),
        currency: donation.currency,
        reference: donation.reference,
        message: donation.message,
        locale: normalizeLocale(donation.locale),
        method: 'stripe' as const,
      }
      // Disputes are a staff matter — do not email the donor who raised one.
      if (notify !== 'disputed') await sendDonorReceipt(payload as any, record, kind)
      await sendEparchyNotification(payload as any, record, notify)
    })
  }

  // A handler failure still returns 200 when the event was recorded: retrying
  // will not fix "no donation matches this payment", and the event row carries
  // the error for staff. Genuine transient failures are surfaced by the 500
  // paths above, which Stripe does retry.
  return NextResponse.json({ received: true, status: outcome.status })
}

/**
 * Stripe only ever POSTs. A GET is someone poking at the URL — answer plainly
 * without revealing whether the secret is configured.
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
