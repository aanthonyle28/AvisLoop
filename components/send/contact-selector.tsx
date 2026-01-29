'use client'

import { useState, useMemo } from 'react'
import type { Contact } from '@/lib/types/database'
import { COOLDOWN_DAYS } from '@/lib/constants/billing'
import { Checkbox } from '@/components/ui/checkbox'

interface ContactSelectorProps {
  contacts: Contact[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  maxSelection?: number // default 25
  resendReadyIds?: Set<string> // contacts ready for re-send
}

export function ContactSelector({
  contacts,
  selectedIds,
  onSelectionChange,
  maxSelection = 25,
  resendReadyIds = new Set<string>(),
}: ContactSelectorProps) {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'ready-to-resend'>('all')

  // Calculate cooldown status
  const getCooldownStatus = (contact: Contact) => {
    if (!contact.last_sent_at) return null
    const lastSent = new Date(contact.last_sent_at)
    const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() < cooldownEnd) {
      const daysLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      return `${daysLeft}d cooldown`
    }
    return null
  }

  // Calculate days since last sent
  const getDaysSinceLastSent = (contact: Contact) => {
    if (!contact.last_sent_at) return null
    const daysSince = Math.floor((Date.now() - new Date(contact.last_sent_at).getTime()) / (24 * 60 * 60 * 1000))
    return daysSince
  }

  const filteredContacts = useMemo(() => {
    let result = contacts

    // Apply filter mode
    if (filterMode === 'ready-to-resend') {
      result = result.filter(c => resendReadyIds.has(c.id))
    }

    // Apply search filter
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(
        c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower)
      )
    }

    return result
  }, [contacts, search, filterMode, resendReadyIds])

  const readyToResendCount = contacts.filter(c => resendReadyIds.has(c.id)).length

  const handleSelectAll = () => {
    // Select all visible contacts that are NOT on cooldown, up to maxSelection
    const eligibleContacts = filteredContacts.filter(c => !getCooldownStatus(c))

    const newSelectedIds = new Set(selectedIds)
    let addedCount = 0

    for (const contact of eligibleContacts) {
      if (newSelectedIds.size >= maxSelection) break
      if (!newSelectedIds.has(contact.id)) {
        newSelectedIds.add(contact.id)
        addedCount++
      }
    }

    onSelectionChange(newSelectedIds)
  }

  const handleDeselectAll = () => {
    onSelectionChange(new Set())
  }

  const handleToggleContact = (contactId: string) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(contactId)) {
      newSelectedIds.delete(contactId)
    } else {
      if (newSelectedIds.size < maxSelection) {
        newSelectedIds.add(contactId)
      }
    }
    onSelectionChange(newSelectedIds)
  }

  const allVisibleSelected = filteredContacts.length > 0 &&
    filteredContacts.filter(c => !getCooldownStatus(c)).every(c => selectedIds.has(c.id))
  const someVisibleSelected = filteredContacts.some(c => selectedIds.has(c.id))
  const isIndeterminate = someVisibleSelected && !allVisibleSelected

  const selectionFull = selectedIds.size >= maxSelection

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Select Contacts</label>

      {/* Filter mode buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            filterMode === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Contacts
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('ready-to-resend')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            filterMode === 'ready-to-resend'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Ready to Re-send ({readyToResendCount})
        </button>
      </div>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search contacts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm"
      />

      {/* Selection count and Select All */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={() => allVisibleSelected ? handleDeselectAll() : handleSelectAll()}
            aria-label="Select all visible contacts"
            className={isIndeterminate ? 'data-[state=checked]:bg-primary/50' : ''}
          />
          <span className="text-sm font-medium">
            {allVisibleSelected ? `All selected` : isIndeterminate ? 'Some selected' : 'Select all'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedIds.size} / {maxSelection} selected
          {selectionFull && <span className="ml-2 text-yellow-600">(limit reached)</span>}
        </div>
      </div>

      {/* Contact list */}
      <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No contacts found
          </div>
        ) : (
          filteredContacts.map(contact => {
            const cooldown = getCooldownStatus(contact)
            const isOnCooldown = !!cooldown
            const isSelected = selectedIds.has(contact.id)
            const isDisabled = isOnCooldown || (!isSelected && selectionFull)
            const isReadyToResend = resendReadyIds.has(contact.id)
            const daysSince = getDaysSinceLastSent(contact)

            return (
              <div
                key={contact.id}
                className={`flex items-center gap-3 p-3 ${
                  isDisabled ? 'opacity-50' : 'hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleContact(contact.id)}
                  disabled={isDisabled}
                  aria-label={`Select ${contact.name}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{contact.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{contact.email}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isReadyToResend && (
                    <span className="text-xs text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-2 py-1 rounded whitespace-nowrap">
                      Ready to re-send
                    </span>
                  )}
                  {daysSince !== null && isReadyToResend && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {daysSince}d ago
                    </span>
                  )}
                  {cooldown && (
                    <span className="text-xs text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 px-2 py-1 rounded whitespace-nowrap">
                      {cooldown}
                    </span>
                  )}
                  {!contact.last_sent_at && (
                    <span className="text-xs text-gray-500 px-2 py-1 rounded whitespace-nowrap">
                      Never sent
                    </span>
                  )}
                  {contact.send_count > 0 && !isReadyToResend && !cooldown && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Sent {contact.send_count}x
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="contactIds"
        value={JSON.stringify(Array.from(selectedIds))}
      />
    </div>
  )
}
