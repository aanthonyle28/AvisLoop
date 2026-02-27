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
        <div className="rounded-full bg-muted p-6 mb-6">
          <ClockCounterClockwise className="h-8 w-8 text-muted-foreground" weight="regular" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">No messages found</h2>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ClockCounterClockwise className="h-8 w-8 text-muted-foreground" weight="regular" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">No messages sent yet</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Once you complete a job and it enrolls in a campaign, messages will appear here.
      </p>
      <Button asChild>
        <Link href="/jobs">
          <Briefcase className="h-4 w-4" weight="regular" />
          Add a Job
        </Link>
      </Button>
    </div>
  )
}
