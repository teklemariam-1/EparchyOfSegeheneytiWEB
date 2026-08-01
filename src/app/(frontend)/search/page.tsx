import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale, getTranslations } from 'next-intl/server'
import { globalSearch } from '@/lib/payload/queries'
import { recordSearchTerm } from '@/lib/payload/searchStats'
import { SEARCH_CATEGORIES, CATEGORY_BY_TYPE, type SearchResult } from '@/lib/search/registry'
import { formatShortDate } from '@/lib/formatters/date'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search across all content on the Catholic Eparchy of Segheneyti website.',
  path: '/search',
})

/**
 * Site-wide search results.
 *
 * A plain GET form and link-based category filters, so the whole page works
 * with no JavaScript at all — the typeahead in the header is an accelerator on
 * top of this page, never a replacement for it.
 *
 * Results are RANKED globally and then GROUPED for display. Those are different
 * things and the distinction matters: the groups are ordered by their best
 * result, so a parish whose name is exactly the query brings the Parishes group
 * to the top rather than sitting wherever the parishes collection happened to
 * be queried.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>
}) {
  const { q = '', scope = 'all' } = await searchParams
  const trimmed = q.trim()
  const hasQuery = trimmed.length >= 2
  const locale = await getLocale()
  const t = await getTranslations('search')

  const results = hasQuery ? await globalSearch(trimmed, scope, locale) : []

  // Anonymous search analytics: the term, and whether it found anything.
  // Fire-and-forget — it must never delay results.
  if (hasQuery) {
    void recordSearchTerm(trimmed, results.length > 0)
  }

  // Group for display without letting the grouping become the ranking: results
  // arrive best-first, so a category's position is its best result's position.
  const groups: { key: string; icon: string; results: SearchResult[] }[] = []
  const seen = new Map<string, number>()
  for (const result of results) {
    const category = CATEGORY_BY_TYPE[result.type]
    if (!category) continue
    const at = seen.get(category.key)
    if (at === undefined) {
      seen.set(category.key, groups.length)
      groups.push({ key: category.key, icon: category.icon, results: [result] })
    } else {
      groups[at]!.results.push(result)
    }
  }

  const scopeHref = (value: string) =>
    trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}&scope=${value}`
      : `/search?scope=${value}`

  const chips = [{ key: 'all' }, ...SEARCH_CATEGORIES.map((c) => ({ key: c.key }))]

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} breadcrumbs={[{ label: t('title') }]} />

      <Section className="bg-white">
        <Container size="narrow">
          <form method="GET" action="/search" className="relative mb-8">
            <label htmlFor="search-input" className="sr-only">
              {t('srLabel')}
            </label>
            {scope !== 'all' && <input type="hidden" name="scope" value={scope} />}
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="search-input"
                name="q"
                type="search"
                defaultValue={q}
                placeholder={t('placeholder')}
                className="w-full rounded-xl border border-charcoal-200 bg-white py-3.5 pl-12 pr-28 text-base text-charcoal-900 placeholder-charcoal-400 shadow-sm transition focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200"
                aria-label={t('srLabel')}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-maroon-700"
              >
                {t('submit')}
              </button>
            </div>
          </form>

          {/* Category filters — links, so they work without JavaScript. */}
          <nav aria-label={t('searchScope')} className="mb-8 flex flex-wrap gap-2">
            {chips.map((chip) => {
              const active = chip.key === scope || (chip.key === 'all' && scope === 'all')
              return (
                <Link
                  key={chip.key}
                  href={scopeHref(chip.key)}
                  aria-current={active ? 'true' : undefined}
                  className={
                    active
                      ? 'rounded-full bg-maroon-800 px-3 py-1 text-xs font-medium text-white'
                      : 'rounded-full border border-charcoal-200 px-3 py-1 text-xs font-medium text-charcoal-600 transition-colors hover:border-maroon-300 hover:text-maroon-700'
                  }
                >
                  {t(`category.${chip.key}`)}
                </Link>
              )
            })}
          </nav>

          {hasQuery ? (
            results.length > 0 ? (
              <div>
                <p className="mb-6 text-sm text-charcoal-500">
                  {results.length === 1 ? t('resultCountOne') : `${results.length} ${t('results')}`}{' '}
                  <span className="font-semibold text-charcoal-900">“{trimmed}”</span>
                  {scope !== 'all' && (
                    <>
                      {' '}
                      {t('inCategory')}{' '}
                      <span className="font-semibold">{t(`category.${scope}`)}</span>
                    </>
                  )}
                </p>

                <div className="space-y-10">
                  {groups.map((group) => (
                    <section key={group.key} aria-labelledby={`group-${group.key}`}>
                      <h2
                        id={`group-${group.key}`}
                        className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-maroon-700"
                      >
                        <span aria-hidden="true">{group.icon}</span>
                        {t(`category.${group.key}`)}
                        <span className="font-normal text-charcoal-400">
                          ({group.results.length})
                        </span>
                      </h2>

                      <ul className="space-y-4">
                        {group.results.map((item, i) => (
                          <li key={`${item.type}-${item.slug}-${i}`}>
                            <Link
                              href={CATEGORY_BY_TYPE[item.type]!.href(item.slug)}
                              className="group block rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm transition hover:border-maroon-200 hover:shadow-md"
                            >
                              {item.date && (
                                <span className="text-xs text-charcoal-400">
                                  {formatShortDate(item.date, locale)}
                                </span>
                              )}
                              <h3 className="search-result-title line-clamp-2 font-serif text-base font-semibold text-charcoal-900 transition-colors group-hover:text-maroon-800">
                                {item.title}
                              </h3>
                              {item.excerpt && (
                                <p className="mt-1 line-clamp-2 text-sm text-charcoal-500">
                                  {item.excerpt}
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-charcoal-200 p-10 text-center">
                <p className="mb-2 font-serif text-lg font-semibold text-charcoal-700">
                  {t('noResults')} “{trimmed}”
                </p>
                <p className="mx-auto max-w-xs text-sm text-charcoal-500">{t('noResultsHint')}</p>
              </div>
            )
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-charcoal-200 p-10 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-charcoal-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="mb-2 font-serif text-lg font-semibold text-charcoal-700">
                {t('emptyTitle')}
              </p>
              <p className="mx-auto max-w-sm text-sm text-charcoal-500">{t('emptyBody')}</p>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
