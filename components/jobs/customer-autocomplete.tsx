'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface CustomerAutocompleteProps {
  customers: Customer[]
  value: Customer | null
  onChange: (customer: Customer | null) => void
  onCreateNew: (name: string) => void
  placeholder?: string
  error?: string
}

export function CustomerAutocomplete({
  customers,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Type customer name or email...',
  error,
}: CustomerAutocompleteProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter customers based on query (minimum 2 chars)
  const filtered = useMemo(() => {
    if (query.length < 2) return []
    const lowerQuery = query.toLowerCase()
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 6)  // Limit to 6 suggestions
  }, [query, customers])

  const showCreateNew = query.length >= 2 && filtered.length === 0

  // Reset highlighted index when filtered changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [filtered])

  // Sync query with selected value
  useEffect(() => {
    if (value) {
      setQuery(value.name)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setIsOpen(true)
    // Clear selection if query changes from selected value
    if (value && newQuery !== value.name) {
      onChange(null)
    }
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer)
    setQuery(customer.name)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleCreateNewClick = () => {
    onCreateNew(query)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filtered.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex])
        } else if (showCreateNew) {
          handleCreateNewClick()
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="customer-autocomplete-list"
        aria-activedescendant={highlightedIndex >= 0 ? `customer-option-${highlightedIndex}` : undefined}
        className={cn(error && 'border-destructive')}
      />

      {/* Dropdown */}
      {isOpen && (filtered.length > 0 || showCreateNew) && (
        <div
          ref={listRef}
          id="customer-autocomplete-list"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {/* Existing customers */}
          {filtered.map((customer, index) => (
            <button
              key={customer.id}
              id={`customer-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              type="button"
              onClick={() => handleSelect(customer)}
              className={cn(
                'w-full px-3 py-2 text-left hover:bg-muted cursor-pointer',
                highlightedIndex === index && 'bg-muted'
              )}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-muted-foreground">{customer.email}</div>
            </button>
          ))}

          {/* Create new option */}
          {showCreateNew && (
            <button
              type="button"
              onClick={handleCreateNewClick}
              className="w-full px-3 py-2 text-left border-t hover:bg-muted cursor-pointer"
            >
              <div className="font-medium text-primary">
                + Create new customer &ldquo;{query}&rdquo;
              </div>
              <div className="text-sm text-muted-foreground">
                Add email and phone in the form below
              </div>
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
