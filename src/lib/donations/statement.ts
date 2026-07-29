import { formatAmount } from './amounts'

/**
 * Annual giving statements — the yearly record a donor asks for at tax time.
 *
 * A diaspora donor in Germany, Canada or the US wants one document listing what
 * they gave in a calendar year. This module turns donation rows into that
 * document's data, and one HTML rendering shared by the staff-facing printable
 * page and the donor-facing email — so the two can never disagree about what
 * was given.
 *
 * ── What counts ──────────────────────────────────────────────────────────────
 * Only `succeeded` donations. `pending` and `failed` never completed;
 * `cancelled` was abandoned; `refunded` and `disputed` mean the money went
 * back. A partial refund leaves the donation `succeeded` with
 * `refundedAmountMinor` set, so the statement reports the NET amount — a
 * statement that claims a refunded gift is worse than no statement.
 *
 * ── Currencies are never summed together ─────────────────────────────────────
 * A donor may give in EUR and USD in the same year. Adding those numbers
 * produces a figure that is false in every currency, so totals are per-currency,
 * always.
 *
 * ── What this document is ────────────────────────────────────────────────────
 * A record of gifts received, issued by the eparchy. It deliberately does NOT
 * claim tax-deductibility in any jurisdiction — whether a gift to an Eritrean
 * eparchy is deductible in Germany or Canada is between the donor and their tax
 * authority, and overclaiming would be worse than saying nothing.
 */

export interface DonationRow {
  status?: string | null
  amountMinor?: number | null
  refundedAmountMinor?: number | null
  currency?: string | null
  frequency?: string | null
  reference?: string | null
  submittedAt?: string | null
  createdAt?: string | null
}

export interface StatementGift {
  /** ISO date of the gift (submission time; server-stamped). */
  date: string
  reference: string
  frequency: string
  currency: string
  grossMinor: number
  refundedMinor: number
  netMinor: number
}

export interface StatementTotal {
  currency: string
  count: number
  grossMinor: number
  refundedMinor: number
  netMinor: number
}

export interface GivingStatement {
  year: number
  gifts: StatementGift[]
  totals: StatementTotal[]
}

/** The date a gift is attributed to. Server-stamped submittedAt, else createdAt. */
function giftDate(row: DonationRow): string | null {
  return row.submittedAt ?? row.createdAt ?? null
}

/**
 * Build the statement for one calendar year from a donor's rows.
 *
 * Year boundaries are UTC and half-open, the same convention the news year
 * filter uses, so a gift at 23:59 on 31 December belongs to exactly one year.
 */
export function buildStatement(rows: DonationRow[], year: number): GivingStatement {
  const from = Date.UTC(year, 0, 1)
  const to = Date.UTC(year + 1, 0, 1)

  const gifts: StatementGift[] = []
  for (const row of rows) {
    if (row.status !== 'succeeded') continue

    const dateIso = giftDate(row)
    if (!dateIso) continue
    const t = Date.parse(dateIso)
    if (Number.isNaN(t) || t < from || t >= to) continue

    const gross = Number(row.amountMinor ?? 0)
    if (!Number.isFinite(gross) || gross <= 0) continue

    // A refund recorded larger than the gift is a data error; clamp rather
    // than print a negative gift.
    const refunded = Math.min(Math.max(Number(row.refundedAmountMinor ?? 0), 0), gross)

    gifts.push({
      date: dateIso,
      reference: String(row.reference ?? ''),
      frequency: row.frequency === 'monthly' ? 'monthly' : 'one-time',
      currency: String(row.currency ?? 'ERN').toUpperCase(),
      grossMinor: gross,
      refundedMinor: refunded,
      netMinor: gross - refunded,
    })
  }

  gifts.sort((a, b) => a.date.localeCompare(b.date))

  const byCurrency = new Map<string, StatementTotal>()
  for (const gift of gifts) {
    const total = byCurrency.get(gift.currency) ?? {
      currency: gift.currency,
      count: 0,
      grossMinor: 0,
      refundedMinor: 0,
      netMinor: 0,
    }
    total.count += 1
    total.grossMinor += gift.grossMinor
    total.refundedMinor += gift.refundedMinor
    total.netMinor += gift.netMinor
    byCurrency.set(gift.currency, total)
  }

  return {
    year,
    gifts,
    // Deterministic order so the same data always renders the same statement.
    totals: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  }
}

/** Escape for interpolation into the HTML rendering below. */
function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // DD/MM/YYYY in UTC — the same convention as submittedAt storage, so the
  // printed date can never sit in a different year than the one that counted it.
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

/**
 * One HTML rendering for both surfaces: the staff printable page and the body
 * of the donor email. Inline styles only — email clients strip stylesheets, and
 * the print dialog keeps inline styles as-is.
 */
export function renderStatementHtml(options: {
  statement: GivingStatement
  donorName: string
  /** e.g. "Catholic Eparchy of Segheneyti" — passed in so tests need no config. */
  organizationName: string
  /** ISO date the statement was produced. */
  issuedAt: string
}): string {
  const { statement, donorName, organizationName, issuedAt } = options
  const maroon = '#911e1e'

  const rows = statement.gifts
    .map((gift) => {
      const net = formatAmount(gift.netMinor, gift.currency)
      const refundNote =
        gift.refundedMinor > 0
          ? ` <span style="color:#666;font-size:11px">(after ${esc(formatAmount(gift.refundedMinor, gift.currency))} refund)</span>`
          : ''
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${fmtDate(gift.date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace">${esc(gift.reference)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${gift.frequency === 'monthly' ? 'Monthly' : 'One-time'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${esc(net)}${refundNote}</td>
      </tr>`
    })
    .join('\n')

  const totals = statement.totals
    .map(
      (total) => `<tr>
        <td colspan="3" style="padding:8px 10px;font-weight:bold;text-align:right">Total given in ${esc(total.currency)} (${total.count} gift${total.count === 1 ? '' : 's'})</td>
        <td style="padding:8px 10px;font-weight:bold;text-align:right;border-top:2px solid ${maroon}">${esc(formatAmount(total.netMinor, total.currency))}</td>
      </tr>`,
    )
    .join('\n')

  return `
  <div style="max-width:640px;margin:0 auto;font-family:Georgia,serif;color:#222">
    <div style="border-bottom:3px solid ${maroon};padding-bottom:12px;margin-bottom:20px">
      <h1 style="margin:0;font-size:20px;color:${maroon}">${esc(organizationName)}</h1>
      <p style="margin:4px 0 0;font-size:14px">Annual Giving Statement — ${statement.year}</p>
    </div>

    <p style="font-size:14px">Issued to <strong>${esc(donorName)}</strong> on ${fmtDate(issuedAt)}.</p>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0">
      <thead>
        <tr style="background:#f7f2ec">
          <th style="padding:8px 10px;text-align:left">Date</th>
          <th style="padding:8px 10px;text-align:left">Reference</th>
          <th style="padding:8px 10px;text-align:left">Type</th>
          <th style="padding:8px 10px;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
${rows}
${totals}
      </tbody>
    </table>

    <p style="font-size:12px;color:#555">
      This statement records donations received by ${esc(organizationName)} during ${statement.year}.
      Amounts are shown net of any refunds. Whether a gift is tax-deductible depends on the laws of
      your country of residence; this document does not constitute tax advice.
    </p>
    <p style="font-size:12px;color:#555">May God bless you for your generosity.</p>
  </div>`
}
