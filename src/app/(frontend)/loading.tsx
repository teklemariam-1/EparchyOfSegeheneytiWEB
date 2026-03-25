import { Skeleton } from '@/components/shared/Skeleton'

export default function FrontendLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="relative bg-maroon-900 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-3 w-48 bg-maroon-700" />
            <Skeleton className="h-12 w-3/4 bg-maroon-700" />
            <Skeleton className="h-8 w-1/2 bg-maroon-700" />
            <Skeleton className="h-5 w-full max-w-2xl bg-maroon-700" />
            <Skeleton className="h-5 w-5/6 bg-maroon-700" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-11 w-40 rounded-lg bg-maroon-700" />
              <Skeleton className="h-11 w-36 rounded-lg bg-maroon-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Bishop message skeleton */}
      <div className="bg-maroon-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="flex justify-center">
              <Skeleton className="w-48 h-48 rounded-full bg-maroon-800" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-3 w-36 bg-maroon-800" />
              <Skeleton className="h-8 w-64 bg-maroon-800" />
              <Skeleton className="h-4 w-48 bg-maroon-800" />
              <Skeleton className="h-20 w-full bg-maroon-800" />
              <Skeleton className="h-10 w-40 rounded-lg bg-maroon-800" />
            </div>
          </div>
        </div>
      </div>

      {/* News section skeleton */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-1 w-12" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-charcoal-100 overflow-hidden space-y-3">
                <Skeleton className="h-44 w-full" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events section skeleton */}
      <div className="bg-parchment py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-1 w-12" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-5 p-5 bg-white rounded-xl border border-charcoal-100">
                <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

