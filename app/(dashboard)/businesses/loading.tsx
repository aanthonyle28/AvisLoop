import { Skeleton } from '@/components/ui/skeleton'
import { BusinessCardSkeleton } from '@/components/businesses/business-card-skeleton'

export default function BusinessesLoading() {
  return (
    <div className="container py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
