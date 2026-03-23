import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'maroon' | 'gold' | 'neutral' | 'green' | 'red'
  size?: 'sm' | 'md'
  className?: string
}

const VARIANT_CLASSES = {
  maroon: 'bg-maroon-100 text-maroon-800',
  gold: 'bg-gold-100 text-gold-800',
  neutral: 'bg-charcoal-100 text-charcoal-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
