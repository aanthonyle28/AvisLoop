"use client"

import { useState, useTransition, useMemo } from 'react'
import { PaperPlaneTilt, MagnifyingGlass, UserPlus } from '@phosphor-icons/react'
import { batchSendReviewRequest } from '@/lib/actions/send'
import { scheduleReviewRequest } from '@/lib/actions/schedule'
import { toast } from 'sonner'

interface QuickSendProps {
  contacts: Array<{ id: string; name: string; email: string }>
  templates: Array<{ id: string; name: string; is_default: boolean }>
  recentContacts: Array<{ id: string; name: string }>
}

type SchedulePreset = 'immediately' | '1hour' | 'morning' | '24hours' | 'custom'

export function QuickSend({ contacts, templates, recentContacts }: QuickSendProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.find(t => t.is_default)?.id || templates[0]?.id || ''
  )
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('immediately')
  const [customDateTime, setCustomDateTime] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return contacts
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [searchQuery, contacts])

  // Get selected contact details
  const selectedContact = contacts.find(c => c.id === selectedContactId)

  // Handle contact selection
  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId)
    setSearchQuery('')
    setShowDropdown(false)
  }

  // Handle deselect contact
  const handleDeselectContact = () => {
    setSelectedContactId(null)
    setSearchQuery('')
  }

  // Calculate scheduled_for ISO string based on preset
  const getScheduledFor = (): string | null => {
    const now = Date.now()

    switch (schedulePreset) {
      case 'immediately':
        return null
      case '1hour':
        return new Date(now + 60 * 60 * 1000).toISOString()
      case 'morning': {
        // Next 9AM local time
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        return tomorrow.toISOString()
      }
      case '24hours':
        return new Date(now + 24 * 60 * 60 * 1000).toISOString()
      case 'custom':
        return customDateTime ? new Date(customDateTime).toISOString() : null
      default:
        return null
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContactId) {
      toast.error('Please select a contact')
      return
    }

    if (!selectedTemplateId) {
      toast.error('Please select a template')
      return
    }

    const scheduledFor = getScheduledFor()

    startTransition(async () => {
      const formData = new FormData()
      formData.append('contactIds', JSON.stringify([selectedContactId]))
      formData.append('templateId', selectedTemplateId)

      try {
        if (scheduledFor) {
          // Schedule the send
          formData.append('scheduledFor', scheduledFor)
          const result = await scheduleReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Review request scheduled successfully')
            // Reset form
            setSelectedContactId(null)
            setSchedulePreset('immediately')
            setCustomDateTime('')
          }
        } else {
          // Send immediately
          const result = await batchSendReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else if (result.data) {
            if (result.data.sent > 0) {
              toast.success(`Review request sent successfully`)
            } else if (result.data.skipped > 0) {
              const detail = result.data.details?.[0]
              const reason = detail?.reason || 'unknown'
              toast.error(`Cannot send: ${reason}`)
            } else {
              toast.error('Failed to send review request')
            }
            // Reset form
            setSelectedContactId(null)
            setSchedulePreset('immediately')
          }
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        console.error('Quick send error:', error)
      }
    })
  }

  return (
    <div className="flex flex-col md:flex-row border border-[#E3E3E3] rounded-lg overflow-hidden">
      {/* Left panel - Quick Send */}
      <div className="flex-1 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <PaperPlaneTilt size={20} weight="regular" />
          <h3 className="font-semibold">Quick Send</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact search */}
          <div className="relative">
            <label htmlFor="contact-search" className="block text-sm font-medium mb-2">
              Contact
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  weight="regular"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="contact-search"
                  type="text"
                  placeholder="Search Through Comments..."
                  value={selectedContact ? selectedContact.name : searchQuery}
                  onChange={(e) => {
                    if (!selectedContact) {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }
                  }}
                  onFocus={() => {
                    if (!selectedContact && searchQuery) {
                      setShowDropdown(true)
                    }
                  }}
                  readOnly={!!selectedContact}
                  className="w-full pl-9 pr-8 py-2 border border-[#E3E3E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {selectedContact && (
                  <button
                    type="button"
                    onClick={handleDeselectContact}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Add Contact button */}
              <a
                href="/contacts"
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
                title="Add Contact"
              >
                <UserPlus size={18} weight="bold" />
              </a>
            </div>

            {/* Search dropdown */}
            {showDropdown && filteredContacts.length > 0 && !selectedContact && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#E3E3E3] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact.id)}
                    className="w-full text-left px-4 py-2 hover:bg-[#F2F2F2] transition-colors"
                  >
                    <div className="font-medium text-sm">{contact.name}</div>
                    <div className="text-xs text-muted-foreground">{contact.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recently added contacts - always visible */}
          {recentContacts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recently Added</label>
              <div className="flex flex-wrap gap-2">
                {recentContacts.slice(0, 5).map(contact => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selectedContactId === contact.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#E3E3E3] hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {contact.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template selector */}
          <div>
            <label htmlFor="template-select" className="block text-sm font-medium mb-2">
              Message Template
            </label>
            <select
              id="template-select"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E3E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-[#E3E3E3]" />
      <div className="md:hidden h-px bg-[#E3E3E3]" />

      {/* Right panel - When to Send */}
      <div className="w-full md:w-1/3 md:shrink-0 bg-[#F9F9FB] p-5">
        <h3 className="font-semibold text-sm mb-4">When to Send</h3>

        <div className="space-y-2 mb-4">
          {(['immediately', '1hour', 'morning', '24hours', 'custom'] as SchedulePreset[]).map((preset) => {
            const labels: Record<SchedulePreset, string> = {
              immediately: 'Immediately',
              '1hour': 'In 1 hour',
              morning: 'In the morning (9AM)',
              '24hours': 'In 24 hours',
              custom: 'Different date',
            }
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setSchedulePreset(preset)}
                className={`w-full rounded-full border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  schedulePreset === preset
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-[#E3E3E3] bg-white text-foreground/70 hover:border-primary/50'
                }`}
              >
                {labels[preset]}
              </button>
            )
          })}
        </div>

        {/* Custom date/time input */}
        {schedulePreset === 'custom' && (
          <div className="mb-4">
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E3E3E3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Send button */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!selectedContactId || isPending}
          className="w-full bg-primary text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <PaperPlaneTilt size={16} weight="fill" />
              Send Request
            </>
          )}
        </button>
      </div>
    </div>
  )
}
