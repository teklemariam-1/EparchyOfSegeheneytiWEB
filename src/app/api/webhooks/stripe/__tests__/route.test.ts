import { describe, it, expect, vi, beforeEach } from 'vitest'
import Stripe from 'stripe'

/**
 * Webhook handler tests.
 *
 * Signature verification is exercised for real: the tests construct a genuine
 * Stripe client against a dummy key and use its own `generateTestHeaderString`
 * to sign fixtures. Nothing about the HMAC is faked, so "an invalid signature is
 * rejected" is a claim about the actual verification path rather than about a
 * mock.
 */

const WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests'

// A real client — the constructor does no I/O, and webhook verification is
// entirely local.
const stripe = new Stripe('sk_test_dummy_key_for_unit_tests', {
  apiVersion: '2026-06-24.dahlia',
})

vi.mock('@/lib/payload/client', () => ({ getPayload: vi.fn() }))
vi.mock('@/lib/donations/receipts', () => ({
  sendDonorReceipt: vi.fn().mockResolvedValue(true),
  sendEparchyNotification: vi.fn().mockResolvedValue(true),
}))
vi.mock('@/lib/donations/stripe', () => ({
  getStripe: () => stripe,
  isStripeConfigured: () => true,
}))
// `after()` needs a Next.js request context. Run the callback immediately so
// the deferred receipt work is still observable in tests.
vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, after: (fn: () => unknown) => fn() }
})

import { getPayload } from '@/lib/payload/client'
import { sendDonorReceipt, sendEparchyNotification } from '@/lib/donations/receipts'
import { POST, GET } from '../route'

interface MockOptions {
  /** The donation `findByID` resolves to, or null for "not found". */
  donation?: Record<string, unknown> | null
  /** Make the stripe-events insert fail, simulating a replay. */
  eventInsertFails?: boolean
  /** How many existing stripe-events rows the duplicate lookup finds. */
  existingEvents?: number
}

function mockPayload(opts: MockOptions = {}) {
  const donationsUpdate = vi.fn().mockResolvedValue({})
  const eventsUpdate = vi.fn().mockResolvedValue({})

  const create = vi.fn(async ({ collection }: any) => {
    if (collection === 'stripe-events') {
      if (opts.eventInsertFails) throw new Error('duplicate key value violates unique constraint')
      return { id: 99 }
    }
    return { id: 1 }
  })

  const update = vi.fn(async (args: any) => {
    if (args.collection === 'donations') return donationsUpdate(args)
    return eventsUpdate(args)
  })

  const findByID = vi.fn(async () => {
    if (opts.donation === null) throw new Error('not found')
    return opts.donation ?? null
  })

  const find = vi.fn(async ({ collection }: any) => {
    if (collection === 'stripe-events') return { totalDocs: opts.existingEvents ?? 0, docs: [] }
    return { totalDocs: 0, docs: [] }
  })

  ;(getPayload as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
    create,
    update,
    findByID,
    find,
  })

  return { create, update, find, findByID, donationsUpdate, eventsUpdate }
}

function buildEvent(type: string, object: Record<string, unknown>, id = 'evt_test_1') {
  return {
    id,
    object: 'event',
    api_version: '2026-06-24.dahlia',
    created: 1_700_000_000,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    type,
    data: { object },
  }
}

function signedRequest(event: unknown, secret = WEBHOOK_SECRET) {
  const body = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret })
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
    body,
  })
}

const paidSession = {
  id: 'cs_test_123',
  object: 'checkout.session',
  payment_status: 'paid',
  payment_intent: 'pi_test_123',
  customer: 'cus_test_1',
  amount_total: 5000,
  currency: 'usd',
  metadata: { donationId: '1', reference: 'SEG-4KQ7HP', locale: 'en', anonymous: 'false' },
}

/** A pending donation as Postgres returns it — note `amountMinor` is a STRING. */
const pendingDonation = {
  id: 1,
  status: 'pending',
  donorName: 'Tesfay Ghebre',
  donorEmail: 'tesfay@example.com',
  amountMinor: '5000',
  currency: 'USD',
  reference: 'SEG-4KQ7HP',
  locale: 'en',
  provider: 'stripe',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
})

describe('signature verification', () => {
  it('rejects a request with no stripe-signature header', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    const res = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(buildEvent('checkout.session.completed', paidSession)),
      }),
    )
    expect(res.status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('REJECTS an invalid signature and touches nothing', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    const event = buildEvent('checkout.session.completed', paidSession)
    const res = await POST(signedRequest(event, 'whsec_the_wrong_secret'))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'Invalid signature' })
    // Nothing was recorded and no donation was promoted.
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
  })

  it('rejects a body that was tampered with after signing', async () => {
    mockPayload({ donation: pendingDonation })
    const event = buildEvent('checkout.session.completed', paidSession)
    const body = JSON.stringify(event)
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })

    const tampered = JSON.stringify({
      ...event,
      data: { object: { ...paidSession, amount_total: 1 } },
    })
    const res = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: tampered,
      }),
    )
    expect(res.status).toBe(400)
  })

  it('accepts a correctly signed event', async () => {
    mockPayload({ donation: pendingDonation })
    const res = await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))
    expect(res.status).toBe(200)
  })

  it('refuses to run at all when the signing secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    mockPayload({ donation: pendingDonation })
    const res = await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))
    // 500, not 400: our misconfiguration, and Stripe should retry after a fix.
    expect(res.status).toBe(500)
  })

  it('answers 405 to a GET', async () => {
    expect((await GET()).status).toBe(405)
  })
})

describe('idempotency', () => {
  it('records the event id before processing', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'stripe-events',
        data: expect.objectContaining({ eventId: 'evt_test_1', type: 'checkout.session.completed' }),
      }),
    )
  })

  it('a DUPLICATE delivery is a no-op — the ledger is not written twice', async () => {
    // The unique constraint rejects the insert; the lookup confirms it is a
    // replay rather than a database fault.
    const mocks = mockPayload({
      donation: pendingDonation,
      eventInsertFails: true,
      existingEvents: 1,
    })

    const res = await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ received: true, duplicate: true })
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
    expect(sendDonorReceipt).not.toHaveBeenCalled()
  })

  it('returns 500 so Stripe retries when the event cannot be claimed or proven duplicate', async () => {
    const mocks = mockPayload({
      donation: pendingDonation,
      eventInsertFails: true,
      existingEvents: 0,
    })
    const res = await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))
    expect(res.status).toBe(500)
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
  })
})

describe('checkout.session.completed', () => {
  it('promotes the donation to succeeded, with the webhook context flag', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    expect(mocks.donationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'donations',
        id: 1,
        // This flag is what the collection's beforeChange guard checks — without
        // it the write is rejected.
        context: { stripeWebhook: true },
        data: expect.objectContaining({
          status: 'succeeded',
          stripePaymentIntentId: 'pi_test_123',
          stripeEventId: 'evt_test_1',
        }),
      }),
    )
  })

  it('does not flag an amount mismatch when the stored numeric arrives as a string', async () => {
    // Regression: `amount_minor` is a Postgres numeric and comes back as
    // '5000'. Comparing that to Stripe's 5000 with !== is always true, which
    // would have written a bogus "amount reconciled" note onto every gift.
    const mocks = mockPayload({ donation: pendingDonation })
    await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    const data = mocks.donationsUpdate.mock.calls[0][0].data
    expect(data.adminNotes).toBeUndefined()
    expect(data.amountMinor).toBeUndefined()
  })

  it('records Stripe’s amount when it genuinely differs', async () => {
    const mocks = mockPayload({ donation: { ...pendingDonation, amountMinor: '4000' } })
    await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    const data = mocks.donationsUpdate.mock.calls[0][0].data
    expect(data.amountMinor).toBe(5000)
    expect(String(data.adminNotes)).toContain('reconciled')
  })

  it('does NOT mark an unpaid session as succeeded', async () => {
    // Bank debits complete asynchronously — "complete" is not "paid".
    const mocks = mockPayload({ donation: pendingDonation })
    await POST(
      signedRequest(buildEvent('checkout.session.completed', { ...paidSession, payment_status: 'unpaid' })),
    )

    const data = mocks.donationsUpdate.mock.calls[0][0].data
    expect(data.status).toBeUndefined()
  })

  it('sends the receipt and the Eparchy notification after acknowledging', async () => {
    mockPayload({ donation: pendingDonation })
    await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    expect(sendDonorReceipt).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ donorEmail: 'tesfay@example.com', amountMinor: 5000 }),
      'succeeded',
    )
    expect(sendEparchyNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'succeeded')
  })

  it('does not re-promote an already succeeded donation', async () => {
    const mocks = mockPayload({ donation: { ...pendingDonation, status: 'succeeded' } })
    const res = await POST(signedRequest(buildEvent('payment_intent.succeeded', {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      amount_received: 5000,
      currency: 'usd',
      metadata: { donationId: '1' },
    })))

    await expect(res.json()).resolves.toEqual({ received: true, status: 'ignored' })
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
    expect(sendDonorReceipt).not.toHaveBeenCalled()
  })

  it('records a failure when no donation matches, without retrying forever', async () => {
    const mocks = mockPayload({ donation: null })
    const res = await POST(signedRequest(buildEvent('checkout.session.completed', paidSession)))

    // 200: a retry cannot make an unmatched payment match.
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ received: true, status: 'failed' })
    expect(mocks.eventsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    )
  })
})

describe('payment_intent.payment_failed', () => {
  it('marks a pending donation failed and stores the reason', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    await POST(
      signedRequest(
        buildEvent('payment_intent.payment_failed', {
          id: 'pi_test_123',
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          metadata: { donationId: '1' },
          last_payment_error: { message: 'Your card was declined.' },
        }),
      ),
    )

    expect(mocks.donationsUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'failed',
      failureReason: 'Your card was declined.',
    })
  })

  it('never un-pays a settled donation, even if events arrive out of order', async () => {
    const mocks = mockPayload({ donation: { ...pendingDonation, status: 'succeeded' } })
    const res = await POST(
      signedRequest(
        buildEvent('payment_intent.payment_failed', {
          id: 'pi_test_123',
          object: 'payment_intent',
          metadata: { donationId: '1' },
        }),
      ),
    )

    await expect(res.json()).resolves.toEqual({ received: true, status: 'ignored' })
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
  })
})

describe('charge.refunded', () => {
  const succeeded = { ...pendingDonation, status: 'succeeded' }

  it('transitions a fully refunded gift to refunded and tells the donor', async () => {
    const mocks = mockPayload({ donation: succeeded })
    await POST(
      signedRequest(
        buildEvent('charge.refunded', {
          id: 'ch_test_1',
          object: 'charge',
          amount: 5000,
          amount_refunded: 5000,
          payment_intent: 'pi_test_123',
          metadata: { donationId: '1' },
        }),
      ),
    )

    expect(mocks.donationsUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'refunded',
      refundedAmountMinor: 5000,
      stripeChargeId: 'ch_test_1',
    })
    expect(sendDonorReceipt).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'refunded')
  })

  it('records a PARTIAL refund without falsely marking the whole gift refunded', async () => {
    const mocks = mockPayload({ donation: succeeded })
    await POST(
      signedRequest(
        buildEvent('charge.refunded', {
          id: 'ch_test_1',
          object: 'charge',
          amount: 5000,
          amount_refunded: 1500,
          payment_intent: 'pi_test_123',
          metadata: { donationId: '1' },
        }),
      ),
    )

    const data = mocks.donationsUpdate.mock.calls[0][0].data
    expect(data.refundedAmountMinor).toBe(1500)
    expect(data.status).toBeUndefined()
    // A partial refund is usually a correction staff already discussed.
    expect(sendDonorReceipt).not.toHaveBeenCalled()
  })
})

describe('charge.dispute.created', () => {
  it('marks the donation disputed and notifies staff but not the donor', async () => {
    const mocks = mockPayload({ donation: { ...pendingDonation, status: 'succeeded' } })
    await POST(
      signedRequest(
        buildEvent('charge.dispute.created', {
          id: 'dp_test_1',
          object: 'dispute',
          reason: 'fraudulent',
          payment_intent: 'pi_test_123',
          metadata: { donationId: '1' },
        }),
      ),
    )

    expect(mocks.donationsUpdate.mock.calls[0][0].data).toMatchObject({ status: 'disputed' })
    expect(String(mocks.donationsUpdate.mock.calls[0][0].data.adminNotes)).toContain('dp_test_1')
    expect(sendEparchyNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'disputed')
    expect(sendDonorReceipt).not.toHaveBeenCalled()
  })
})

describe('events we do not act on', () => {
  it('acknowledges an unrelated event without touching a donation', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    const res = await POST(signedRequest(buildEvent('customer.created', { id: 'cus_1', object: 'customer' })))

    await expect(res.json()).resolves.toEqual({ received: true, status: 'ignored' })
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
  })

  it('records subscription events as ignored, since recurring giving is not enabled', async () => {
    const mocks = mockPayload({ donation: pendingDonation })
    const res = await POST(
      signedRequest(buildEvent('invoice.paid', { id: 'in_1', object: 'invoice' })),
    )

    await expect(res.json()).resolves.toEqual({ received: true, status: 'ignored' })
    expect(mocks.donationsUpdate).not.toHaveBeenCalled()
    expect(mocks.eventsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ error: expect.stringContaining('Recurring giving is not enabled') }),
      }),
    )
  })
})
