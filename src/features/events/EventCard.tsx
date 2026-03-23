import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
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
  const start = new Date(event.startDate)
  const month = start.toLocaleDateString('en-US', { month: 'short' })
  const day = start.getDate()

  return (
    <article
      className={cn(
        'card group flex gap-4 p-4 transition-shadow hover:shadow-md',
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
