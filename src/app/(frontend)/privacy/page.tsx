import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getTranslations } from 'next-intl/server'

// Reads the active locale (NEXT_LOCALE cookie) via getTranslations.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy & Cookies',
  description:
    'How the Catholic Eparchy of Segheneyti website uses cookies and handles the information you send us.',
  path: '/privacy',
})

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')

  const sections = [
    { heading: t('cookiesHeading'), body: t('cookiesBody') },
    { heading: t('formHeading'), body: t('formBody') },
    { heading: t('analyticsHeading'), body: t('analyticsBody') },
    { heading: t('errorsHeading'), body: t('errorsBody') },
    { heading: t('choicesHeading'), body: t('choicesBody') },
    { heading: t('contactHeading'), body: t('contactBody') },
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container size="narrow">
          <div className="prose prose-eparchy max-w-none">
            <p className="lead">{t('intro')}</p>

            {sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                <p>{s.body}</p>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
