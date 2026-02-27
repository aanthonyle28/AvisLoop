import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BusinessCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      {/* Header row: name + active badge */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Service type badge */}
      <Skeleton className="h-5 w-16 rounded-full" />

      {/* Google rating */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Reviews gained */}
      <Skeleton className="h-4 w-24" />

      {/* Competitive gap */}
      <Skeleton className="h-4 w-20" />
    </Card>
  )
}
