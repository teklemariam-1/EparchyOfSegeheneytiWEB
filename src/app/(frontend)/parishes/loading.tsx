import { CardSkeleton, PageHeaderSkeleton, Skeleton } from '@/components/shared/Skeleton'

export default function ParishesLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Vicariate filter tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-full" />
          ))}
        </div>
        {/* Parish grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
