import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { DonateForm, type DonateFormConfig } from '@/features/donate/DonateForm'
import { getDonationSettings } from '@/lib/payload/queries'
import { getLocale, getTranslations } from 'next-intl/server'

export const metadata: Metadata = buildMetadata({
  title: 'Donate',
  description: 'Support the mission and ministries of the Catholic Eparchy of Segeneyti with a donation.',
  path: '/donate',
})

export default async function DonatePage() {
  const locale = await getLocale()
  const [settings, t] = await Promise.all([getDonationSettings(locale), getTranslations('donate')])

  if (settings.enabled !== true) {
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

  const config: DonateFormConfig = {
    presetAmounts: (settings.presetAmounts ?? []).map((p) => p.amount).filter((n) => n > 0),
    defaultCurrency: settings.defaultCurrency ?? 'ERN',
    currencies: settings.currencies ?? [],
    allowCustomAmount: settings.allowCustomAmount !== false,
    allowRecurring: settings.allowRecurring !== false,
    minAmount: settings.minAmount,
    maxAmount: settings.maxAmount,
    locale,
  }

  return (
    <>
      <PageHeader title={t('title')} subtitle={settings.intro || t('subtitle')} breadcrumbs={[{ label: t('title') }]} />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <DonateForm config={config} />
            </div>

            <aside className="space-y-5">
              {settings.manualInstructions && (
                <div className="card p-5">
                  <h2 className="font-serif text-base font-semibold text-charcoal-900 mb-2">
                    {t('howToTitle')}
                  </h2>
                  <p className="text-sm text-charcoal-600 whitespace-pre-line leading-relaxed">
                    {settings.manualInstructions}
                  </p>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
