'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MagnifyingGlass, X, PaperPlaneTilt } from '@phosphor-icons/react'
import { batchSendReviewRequest } from '@/lib/actions/send'
import { sendSmsRequest } from '@/lib/actions/send-sms.action'
import { scheduleReviewRequest } from '@/lib/actions/schedule'
import { findOrCreateCustomer } from '@/lib/actions/customer'
import { SendSettingsBar } from './send-settings-bar'
import { MessagePreview } from './message-preview'
import { EmailPreviewModal } from './email-preview-modal'
import { ChannelSelector } from './channel-selector'
import { SmsCharacterCounter, SmsCharacterNotice } from './sms-character-counter'
import type { Customer, Business, MessageTemplate } from '@/lib/types/database'
import { CircleNotch } from '@phosphor-icons/react'

type Channel = 'email' | 'sms'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

interface QuickSendTabProps {
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
}

export function QuickSendTab({
  customers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
}: QuickSendTabProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<Channel>('email')
  const [smsBody, setSmsBody] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.find(t => t.is_default)?.id || templates[0]?.id || ''
  )
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('immediately')
  const [customDateTime, setCustomDateTime] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Email search and matching (must be declared before SMS hooks that depend on it)
  const matchedCustomer = useMemo(() => {
    if (!email.trim()) return null
    const normalizedEmail = email.toLowerCase().trim()
    return customers.find(c => c.email.toLowerCase() === normalizedEmail) || null
  }, [email, customers])

  // SMS availability checks
  const canSendSms = useMemo(() => {
    if (!matchedCustomer) return false
    return matchedCustomer.phone_status === 'valid' && matchedCustomer.sms_consent_status === 'opted_in'
  }, [matchedCustomer])

  const smsDisabledReason = useMemo(() => {
    if (!matchedCustomer) return 'Select a customer first'
    if (!matchedCustomer.phone) return 'Customer has no phone number'
    if (matchedCustomer.phone_status !== 'valid') return 'Phone number is invalid'
    if (matchedCustomer.sms_consent_status !== 'opted_in') return 'Customer has not opted in to SMS'
    return undefined
  }, [matchedCustomer])

  // Autocomplete suggestions - search by email AND name
  const suggestions = useMemo(() => {
    if (!email.trim() || email.trim().length < 2) return []
    const query = email.toLowerCase().trim()
    return customers
      .filter(c =>
        c.email.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
      )
      .slice(0, 6)
  }, [email, customers])

  // Filter contacts added today for quick chips
  const recentCustomers = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return customers.filter(c => {
      const created = new Date(c.created_at)
      return created >= today
    })
  }, [customers])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset channel to email when customer changes and SMS not available
  useEffect(() => {
    if (channel === 'sms' && !canSendSms) {
      setChannel('email')
    }
  }, [matchedCustomer, canSendSms, channel])

  // Set default SMS body with review link when switching to SMS
  useEffect(() => {
    if (channel === 'sms' && !smsBody && business.google_review_link) {
      const customerName = matchedCustomer?.name || name || 'there'
      setSmsBody(
        `Hi ${customerName}! Thanks for choosing ${business.name}. We'd love your feedback - please leave us a review: ${business.google_review_link}`
      )
    }
  }, [channel, smsBody, business.name, business.google_review_link, matchedCustomer?.name, name])

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

  const handleSelectSuggestion = (customer: Customer) => {
    setEmail(customer.email)
    setName(customer.name)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleChipClick = (customer: Customer) => {
    setEmail(customer.email)
    setName(customer.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // For email channel, require template
    if (channel === 'email' && !selectedTemplateId) {
      toast.error('Please select a template')
      return
    }

    // For SMS channel, require body
    if (channel === 'sms' && !smsBody.trim()) {
      toast.error('Please enter an SMS message')
      return
    }

    if (monthlyUsage.count >= monthlyUsage.limit) {
      toast.error(`Monthly send limit reached (${monthlyUsage.limit})`)
      return
    }

    startTransition(async () => {
      try {
        let contactId = matchedCustomer?.id

        if (!contactId) {
          if (!name.trim()) {
            toast.error('Please enter a name for this new customer')
            return
          }

          const result = await findOrCreateCustomer({
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
          toast.error('Failed to create or find customer')
          return
        }

        // Handle SMS channel
        if (channel === 'sms') {
          const formData = new FormData()
          formData.append('customerId', contactId)
          formData.append('body', smsBody)
          if (selectedTemplateId) {
            formData.append('templateId', selectedTemplateId)
          }

          const result = await sendSmsRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else if (result.queued && result.queuedFor) {
            const queuedTime = new Date(result.queuedFor).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })
            toast.success(`SMS queued for ${queuedTime} (quiet hours)`)
            setEmail('')
            setName('')
            setSmsBody('')
          } else if (result.success) {
            toast.success('SMS sent successfully')
            setEmail('')
            setName('')
            setSmsBody('')
          }
          return
        }

        // Handle email channel
        const scheduledFor = getScheduledFor()
        const formData = new FormData()
        formData.append('contactIds', JSON.stringify([contactId]))
        formData.append('templateId', selectedTemplateId)

        if (scheduledFor) {
          formData.append('scheduledFor', scheduledFor)
          const result = await scheduleReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Review request scheduled successfully')
            setEmail('')
            setName('')
          }
        } else {
          const result = await batchSendReviewRequest(null, formData)

          if (result.error) {
            toast.error(result.error)
          } else if (result.data) {
            if (result.data.sent > 0) {
              toast.success('Message sent successfully')
            } else if (result.data.skipped > 0) {
              const detail = result.data.details?.[0]
              const reason = detail?.reason || 'unknown'
              toast.error(`Cannot send: ${reason}`)
            } else {
              toast.error('Failed to send review request')
            }
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
  const previewCustomer = matchedCustomer || (email && name ? {
    id: 'preview', name, email, status: 'active', opted_out: false,
    send_count: 0, last_sent_at: null, created_at: new Date().toISOString(),
    business_id: business.id, phone: null, phone_status: 'missing' as const,
    tags: [], timezone: null, sms_consent_status: 'unknown' as const,
    sms_consent_at: null, sms_consent_source: null, sms_consent_method: null,
    sms_consent_notes: null, sms_consent_ip: null, sms_consent_captured_by: null,
    updated_at: new Date().toISOString(),
  } as Customer : null)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <PaperPlaneTilt size={18} weight="bold" />
        <h2 className="text-base font-semibold">Single Send</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Settings Bar: Template + Schedule in one row */}
        <SendSettingsBar
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          schedulePreset={schedulePreset}
          onSchedulePresetChange={setSchedulePreset}
          customDateTime={customDateTime}
          onCustomDateTimeChange={setCustomDateTime}
        />

        {/* Contact search with autocomplete */}
        <div className="space-y-2">
          <label htmlFor="email-input" className="block text-sm font-medium">
            Customer
          </label>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              weight="regular"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={inputRef}
              id="email-input"
              type="text"
              placeholder="Search customers..."
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setShowSuggestions(true)
                setHighlightedIndex(-1)
              }}
              onFocus={() => {
                if (email.trim().length >= 2) setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              className="w-full pl-9 pr-10 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {email && (
              <button
                type="button"
                onClick={() => {
                  setEmail('')
                  setName('')
                  setShowSuggestions(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} weight="bold" />
              </button>
            )}

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && !matchedCustomer && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {suggestions.map((customer, index) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(customer)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${
                      index === highlightedIndex ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{customer.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Existing contact chip */}
          {matchedCustomer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Existing customer:</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                {matchedCustomer.name}
              </span>
            </div>
          )}

          {/* Name input for new contact */}
          {email && !matchedCustomer && (
            <div className="space-y-1">
              <label htmlFor="name-input" className="block text-sm font-medium">
                Customer Name
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="Enter name for new customer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Channel Selector - show when customer is selected */}
        {matchedCustomer && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Channel</label>
            <ChannelSelector
              value={channel}
              onChange={setChannel}
              smsDisabled={!canSendSms}
              smsDisabledReason={smsDisabledReason}
            />
          </div>
        )}

        {/* SMS Message Body - show when SMS channel selected */}
        {channel === 'sms' && matchedCustomer && (
          <div className="space-y-2">
            <label htmlFor="sms-body" className="block text-sm font-medium">
              SMS Message
            </label>
            <textarea
              id="sms-body"
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              placeholder="Enter your SMS message..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <SmsCharacterCounter text={smsBody} />
            <SmsCharacterNotice length={smsBody.length} />
          </div>
        )}

        {/* Recently Added chips */}
        {recentCustomers.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recently Added
            </label>
            <div className="flex flex-wrap gap-2">
              {recentCustomers.slice(0, 10).map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleChipClick(customer)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {customer.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact Message Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </label>
          <MessagePreview
            customer={previewCustomer}
            business={business}
            template={selectedTemplate}
            onViewFull={() => setShowFullPreview(true)}
          />
        </div>

        {/* Send button */}
        <div className="pt-2">
          {!hasReviewLink ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Add your Google review link in settings before sending
              </p>
              <a
                href="/settings"
                className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
              >
                Go to Settings
              </a>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!email || isPending || (!matchedCustomer && !name)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  {schedulePreset === 'immediately' ? 'Sending...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={16} weight="bold" />
                  Send Message
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <EmailPreviewModal
        open={showFullPreview}
        onOpenChange={setShowFullPreview}
        customer={previewCustomer}
        business={business}
        template={selectedTemplate}
      />
    </div>
  )
}
