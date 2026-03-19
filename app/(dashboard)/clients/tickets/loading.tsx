import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function AllTicketsLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-44 rounded-md" />
        <Skeleton className="h-10 w-52 rounded-md" />
      </div>

      {/* Summary stats skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Table skeleton */}
      <TableSkeleton columns={7} rows={5} />
    </div>
  )
}
