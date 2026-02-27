'use client'

import { useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTransition, useRef, useEffect } from 'react'
import { format, subWeeks, subMonths } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react'

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

const DATE_PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      return { from: today, to: today }
    },
  },
  {
    label: 'Past Week',
    getRange: () => ({
      from: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Past Month',
    getRange: () => ({
      from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Past 3 Months',
    getRange: () => ({
      from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
]

export function HistoryFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

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

  // Update both date params atomically in a single URL navigation
  function updateDateRange(from: string, to: string) {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')
    if (from) {
      params.set('from', from)
    } else {
      params.delete('from')
    }
    if (to) {
      params.set('to', to)
    } else {
      params.delete('to')
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

  // Apply a date preset chip (toggle off if already active)
  function applyPreset(preset: (typeof DATE_PRESETS)[number]) {
    if (activePreset === preset.label) {
      // Toggle off: clear dates
      setActivePreset(null)
      updateDateRange('', '')
      return
    }
    const { from, to } = preset.getRange()
    setActivePreset(preset.label)
    updateDateRange(from, to)
  }

  // Manual date input change — deselects any active preset chip
  function handleDateInputChange(key: 'from' | 'to', value: string) {
    setActivePreset(null)
    updateFilter(key, value)
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
    setActivePreset(null)
    startTransition(() => {
      replace(pathname)
    })
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Search + Radix Select status filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <MagnifyingGlass size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            defaultValue={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter — Radix Select */}
        <Select value={status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Date preset chips + custom date inputs + clear/loading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* Preset chips */}
        <div className="flex items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-pressed={activePreset === preset.label}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activePreset === preset.label
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Vertical separator (desktop only) */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Custom date inputs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateInputChange('from', e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateInputChange('to', e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>

        {/* Loading + Clear */}
        <div className="flex items-center gap-2">
          {isPending && (
            <CircleNotch size={16} weight="regular" className="animate-spin text-muted-foreground" />
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={12} weight="regular" className="mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
