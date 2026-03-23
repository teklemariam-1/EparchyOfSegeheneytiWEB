import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  className?: string
  /** HTML element to render — defaults to <section> */
  as?: 'section' | 'div' | 'article'
  /** Semantic ARIA label for landmark sections */
  'aria-labelledby'?: string
}

export function Section({
  children,
  className,
  as: Tag = 'section',
  ...props
}: SectionProps) {
  return (
    <Tag className={cn('py-16 md:py-20 lg:py-24', className)} {...props}>
      {children}
    </Tag>
  )
}
