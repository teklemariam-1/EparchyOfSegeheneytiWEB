import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { NewsCard, type NewsCardData } from '@/features/news/NewsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getLocale, getTranslations } from 'next-intl/server'
import { getNewsList, getNewsCategories } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'News',
  description: 'Latest news and announcements from the Catholic Eparchy of Segeneyti.',
  path: '/news',
})

/** Fallback if the News Categories collection is empty/unreachable. */
const DEFAULT_CATEGORIES = [
  { value: 'eparchy', label: 'Eparchy' },
  { value: 'vatican', label: 'Vatican' },
  { value: 'pastoral', label: 'Pastoral' },
  { value: 'community', label: 'Community' },
  { value: 'social', label: 'Social Ministry' },
  { value: 'announcement', label: 'Announcements' },
]

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category, page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const locale = await getLocale()
  const t = await getTranslations('news')

  const [{ docs, meta }, managedCategories] = await Promise.all([
    getNewsList({ limit: 12, category, page: currentPage, locale }),
    getNewsCategories(),
  ])
  const isFiltered = Boolean(category && category !== 'all')

  // Filter buttons come from the admin-managed News Categories collection.
  const filterOptions = [
    { value: 'all', label: 'All' },
    ...(managedCategories.length ? managedCategories : DEFAULT_CATEGORIES),
  ]

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
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={filterOptions} paramName="category" />
          </Suspense>

          {cards.length === 0 ? (
            <EmptyState
              title="No articles found"
              description="Check back soon for the latest news from the Eparchy."
            />
          ) : isFiltered ? (
            /* Filtered by category: show a plain list of every match. Promoting
               one article to a "Featured" block here made the page look like it
               was still showing the highlight rather than the filter results. */
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((item) => (
                <NewsCard key={item.slug} news={item} variant="compact" />
              ))}
            </div>
          ) : (
            <>
              {/* Magazine block: one large lead story beside a 2×2 grid */}
              <div className="mb-10 grid gap-6 lg:grid-cols-2">
                <NewsCard news={cards[0]!} variant="lead" />

                {cards.length > 1 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {cards.slice(1, 5).map((item) => (
                      <NewsCard key={item.slug} news={item} variant="compact" />
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining stories in a denser row */}
              {cards.length > 5 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {cards.slice(5).map((item) => (
                    <NewsCard key={item.slug} news={item} variant="compact" />
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
