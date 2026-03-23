import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { NewsCard, type NewsCardData } from '@/features/news/NewsCard'
import { EmptyState } from '@/components/shared/EmptyState'

export const revalidate = 300

export const metadata: Metadata = buildMetadata({
  title: 'News',
  description: 'Latest news and announcements from the Catholic Eparchy of Segeneyti.',
  path: '/news',
})

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'eparchy', label: 'Eparchy' },
  { value: 'vatican', label: 'Vatican' },
  { value: 'community', label: 'Community' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'youth', label: 'Youth' },
]

// Mock data — replaced by real CMS data in Stage 5
const MOCK_NEWS: NewsCardData[] = [
  {
    slug: 'bishop-pastoral-letter-2024',
    title: 'Bishop Issues Pastoral Letter on Family and Faith',
    excerpt:
      'In a heartfelt message to the faithful, the Bishop of Segeneyti reflects on the role of the family as the domestic church and calls for renewed commitment to prayer and catechesis in every home.',
    category: 'eparchy',
    publishedAt: '2024-12-01T08:00:00Z',
  },
  {
    slug: 'advent-preparations-parishes',
    title: 'Parishes Across the Eparchy Prepare for Advent Season',
    excerpt:
      'As the sacred season of Advent approaches in the Ge\'ez liturgical calendar, parishes throughout the vicariates of Segeneyti, Adi Keyih, and Dekemhare are organising special prayer evenings and youth retreats.',
    category: 'community',
    publishedAt: '2024-11-28T10:30:00Z',
  },
  {
    slug: 'pope-message-africa-solidarity',
    title: 'Pope Francis Calls for Solidarity with African Communities',
    excerpt:
      'In his Sunday Angelus address, the Holy Father offered prayers for peace and called on the global Catholic community to stand in solidarity with the peoples of the Horn of Africa.',
    category: 'vatican',
    publishedAt: '2024-11-24T12:00:00Z',
  },
  {
    slug: 'youth-day-segeneyti-2024',
    title: 'Diocesan Youth Day 2024 Draws 800 Young Pilgrims',
    excerpt:
      'Over 800 young people from all vicariates gathered in Segeneyti for the annual Diocesan Youth Day, organised around the theme "Walk in the Light." The day featured Mass, testimonies, and formation workshops.',
    category: 'youth',
    publishedAt: '2024-11-15T14:00:00Z',
  },
  {
    slug: 'new-school-mendefera',
    title: 'Ground-Breaking for New Parish School in Mendefera Vicariate',
    excerpt:
      'A ground-breaking ceremony was held for a new primary school attached to a rural parish in the Mendefera Vicariate. The school will accommodate 350 students and will open its doors in early 2025.',
    category: 'announcement',
    publishedAt: '2024-11-10T09:00:00Z',
  },
  {
    slug: 'synod-eritrean-bishops',
    title: 'Eritrean Catholic Bishops\' Conference Concludes Autumn Synod',
    excerpt:
      'The Catholic Bishops of Eritrea concluded their autumn plenary session with a joint communiqué highlighting themes of peace, education, and the promotion of integral human development across all dioceses.',
    category: 'eparchy',
    publishedAt: '2024-11-05T11:00:00Z',
  },
]

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="News"
        subtitle="Latest announcements, pastoral letters, and updates from the Eparchy."
        breadcrumbs={[{ label: 'News' }]}
      />

      <Section className="bg-white">
        <Container>
          {/* Category filter tabs */}
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

          {/* Featured article */}
          {MOCK_NEWS[0] && (
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-maroon-600 mb-3">
                Featured
              </p>
              <NewsCard news={MOCK_NEWS[0]} featured />
            </div>
          )}

          {/* News grid */}
          {MOCK_NEWS.length > 1 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_NEWS.slice(1).map((item) => (
                <NewsCard key={item.slug} news={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No articles found"
              description="Check back soon for the latest news from the Eparchy."
            />
          )}

          {/* Pagination placeholder */}
          <div className="mt-10 flex justify-center gap-2">
            <button className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors">
              ← Previous
            </button>
            <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
              1
            </span>
            <button className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors">
              Next →
            </button>
          </div>
        </Container>
      </Section>
    </>
  )
}
