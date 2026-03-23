import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const VICARIATE_VARIANTS: Record<string, 'maroon' | 'gold' | 'neutral' | 'green' | 'red'> = {
  segeneyti: 'maroon',
  'adi-keyih': 'gold',
  dekemhare: 'neutral',
  mendefera: 'green',
  diaspora: 'maroon',
}

export interface ParishCardData {
  slug: string
  name: string
  vicariate: string
  patronSaint?: string
  city?: string
  imageUrl?: string
  priestName?: string
}

interface ParishCardProps {
  parish: ParishCardData
  className?: string
}

export function ParishCard({ parish, className }: ParishCardProps) {
  return (
    <article
      className={cn(
        'card group flex flex-col overflow-hidden transition-shadow hover:shadow-md',
        className,
      )}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-parchment-200">
        {parish.imageUrl ? (
          <Image
            src={parish.imageUrl}
            alt={parish.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-maroon-50">
            <svg className="h-16 w-16 text-maroon-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <Badge
            variant={VICARIATE_VARIANTS[parish.vicariate] ?? 'neutral'}
            size="sm"
          >
            {parish.vicariate.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Vicariate
          </Badge>
        </div>

        <h3 className="font-serif text-base font-semibold text-charcoal-900 leading-snug mb-1 group-hover:text-maroon-700 transition-colors">
          <Link href={`/parishes/${parish.slug}`} className="after:absolute after:inset-0">
            {parish.name}
          </Link>
        </h3>

        {parish.patronSaint && (
          <p className="text-xs text-charcoal-500 mb-1">Patron: {parish.patronSaint}</p>
        )}
        {parish.city && (
          <p className="text-xs text-charcoal-400 flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {parish.city}
          </p>
        )}
        {parish.priestName && (
          <p className="mt-auto pt-2 text-xs text-charcoal-400 border-t border-charcoal-100 mt-3">
            Fr. {parish.priestName}
          </p>
        )}
      </div>
    </article>
  )
}
