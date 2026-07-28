import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
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
}

interface EventCardProps {
  event: EventCardData
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  // Resolved in the eparchy's timezone, not the renderer's. `new Date(...)` plus
  // getDate() returned the day in whichever zone the code ran in — UTC on the
  // server, the reader's zone in the browser — so a 01:00 Asmara liturgy showed
  // the previous day, and showed it differently depending on where the reader
  // was. It also disagreed with the ICS feed, which has always pinned Asmara.
  const parts = dateParts(event.startDate)
  const month = parts?.month ?? ''
  const day = parts?.day ?? ''

  return (
    <article
      className={cn(
        // `relative` contains the title's `after:absolute after:inset-0`
        // stretched link to this card; without it the overlay escapes and can
        // sit over other controls (see ParishCard for the same fix).
        'card group relative flex gap-4 p-4 transition-shadow hover:shadow-md',
        event.isPast && 'opacity-70',
        className,
      )}
    >
      {/* Date badge */}
      <div className="flex shrink-0 flex-col items-center justify-start rounded-lg bg-maroon-800 px-3 py-2 text-white min-w-[56px]">
        <span className="text-xs font-medium uppercase tracking-wide text-maroon-200">{month}</span>
        <span className="text-2xl font-bold leading-none">{day}</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge
            variant={TYPE_VARIANTS[event.eventType] ?? 'neutral'}
            size="sm"
          >
            {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1).replace(/-/g, ' ')}
          </Badge>
        </div>

        <h3 className="font-serif font-semibold text-charcoal-900 leading-snug text-base mb-1 group-hover:text-maroon-700 transition-colors">
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0"
          >
            {event.title}
          </Link>
        </h3>

        <p className="text-xs text-charcoal-500 line-clamp-2">{event.excerpt}</p>

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
