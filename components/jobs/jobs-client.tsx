'use client'

import { useState, useEffect } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { FirstVisitHint } from '@/components/onboarding/first-visit-hint'
import { JobTable } from './job-table'
import { JobFilters, type JobFiltersState } from './job-filters'
import { EmptyState } from './empty-state'
import { AddJobSheet } from './add-job-sheet'
import type { JobWithEnrollment, Customer, ServiceType } from '@/lib/types/database'

interface JobsClientProps {
  initialJobs: JobWithEnrollment[]
  totalJobs: number
  customers: Customer[]
  /** Map of service type to matching campaign info for enrollment preview */
  campaignMap?: Map<string, { campaignName: string; firstTouchDelay: number }>
  /** Whether to auto-open the Add Job sheet (from URL param) */
  defaultAddJobOpen?: boolean
  /** Service types enabled for this business (from onboarding settings) */
  enabledServiceTypes?: ServiceType[]
}

export function JobsClient({ initialJobs, totalJobs, customers, campaignMap, defaultAddJobOpen = false, enabledServiceTypes }: JobsClientProps) {
  const [filters, setFilters] = useState<JobFiltersState>({
    status: null,
    serviceType: null,
    search: '',
  })
  const [showAddSheet, setShowAddSheet] = useState(false)

  // Handle auto-open from URL param and clean URL
  useEffect(() => {
    if (defaultAddJobOpen) {
      setShowAddSheet(true)
      // Clean URL to prevent re-opening on refresh
      window.history.replaceState({}, '', '/jobs')
    }
  }, [defaultAddJobOpen])

  // Filter jobs client-side (for initial load, server-side filtering for large datasets)
  const filteredJobs = initialJobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false
    if (filters.serviceType && job.service_type !== filters.serviceType) return false
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const customerName = job.customers?.name?.toLowerCase() || ''
      const customerEmail = job.customers?.email?.toLowerCase() || ''
      if (!customerName.includes(query) && !customerEmail.includes(query)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} total
          </p>
        </div>
        <FirstVisitHint
          hintId="jobs-add-button"
          title="Add your first job here"
          description="Log completed jobs to start collecting reviews automatically. This is the main action in AvisLoop."
          side="bottom"
        >
          <Button onClick={() => setShowAddSheet(true)}>
            <Plus className="mr-2 h-4 w-4" weight="bold" />
            Add Job
          </Button>
        </FirstVisitHint>
      </div>

      {/* Filters */}
      <JobFilters filters={filters} onFiltersChange={setFilters} enabledServiceTypes={enabledServiceTypes} />

      {/* Table or Empty State */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          hasFilters={!!(filters.status || filters.serviceType || filters.search)}
          onClearFilters={() => setFilters({ status: null, serviceType: null, search: '' })}
          onAddJob={() => setShowAddSheet(true)}
        />
      ) : (
        <JobTable jobs={filteredJobs} customers={customers} campaignMap={campaignMap} />
      )}

      {/* Add Job Sheet */}
      <AddJobSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        customers={customers}
        enabledServiceTypes={enabledServiceTypes}
      />
    </div>
  )
}
