'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Search } from 'lucide-react'

interface ContactFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'archived'
  onStatusFilterChange: (status: 'all' | 'active' | 'archived') => void
}

export function ContactFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ContactFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all'

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('active')}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('archived')}
        >
          Archived
        </Button>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onStatusFilterChange('all')
            }}
            className="ml-auto"
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
