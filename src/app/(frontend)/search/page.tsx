import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search across all content on the Catholic Eparchy of Segeneyti website.',
  path: '/search',
})

const CONTENT_TYPES = [
  { icon: '📰', label: 'News articles' },
  { icon: '📅', label: 'Events & celebrations' },
  { icon: '⛪', label: 'Parishes' },
  { icon: '📖', label: 'Publications' },
  { icon: '🙏', label: 'Ministries' },
  { icon: '📷', label: 'Media & photos' },
]

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find news, events, parishes, publications, and more across the Eparchy."
        breadcrumbs={[{ label: 'Search' }]}
      />

      <Section className="bg-white">
        <Container size="narrow">
          {/* Search input */}
          <div className="relative mb-8">
            <label htmlFor="search-input" className="sr-only">
              Search the Eparchy website
            </label>
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
                type="search"
                placeholder="Search news, events, parishes…"
                className="w-full rounded-xl border border-charcoal-200 bg-white py-3.5 pl-12 pr-4 text-base text-charcoal-900 placeholder-charcoal-400 shadow-sm focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
                aria-label="Search the Eparchy website"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-maroon-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Scope filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {['All', 'News', 'Events', 'Parishes', 'Publications', 'Media'].map((scope) => (
              <button
                key={scope}
                className={
                  scope === 'All'
                    ? 'rounded-full bg-maroon-800 px-3 py-1 text-xs font-medium text-white'
                    : 'rounded-full border border-charcoal-200 px-3 py-1 text-xs font-medium text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors'
                }
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Empty-state / prompt */}
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
              Type a keyword above to search across all content. Full search powered by the CMS
              will be live in Stage 6.
            </p>
          </div>

          {/* What you can search */}
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-4 text-center">
              Search across
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CONTENT_TYPES.map((ct) => (
                <div
                  key={ct.label}
                  className="flex items-center gap-3 rounded-xl border border-charcoal-100 px-4 py-3 text-sm text-charcoal-700"
                >
                  <span className="text-xl" aria-hidden="true">{ct.icon}</span>
                  {ct.label}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
