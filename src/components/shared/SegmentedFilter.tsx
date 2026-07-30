import Link from 'next/link'

export interface Segment {
  value: string
  label: string
  href: string
  active: boolean
  count?: number
}

/**
 * Link-based segmented control used to filter listings by category.
 *
 * Server-rendered links (not client buttons) so every filter state has a
 * shareable URL, works without JavaScript, and plays well with pagination.
 * Scrolls horizontally on narrow screens instead of wrapping, so it always
 * reads as one control.
 */
export function SegmentedFilter({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  if (segments.length <= 1) return null

  return (
    <nav aria-label={ariaLabel} className="mb-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex items-center gap-1 rounded-full border border-charcoal-200 bg-charcoal-50/70 p-1">
        {segments.map((s) => (
          <Link
            key={s.value}
            href={s.href}
            aria-current={s.active ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700 ${
              s.active
                ? 'bg-maroon-800 text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-white hover:text-maroon-800'
            }`}
          >
            {s.label}
            {typeof s.count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-px text-[11px] font-semibold leading-4 ${
                  s.active ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-500'
                }`}
              >
                {s.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
