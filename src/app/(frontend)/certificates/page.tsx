import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getTranslations } from 'next-intl/server'
import { SacramentalRequestForm } from '@/features/sacramental/SacramentalRequestForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Sacramental records & certificates',
  description:
    'Request a baptism, confirmation or marriage record from the Catholic Eparchy of Segheneyti.',
  path: '/certificates',
})

/**
 * Requesting a sacramental record.
 *
 * The audience for this page is mostly abroad: a diaspora Eritrean whose
 * diocese has asked for proof of baptism before a wedding. Previously they had
 * to describe that in the contact form's free-text box, and the chancery got a
 * message with no parish, no date and no parents' names — the three things
 * needed to find an entry in a handwritten register.
 */
export default async function CertificatesPage() {
  const [t, tn] = await Promise.all([getTranslations('sacramental'), getTranslations('nav')])

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
              {t('beforeYouStart')}
            </h2>
            <p className="text-sm leading-relaxed text-charcoal-700">{t('beforeYouStartBody')}</p>
          </div>

          <SacramentalRequestForm />
        </Container>
      </Section>
    </>
  )
}
