'use client'

import { useState, useMemo } from 'react'
import type { Contact } from '@/lib/types/database'
import { COOLDOWN_DAYS } from '@/lib/constants/billing'

interface ContactSelectorProps {
  contacts: Contact[]
  selectedId: string | null
  onSelect: (contact: Contact | null) => void
}

export function ContactSelector({
  contacts,
  selectedId,
  onSelect,
}: ContactSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredContacts = useMemo(() => {
    if (!search) return contacts
    const lower = search.toLowerCase()
    return contacts.filter(
      c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower)
    )
  }, [contacts, search])

  const selectedContact = contacts.find(c => c.id === selectedId)

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

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Select Contact</label>

      <input
        type="text"
        placeholder="Search contacts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm"
      />

      {selectedContact && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
          <div>
            <div className="font-medium">{selectedContact.name}</div>
            <div className="text-sm text-muted-foreground">{selectedContact.email}</div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm text-primary hover:underline"
          >
            Change
          </button>
        </div>
      )}

      {!selectedContact && (
        <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No contacts found
            </div>
          ) : (
            filteredContacts.map(contact => {
              const cooldown = getCooldownStatus(contact)
              const disabled = !!cooldown

              return (
                <button
                  key={contact.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(contact)}
                  className={`w-full p-3 text-left hover:bg-muted/50 ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    </div>
                    {cooldown && (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        {cooldown}
                      </span>
                    )}
                    {contact.send_count > 0 && !cooldown && (
                      <span className="text-xs text-muted-foreground">
                        Sent {contact.send_count}x
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="contactId" value={selectedId || ''} />
    </div>
  )
}
