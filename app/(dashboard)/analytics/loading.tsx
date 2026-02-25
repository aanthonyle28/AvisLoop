import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="container py-6 space-y-8">
      {/* Header */}
      <Skeleton className="h-8 w-32" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Service type breakdown table */}
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
