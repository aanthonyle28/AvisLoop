'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { MagnifyingGlass, X, User, CaretDown } from '@phosphor-icons/react'
import type { Customer } from '@/lib/types/database'

interface CustomerSelectorProps {
  customers: Customer[]
  value: string | null
  onChange: (customerId: string | null) => void
  error?: string
}

export function CustomerSelector({ customers, value, onChange, error }: CustomerSelectorProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Find selected customer
  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id === value) || null
  , [customers, value])

  // Filter suggestions (min 2 chars)
  const suggestions = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return []
    const q = query.toLowerCase().trim()
    return customers
      .filter(c =>
        c.status === 'active' && (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        )
      )
      .slice(0, 6)
  }, [query, customers])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (customer: Customer) => {
    onChange(customer.id)
    setQuery('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // If customer selected, show selected state
  if (selectedCustomer) {
    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between rounded-md border px-3 py-2 ${
            error ? 'border-destructive' : 'border-input'
          } bg-background`}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{selectedCustomer.name}</div>
              <div className="text-xs text-muted-foreground">{selectedCustomer.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-1 hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="relative space-y-1">
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search customers by name or email..."
          className={`w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-destructive' : 'border-input'
          }`}
        />
        <CaretDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
        >
          {suggestions.map((customer, index) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelect(customer)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                index === highlightedIndex ? 'bg-muted' : ''
              }`}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-xs text-muted-foreground">{customer.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md"
        >
          No customers found
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
