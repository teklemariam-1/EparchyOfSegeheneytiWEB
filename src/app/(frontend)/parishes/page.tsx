import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ParishCard, type ParishCardData } from '@/features/parishes/ParishCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getParishesList } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Parishes',
  description: 'Explore all parishes of the Catholic Eparchy of Segeneyti across Eritrea and the diaspora.',
  path: '/parishes',
})

const VICARIATES = [
  { value: 'all', label: 'All Vicariates' },
  { value: 'segeneyti', label: 'Segeneyti' },
  { value: 'adi-keyih', label: 'Adi Keyih' },
  { value: 'dekemhare', label: 'Dekemhare' },
  { value: 'mendefera', label: 'Mendefera' },
  { value: 'diaspora', label: 'Diaspora' },
]

export default async function ParishesPage({
  searchParams,
}: {
  searchParams: Promise<{ vicariate?: string }>
}) {
  const { vicariate } = await searchParams
  const parishes = await getParishesList(100, vicariate)

  const cards: ParishCardData[] = parishes.map((p) => ({
    slug: p.slug,
    name: p.title,
    vicariate: p.vicariate ?? 'segeneyti',
    patronSaint: p.patronSaint,
    city: p.city,
    imageUrl: p.image?.url,
    priestName: p.pastor ?? undefined,
  }))

  return (
    <>
      <PageHeader
        title="Parishes"
        subtitle="Find a parish community in the Eparchy of Segeneyti — in Eritrea and in the diaspora."
        breadcrumbs={[{ label: 'Parishes' }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={VICARIATES} paramName="vicariate" />
          </Suspense>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Parishes', value: String(cards.length || '—') },
              { label: 'Vicariates', value: '5' },
              { label: 'Priests', value: String(cards.filter((p) => p.priestName).length || '—') },
              { label: 'Countries', value: '18' },
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
