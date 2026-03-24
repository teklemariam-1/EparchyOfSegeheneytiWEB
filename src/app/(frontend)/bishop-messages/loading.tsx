import { CardSkeleton, PageHeaderSkeleton, Skeleton } from '@/components/shared/Skeleton'

export default function BishopMessagesLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured message skeleton */}
        <div className="mb-10 rounded-2xl border border-gold-100 bg-parchment-50 p-6 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        {/* Message cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
