import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { NewsCard, type NewsCardData } from '@/features/news/NewsCard'
import { MagazineView } from '@/features/news/MagazineView'
import { ViewToggle } from '@/features/news/ViewToggle'
import { YearFilter } from '@/features/news/YearFilter'
import { NEWS_VIEW_COOKIE, parseNewsView } from '@/features/news/view'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getLocale, getTranslations } from 'next-intl/server'
import { getNewsList, getNewsCategories, getNewsYears } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

/**
 * Single source of truth for pagination.
 *
 * PAGE_SIZE is shared by BOTH views so they paginate identically — the same
 * articles land on the same page whichever layout is chosen, which is what
 * makes the toggle presentation-only.
 *
 * 12 is a multiple of the desktop column count (4 → `lg:grid-cols-4`), so the
 * card grid fills completely at the 4-up desktop and 2-up tablet breakpoints.
 * The magazine view takes 5 for its featured block, leaving 7 — which does not
 * divide by 4. That mismatch is what left a hole on every page in the earlier
 * magazine attempt; MagazineView closes it by spanning one card across two
 * columns rather than by changing this number. See the comment there before
 * touching either value.
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
  searchParams: Promise<{ category?: string; page?: string; year?: string }>
}) {
  const { category, page: pageParam, year: yearParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const year = /^\d{4}$/.test(yearParam ?? '') ? Number(yearParam) : undefined
  const locale = await getLocale()
  const t = await getTranslations('news')

  // Read on the server so the chosen layout is in the first byte of HTML —
  // no flash of the wrong view while a client effect catches up.
  const cookieStore = await cookies()
  const view = parseNewsView(cookieStore.get(NEWS_VIEW_COOKIE)?.value)

  const [{ docs, meta }, managedCategories, years] = await Promise.all([
    getNewsList({ limit: PAGE_SIZE, category, page: currentPage, locale, year }),
    getNewsCategories(),
    getNewsYears(),
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

  /** Keeps category and year while changing one of page/year. */
  const buildQuery = (overrides: { page?: number; year?: number | undefined }) => {
    const params = new URLSearchParams()
    if (category && category !== 'all') params.set('category', category)
    const nextYear = 'year' in overrides ? overrides.year : year
    if (nextYear) params.set('year', String(nextYear))
    if (overrides.page && overrides.page > 1) params.set('page', String(overrides.page))
    const query = params.toString()
    return query ? `/news?${query}` : '/news'
  }

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

          {/* Archive year + layout choice. Both are chrome: fixed size, never
              scaled by the reader's font-size preference. */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <YearFilter
              years={years}
              selected={year}
              buildHref={(nextYear) => buildQuery({ year: nextYear })}
              labels={{ trigger: t('selectYear'), all: t('allYears') }}
            />
            <ViewToggle
              current={view}
              labels={{ grid: t('viewGrid'), magazine: t('viewMagazine'), legend: t('viewToggleLabel') }}
            />
          </div>

          {cards.length === 0 ? (
            <EmptyState
              title={t('emptyTitle')}
              description={year ? t('emptyYearDescription', { year }) : t('emptyDescription')}
            />
          ) : view === 'magazine' ? (
            <MagazineView items={cards} />
          ) : (
            /* One uniform grid so every non-final page fills completely.
               `auto-rows-fr` + `h-full` cards give equal-height rows even when
               titles wrap to a different number of lines. */
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((item) => (
                <NewsCard key={item.slug} news={item} variant="compact" className="h-full" />
              ))}
            </div>
          )}

          {/* Pagination — identical in both views. */}
          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={buildQuery({ page: meta.page - 1 })}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  ← {t('previous')}
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={buildQuery({ page: meta.page + 1 })}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  {t('next')} →
                </a>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
