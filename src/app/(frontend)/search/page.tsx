import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { globalSearch, type SearchResult } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search across all content on the Catholic Eparchy of Segeneyti website.',
  path: '/search',
})

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'events', label: 'Events' },
  { value: 'parishes', label: 'Parishes' },
  { value: 'ministries', label: 'Ministries' },
  { value: 'publications', label: 'Publications' },
]

const TYPE_META: Record<SearchResult['type'], { icon: string; label: string; href: (slug: string) => string }> = {
  news: { icon: '📰', label: 'News', href: (s) => `/news/${s}` },
  event: { icon: '📅', label: 'Event', href: (s) => `/events/${s}` },
  parish: { icon: '⛪', label: 'Parish', href: (s) => `/parishes/${s}` },
  ministry: { icon: '🙏', label: 'Ministry', href: (s) => `/ministries/${s}` },
  publication: { icon: '📖', label: 'Publication', href: (s) => `/publications/${s}` },
  'bishop-message': { icon: '✉️', label: "Bishop's Message", href: (s) => `/bishop-messages/${s}` },
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>
}) {
  const { q = '', scope = 'all' } = await searchParams
  const trimmed = q.trim()
  const results = trimmed.length >= 2 ? await globalSearch(trimmed, scope) : []
  const hasQuery = trimmed.length >= 2

  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find news, events, parishes, publications, and more across the Eparchy."
        breadcrumbs={[{ label: 'Search' }]}
      />

      <Section className="bg-white">
        <Container size="narrow">
          {/* Search form (plain GET — no JS required) */}
          <form method="GET" action="/search" className="relative mb-8">
            <label htmlFor="search-input" className="sr-only">
              Search the Eparchy website
            </label>
            {scope !== 'all' && (
              <input type="hidden" name="scope" value={scope} />
            )}
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-input"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search news, events, parishes…"
                className="w-full rounded-xl border border-charcoal-200 bg-white py-3.5 pl-12 pr-28 text-base text-charcoal-900 placeholder-charcoal-400 shadow-sm focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
                aria-label="Search the Eparchy website"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-maroon-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Scope filter (link-based, no JS) */}
          <div className="flex flex-wrap gap-2 mb-8">
            {SCOPES.map((s) => (
              <a
                key={s.value}
                href={trimmed ? `/search?q=${encodeURIComponent(trimmed)}&scope=${s.value}` : `/search?scope=${s.value}`}
                className={
                  (s.value === scope || (s.value === 'all' && (!scope || scope === 'all')))
                    ? 'rounded-full bg-maroon-800 px-3 py-1 text-xs font-medium text-white'
                    : 'rounded-full border border-charcoal-200 px-3 py-1 text-xs font-medium text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors'
                }
                aria-current={s.value === scope ? 'true' : undefined}
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Results */}
          {hasQuery ? (
            results.length > 0 ? (
              <div>
                <p className="text-sm text-charcoal-500 mb-6">
                  {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
                  <span className="font-semibold text-charcoal-900">"{trimmed}"</span>
                  {scope !== 'all' && (
                    <> in <span className="font-semibold capitalize">{scope}</span></>
                  )}
                </p>

                <ul className="space-y-4">
                  {results.map((item, i) => {
                    const meta = TYPE_META[item.type]
                    return (
                      <li key={`${item.type}-${item.slug}-${i}`}>
                        <a
                          href={meta.href(item.slug)}
                          className="group block rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm hover:border-maroon-200 hover:shadow-md transition"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{meta.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="inline-block rounded-full bg-parchment-100 border border-parchment-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-maroon-700">
                                  {meta.label}
                                </span>
                                {item.date && (
                                  <span className="text-xs text-charcoal-400">{formatDate(item.date)}</span>
                                )}
                              </div>
                              <h3 className="font-serif text-base font-semibold text-charcoal-900 group-hover:text-maroon-800 transition-colors line-clamp-2">
                                {item.title}
                              </h3>
                              {item.excerpt && (
                                <p className="mt-1 text-sm text-charcoal-500 line-clamp-2">{item.excerpt}</p>
                              )}
                            </div>
                          </div>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-charcoal-200 p-10 text-center">
                <svg className="mx-auto h-12 w-12 text-charcoal-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-serif text-lg font-semibold text-charcoal-700 mb-2">No results found</p>
                <p className="text-sm text-charcoal-500 max-w-xs mx-auto">
                  No content matched <span className="font-semibold">"{trimmed}"</span>. Try a different keyword or broaden your scope.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-charcoal-200 p-10 text-center">
              <svg
                className="mx-auto h-12 w-12 text-charcoal-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-serif text-lg font-semibold text-charcoal-700 mb-2">
                Search the entire Eparchy website
              </p>
              <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
                Type at least two characters above to search across news, events, parishes, ministries, and publications.
              </p>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}

