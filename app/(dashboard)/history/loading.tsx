import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

export default function HistoryLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-40" />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table */}
      <TableSkeleton rows={10} columns={4} showCheckbox={false} />
    </div>
  )
}
