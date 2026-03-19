import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function ClientsLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* MRR summary bar skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />
      {/* Table skeleton */}
      <TableSkeleton columns={7} rows={5} />
    </div>
  )
}
