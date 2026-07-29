import { describe, it, expect } from 'vitest'
import { buildStatement, renderStatementHtml, type DonationRow } from '../statement'

/**
 * A giving statement is a financial document a donor may hand to a tax office.
 * The properties worth pinning are the ones that would make it FALSE: counting
 * money that never arrived, counting money that went back, or adding euros to
 * dollars.
 */

const gift = (over: Partial<DonationRow> = {}): DonationRow => ({
  status: 'succeeded',
  amountMinor: 5000,
  refundedAmountMinor: 0,
  currency: 'EUR',
  frequency: 'one-time',
  reference: 'SEG-2026-0001',
  submittedAt: '2026-03-15T10:00:00.000Z',
  ...over,
})

describe('what counts', () => {
  it('includes only succeeded donations', () => {
    const rows = [
      gift(),
      gift({ status: 'pending' }),
      gift({ status: 'failed' }),
      gift({ status: 'cancelled' }),
      gift({ status: 'refunded' }),
      gift({ status: 'disputed' }),
    ]
    const statement = buildStatement(rows, 2026)
    expect(statement.gifts).toHaveLength(1)
  })

  it('reports partial refunds net, not gross', () => {
    // A statement claiming a refunded gift is worse than no statement.
    const statement = buildStatement([gift({ amountMinor: 5000, refundedAmountMinor: 2000 })], 2026)
    expect(statement.gifts[0]!.netMinor).toBe(3000)
    expect(statement.totals[0]!.netMinor).toBe(3000)
  })

  it('clamps a refund recorded larger than the gift instead of printing a negative', () => {
    const statement = buildStatement([gift({ amountMinor: 5000, refundedAmountMinor: 9000 })], 2026)
    expect(statement.gifts[0]!.netMinor).toBe(0)
  })

  it('drops rows with no usable amount', () => {
    const rows = [gift({ amountMinor: 0 }), gift({ amountMinor: null }), gift({ amountMinor: -100 })]
    expect(buildStatement(rows, 2026).gifts).toHaveLength(0)
  })
})

describe('year attribution', () => {
  it('uses UTC half-open boundaries so New Year midnight belongs to one year only', () => {
    const rows = [
      gift({ submittedAt: '2026-01-01T00:00:00.000Z', reference: 'IN' }),
      gift({ submittedAt: '2025-12-31T23:59:59.999Z', reference: 'BEFORE' }),
      gift({ submittedAt: '2027-01-01T00:00:00.000Z', reference: 'AFTER' }),
    ]
    const statement = buildStatement(rows, 2026)
    expect(statement.gifts.map((g) => g.reference)).toEqual(['IN'])
  })

  it('falls back to createdAt when submittedAt is missing', () => {
    const statement = buildStatement(
      [gift({ submittedAt: null, createdAt: '2026-06-01T00:00:00.000Z' })],
      2026,
    )
    expect(statement.gifts).toHaveLength(1)
  })

  it('drops rows with no date at all rather than guessing', () => {
    expect(buildStatement([gift({ submittedAt: null, createdAt: null })], 2026).gifts).toHaveLength(0)
  })

  it('sorts gifts chronologically regardless of input order', () => {
    const rows = [
      gift({ submittedAt: '2026-09-01T00:00:00.000Z', reference: 'SEP' }),
      gift({ submittedAt: '2026-02-01T00:00:00.000Z', reference: 'FEB' }),
    ]
    expect(buildStatement(rows, 2026).gifts.map((g) => g.reference)).toEqual(['FEB', 'SEP'])
  })
})

describe('currencies are never summed together', () => {
  it('totals per currency', () => {
    const rows = [
      gift({ currency: 'EUR', amountMinor: 5000 }),
      gift({ currency: 'USD', amountMinor: 10000 }),
      gift({ currency: 'EUR', amountMinor: 2500 }),
    ]
    const { totals } = buildStatement(rows, 2026)
    expect(totals).toHaveLength(2)
    expect(totals.find((t) => t.currency === 'EUR')!.netMinor).toBe(7500)
    expect(totals.find((t) => t.currency === 'USD')!.netMinor).toBe(10000)
  })

  it('orders totals deterministically', () => {
    const rows = [gift({ currency: 'USD' }), gift({ currency: 'EUR' })]
    expect(buildStatement(rows, 2026).totals.map((t) => t.currency)).toEqual(['EUR', 'USD'])
  })
})

describe('the rendered document', () => {
  const statement = buildStatement(
    [gift({ amountMinor: 5000, refundedAmountMinor: 1000, reference: 'SEG-1' })],
    2026,
  )
  const html = renderStatementHtml({
    statement,
    donorName: 'Tesfay <script>alert(1)</script>',
    organizationName: 'Catholic Eparchy of Segheneyti',
    issuedAt: '2026-07-29T00:00:00.000Z',
  })

  it('escapes donor-controlled text — this HTML goes into an email', () => {
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('shows the net amount with the refund noted', () => {
    expect(html).toContain('40')
    expect(html).toContain('refund')
  })

  it('names the year and the organization', () => {
    expect(html).toContain('2026')
    expect(html).toContain('Catholic Eparchy of Segheneyti')
  })

  it('claims no tax status — deductibility is the donor\'s jurisdiction, not ours', () => {
    expect(html).toContain('does not constitute tax advice')
    expect(html).not.toMatch(/501\(c\)|deductible in|tax-exempt/i)
  })
})
