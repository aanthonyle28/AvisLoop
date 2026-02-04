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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <FunnelSimple className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No jobs match your filters</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or clear them to see all jobs.
        </p>
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
      <Briefcase className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">No jobs yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first job to start tracking completed work.
      </p>
      <Button className="mt-4" onClick={onAddJob}>
        <Plus className="mr-2 h-4 w-4" weight="bold" />
        Add Job
      </Button>
    </div>
  )
}
