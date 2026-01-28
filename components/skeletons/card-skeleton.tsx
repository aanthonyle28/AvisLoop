import { Skeleton } from '@/components/ui/skeleton'

interface CardSkeletonProps {
  showIcon?: boolean
  lines?: number
}

export function CardSkeleton({ showIcon = true, lines = 2 }: CardSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        {showIcon && <Skeleton className="h-10 w-10 rounded-lg" />}
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={i === 0 ? "h-8 w-24" : "h-4 w-20"} />
        ))}
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-9 w-16 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}
