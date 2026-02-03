'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'
import { TagBadge, PRESET_TAGS } from '@/components/ui/tag-badge'

interface CustomerFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'archived'
  onStatusFilterChange: (status: 'all' | 'active' | 'archived') => void
  onTagFilterChange?: (tags: string[]) => void
  selectedTags?: string[]
  availableTags?: string[]
}

export function CustomerFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onTagFilterChange,
  selectedTags = [],
  availableTags = [],
}: CustomerFiltersProps) {
  // Combine preset tags with custom tags from business
  const allTags = [...new Set([...PRESET_TAGS, ...availableTags])]

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    onTagFilterChange?.(newTags)
  }

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || selectedTags.length > 0

  return (
    <div className='space-y-3'>
      {/* Search input */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search by name or email...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Filter chips */}
      <div className='flex items-center gap-2 flex-wrap'>
        <span className='text-sm text-muted-foreground'>Filter:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size='sm'
          onClick={() => onStatusFilterChange('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size='sm'
          onClick={() => onStatusFilterChange('active')}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          size='sm'
          onClick={() => onStatusFilterChange('archived')}
        >
          Archived
        </Button>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              onSearchChange('')
              onStatusFilterChange('all')
              onTagFilterChange?.([])
            }}
            className='ml-auto'
          >
            <X className='mr-1 h-3 w-3' />
            Clear filters
          </Button>
        )}
      </div>

      {/* Tag filter section */}
      {allTags.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Filter by tag:</span>
          {allTags.map(tag => (
            <TagBadge
              key={tag}
              tag={tag}
              onClick={() => toggleTag(tag)}
              selected={selectedTags.includes(tag)}
            />
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagFilterChange?.([])}
              className='text-xs text-muted-foreground hover:text-foreground underline'
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
