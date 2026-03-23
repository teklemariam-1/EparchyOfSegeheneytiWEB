import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
import { cn } from '@/lib/utils'

const CATEGORY_VARIANTS: Record<string, 'maroon' | 'gold' | 'neutral' | 'green' | 'red'> = {
  eparchy: 'maroon',
  vatican: 'gold',
  community: 'neutral',
  announcement: 'green',
  obituary: 'neutral',
  youth: 'maroon',
}

export interface NewsCardData {
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string
  imageUrl?: string
  imageAlt?: string
}

interface NewsCardProps {
  news: NewsCardData
  className?: string
  featured?: boolean
}

export function NewsCard({ news, className, featured = false }: NewsCardProps) {
  return (
    <article
      className={cn(
        'card group flex flex-col overflow-hidden',
        featured && 'md:flex-row',
        className,
      )}
    >
      {/* Image */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-parchment-200',
          featured ? 'md:w-80 h-56 md:h-auto' : 'h-48',
        )}
      >
        {news.imageUrl ? (
          <Image
            src={news.imageUrl}
            alt={news.imageAlt ?? news.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={featured ? '(min-width: 768px) 320px, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-maroon-200"
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
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant={CATEGORY_VARIANTS[news.category] ?? 'neutral'} size="sm">
            {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
          </Badge>
          <time className="text-xs text-charcoal-400" dateTime={news.publishedAt}>
            {formatDate(news.publishedAt, { month: 'long', day: 'numeric', year: 'numeric' })}
          </time>
        </div>

        <h3
          className={cn(
            'font-serif font-semibold text-charcoal-900 leading-snug mb-2',
            featured ? 'text-xl md:text-2xl' : 'text-lg',
          )}
        >
          <Link
            href={`/news/${news.slug}`}
            className="hover:text-maroon-700 transition-colors after:absolute after:inset-0"
          >
            {news.title}
          </Link>
        </h3>

        <p className="text-sm text-charcoal-600 line-clamp-3 flex-1">{news.excerpt}</p>

        <span className="mt-4 text-xs font-semibold text-maroon-700 group-hover:text-maroon-900 transition-colors">
          Read more →
        </span>
      </div>
    </article>
  )
}
