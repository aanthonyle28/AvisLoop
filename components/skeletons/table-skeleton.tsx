import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  showCheckbox?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showCheckbox = true,
}: TableSkeletonProps) {
  // Calculate explicit height to prevent layout shift
  const rowHeight = 73 // px per row
  const headerHeight = showHeader ? 48 : 0
  const minHeight = rows * rowHeight + headerHeight

  return (
    <div className="rounded-lg border bg-card" style={{ minHeight: `${minHeight}px` }}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
          {showCheckbox && <Skeleton className="h-5 w-5" />}
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4">
            {showCheckbox && <Skeleton className="h-5 w-5" />}
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={colIndex === 0 ? "h-5 flex-[2]" : "h-5 flex-1"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
