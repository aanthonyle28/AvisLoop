import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TableSkeletonProps {
  /** Number of columns to render */
  columns: number
  /** Number of rows to render (default: 5) */
  rows?: number
  /** Additional class name for the container */
  className?: string
  /** Whether to show checkbox column styling for first column */
  hasCheckbox?: boolean
}

/**
 * A reusable table skeleton loader component that matches the structure
 * of shadcn Table components for visual consistency during data loading.
 */
export function TableSkeleton({
  columns,
  rows = 5,
  className,
  hasCheckbox = false,
}: TableSkeletonProps) {
  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableHead key={colIndex}>
                {hasCheckbox && colIndex === 0 ? (
                  // Checkbox column - square skeleton
                  <Skeleton className="h-4 w-4" />
                ) : (
                  // Regular header - slightly bolder/taller skeleton
                  <Skeleton className="h-4 w-20" />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {hasCheckbox && colIndex === 0 ? (
                    // Checkbox column - square skeleton
                    <Skeleton className="h-4 w-4" />
                  ) : colIndex === columns - 1 ? (
                    // Actions column - smaller skeleton for icon buttons
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    // Regular cell - varied widths for visual interest
                    <Skeleton
                      className={cn(
                        'h-4',
                        colIndex % 3 === 0
                          ? 'w-32'
                          : colIndex % 3 === 1
                            ? 'w-24'
                            : 'w-20'
                      )}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
