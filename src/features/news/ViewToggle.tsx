'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { NEWS_VIEW_COOKIE, type NewsView } from './view'

/**
 * Switches between the card grid and the magazine layout.
 *
 * The choice is written to a cookie and the page is re-rendered on the SERVER,
 * so the correct layout arrives in the initial HTML on every subsequent visit —
 * no flash of the wrong view, and no layout state duplicated in the client.
 * `router.refresh()` re-runs the Server Component with the new cookie; nothing
 * about the data or the pagination changes, only how it is drawn.
 *
 * Chrome, not content: fixed sizing, so it does not scale with the reader's
 * font-size preference.
 */

interface ViewToggleProps {
  current: NewsView
  labels: { grid: string; magazine: string; legend: string }
}

const ONE_YEAR = 60 * 60 * 24 * 365

export function ViewToggle({ current, labels }: ViewToggleProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function choose(view: NewsView) {
    if (view === current) return
    document.cookie = `${NEWS_VIEW_COOKIE}=${view}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label={labels.legend}
      className={cn(
        'inline-flex items-center rounded-lg border border-charcoal-200 bg-white p-0.5',
        pending && 'opacity-60',
      )}
    >
      {(['grid', 'magazine'] as const).map((view) => {
        const active = current === view
        return (
          <button
            key={view}
            type="button"
            onClick={() => choose(view)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-maroon-800 text-white'
                : 'text-charcoal-500 hover:bg-parchment hover:text-maroon-800',
            )}
          >
            {view === 'grid' ? <GridIcon /> : <MagazineIcon />}
            {labels[view]}
          </button>
        )
      })}
    </div>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" />
    </svg>
  )
}

function MagazineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="3" y="3" width="11" height="18" rx="1" />
      <rect x="16" y="3" width="5" height="8" rx="1" />
      <rect x="16" y="13" width="5" height="8" rx="1" />
    </svg>
  )
}
