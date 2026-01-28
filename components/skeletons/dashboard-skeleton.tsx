import { Skeleton } from '@/components/ui/skeleton'
import { CardSkeleton, StatsCardSkeleton } from './card-skeleton'

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Welcome header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next action card */}
          <CardSkeleton lines={3} />

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Checklist skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick links skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
