import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { DonateForm, type DonateFormConfig } from '@/features/donate/DonateForm'
import { getDonationSettings } from '@/lib/payload/queries'
import { resolveDonationConfig } from '@/lib/donations/settings'
import { isStripeConfigured, isStripeTestMode } from '@/lib/donations/stripe'
import { getLocale, getTranslations } from 'next-intl/server'

export const metadata: Metadata = buildMetadata({
  title: 'Donate',
  description: 'Support the mission and ministries of the Catholic Eparchy of Segeneyti with a donation.',
  path: '/donate',
})

/**
 * Where the visitor appears to be, for ordering the payment methods.
 *
 * Only `x-vercel-ip-country` is trusted — Vercel sets it at the edge and
 * overwrites any client-supplied value (same reasoning as /api/track). A
 * spoofed value here would only reorder two buttons, but there is no reason to
 * accept one.
 */
async function visitorCountry(): Promise<string | null> {
  try {
    const raw = (await headers()).get('x-vercel-ip-country')?.trim().toUpperCase()
    return raw && /^[A-Z]{2}$/.test(raw) ? raw : null
  } catch {
    return null
  }
}

export default async function DonatePage() {
  const locale = await getLocale()
  const [settings, t, country] = await Promise.all([
    getDonationSettings(locale),
    getTranslations('donate'),
    visitorCountry(),
  ])

  const config = resolveDonationConfig(settings, isStripeConfigured())

  if (!config.enabled) {
    return (
      <>
        <PageHeader title={t('title')} subtitle={t('subtitle')} breadcrumbs={[{ label: t('title') }]} />
        <Section className="bg-white">
          <Container>
            <div className="max-w-xl mx-auto rounded-xl border border-charcoal-100 bg-parchment-50 px-6 py-10 text-center">
              <p className="font-serif text-lg font-semibold text-charcoal-800 mb-2">{t('disabledTitle')}</p>
              <p className="text-sm text-charcoal-600 mb-6">{t('disabledMessage')}</p>
              <Link href="/" className="text-sm font-medium text-maroon-700 hover:underline">
                {t('backHome')}
              </Link>
            </div>
          </Container>
        </Section>
      </>
    )
  }

  // Order the methods for this visitor. Cards are simply not usable inside
  // Eritrea — no local issuer, and ERN is not a currency Stripe can charge — so
  // showing "Card" first to someone in Asmara offers them a dead end. Both
  // methods stay visible either way; only the default and the order change.
  const preferManual = country != null && config.preferManualCountries.includes(country)
  const methods = preferManual
    ? [...config.methods].sort((a, b) => (a === 'manual' ? -1 : b === 'manual' ? 1 : 0))
    : config.methods

  const formConfig: DonateFormConfig = {
    presetAmounts: config.presetAmounts,
    defaultCurrency: config.defaultCurrency,
    currencies: config.currencies,
    allowCustomAmount: config.allowCustomAmount,
    allowRecurring: config.allowRecurring,
    minAmount: config.minAmount,
    maxAmount: config.maxAmount,
    locale,
    methods,
    transferDetails: config.transferDetails,
    stripeAccountNotice: config.stripeAccountNotice,
    stripeTestMode: isStripeTestMode(),
  }

  const details = config.transferDetails

  return (
    <>
      <PageHeader title={t('title')} subtitle={settings.intro || t('subtitle')} breadcrumbs={[{ label: t('title') }]} />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <DonateForm config={formConfig} />
            </div>

            <aside className="space-y-5">
              {/* Transfer details are published here as well, so a donor can read
                  them before committing rather than only after submitting. */}
              {config.methods.includes('manual') && config.hasTransferDetails && (
                <div className="card p-5">
                  <h2 className="font-serif text-base font-semibold text-charcoal-900 mb-3">{t('howToTitle')}</h2>
                  <dl className="space-y-2 text-sm">
                    {details.accountHolder && (
                      <div>
                        <dt className="text-charcoal-500">{t('transferAccountHolder')}</dt>
                        <dd className="font-medium text-charcoal-900">{details.accountHolder}</dd>
                      </div>
                    )}
                    {details.bankName && (
                      <div>
                        <dt className="text-charcoal-500">{t('transferBank')}</dt>
                        <dd className="font-medium text-charcoal-900">{details.bankName}</dd>
                      </div>
                    )}
                    {details.accountNumber && (
                      <div>
                        <dt className="text-charcoal-500">{t('transferAccountNumber')}</dt>
                        <dd className="font-medium text-charcoal-900 break-all">{details.accountNumber}</dd>
                      </div>
                    )}
                    {details.swift && (
                      <div>
                        <dt className="text-charcoal-500">{t('transferSwift')}</dt>
                        <dd className="font-medium text-charcoal-900">{details.swift}</dd>
                      </div>
                    )}
                  </dl>
                  {details.extraInstructions && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-600">
                      {details.extraInstructions}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-charcoal-500">{t('referenceHint')}</p>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
