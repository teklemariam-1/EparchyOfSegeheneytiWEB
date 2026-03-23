import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'wide' | 'full'
}

const SIZE_CLASSES = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-8xl',
  full: 'max-w-full',
}

export function Container({ children, className, size = 'default' }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </div>
  )
}
