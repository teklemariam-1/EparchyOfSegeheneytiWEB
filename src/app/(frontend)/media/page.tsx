import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: 'Media',
  description: 'Photo gallery and media resources from the Catholic Eparchy of Segeneyti.',
  path: '/media',
})

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'liturgy', label: 'Liturgy' },
  { value: 'youth', label: 'Youth' },
  { value: 'community', label: 'Community' },
  { value: 'pastoral-visit', label: 'Pastoral Visits' },
  { value: 'ordination', label: 'Ordinations' },
]

// Mock gallery items — real data from CMS Media collection in Stage 5
const GALLERY_ITEMS = [
  { id: 1, alt: 'Easter Mass at Segeneyti Cathedral', category: 'liturgy', year: 2024 },
  { id: 2, alt: 'Youth Day gathering, Segeneyti 2024', category: 'youth', year: 2024 },
  { id: 3, alt: "Bishop's pastoral visit to Dekemhare", category: 'pastoral-visit', year: 2024 },
  { id: 4, alt: 'Diaconate ordination ceremony', category: 'ordination', year: 2024 },
  { id: 5, alt: 'Women\'s league meeting', category: 'community', year: 2024 },
  { id: 6, alt: 'Timkat celebration procession', category: 'liturgy', year: 2025 },
  { id: 7, alt: 'School blessing ceremony', category: 'community', year: 2024 },
  { id: 8, alt: 'Lenten youth retreat 2025', category: 'youth', year: 2025 },
  { id: 9, alt: 'Feast of St Michael patronal celebration', category: 'liturgy', year: 2024 },
  { id: 10, alt: 'Visit of papal nuncio', category: 'pastoral-visit', year: 2024 },
  { id: 11, alt: 'Children catechism class', category: 'community', year: 2024 },
  { id: 12, alt: 'Choir performing at Pentecost', category: 'liturgy', year: 2024 },
]

const PLACEHOLDER_COLORS = [
  'bg-maroon-100', 'bg-gold-100', 'bg-parchment-200', 'bg-charcoal-100',
  'bg-maroon-50', 'bg-gold-50', 'bg-parchment-100', 'bg-charcoal-50',
]

export default function MediaPage() {
  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Photos and media from liturgical life, pastoral visits, and community events across the Eparchy."
        breadcrumbs={[{ label: 'Media' }]}
      />

      <Section className="bg-white">
        <Container>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-charcoal-100 pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={
                  cat.value === 'all'
                    ? 'rounded-full bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white'
                    : 'rounded-full border border-charcoal-200 px-4 py-1.5 text-sm font-medium text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors'
                }
                aria-pressed={cat.value === 'all'}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={item.id}
                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
                  PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]
                }`}
              >
                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                  <svg
                    className="h-8 w-8 text-charcoal-300 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-charcoal-900/0 group-hover:bg-charcoal-900/60 transition-colors flex items-end p-3">
                  <p className="text-white text-xs font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                    {item.alt}
                  </p>
                </div>

                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="maroon" size="sm" className="shadow-sm">
                    {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="mt-8 text-center text-sm text-charcoal-400">
            Photos are placeholders. The full media gallery — with real images from CMS — will be
            available in Stage 5.
          </p>

          {/* Load more */}
          <div className="mt-6 flex justify-center">
            <button className="rounded-md border border-charcoal-200 px-6 py-2 text-sm text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors">
              Load More
            </button>
          </div>
        </Container>
      </Section>
    </>
  )
}
