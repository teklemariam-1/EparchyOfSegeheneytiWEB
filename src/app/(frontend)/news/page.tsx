import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { NewsCard, type NewsCardData } from '@/features/news/NewsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getNewsList } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

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

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category, page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1

  const { docs, meta } = await getNewsList({ limit: 12, category, page: currentPage })

  const cards: NewsCardData[] = docs.map((item) => ({
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? '',
    category: item.category ?? 'eparchy',
    publishedAt: item.publishedAt ?? new Date().toISOString(),
    imageUrl: item.featuredImage?.url,
    imageAlt: item.featuredImage?.alt,
  }))

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Latest announcements, pastoral letters, and updates from the Eparchy."
        breadcrumbs={[{ label: 'News' }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={CATEGORIES} paramName="category" />
          </Suspense>

          {cards.length === 0 ? (
            <EmptyState
              title="No articles found"
              description="Check back soon for the latest news from the Eparchy."
            />
          ) : (
            <>
              {/* Featured article */}
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-maroon-600 mb-3">
                  Featured
                </p>
                <NewsCard news={cards[0]!} featured />
              </div>

              {/* News grid */}
              {cards.length > 1 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.slice(1).map((item) => (
                    <NewsCard key={item.slug} news={item} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={`/news?${category && category !== 'all' ? `category=${category}&` : ''}page=${meta.page - 1}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  ← Previous
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={`/news?${category && category !== 'all' ? `category=${category}&` : ''}page=${meta.page + 1}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
