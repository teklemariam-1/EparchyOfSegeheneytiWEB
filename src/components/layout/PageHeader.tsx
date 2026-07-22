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
        'text-white py-14 md:py-20 relative overflow-hidden',
        className,
      )}
      // Seasonal theme vars are set on <body> by the frontend layout;
      // fallbacks preserve the original brand-red design.
      style={{ backgroundColor: 'var(--banner-bg, #911e1e)' }}
    >
      {/* Optional uploaded banner image (Banner Theme settings) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: 'var(--banner-image, none)' }}
      />
      {/* Theme-colour tint keeps the text readable over the image */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundColor: 'var(--banner-bg, #911e1e)',
          opacity: 'var(--banner-overlay-opacity, 0)',
        }}
      />
      {/* Subtle decorative cross pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M17 0h6v17H40v6H23v17h-6V23H0v-6h17z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
          opacity: 'var(--banner-pattern-opacity, 0.05)',
        }}
      />

      <Container className="relative">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} dark className="mb-6" />}

        <div className={cn(align === 'center' && 'text-center')}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-4 text-base md:text-lg max-w-2xl leading-relaxed"
              style={{ color: 'var(--banner-subtitle, #fbcccc)' }}
            >
              {subtitle}
            </p>
          )}
          {/* Gold underline accent */}
          <div
            className={cn('mt-5 h-1 w-16 rounded-full', align === 'center' && 'mx-auto')}
            style={{ backgroundColor: 'var(--banner-accent, #fbbf24)' }}
          />
        </div>
      </Container>
    </div>
  )
}
