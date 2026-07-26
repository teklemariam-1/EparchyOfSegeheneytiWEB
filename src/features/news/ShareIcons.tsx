'use client'

import { shareUrl, type ShareTarget } from './share'
import { cn } from '@/lib/utils'

/**
 * Share row for an article card.
 *
 * A client component for one reason: the surrounding card is a single large
 * link (`after:absolute after:inset-0`), so these have to stop the click from
 * bubbling up to it — otherwise tapping "share" navigates to the article
 * instead. That needs a real event handler.
 *
 * Fixed at a small size: these are chrome, not content, so they do not scale
 * with the reader's font-size preference.
 */

interface ShareIconsProps {
  title: string
  slug: string
  /** Tailwind text colour class for the icons. */
  className?: string
  /** Accessible labels, already translated by the caller (a Server Component). */
  labels: Record<ShareTarget, string>
}

const ORDER: ShareTarget[] = ['facebook', 'x', 'whatsapp']

const PATHS: Record<ShareTarget, string> = {
  facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.4',
}

export function ShareIcons({ title, slug, className, labels }: ShareIconsProps) {
  return (
    <div className="flex items-center gap-2">
      {ORDER.map((target) => (
        <a
          key={target}
          href={shareUrl(target, title, slug)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels[target]}
          // The card is one big link; without this the share opens the article.
          // `relative z-10` lifts these above the card's absolute overlay so
          // they are clickable at all.
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'relative z-10 inline-flex h-6 w-6 items-center justify-center rounded transition-opacity hover:opacity-70',
            className,
          )}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path d={PATHS[target]} />
          </svg>
        </a>
      ))}
    </div>
  )
}
