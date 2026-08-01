import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { dateParts } from '@/lib/formatters/eventTime'
import { cn } from '@/lib/utils'

const TYPE_VARIANTS: Record<string, 'maroon' | 'gold' | 'neutral' | 'green' | 'red'> = {
  liturgical: 'maroon',
  diocesan: 'gold',
  youth: 'maroon',
  educational: 'neutral',
  community: 'green',
  pilgrimage: 'gold',
  ordination: 'maroon',
  retreat: 'neutral',
}

export interface EventCardData {
  slug: string
  title: string
  excerpt: string
  eventType: string
  startDate: string
  endDate?: string
  location?: string
  imageUrl?: string
  isPast?: boolean
  isFeatured?: boolean
}

interface EventCardProps {
  event: EventCardData
  className?: string
  /**
   * `feature` is the wide card at the top of the listing: same information,
   * more room. A separate component would have meant a second copy of the
   * Asmara-zone date logic, which is exactly the thing that must not drift.
   */
  variant?: 'default' | 'feature'
  /** Translated "Featured" label. Only rendered in the feature variant. */
  featuredLabel?: string
}

/**
 * Image-forward event card: the featured image (or a quiet parchment wash when
 * none is set) crowns the card, with the Asmara-zone date badge anchored on
 * it, and the details below. Past events render dimmed and desaturated so the
 * archive section reads as history at a glance.
 */
export function EventCard({ event, className, variant = 'default', featuredLabel }: EventCardProps) {
  // Resolved in the eparchy's timezone, not the renderer's. `new Date(...)` plus
  // getDate() returned the day in whichever zone the code ran in — UTC on the
  // server, the reader's zone in the browser — so a 01:00 Asmara liturgy showed
  // the previous day, and showed it differently depending on where the reader
  // was. It also disagreed with the ICS feed, which has always pinned Asmara.
  const parts = dateParts(event.startDate)
  const month = parts?.month ?? ''
  const day = parts?.day ?? ''
  const year = parts?.year ?? ''
  const feature = variant === 'feature'

  return (
    <article
      className={cn(
        // `relative` contains the title's `after:absolute after:inset-0`
        // stretched link to this card; without it the overlay escapes and can
        // sit over other controls (see ParishCard for the same fix).
        'card group relative overflow-hidden p-0 transition-shadow hover:shadow-md',
        feature
          ? 'flex flex-col md:flex-row md:items-stretch ring-1 ring-gold-300/70'
          : 'flex flex-col',
        className,
      )}
    >
      {/* Featured image (or fallback wash) with the date badge anchored on it */}
      <div
        className={cn(
          'relative w-full overflow-hidden',
          feature ? 'aspect-[16/9] md:aspect-auto md:w-1/2 md:min-h-[20rem]' : 'aspect-[16/9]',
          event.isPast && 'grayscale-[0.4]',
        )}
      >
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes={feature ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 640px) 50vw, 100vw'}
            className={cn(
              'object-cover transition-transform duration-300 group-hover:scale-[1.03]',
              event.isPast && 'opacity-80',
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900">
            {/* A faint cross keeps imageless cards from looking broken. */}
            <svg
              className="absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 text-white/10"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z" />
            </svg>
          </div>
        )}

        {/* Date badge */}
        <div className="absolute left-4 top-4 flex flex-col items-center rounded-lg bg-white/95 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-maroon-700">{month}</span>
          <span className="text-xl font-bold leading-none text-charcoal-900">{day}</span>
          {event.isPast && year && (
            <span className="text-[10px] leading-tight text-charcoal-400">{year}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          feature ? 'justify-center p-6 md:p-8' : 'p-4',
          event.isPast && 'opacity-80',
        )}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Badge variant={TYPE_VARIANTS[event.eventType] ?? 'neutral'} size="sm">
            {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1).replace(/-/g, ' ')}
          </Badge>
          {feature && featuredLabel && (
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-maroon-800">
              {featuredLabel}
            </span>
          )}
        </div>

        <h3
          className={cn(
            'event-card-title mb-1 font-serif font-semibold leading-snug text-charcoal-900 transition-colors group-hover:text-maroon-700',
            feature ? 'text-xl md:text-2xl' : 'text-base',
          )}
        >
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>

        <p
          className={cn(
            'text-charcoal-500',
            feature ? 'line-clamp-3 text-sm leading-relaxed' : 'line-clamp-2 text-xs',
          )}
        >
          {event.excerpt}
        </p>

        {event.location && (
          <div className="mt-2 flex items-center gap-1 text-xs text-charcoal-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </article>
  )
}
