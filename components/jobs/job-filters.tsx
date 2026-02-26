'use client'

import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, JOB_STATUSES, JOB_STATUS_LABELS } from '@/lib/validations/job'
import { useBusinessSettings } from '@/components/providers/business-settings-provider'
import type { ServiceType, JobStatus } from '@/lib/types/database'

export interface JobFiltersState {
  status: JobStatus | null
  serviceType: ServiceType | null
  search: string
}

interface JobFiltersProps {
  filters: JobFiltersState
  onFiltersChange: (filters: JobFiltersState) => void
}

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const { enabledServiceTypes, customServiceNames } = useBusinessSettings()
  const hasActiveFilters = filters.status || filters.serviceType || filters.search

  // Scope to enabled types; fall back to all 8 if none configured
  const visibleServiceTypes = enabledServiceTypes && enabledServiceTypes.length > 0
    ? SERVICE_TYPES.filter(t => enabledServiceTypes.includes(t))
    : SERVICE_TYPES

  const getServiceLabel = (type: ServiceType) => {
    if (type === 'other' && customServiceNames.length > 0) {
      if (customServiceNames.length === 1) return customServiceNames[0]
      return `${customServiceNames[0]} +${customServiceNames.length - 1}`
    }
    return SERVICE_TYPE_LABELS[type]
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or email..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status group label */}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">
          Status
        </span>

        {/* Status filters — pill shape (rounded-full) */}
        {JOB_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => onFiltersChange({
              ...filters,
              status: filters.status === status ? null : status,
            })}
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filters.status === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {JOB_STATUS_LABELS[status]}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 self-center bg-border mx-1" />

        {/* Service group label */}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">
          Service
        </span>

        {/* Service type filters — rounded rectangle (rounded-md) */}
        {visibleServiceTypes.map(type => (
          <button
            key={type}
            onClick={() => onFiltersChange({
              ...filters,
              serviceType: filters.serviceType === type ? null : type,
            })}
            className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filters.serviceType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {getServiceLabel(type)}
          </button>
        ))}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ status: null, serviceType: null, search: '' })}
            className="h-7 px-2 text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
