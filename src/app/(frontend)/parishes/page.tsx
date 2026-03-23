import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ParishCard, type ParishCardData } from '@/features/parishes/ParishCard'
import { EmptyState } from '@/components/shared/EmptyState'

export const revalidate = 600

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

// Mock data — replaced by CMS data in Stage 5
const MOCK_PARISHES: ParishCardData[] = [
  { slug: 'st-michael-segeneyti', name: 'Cathedral of Saint Michael', vicariate: 'segeneyti', patronSaint: 'Saint Michael the Archangel', city: 'Segeneyti', priestName: 'Tesfay Haile' },
  { slug: 'st-mary-adi-keyih', name: 'Parish of Saint Mary', vicariate: 'adi-keyih', patronSaint: 'Our Lady of the Assumption', city: 'Adi Keyih', priestName: 'Gebrehiwet Tesfay' },
  { slug: 'holy-trinity-dekemhare', name: 'Parish of the Holy Trinity', vicariate: 'dekemhare', patronSaint: 'The Holy Trinity', city: 'Dekemhare', priestName: 'Dawit Abraha' },
  { slug: 'st-george-mendefera', name: 'Parish of Saint George', vicariate: 'mendefera', patronSaint: 'Saint George', city: 'Mendefera', priestName: 'Yohannes Kibrom' },
  { slug: 'st-joseph-senafe', name: 'Parish of Saint Joseph', vicariate: 'adi-keyih', patronSaint: 'Saint Joseph', city: 'Senafé', priestName: 'Berhane Tewolde' },
  { slug: 'immaculate-conception-areza', name: 'Parish of the Immaculate Conception', vicariate: 'mendefera', patronSaint: 'Our Lady Immaculate', city: 'Areza' },
  { slug: 'st-stephen-rome', name: 'St Stephen Mission (Rome)', vicariate: 'diaspora', patronSaint: 'Saint Stephen', city: 'Rome, Italy' },
  { slug: 'st-frumentius-london', name: "St Frumentius' Parish (London)", vicariate: 'diaspora', patronSaint: 'Saint Frumentius', city: 'London, UK' },
]

export default function ParishesPage() {
  return (
    <>
      <PageHeader
        title="Parishes"
        subtitle="Find a parish community in the Eparchy of Segeneyti — in Eritrea and in the diaspora."
        breadcrumbs={[{ label: 'Parishes' }]}
      />

      <Section className="bg-white">
        <Container>
          {/* Vicariate filter */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-charcoal-100 pb-4">
            {VICARIATES.map((v) => (
              <button
                key={v.value}
                className={
                  v.value === 'all'
                    ? 'rounded-full bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white'
                    : 'rounded-full border border-charcoal-200 px-4 py-1.5 text-sm font-medium text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors'
                }
                aria-pressed={v.value === 'all'}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Parishes', value: '47' },
              { label: 'Vicariates', value: '5' },
              { label: 'Priests', value: '62' },
              { label: 'Countries', value: '18' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-parchment-50 border border-parchment-200 p-4 text-center">
                <p className="text-2xl font-bold font-serif text-maroon-800">{stat.value}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Parish grid */}
          {MOCK_PARISHES.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MOCK_PARISHES.map((p) => (
                <ParishCard key={p.slug} parish={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No parishes found" description="Try a different vicariate filter." />
          )}
        </Container>
      </Section>
    </>
  )
}
