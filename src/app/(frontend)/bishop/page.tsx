import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BishopProfile } from '@/features/bishop/BishopProfile'
import { getActiveBishop } from '@/lib/bishops/queries'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { bishopPersonSchema } from '@/lib/bishops/schema'

// Resolves the active locale from the NEXT_LOCALE cookie, so it can never be
// statically generated — same reason as the other content routes.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const bishop = await getActiveBishop()
  if (!bishop) return buildMetadata({ title: 'Eparch', noIndex: true })

  return buildMetadata({
    title: bishop.seo?.metaTitle ?? bishop.fullName ?? 'Eparch',
    description: bishop.seo?.metaDescription ?? bishop.biographySummary ?? undefined,
    path: '/bishop',
    image: bishop.portrait?.url,
    type: 'article',
  })
}

/**
 * The sitting Eparch's profile.
 *
 * A distinct route from /eparchs/[slug] so the header, footer and About page can
 * link to "the Eparch" without knowing who currently holds the office — when
 * the sitting Eparch changes, this URL follows automatically and no link needs
 * editing.
 *
 * 404s rather than showing a placeholder when no Eparch has been marked as
 * sitting: inventing a name for an office that has one real occupant is worse
 * than an honest missing page.
 */
export default async function BishopPage() {
  const locale = await getLocale()
  const [bishop, t] = await Promise.all([getActiveBishop(locale), getTranslations('bishop')])
  if (!bishop) notFound()

  const tn = await getTranslations('nav')

  return (
    <>
      {/* JsonLd escapes "<" so a stray "</script>" in CMS text cannot break out
          of the tag — which is why this does not hand-roll the script element. */}
      <JsonLd data={bishopPersonSchema(bishop)} />

      <PageHeader
        title={bishop.fullName ?? t('title')}
        subtitle={bishop.formalTitle ?? undefined}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />
      <BishopProfile bishop={bishop} locale={locale} />
    </>
  )
}
