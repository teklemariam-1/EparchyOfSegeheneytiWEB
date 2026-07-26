import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { getPayload } from '@/lib/payload/client'
import { formatAmount } from '@/lib/donations/amounts'
import { normalizeReference } from '@/lib/donations/reference'
import { ConfirmingPoller } from '@/features/donate/ConfirmingPoller'

/**
 * Where a donor lands after Stripe Checkout.
 *
 * **This page never changes a donation's status.** It reads the record and
 * reports what the webhook has recorded so far. Reaching this URL is not
 * evidence of anything: anyone can type it, and a donor whose browser closed
 * mid-redirect never reaches it at all. If the webhook has not landed yet the
 * donor sees "confirming your gift", never a thank-you the payment has not
 * earned.
 *
 * The `ref` in the query string must match the record's reference. Donation ids
 * are sequential, so without that check anyone could walk /donate/complete?id=1,
 * 2, 3 and read the congregation's giving history. The reference is a CSPRNG
 * code, so it works as a capability for exactly one record.
 */

export const metadata: Metadata = { robots: { index: false, follow: false } }
// Reads a specific record on every request; caching it would show one donor
// another donor's state.
export const dynamic = 'force-dynamic'

interface DonationView {
  id: string | number
  status: string
  /** Postgres `numeric` — arrives as a string, so coerce before formatting. */
  amountMinor: number | string
  currency: string
  reference?: string | null
  donorName?: string | null
  provider?: string | null
}

async function loadDonation(id: string, ref: string | null): Promise<DonationView | null> {
  const wanted = normalizeReference(ref)
  if (!wanted) return null
  // Ids are numeric in Postgres; a non-numeric id is a probe, not a donor.
  if (!/^\d+$/.test(id)) return null

  try {
    const payload = await getPayload()
    const doc = (await payload.findByID({
      collection: 'donations',
      id,
      depth: 0,
      // The public has no read access to donations. This page is authorized by
      // the reference check above, so it reads with overrideAccess and then
      // exposes only the four fields below — never the email, message or notes.
      overrideAccess: true,
    })) as unknown as DonationView | null

    if (!doc || normalizeReference(doc.reference) !== wanted) return null
    return doc
  } catch {
    return null
  }
}

export default async function DonateCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ref?: string; cancelled?: string }>
}) {
  const [params, locale, t] = await Promise.all([searchParams, getLocale(), getTranslations('donate')])
  const donation = params.id ? await loadDonation(params.id, params.ref ?? null) : null

  let title: string
  let body: string
  let tone: 'good' | 'wait' | 'bad'
  let extra: React.ReactNode = null
  // A donor whose card was declined wants to retry, not to be congratulated and
  // offered "make another gift" — the link says what the situation calls for.
  let retry = false

  if (!donation) {
    title = t('notFoundTitle')
    body = t('notFoundBody')
    tone = 'bad'
  } else {
    const amount = formatAmount(Number(donation.amountMinor ?? 0), donation.currency, locale)

    switch (donation.status) {
      case 'succeeded':
        title = t('succeededTitle')
        body = t('succeededBody', { amount })
        tone = 'good'
        break
      case 'refunded':
        title = t('refundedTitle')
        body = t('refundedBody', { amount })
        tone = 'bad'
        break
      case 'disputed':
        title = t('disputedTitle')
        body = t('disputedBody')
        tone = 'bad'
        break
      case 'failed':
      case 'cancelled':
        title = t('failedTitle')
        body = t('failedBody')
        tone = 'bad'
        retry = true
        break
      default:
        // Still pending. Either the donor cancelled at Stripe, or the payment
        // succeeded and the webhook is seconds behind. Those are different
        // messages, and `cancelled=1` on the return URL is the only hint we
        // have — it is not proof either, which is why neither branch claims the
        // gift was received.
        if (params.cancelled) {
          title = t('cancelledTitle')
          body = t('cancelledBody')
          tone = 'bad'
          retry = true
        } else {
          title = t('confirmingTitle')
          body = t('confirmingBody')
          tone = 'wait'
          extra = <ConfirmingPoller />
        }
    }
  }

  const toneClass =
    tone === 'good'
      ? 'border-green-200 bg-green-50 text-green-900'
      : tone === 'wait'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-charcoal-200 bg-parchment-50 text-charcoal-800'

  return (
    <>
      <PageHeader title={t('title')} breadcrumbs={[{ label: t('title'), href: '/donate' }, { label: title }]} />
      <Section className="bg-white">
        <Container>
          <div className={`mx-auto max-w-xl rounded-xl border px-6 py-10 text-center ${toneClass}`}>
            {tone === 'wait' && (
              <span
                className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700"
                aria-hidden="true"
              />
            )}
            <h2 className="font-serif text-lg font-semibold mb-2">{title}</h2>
            <p className="text-sm leading-relaxed">{body}</p>

            {donation?.reference && (
              <p className="mt-4 text-xs uppercase tracking-wide opacity-70">
                {t('referenceCode')}:{' '}
                <span className="font-mono tracking-[0.15em]">{donation.reference}</span>
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {extra}
              <Link href="/donate" className="text-sm font-medium text-maroon-700 hover:underline">
                {retry ? t('tryAgain') : t('giveAgain')}
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
