import Link from 'next/link'
import Image from 'next/image'
import { formatShortDate } from '@/lib/formatters/date'
import { cn } from '@/lib/utils'
import { ArticleTypeIcon } from './ArticleTypeIcon'
import { ShareIcons } from './ShareIcons'
import type { ShareTarget } from './share'
import type { NewsCardData } from './NewsCard'

/**
 * Cards for the magazine view.
 *
 * Two shapes, both "image on top, then an info bar, then the headline":
 *
 *  - `MagazineHero`     — the large left-hand story. Info bar and headline sit
 *                         inside one solid maroon panel, headline in white.
 *  - `MagazineSecondary`— the 2×2 companions and the cards below. Thin white
 *                         info bar, headline in charcoal underneath.
 *
 * Headline sizing and leading live in globals.css (`.news-headline-hero`,
 * `.news-headline-card`) rather than in Tailwind utilities here, for two
 * reasons: those rules scale with the reader's font-size preference while this
 * card's chrome does not, and they carry the `:lang(ti)` leading bump that
 * keeps Ge'ez ascenders and descenders from colliding. The maroon panel is
 * free to grow with a long Tigrinya headline instead of clipping it.
 */

export interface MagazineCardProps {
  news: NewsCardData
  locale: string
  shareLabels: Record<ShareTarget, string>
  className?: string
}

function Placeholder({ iconClass }: { iconClass: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-parchment-200">
      <svg
        className={cn('text-maroon-200', iconClass)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
    </div>
  )
}

/**
 * A missing image never removes the article from the page — the placeholder
 * holds the same aspect ratio so the featured block stays a clean rectangle.
 * `next/image` also falls back to this when a stored URL 404s at request time.
 */
function CardImage({
  news,
  sizes,
  priority = false,
  iconClass,
}: {
  news: NewsCardData
  sizes: string
  priority?: boolean
  iconClass: string
}) {
  if (!news.imageUrl) return <Placeholder iconClass={iconClass} />
  return (
    <Image
      src={news.imageUrl}
      alt={news.imageAlt ?? news.title}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  )
}

export function MagazineHero({ news, locale, shareLabels, className }: MagazineCardProps) {
  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-xl', className)}>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
        <CardImage
          news={news}
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          iconClass="h-16 w-16"
        />
      </div>

      {/* `flex-1` lets the panel absorb the leftover height so the hero column
          and the 2×2 column end flush; `min-h-0` stops a long Ge'ez headline
          from being clipped instead of growing the block. */}
      <div className="flex min-h-0 flex-1 flex-col bg-maroon-800 p-5 text-white sm:p-6">
        <div className="mb-3 flex items-center gap-3">
          <ArticleTypeIcon className="h-4 w-4 shrink-0 text-gold-300" />
          {/* 6.05:1 against maroon-800 — passes AA for this small text. */}
          <time className="text-xs font-medium tracking-wide text-gold-300" dateTime={news.publishedAt}>
            {formatShortDate(news.publishedAt, locale)}
          </time>
          <div className="ml-auto">
            <ShareIcons title={news.title} slug={news.slug} labels={shareLabels} className="text-white/80" />
          </div>
        </div>

        {/* 8.72:1 white-on-maroon-800 — AAA even at body size. Sizing and the
            Ge'ez leading live in .news-headline-hero (globals.css) so the
            headline respects the reader's font-size preference. */}
        <h2 className="news-headline-hero font-serif font-bold">
          <Link href={`/news/${news.slug}`} className="after:absolute after:inset-0">
            {news.title}
          </Link>
        </h2>
      </div>
    </article>
  )
}

export function MagazineSecondary({ news, locale, shareLabels, className }: MagazineCardProps) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-charcoal-100 bg-white',
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
        <CardImage
          news={news}
          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 50vw, 100vw"
          iconClass="h-10 w-10"
        />
      </div>

      <div className="flex items-center gap-2 border-b border-charcoal-100 px-3 py-2">
        {/* 3.19:1 on white — clears the 3:1 minimum for non-text graphics.
            The date beside it stays charcoal, which is a text-contrast pass. */}
        <ArticleTypeIcon className="h-3.5 w-3.5 shrink-0 text-gold-600" />
        <time className="text-xs font-medium text-charcoal-500" dateTime={news.publishedAt}>
          {formatShortDate(news.publishedAt, locale)}
        </time>
        <div className="ml-auto">
          <ShareIcons title={news.title} slug={news.slug} labels={shareLabels} className="text-charcoal-300" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="news-headline-card font-serif font-semibold text-charcoal-900 transition-colors group-hover:text-maroon-800">
          <Link href={`/news/${news.slug}`} className="after:absolute after:inset-0">
            {news.title}
          </Link>
        </h3>
      </div>
    </article>
  )
}
