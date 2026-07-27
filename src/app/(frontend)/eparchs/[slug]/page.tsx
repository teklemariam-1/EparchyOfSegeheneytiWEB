import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BishopProfile } from '@/features/bishop/BishopProfile'
import { getBishopBySlug } from '@/lib/bishops/queries'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { bishopPersonSchema } from '@/lib/bishops/schema'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const bishop = await getBishopBySlug(slug)
  if (!bishop) return {}

  return buildMetadata({
    title: bishop.seo?.metaTitle ?? bishop.fullName ?? '',
    description: bishop.seo?.metaDescription ?? bishop.biographySummary ?? undefined,
    path: `/eparchs/${bishop.slug}`,
    image: bishop.portrait?.url,
    type: 'article',
  })
}

/**
 * An individual Eparch's profile — the permanent URL for a man, as distinct
 * from /bishop, which always points at whoever currently holds the office.
 * A predecessor added later for the historical record lives here and stays here.
 */
export default async function EparchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const [bishop, t, tn] = await Promise.all([
    getBishopBySlug(slug, locale),
    getTranslations('bishop'),
    getTranslations('nav'),
  ])
  if (!bishop) notFound()

  return (
    <>
      {/* JsonLd escapes "<" so a stray "</script>" in CMS text cannot break out
          of the tag — which is why this does not hand-roll the script element. */}
      <JsonLd data={bishopPersonSchema(bishop)} />

      <PageHeader
        title={bishop.fullName ?? ''}
        subtitle={bishop.formalTitle ?? undefined}
        breadcrumbs={[
          { label: tn('home'), href: '/' },
          { label: t('successionTitle'), href: '/eparchs' },
          { label: bishop.fullName ?? '' },
        ]}
      />
      <BishopProfile bishop={bishop} locale={locale} />
    </>
  )
}
