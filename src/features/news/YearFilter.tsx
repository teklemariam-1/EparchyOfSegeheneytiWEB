import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * "Select the year" archive filter.
 *
 * Server-side by query parameter, not client-side filtering: with 100 articles
 * and growing, filtering in the browser would mean shipping the whole archive
 * to every visitor and would break pagination (page 2 of a client-filtered list
 * is meaningless). The year becomes `?year=2026`, the query does the work, and
 * the result is linkable and crawlable.
 *
 * Built from `<details>` + links rather than a `<select>`, so it needs no
 * JavaScript at all — it works on the slow connections and older handsets much
 * of this audience browses on.
 */

interface YearFilterProps {
  years: number[]
  selected?: number
  /** Preserves the other filters when switching year. */
  buildHref: (year?: number) => string
  labels: { trigger: string; all: string }
}

export function YearFilter({ years, selected, buildHref, labels }: YearFilterProps) {
  if (years.length === 0) return null

  return (
    <details className="group relative">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-3 py-1.5',
          'text-xs font-semibold text-charcoal-600 transition-colors hover:border-maroon-300 hover:text-maroon-800',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        {selected ?? labels.trigger}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-3 w-3 transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="absolute left-0 z-20 mt-1 max-h-72 w-40 overflow-y-auto rounded-lg border border-charcoal-200 bg-white py-1 shadow-lg">
        <Link
          href={buildHref(undefined)}
          className={cn(
            'block px-3 py-1.5 text-xs transition-colors hover:bg-parchment',
            selected === undefined ? 'font-semibold text-maroon-800' : 'text-charcoal-600',
          )}
        >
          {labels.all}
        </Link>
        {years.map((year) => (
          <Link
            key={year}
            href={buildHref(year)}
            className={cn(
              'block px-3 py-1.5 text-xs transition-colors hover:bg-parchment',
              selected === year ? 'font-semibold text-maroon-800' : 'text-charcoal-600',
            )}
          >
            {year}
          </Link>
        ))}
      </div>
    </details>
  )
}
