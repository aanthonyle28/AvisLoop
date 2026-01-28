import { Skeleton } from '@/components/ui/skeleton'
import { CardSkeleton } from '@/components/skeletons/card-skeleton'

export default function BillingLoading() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Current plan card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Usage cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>

      {/* Manage button */}
      <Skeleton className="h-10 w-40" />
    </div>
  )
}
