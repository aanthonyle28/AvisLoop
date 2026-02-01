'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { batchSendReviewRequest } from '@/lib/actions/send'
import { scheduleReviewRequest } from '@/lib/actions/schedule'
import { findOrCreateContact } from '@/lib/actions/contact'
import { SendSettingsBar } from './send-settings-bar'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'
import { Loader2 } from 'lucide-react'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

interface QuickSendTabProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
}

export function QuickSendTab({
  contacts,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
}: QuickSendTabProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.find(t => t.is_default)?.id || templates[0]?.id || ''
  )
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('immediately')
  const [customDateTime, setCustomDateTime] = useState('')
  const [isPending, startTransition] = useTransition()

  // Email search and matching
  const matchedContact = useMemo(() => {
    if (!email.trim()) return null
    const normalizedEmail = email.toLowerCase().trim()
    return contacts.find(c => c.email.toLowerCase() === normalizedEmail) || null
  }, [email, contacts])

  // Filter contacts by created today
  const addedTodayContacts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return contacts.filter(c => {
      const created = new Date(c.created_at)
      return created >= today
    })
  }, [contacts])

  // Get scheduled_for ISO string based on preset
  const getScheduledFor = (): string | null => {
    const now = Date.now()

    switch (schedulePreset) {
      case 'immediately':
        return null
      case '1hour':
        return new Date(now + 60 * 60 * 1000).toISOString()
      case 'morning': {
        const target = new Date()
        target.setHours(9, 0, 0, 0)
        if (target.getTime() <= Date.now()) {
          target.setDate(target.getDate() + 1)
        }
        return target.toISOString()
      }
      case 'custom':
        return customDateTime ? new Date(customDateTime).toISOString() : null
      default:
        return null
    }
  }

  // Handle chip click to auto-fill email
  const handleChipClick = (contact: Contact) => {
    setEmail(contact.email)
    setName(contact.name)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    if (!selectedTemplateId) {
      toast.error('Please select a template')
      return
    }

    // Check monthly limit
    if (monthlyUsage.count >= monthlyUsage.limit) {
      toast.error(`Monthly send limit reached (${monthlyUsage.limit})`)
      return
    }

    startTransition(async () => {
      try {
        let contactId = matchedContact?.id

        // If no match, create new contact
        if (!contactId) {
          if (!name.trim()) {
            toast.error('Please enter a name for this new contact')
            return
          }

          const result = await findOrCreateContact({
            email: email.trim(),
            name: name.trim(),
            businessId: business.id,
          })

          if (result.error) {
            toast.error(result.error)
            return
          }

          contactId = result.data?.id
        }

        if (!contactId) {
          toast.error('Failed to create or find contact')
          return
        }

        const scheduledFor = getScheduledFor()
        const formData = new FormData()
        formData.append('contactIds', JSON.stringify([contactId]))
        formData.append('templateId', selectedTemplateId)

        if (scheduledFor) {
          // Schedule the send
          formData.append('scheduledFor', scheduledFor)
          const result = await scheduleReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Review request scheduled successfully')
            // Clear contact/name fields, keep template + schedule
            setEmail('')
            setName('')
          }
        } else {
          // Send immediately
          const result = await batchSendReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else if (result.data) {
            if (result.data.sent > 0) {
              toast.success('Review request sent successfully')
            } else if (result.data.skipped > 0) {
              const detail = result.data.details?.[0]
              const reason = detail?.reason || 'unknown'
              toast.error(`Cannot send: ${reason}`)
            } else {
              toast.error('Failed to send review request')
            }
            // Clear contact/name fields, keep template + schedule
            setEmail('')
            setName('')
          }
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        console.error('Quick send error:', error)
      }
    })
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null
  const previewContact = matchedContact || (email && name ? { id: 'preview', name, email, status: 'active', opted_out: false, send_count: 0, last_sent_at: null, created_at: new Date().toISOString(), business_id: business.id, phone: null } as Contact : null)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {/* Settings Bar */}
      <SendSettingsBar
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        schedulePreset={schedulePreset}
        onSchedulePresetChange={setSchedulePreset}
        customDateTime={customDateTime}
        onCustomDateTimeChange={setCustomDateTime}
      />

      {/* Email field with search + contact detection */}
      <div className="space-y-2">
        <label htmlFor="email-input" className="block text-sm font-medium">
          Contact Email
        </label>
        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="email-input"
            type="email"
            placeholder="Search by email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {email && (
            <button
              type="button"
              onClick={() => {
                setEmail('')
                setName('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Show existing contact chip if match found */}
        {matchedContact && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Existing contact:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
              {matchedContact.name}
            </span>
          </div>
        )}

        {/* Show name input if no match */}
        {email && !matchedContact && (
          <div className="space-y-1">
            <label htmlFor="name-input" className="block text-sm font-medium">
              Contact Name
            </label>
            <input
              id="name-input"
              type="text"
              placeholder="Enter name for new contact"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Added Today chips */}
      {addedTodayContacts.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Added Today
          </label>
          <div className="flex flex-wrap gap-2">
            {addedTodayContacts.slice(0, 10).map(contact => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleChipClick(contact)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {contact.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Preview */}
      {previewContact && selectedTemplate && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b">
            <div className="text-sm text-muted-foreground">Preview</div>
            <div className="font-medium">{selectedTemplate.subject}</div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="bg-white rounded-lg p-6 shadow-sm max-w-lg mx-auto">
              <h2 className="text-xl font-semibold mb-4">Hi {previewContact.name},</h2>
              <p className="text-gray-600 mb-6">{selectedTemplate.body}</p>
              <div className="text-center mb-6">
                <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
                  Leave a Review
                </span>
              </div>
              <hr className="my-6 border-gray-200" />
              <p className="text-gray-500 text-sm">
                Thanks so much,<br />
                {business.default_sender_name || business.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Send button area */}
      <div className="flex justify-end pt-4 border-t">
        {!hasReviewLink ? (
          <div className="flex-1 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Add your Google review link in settings before sending
            </p>
            <a
              href="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
            >
              Go to Settings
            </a>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!email || isPending || (!matchedContact && !name)}
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {schedulePreset === 'immediately' ? 'Sending...' : 'Scheduling...'}
              </>
            ) : (
              <>
                {schedulePreset === 'immediately' ? 'Send Review Request' : 'Schedule Send'}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
