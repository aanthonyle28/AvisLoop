'use client'

import { Briefcase, Plus, FunnelSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
  onAddJob: () => void
}

export function EmptyState({ hasFilters, onClearFilters, onAddJob }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <FunnelSimple className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">No jobs match your filters</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Try adjusting your filters or clear them to see all jobs.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">No jobs yet</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Create your first job to start tracking completed work and collecting reviews.
      </p>
      <Button onClick={onAddJob}>
        <Plus className="mr-2 h-4 w-4" weight="bold" />
        Add Job
      </Button>
    </div>
  )
}
