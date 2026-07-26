import { describe, it, expect } from 'vitest'
import { Donations } from '../index'

/**
 * The data-layer half of "only a verified webhook may mark a card gift paid".
 *
 * The page-level guarantee is tested in the /donate/complete page tests. This
 * covers the case those cannot: some future caller — an admin edit, a script, a
 * new server action — trying to promote a Stripe donation by hand. The rule
 * lives in the collection so it holds regardless of who is calling.
 */

const beforeValidate = Donations.hooks!.beforeValidate![0]!
const beforeChange = Donations.hooks!.beforeChange![0]!

interface RunArgs {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  operation?: 'create' | 'update'
  context?: Record<string, unknown>
}

/** Run both hooks in the order Payload does, so the tests match the real path. */
function run(args: RunArgs) {
  const shared = {
    originalDoc: args.originalDoc,
    operation: args.operation ?? 'update',
    req: { context: args.context ?? {} },
  }
  // beforeValidate derives the display amount and the create-time defaults…
  const data = beforeValidate({ ...shared, data: args.data } as never) as Record<string, unknown>
  // …and beforeChange enforces the webhook-only status rule.
  return beforeChange({ ...shared, data } as never) as Record<string, unknown>
}

const stripePending = { status: 'pending', provider: 'stripe', amountMinor: 5000, currency: 'USD' }

describe('webhook-only status promotion', () => {
  for (const status of ['succeeded', 'refunded', 'disputed']) {
    it(`refuses to set "${status}" on a Stripe donation without the webhook context`, () => {
      expect(() => run({ data: { status }, originalDoc: stripePending })).toThrow(/verified webhook/)
    })

    it(`allows "${status}" when the verified webhook sets the context flag`, () => {
      expect(() =>
        run({ data: { status }, originalDoc: stripePending, context: { stripeWebhook: true } }),
      ).not.toThrow()
    })
  }

  it('lets staff set the same statuses on a MANUAL donation', () => {
    // A treasurer confirming a bank transfer is exactly the intended path.
    expect(() =>
      run({ data: { status: 'succeeded' }, originalDoc: { ...stripePending, provider: 'manual' } }),
    ).not.toThrow()
  })

  it('allows non-settlement status changes on a Stripe donation', () => {
    expect(() => run({ data: { status: 'failed' }, originalDoc: stripePending })).not.toThrow()
    expect(() => run({ data: { status: 'cancelled' }, originalDoc: stripePending })).not.toThrow()
  })

  it('does not fire when the status is unchanged', () => {
    expect(() =>
      run({ data: { status: 'succeeded' }, originalDoc: { ...stripePending, status: 'succeeded' } }),
    ).not.toThrow()
  })

  it('cannot be bypassed by creating a Stripe donation already succeeded', () => {
    expect(() =>
      run({ data: { ...stripePending, status: 'succeeded' }, operation: 'create' }),
    ).toThrow(/verified webhook/)
  })
})

describe('derived display amount', () => {
  it('recomputes `amount` from the canonical minor value', () => {
    const data = run({ data: { amountMinor: 5000, currency: 'USD' }, originalDoc: stripePending }) as any
    expect(data.amount).toBe(50)
  })

  it('respects zero-decimal currencies', () => {
    const data = run({ data: { amountMinor: 1000, currency: 'JPY' }, originalDoc: stripePending }) as any
    expect(data.amount).toBe(1000)
  })

  it('overwrites an `amount` that disagrees with the minor value', () => {
    // The ledger must never show a number different from what was charged.
    const data = run({
      data: { amountMinor: 5000, amount: 9999, currency: 'USD' },
      originalDoc: stripePending,
    }) as any
    expect(data.amount).toBe(50)
  })

  it('uses the stored currency when the update does not include one', () => {
    const data = run({
      data: { amountMinor: 1000 },
      originalDoc: { ...stripePending, currency: 'JPY' },
    }) as any
    expect(data.amount).toBe(1000)
  })

  it('defaults a new record to pending, manual, with a submission timestamp', () => {
    const data = run({ data: { amountMinor: 100, currency: 'ERN' }, operation: 'create' }) as any
    expect(data.status).toBe('pending')
    expect(data.provider).toBe('manual')
    expect(typeof data.submittedAt).toBe('string')
  })
})
