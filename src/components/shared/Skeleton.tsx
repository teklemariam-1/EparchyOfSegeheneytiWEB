import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-charcoal-100', className)}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-44 w-full rounded-lg" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="bg-maroon-800 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <Skeleton className="h-4 w-32 bg-maroon-700" />
        <Skeleton className="h-10 w-64 bg-maroon-700" />
        <Skeleton className="h-5 w-48 bg-maroon-700" />
        <Skeleton className="h-1 w-16 bg-maroon-600" />
      </div>
    </div>
  )
}
