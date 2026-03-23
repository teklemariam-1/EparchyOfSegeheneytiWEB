import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  dark?: boolean
  className?: string
}

export function Breadcrumb({ items, dark = false, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li>
          <Link
            href="/"
            className={cn(
              'transition-colors',
              dark
                ? 'text-maroon-200 hover:text-white'
                : 'text-charcoal-500 hover:text-maroon-700',
            )}
          >
            Home
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <svg
              className={cn('h-3.5 w-3.5', dark ? 'text-maroon-400' : 'text-charcoal-400')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>

            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className={cn(
                  'transition-colors',
                  dark
                    ? 'text-maroon-200 hover:text-white'
                    : 'text-charcoal-500 hover:text-maroon-700',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  dark ? 'text-white' : 'text-charcoal-800',
                )}
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
