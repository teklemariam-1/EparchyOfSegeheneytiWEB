import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ParishCard, type ParishCardData } from '@/features/parishes/ParishCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getLocale, getTranslations } from 'next-intl/server'
import { getParishesList, getVicariatesList } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Parishes',
  description: 'Explore all parishes of the Catholic Eparchy of Segheneyti across Eritrea and the diaspora.',
  path: '/parishes',
})

export default async function ParishesPage({
  searchParams,
}: {
  searchParams: Promise<{ vicariate?: string }>
}) {
  const { vicariate } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('parishes')
  const [parishes, vicariates] = await Promise.all([
    getParishesList(100, vicariate, locale),
    getVicariatesList(locale),
  ])

  // Filter options come from the CMS now, so adding a vicariate in the admin
  // makes it filterable here without a code change.
  const VICARIATES = [
    { value: 'all', label: t('allVicariates') },
    ...vicariates.map((v) => ({ value: v.slug, label: v.name })),
  ]

  const cards: ParishCardData[] = parishes.map((p) => ({
    slug: p.slug,
    name: p.title,
    vicariate: p.vicariate?.slug ?? '',
    vicariateName: p.vicariate?.name,
    patronSaint: p.patronSaint,
    city: p.city,
    imageUrl: p.image?.url,
    priestName: p.pastor ?? undefined,
  }))

  const uniqueVicariates = new Set(cards.map((p) => p.vicariate).filter(Boolean)).size
  const priestCount = cards.filter((p) => p.priestName).length

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={VICARIATES} paramName="vicariate" />
          </Suspense>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Total Parishes', value: cards.length ? String(cards.length) : '—' },
              { label: 'Vicariates', value: uniqueVicariates ? String(uniqueVicariates) : '—' },
              { label: 'Priests', value: priestCount ? String(priestCount) : '—' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-parchment-50 border border-parchment-200 p-4 text-center">
                <p className="text-2xl font-bold font-serif text-maroon-800">{stat.value}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Parish grid */}
          {cards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {cards.map((p) => (
                <ParishCard key={p.slug} parish={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No parishes found" description="Parish data will appear here once added to the CMS." />
          )}
        </Container>
      </Section>
    </>
  )
}
