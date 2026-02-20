import { ClockCounterClockwise, Briefcase } from '@phosphor-icons/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HistoryEmptyStateProps {
  hasFilters?: boolean
}

export function HistoryEmptyState({ hasFilters = false }: HistoryEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ClockCounterClockwise size={32} weight="regular" className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No messages found</h3>
        <p className="text-muted-foreground max-w-sm">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClockCounterClockwise size={32} weight="regular" className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No messages sent yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Once you send your first message, it will appear here so you can track its status.
      </p>
      <Button asChild>
        <Link href="/jobs">
          <Briefcase size={16} weight="regular" />
          Add a Job
        </Link>
      </Button>
    </div>
  )
}

// Backward compatibility: export both names
export { HistoryEmptyState as EmptyState }
