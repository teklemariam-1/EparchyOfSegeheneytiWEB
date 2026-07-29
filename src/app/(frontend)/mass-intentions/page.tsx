import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getTranslations } from 'next-intl/server'
import { MassIntentionForm } from '@/features/mass-intentions/MassIntentionForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Mass Intentions',
  description:
    'Request a Mass to be offered by the Catholic Eparchy of Segheneyti — for the departed, the sick, or in thanksgiving.',
  path: '/mass-intentions',
})

/**
 * Requesting a Mass intention.
 *
 * The audience is mostly abroad: someone who cannot be at the graveside for a
 * parent's anniversary asks that a Mass be offered at home. The page promises
 * the one thing the requester actually wants — the date will be emailed once
 * the Mass is arranged.
 */
export default async function MassIntentionsPage() {
  const [t, tn] = await Promise.all([getTranslations('massIntentions'), getTranslations('nav')])

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />

      <Section className="bg-white">
        <Container size="narrow">
          <div className="mb-8 rounded-xl border border-parchment-200 bg-parchment-50 p-5">
            <h2 className="mb-2 font-serif text-base font-semibold text-charcoal-900">
              {t('howItWorks')}
            </h2>
            <p className="text-sm leading-relaxed text-charcoal-700">{t('howItWorksBody')}</p>
          </div>

          <MassIntentionForm />
        </Container>
      </Section>
    </>
  )
}
