import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * The non-negotiable guarantee: **landing on the success URL is not payment.**
 *
 * Anyone can type /donate/complete?id=…&ref=…. A donor's browser can also reach
 * it a moment before the webhook does. Neither case may produce a thank-you the
 * payment has not earned, and neither may write anything to the ledger.
 *
 * These tests execute the real page against a mocked Payload and assert that no
 * write of any kind is issued, and that a still-pending donation renders the
 * "confirming your gift" state rather than a confirmation.
 */

vi.mock('@/lib/payload/client', () => ({ getPayload: vi.fn() }))

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  // Return the key so assertions do not depend on copy, plus a readable marker
  // for interpolated values.
  getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}))

// Layout chrome is irrelevant here — stub it down to plain elements.
vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <header>{title}</header>,
}))
vi.mock('@/components/layout/Section', () => ({
  Section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}))
vi.mock('@/components/layout/Container', () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/features/donate/ConfirmingPoller', () => ({
  ConfirmingPoller: () => <button type="button">poller</button>,
}))

import { getPayload } from '@/lib/payload/client'
import DonateCompletePage from '../page'

const REFERENCE = 'SEG-4KQ7HP'

function mockPayload(donation: Record<string, unknown> | null | 'throw') {
  const findByID = vi.fn(async () => {
    if (donation === 'throw') throw new Error('not found')
    return donation
  })
  const update = vi.fn()
  const create = vi.fn()
  ;(getPayload as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
    findByID,
    update,
    create,
  })
  return { findByID, update, create }
}

const pending = {
  id: 1,
  status: 'pending',
  amountMinor: '5000',
  currency: 'USD',
  reference: REFERENCE,
  provider: 'stripe',
}

async function renderPage(params: Record<string, string>, mocks: ReturnType<typeof mockPayload>) {
  const element = await DonateCompletePage({ searchParams: Promise.resolve(params) })
  render(element)
  return mocks
}

beforeEach(() => vi.clearAllMocks())

describe('hitting the success URL directly', () => {
  it('does NOT mark the donation succeeded', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: '1', ref: REFERENCE }, mocks)

    // The single most important assertion in this codebase: the page performs
    // no write at all. Only the verified webhook may promote a donation.
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('shows "confirming", never a thank-you, while the webhook has not landed', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: '1', ref: REFERENCE }, mocks)

    expect(screen.getByText('confirmingTitle')).toBeInTheDocument()
    expect(screen.queryByText(/succeededTitle/)).not.toBeInTheDocument()
  })

  it('still writes nothing when the donation is already succeeded', async () => {
    const mocks = mockPayload({ ...pending, status: 'succeeded' })
    await renderPage({ id: '1', ref: REFERENCE }, mocks)

    expect(screen.getByText('succeededTitle')).toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('does not claim a gift was received when the donor cancelled', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: '1', ref: REFERENCE, cancelled: '1' }, mocks)

    expect(screen.getByText('cancelledTitle')).toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe('the reference acts as the capability for one record', () => {
  it('refuses to show a donation when the reference does not match', async () => {
    // Donation ids are sequential. Without this check, walking id=1,2,3 would
    // expose the congregation's giving history.
    const mocks = mockPayload(pending)
    await renderPage({ id: '1', ref: 'SEG-AAAAAA' }, mocks)

    expect(screen.getByText('notFoundTitle')).toBeInTheDocument()
    expect(screen.queryByText('confirmingTitle')).not.toBeInTheDocument()
  })

  it('refuses when no reference is supplied at all', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: '1' }, mocks)

    expect(screen.getByText('notFoundTitle')).toBeInTheDocument()
    expect(mocks.findByID).not.toHaveBeenCalled()
  })

  it('does not query for a non-numeric id', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: "1' OR 1=1", ref: REFERENCE }, mocks)

    expect(mocks.findByID).not.toHaveBeenCalled()
    expect(screen.getByText('notFoundTitle')).toBeInTheDocument()
  })

  it('accepts a reference the donor retyped without the hyphen', async () => {
    const mocks = mockPayload(pending)
    await renderPage({ id: '1', ref: 'seg4kq7hp' }, mocks)

    expect(screen.getByText('confirmingTitle')).toBeInTheDocument()
  })

  it('handles a missing record without leaking whether the id exists', async () => {
    const mocks = mockPayload('throw')
    await renderPage({ id: '999', ref: REFERENCE }, mocks)

    expect(screen.getByText('notFoundTitle')).toBeInTheDocument()
  })
})

describe('terminal states', () => {
  it('reports a failed payment as failed', async () => {
    const mocks = mockPayload({ ...pending, status: 'failed' })
    await renderPage({ id: '1', ref: REFERENCE }, mocks)
    expect(screen.getByText('failedTitle')).toBeInTheDocument()
  })

  it('reports a refunded gift as refunded', async () => {
    const mocks = mockPayload({ ...pending, status: 'refunded' })
    await renderPage({ id: '1', ref: REFERENCE }, mocks)
    expect(screen.getByText('refundedTitle')).toBeInTheDocument()
  })

  it('reports a disputed gift as under review', async () => {
    const mocks = mockPayload({ ...pending, status: 'disputed' })
    await renderPage({ id: '1', ref: REFERENCE }, mocks)
    expect(screen.getByText('disputedTitle')).toBeInTheDocument()
  })
})
