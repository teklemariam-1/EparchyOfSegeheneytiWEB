import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getObituaryBySlug } from '@/lib/obituary/queries'
import { ObituaryArticle } from '@/features/obituaries/ObituaryArticle'
import type { ObituaryLocale } from '@/lib/obituary/compose'

// Locale comes from the NEXT_LOCALE cookie — dynamic like every detail page
// (see the note in news/[slug] about DYNAMIC_SERVER_USAGE).
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await getObituaryBySlug(slug)
  if (!doc) notFound()

  const honorific = (doc.honorific === 'other' ? doc.honorificOther : doc.honorific) ?? ''
  const photo = typeof doc.photo === 'object' ? doc.photo : null
  return buildMetadata({
    title: doc.seo?.metaTitle ?? `${honorific} ${doc.fullName}`.trim(),
    description:
      doc.seo?.metaDescription ??
      `ታሪኽ ሕይወት ${honorific} ${doc.fullName} — Catholic Eparchy of Segheneyti.`,
    image: photo?.url ?? undefined,
    path: `/obituaries/${slug}`,
    type: 'article',
  })
}

export default async function ObituaryDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = (await getLocale()) as ObituaryLocale
  const t = await getTranslations('obituaries')
  const tn = await getTranslations('nav')
  const doc = await getObituaryBySlug(slug, locale)
  if (!doc) notFound()

  const honorific = (doc.honorific === 'other' ? doc.honorificOther : doc.honorific) ?? ''

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={`${honorific} ${doc.fullName}`}
          breadcrumbs={[
            { label: tn('home'), href: '/' },
            { label: t('title'), href: '/obituaries' },
            { label: doc.fullName },
          ]}
        />
      </div>

      <Section className="bg-parchment-100 print:bg-white">
        <Container size="narrow">
          <ObituaryArticle doc={doc} locale={locale} />
        </Container>
      </Section>
    </>
  )
}
