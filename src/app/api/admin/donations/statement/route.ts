import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'
import { buildStatement, renderStatementHtml, type DonationRow } from '@/lib/donations/statement'

/**
 * Staff-side printable giving statement: one donor, one calendar year.
 *
 * GET /api/admin/donations/statement?email=donor@example.org&year=2026
 *
 * Returns an HTML page sized for the browser's print dialog — print-to-PDF is
 * the delivery mechanism, the same way the analytics dashboard exports. No PDF
 * library: a dependency that renders one table earns nothing.
 *
 * Requires `donations.manage`, not just `donations.view`. A statement is
 * inherently about an identified donor — name, email, giving history — and the
 * CSV export draws the same line: reporting roles see amounts, only managers
 * see the congregation's address book.
 */

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers as Headers })
  const authUser = user as AuthUser | null

  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(authUser, 'donations.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()
  const yearRaw = url.searchParams.get('year') ?? ''
  const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : NaN

  if (!email || Number.isNaN(year)) {
    return NextResponse.json(
      { error: 'Provide ?email= and a four-digit ?year=.' },
      { status: 400 },
    )
  }

  // Pull the donor's year with headroom; the builder re-filters precisely.
  // 1000 rows is far beyond any plausible single donor-year.
  const result = await payload.find({
    collection: 'donations',
    where: {
      donorEmail: { equals: email },
      status: { equals: 'succeeded' },
      submittedAt: {
        greater_than_equal: new Date(Date.UTC(year, 0, 1)).toISOString(),
        less_than: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
      },
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const rows = result.docs as unknown as (DonationRow & { donorName?: string })[]
  const statement = buildStatement(rows, year)

  if (statement.gifts.length === 0) {
    return NextResponse.json(
      { error: `No succeeded donations found for ${email} in ${year}.` },
      { status: 404 },
    )
  }

  const body = renderStatementHtml({
    statement,
    donorName: rows[0]?.donorName ?? email,
    organizationName: 'Catholic Eparchy of Segheneyti',
    issuedAt: new Date().toISOString(),
  })

  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Giving Statement ${year}</title></head><body style="margin:24px">${body}<script>window.print()</script></body></html>`,
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // A donor's giving history must never land in a shared cache.
        'cache-control': 'no-store, max-age=0',
      },
    },
  )
}
