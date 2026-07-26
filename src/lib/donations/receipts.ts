import { formatAmount } from './amounts'
import { getDonationTranslator, normalizeLocale, type DonationLocale } from './messages'

/**
 * Donor receipts and Eparchy notifications.
 *
 * Every send here is **best effort**: a misconfigured mail transport must never
 * lose a donation or fail a webhook. Stripe treats a non-2xx webhook response as
 * a delivery failure and retries it, so throwing out of a receipt would make
 * Stripe replay a payment event because an SMTP server was down. Each function
 * catches its own errors and reports them to the log instead.
 *
 * Mail goes through Payload's configured adapter, which is the existing
 * Resend → SMTP → log chain in src/lib/payload/email.ts. No new transport.
 */

/** The payload surface these helpers need — narrow so tests can fake it. */
interface Mailer {
  sendEmail(options: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<unknown>
}

export interface DonationEmailRecord {
  id: string | number
  donorName: string
  donorEmail: string
  /** Integer minor units — the canonical amount. */
  amountMinor: number
  currency: string
  reference?: string | null
  message?: string | null
  locale?: string | null
  method: 'stripe' | 'manual'
}

export interface TransferDetails {
  accountHolder?: string | null
  bankName?: string | null
  accountNumber?: string | null
  swift?: string | null
  extraInstructions?: string | null
}

/**
 * Escape text before it goes into an HTML email.
 *
 * The previous receipt interpolated the donor's name straight into the markup,
 * so a name containing `<` broke the message and a crafted one could inject
 * markup into mail we send in the Eparchy's name.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim().replace(/\/$/, '')
}

/** Wrap body rows in the shared email shell. Plain, table-free, mail-client safe. */
function shell(bodyHtml: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#2b2b2b;max-width:600px">
${bodyHtml}
</div>`
}

/** Render the transfer details as an HTML definition list and as plain text. */
function renderTransferDetails(
  details: TransferDetails,
  t: (key: string, values?: Record<string, string | number>) => string,
): { html: string; text: string } {
  const rows: Array<[string, string]> = []
  if (details.accountHolder) rows.push([t('donate.transferAccountHolder'), details.accountHolder])
  if (details.bankName) rows.push([t('donate.transferBank'), details.bankName])
  if (details.accountNumber) rows.push([t('donate.transferAccountNumber'), details.accountNumber])
  if (details.swift) rows.push([t('donate.transferSwift'), details.swift])

  if (rows.length === 0 && !details.extraInstructions) {
    return { html: `<p>${escapeHtml(t('donate.transferNoDetails'))}</p>`, text: t('donate.transferNoDetails') }
  }

  const html = [
    rows.length
      ? `<table style="border-collapse:collapse;margin:12px 0">${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#6b6b6b">${escapeHtml(label)}</td>` +
              `<td style="padding:4px 0;font-weight:bold">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}</table>`
      : '',
    details.extraInstructions
      ? `<p style="white-space:pre-line">${escapeHtml(details.extraInstructions)}</p>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    details.extraInstructions ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  return { html, text }
}

export type ReceiptKind = 'pledge' | 'succeeded' | 'refunded'

/**
 * Send the donor's bilingual receipt.
 *
 * `pledge` is sent when a manual transfer is recorded and is explicit that the
 * gift is **not yet complete** — the old flow's "your gift has been recorded"
 * read as a finished donation when no money had moved. `succeeded` is only ever
 * triggered by a verified Stripe webhook.
 */
export async function sendDonorReceipt(
  payload: Mailer,
  donation: DonationEmailRecord,
  kind: ReceiptKind,
  transfer?: TransferDetails,
): Promise<boolean> {
  try {
    const locale: DonationLocale = normalizeLocale(donation.locale)
    const t = await getDonationTranslator(locale)
    const amount = formatAmount(donation.amountMinor, donation.currency, locale)
    const name = donation.donorName

    const subject =
      kind === 'succeeded'
        ? t('donate.email.receiptSubject')
        : kind === 'refunded'
          ? t('donate.email.refundSubject')
          : t('donate.email.pledgeSubject')

    const parts: string[] = [`<p>${escapeHtml(t('donate.email.greeting', { name }))}</p>`]
    const textParts: string[] = [t('donate.email.greeting', { name })]

    if (kind === 'succeeded') {
      parts.push(`<p>${escapeHtml(t('donate.email.receiptBody', { amount }))}</p>`)
      textParts.push(t('donate.email.receiptBody', { amount }))
    } else if (kind === 'refunded') {
      parts.push(`<p>${escapeHtml(t('donate.email.refundBody', { amount }))}</p>`)
      textParts.push(t('donate.email.refundBody', { amount }))
    } else {
      parts.push(`<p>${escapeHtml(t('donate.email.pledgeBody', { amount }))}</p>`)
      parts.push(`<p>${escapeHtml(t('donate.email.pledgeAction'))}</p>`)
      textParts.push(t('donate.email.pledgeBody', { amount }), t('donate.email.pledgeAction'))
    }

    // The reference is the whole point of the manual flow — give it visual
    // weight so it survives being skim-read on a phone.
    if (donation.reference && kind === 'pledge') {
      parts.push(
        `<p style="margin:16px 0;padding:12px 16px;background:#f6f1e7;border-left:4px solid #7b1e2b">` +
          `<span style="color:#6b6b6b">${escapeHtml(t('donate.referenceCode'))}</span><br>` +
          `<strong style="font-family:monospace;font-size:20px;letter-spacing:2px">${escapeHtml(donation.reference)}</strong>` +
          `</p>`,
        `<p style="color:#6b6b6b;font-size:13px">${escapeHtml(t('donate.referenceHint'))}</p>`,
      )
      textParts.push(t('donate.email.referenceLine', { reference: donation.reference }), t('donate.referenceHint'))

      if (transfer) {
        const rendered = renderTransferDetails(transfer, t)
        parts.push(`<h3 style="font-size:15px;margin:20px 0 4px">${escapeHtml(t('donate.transferStepsTitle'))}</h3>`, rendered.html)
        textParts.push('', t('donate.transferStepsTitle'), rendered.text)
      }
    }

    if (kind === 'succeeded' && donation.reference) {
      parts.push(
        `<p style="color:#6b6b6b;font-size:13px">${escapeHtml(t('donate.email.referenceLine', { reference: donation.reference }))}</p>`,
      )
      textParts.push(t('donate.email.referenceLine', { reference: donation.reference }))
    }

    parts.push(
      `<p>${escapeHtml(t('donate.email.blessing'))}</p>`,
      `<p style="color:#6b6b6b">${escapeHtml(t('donate.email.signature'))}<br>` +
        `<a href="${siteUrl()}/donate" style="color:#7b1e2b">${escapeHtml(siteUrl())}</a></p>`,
    )
    textParts.push('', t('donate.email.blessing'), t('donate.email.signature'), `${siteUrl()}/donate`)

    await payload.sendEmail({
      to: donation.donorEmail,
      subject,
      html: shell(parts.join('\n')),
      text: textParts.join('\n'),
    })
    return true
  } catch (err) {
    console.error('[donations] donor receipt failed', { id: donation.id, kind, err })
    return false
  }
}

/**
 * Tell the Eparchy a donation arrived.
 *
 * Nobody was notified before, so pledges accumulated in a table no one had a
 * reason to open. Reuses CONTACT_NOTIFICATION_EMAIL unless a dedicated
 * DONATION_NOTIFICATION_EMAIL is configured; silently does nothing when neither
 * is set, since a mail to nowhere is not worth failing a payment over.
 *
 * Always English — this goes to staff, not donors, and mixing languages in an
 * operational alert helps nobody.
 */
export async function sendEparchyNotification(
  payload: Mailer,
  donation: DonationEmailRecord,
  status: 'pending' | 'succeeded' | 'refunded' | 'disputed',
): Promise<boolean> {
  const to = (process.env.DONATION_NOTIFICATION_EMAIL ?? process.env.CONTACT_NOTIFICATION_EMAIL ?? '').trim()
  if (!to) return false

  try {
    const t = await getDonationTranslator('en')
    const amount = formatAmount(donation.amountMinor, donation.currency, 'en')
    const method = donation.method === 'stripe' ? 'card' : 'manual transfer'
    const adminUrl = `${siteUrl()}/admin/collections/donations/${donation.id}`

    const summary =
      status === 'pending'
        ? t('donate.email.notifyPending')
        : status === 'succeeded'
          ? t('donate.email.notifySucceeded')
          : `Donation status changed to ${status}.`

    const rows: Array<[string, string]> = [
      ['Amount', amount],
      ['Method', method],
      ['Status', status],
      ['Donor', donation.donorName],
      ['Email', donation.donorEmail],
    ]
    if (donation.reference) rows.push(['Reference', donation.reference])
    if (donation.message) rows.push(['Message', donation.message])

    await payload.sendEmail({
      to,
      subject: t('donate.email.notifySubject', { amount, method }),
      html: shell(
        `<p>${escapeHtml(summary)}</p>` +
          `<table style="border-collapse:collapse;margin:12px 0">${rows
            .map(
              ([label, value]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#6b6b6b">${escapeHtml(label)}</td>` +
                `<td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}</table>` +
          `<p><a href="${escapeHtml(adminUrl)}" style="color:#7b1e2b">${escapeHtml(t('donate.email.viewInAdmin'))}</a></p>`,
      ),
      text: [summary, ...rows.map(([l, v]) => `${l}: ${v}`), adminUrl].join('\n'),
    })
    return true
  } catch (err) {
    console.error('[donations] eparchy notification failed', { id: donation.id, status, err })
    return false
  }
}
