import { CardSkeleton, PageHeaderSkeleton, Skeleton } from '@/components/shared/Skeleton'

export default function NewsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured article skeleton */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2 items-stretch">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-4 py-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        {/* Article grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
