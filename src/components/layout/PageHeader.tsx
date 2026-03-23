import { cn } from '@/lib/utils'
import { Container } from './Container'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import type { BreadcrumbItem } from '@/components/navigation/Breadcrumb'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  /** Optional decorative image — displayed as a subtle overlay */
  backgroundImage?: string
  className?: string
  /** Align title — useful for certain page types */
  align?: 'left' | 'center'
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  className,
  align = 'left',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-maroon-800 text-white py-14 md:py-20 relative overflow-hidden',
        className,
      )}
    >
      {/* Subtle decorative cross pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M17 0h6v17H40v6H23v17h-6V23H0v-6h17z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      <Container className="relative">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} dark className="mb-6" />}

        <div className={cn(align === 'center' && 'text-center')}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base md:text-lg text-maroon-200 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {/* Gold underline accent */}
          <div className={cn('mt-5 h-1 w-16 rounded-full bg-gold-400', align === 'center' && 'mx-auto')} />
        </div>
      </Container>
    </div>
  )
}
