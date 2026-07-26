'use client'

import { useTranslations } from 'next-intl'
import { formatAmount } from '@/lib/donations/amounts'

/**
 * The transfer instructions a donor needs in order to actually pay.
 *
 * Shared by the pledge confirmation shown after the form and by /donate/complete,
 * so a donor who bookmarks the page, or comes back to it from the email, sees
 * exactly the same thing. The reference code is the most important element on
 * the screen and is styled accordingly — without it quoted on the transfer,
 * staff cannot tell whose gift arrived.
 */

export interface TransferDetailsView {
  accountHolder?: string
  bankName?: string
  accountNumber?: string
  swift?: string
  extraInstructions?: string
}

export function TransferInstructions({
  reference,
  amountMinor,
  currency,
  details,
  locale,
  emailed = false,
}: {
  reference: string
  amountMinor: number
  currency: string
  details: TransferDetailsView
  locale: string
  emailed?: boolean
}) {
  const t = useTranslations('donate')
  const rows: Array<[string, string]> = []
  if (details.accountHolder) rows.push([t('transferAccountHolder'), details.accountHolder])
  if (details.bankName) rows.push([t('transferBank'), details.bankName])
  if (details.accountNumber) rows.push([t('transferAccountNumber'), details.accountNumber])
  if (details.swift) rows.push([t('transferSwift'), details.swift])
  rows.push([t('transferAmount'), formatAmount(amountMinor, currency, locale)])

  const hasDetails = Boolean(details.accountNumber || details.extraInstructions)

  return (
    <div className="space-y-5">
      {/* The reference code. Monospace and spaced so it can be copied by eye. */}
      <div className="rounded-lg border-l-4 border-maroon-700 bg-parchment-50 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-charcoal-500 mb-1">{t('referenceCode')}</p>
        <p className="font-mono text-2xl font-bold tracking-[0.2em] text-maroon-800">{reference}</p>
        <p className="mt-2 text-xs text-charcoal-600">{t('referenceHint')}</p>
      </div>

      <div>
        <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-2">{t('transferStepsTitle')}</h3>
        {hasDetails ? (
          <>
            <dl className="divide-y divide-charcoal-100 rounded-lg border border-charcoal-100">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                  <dt className="text-sm text-charcoal-500">{label}</dt>
                  <dd className="text-sm font-semibold text-charcoal-900 break-all">{value}</dd>
                </div>
              ))}
            </dl>
            {details.extraInstructions && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-600">
                {details.extraInstructions}
              </p>
            )}
          </>
        ) : (
          // Staff have published nothing to transfer to. Say so plainly and give
          // the donor a route forward, rather than showing an empty panel — the
          // silent-empty case is what made the old flow a dead end.
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('transferNoDetails')}
          </p>
        )}
      </div>

      {emailed && <p className="text-sm text-charcoal-500">{t('pledgeEmailed')}</p>}
    </div>
  )
}
