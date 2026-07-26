import { NextResponse } from 'next/server'
import type { Where } from 'payload'
import { getPayload } from '@/lib/payload/client'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'
import { toMajorUnits, currencyExponent } from '@/lib/donations/amounts'

/**
 * Row-level CSV export of the donation ledger, for the treasurer.
 *
 * Deliberately row-level rather than grouped: reconciliation is done line by
 * line against a bank statement, and the reference code is the key that makes
 * that possible. The grouped view in the admin already exports its own
 * summaries through `toCsv`.
 *
 * Donor email is included only for callers who hold `donations.manage`, which
 * matches the field-level access on the collection — a reporting role can see
 * what was given without exporting the congregation's address book.
 */

export const dynamic = 'force-dynamic'

/** RFC 4180 quoting. A donor's message can legitimately contain commas and quotes. */
function cell(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Neutralise values Excel would evaluate as a formula on open. */
function safeCell(value: unknown): string {
  const s = String(value ?? '')
  return cell(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s)
}

export async function GET(req: Request) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers as Headers })
  const authUser = user as AuthUser | null

  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(authUser, 'donations.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const includeDonorContact = hasPermission(authUser, 'donations.manage')

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const and: Where[] = []
  if (status) and.push({ status: { equals: status } })
  if (from) and.push({ createdAt: { greater_than_equal: from } })
  if (to) and.push({ createdAt: { less_than_equal: to } })
  const where: Where = and.length ? { and } : {}

  const headerRow = [
    'ID',
    'Date',
    'Confirmed',
    'Status',
    'Method',
    'Reference',
    'Donor',
    ...(includeDonorContact ? ['Email'] : []),
    'Anonymous',
    'Currency',
    'Amount',
    'Amount (minor units)',
    'Refunded (minor units)',
    'Frequency',
    'Stripe payment intent',
    ...(includeDonorContact ? ['Message'] : []),
  ]

  const lines = [headerRow.map(cell).join(',')]

  // Paginate rather than pulling the whole table into memory at once: this runs
  // in a serverless function with a fixed memory ceiling, and a ledger only
  // grows.
  let page = 1
  const limit = 500
  for (;;) {
    const result = (await payload.find({
      collection: 'donations',
      where,
      sort: '-createdAt',
      depth: 0,
      limit,
      page,
      overrideAccess: true,
    })) as any

    for (const doc of result.docs as any[]) {
      // Numeric columns come back from Postgres as strings.
      const minor = Number(doc.amountMinor ?? 0)
      const currency = String(doc.currency ?? '')
      const exponent = currencyExponent(currency)

      lines.push(
        [
          doc.id,
          doc.createdAt,
          doc.confirmedAt ?? '',
          doc.status,
          doc.provider === 'stripe' ? 'card' : 'manual transfer',
          doc.reference ?? '',
          doc.donorName ?? '',
          ...(includeDonorContact ? [doc.donorEmail ?? ''] : []),
          doc.anonymous ? 'yes' : 'no',
          currency,
          toMajorUnits(minor, currency).toFixed(exponent),
          minor,
          Number(doc.refundedAmountMinor ?? 0),
          doc.frequency ?? '',
          doc.stripePaymentIntentId ?? '',
          ...(includeDonorContact ? [doc.message ?? ''] : []),
        ]
          .map(safeCell)
          .join(','),
      )
    }

    if (!result.hasNextPage) break
    page += 1
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(
    // BOM so Excel opens the file as UTF-8 and Tigrinya names are not mojibake.
    `﻿${lines.join('\r\n')}`,
    {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="donations-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    },
  )
}
