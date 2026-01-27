'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTransition, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Search, Loader2 } from 'lucide-react'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'complained', label: 'Complained' },
  { value: 'failed', label: 'Failed' },
  { value: 'opened', label: 'Opened' },
]

export function HistoryFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Get current filter values from URL
  const query = searchParams.get('query') || ''
  const status = searchParams.get('status') || 'all'
  const dateFrom = searchParams.get('from') || ''
  const dateTo = searchParams.get('to') || ''

  const hasActiveFilters = query !== '' || status !== 'all' || dateFrom !== '' || dateTo !== ''

  // Update URL with new filter value
  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1') // Reset pagination on filter change

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

  // Debounced search handler (300ms)
  function handleSearchChange(value: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      updateFilter('query', value)
    }, 300)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function clearFilters() {
    startTransition(() => {
      replace(pathname)
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and status row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            defaultValue={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter - native HTML select styled with Tailwind */}
        <select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date-from" className="text-sm text-muted-foreground">From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => updateFilter('from', e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-to" className="text-sm text-muted-foreground">To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => updateFilter('to', e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
        </div>

        {/* Clear filters / Loading indicator */}
        <div className="flex items-center gap-2">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
