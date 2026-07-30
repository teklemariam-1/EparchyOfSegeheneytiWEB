import Link from 'next/link'
import Image from 'next/image'
import type { CMSImage } from '@/lib/payload/queries'

export interface MagazineCardProps {
  href: string
  badge: string
  title: string
  excerpt?: string
  /** ISO date for the <time> element; omit to hide the date. */
  dateISO?: string
  dateLabel?: string | null
  image?: CMSImage | null
  /** Renders a small PDF marker when true. */
  hasPdf?: boolean
  /** Extra badge (e.g. "Featured") rendered next to the type badge. */
  featuredLabel?: string
  /** Badge palette: gold for papal documents, maroon for the bishop's. */
  tone?: 'gold' | 'maroon'
}

/**
 * Full-width editorial card for the magazine-style message listings.
 *
 * Every card is the same size (min-height + line clamps) so the list reads as
 * one publication. The featured image sits behind the content at low opacity
 * under a white scrim that fades toward the right, keeping text at WCAG
 * contrast while letting the image color the card; cards without an image get
 * a quiet parchment wash instead.
 */
export function MagazineCard({
  href,
  badge,
  title,
  excerpt,
  dateISO,
  dateLabel,
  image,
  hasPdf,
  featuredLabel,
  tone = 'maroon',
}: MagazineCardProps) {
  const badgeClass =
    tone === 'gold'
      ? 'bg-gold-50/90 border-gold-200 text-gold-800'
      : 'bg-maroon-50/90 border-maroon-100 text-maroon-700'

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-charcoal-100 bg-white transition-shadow hover:border-maroon-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
    >
      {/* Low-opacity featured-image backdrop */}
      {image?.url ? (
        <>
          <Image
            src={image.url}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="absolute inset-0 object-cover opacity-[0.14] transition-opacity duration-300 group-hover:opacity-25"
          />
          {/* Scrim: solid where the text sits, thinner toward the right edge */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/30"
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-parchment/60 via-white to-white"
          aria-hidden="true"
        />
      )}

      <div className="relative flex min-h-[200px] flex-col p-6 sm:min-h-[220px] sm:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            {badge}
          </span>
          {featuredLabel && (
            <span className="inline-block rounded-full border border-gold-300 bg-gold-100/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-800">
              ★ {featuredLabel}
            </span>
          )}
        </div>

        <h2 className="mb-2 max-w-3xl font-serif text-xl font-semibold leading-snug text-charcoal-900 transition-colors group-hover:text-maroon-800 sm:text-2xl lg:text-[1.65rem] line-clamp-2">
          {title}
        </h2>

        {excerpt && (
          <p className="max-w-2xl text-sm leading-relaxed text-charcoal-600 line-clamp-2 sm:line-clamp-3 sm:text-[15px]">
            {excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-charcoal-100/80 pt-3">
          {dateISO && dateLabel ? (
            <time dateTime={dateISO} className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
              {dateLabel}
            </time>
          ) : (
            <span />
          )}
          {hasPdf && (
            <span className="flex items-center gap-1 text-xs font-medium text-maroon-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDF
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
