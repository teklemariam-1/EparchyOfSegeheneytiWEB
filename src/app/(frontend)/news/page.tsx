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

/**
 * Single source of truth for pagination + grid layout.
 *
 * PAGE_SIZE is a multiple of the desktop column count (4 → `lg:grid-cols-4`) so
 * every non-final page fills completely at the 4-up desktop and 2-up tablet
 * breakpoints. It drives the query limit, the grid, and — via the query —
 * totalPages, so the three can never drift out of sync. A previous "magazine"
 * layout carved a 5-item featured block out of the page and rendered the
 * remaining 7 in a 4-wide grid, leaving one slot empty on every page; a uniform
 * grid removes that gap.
 */
const PAGE_SIZE = 12

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
    getNewsList({ limit: PAGE_SIZE, category, page: currentPage, locale }),
    getNewsCategories(),
  ])

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
          ) : (
            /* One uniform grid so every non-final page fills completely.
               `auto-rows-fr` + `h-full` cards give equal-height rows even when
               titles wrap to a different number of lines. `lg:grid-cols-4`
               matches GRID_COLS; PAGE_SIZE is a multiple of it. */
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((item) => (
                <NewsCard key={item.slug} news={item} variant="compact" className="h-full" />
              ))}
            </div>
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
