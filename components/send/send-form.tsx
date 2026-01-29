'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { batchSendReviewRequest } from '@/lib/actions/send'
import { ContactSelector } from './contact-selector'
import { MessagePreview } from './message-preview'
import { BatchResults } from './batch-results'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'
import { Loader2, AlertCircle } from 'lucide-react'

interface SendFormProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  contactCount: number
  contactLimit?: number
  resendReadyContactIds: string[]
}

export function SendForm({
  contacts,
  business,
  templates,
  monthlyUsage,
  contactCount,
  contactLimit,
  resendReadyContactIds,
}: SendFormProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(
    templates.find(t => t.is_default) || templates[0] || null
  )
  const [customSubject, setCustomSubject] = useState('')
  const [showResults, setShowResults] = useState(false)

  const [batchState, batchFormAction, isBatchPending] = useActionState(batchSendReviewRequest, null)

  // Convert resendReadyContactIds array to Set for efficient lookup
  const resendReadyIds = new Set(resendReadyContactIds)

  // Get list of selected contact objects for preview
  const selectedContactsList = contacts.filter(c => selectedContacts.has(c.id))
  const previewContact = selectedContactsList[0] || null

  // Handle successful batch send
  useEffect(() => {
    if (batchState?.success && batchState.data) {
      setShowResults(true)
    }
  }, [batchState?.success, batchState?.data])

  // Reset form and hide results
  const handleSendMore = () => {
    setSelectedContacts(new Set())
    setCustomSubject('')
    setShowResults(false)
  }

  // Limit checks
  const sendLimitReached = monthlyUsage.count >= monthlyUsage.limit

  // BILL-07: Contact limit enforcement for Basic tier
  const contactsOverLimit =
    contactLimit !== undefined && contactCount > contactLimit

  const limitReached = sendLimitReached || contactsOverLimit

  // Show results if batch completed
  if (showResults && batchState?.success && batchState.data) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Batch Send Results</h2>
        <BatchResults results={batchState.data} onSendMore={handleSendMore} />
      </div>
    )
  }

  return (
    <form action={batchFormAction} className="space-y-6">
      {/* Error display */}
      {batchState?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Unable to send</p>
            <p className="text-sm text-red-700">{batchState.error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Contact selection + template */}
        <div className="space-y-6">
          <ContactSelector
            contacts={contacts}
            selectedIds={selectedContacts}
            onSelectionChange={setSelectedContacts}
            maxSelection={25}
            resendReadyIds={resendReadyIds}
          />

          {templates.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Template</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={selectedTemplate?.id || ''}
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value)
                  setSelectedTemplate(tpl || null)
                  setCustomSubject('') // Reset custom subject when template changes
                }}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default && '(Default)'}
                  </option>
                ))}
              </select>
              <input type="hidden" name="templateId" value={selectedTemplate?.id || ''} />
            </div>
          )}

          {/* Pre-send summary */}
          {selectedContacts.size > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="font-medium text-sm mb-2">Ready to Send</h3>
              <p className="text-sm text-muted-foreground">
                Sending to <strong>{selectedContacts.size}</strong> contact{selectedContacts.size !== 1 ? 's' : ''}
              </p>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Using template: <strong>{selectedTemplate.name}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column: Preview */}
        <div>
          <MessagePreview
            contact={previewContact}
            business={business}
            template={selectedTemplate}
            customSubject={customSubject}
            customBody={''}
            onSubjectChange={setCustomSubject}
            onBodyChange={() => {}}
          />
          {selectedContacts.size > 1 && previewContact && (
            <p className="text-xs text-muted-foreground mt-2">
              Preview showing first selected contact. Message will be personalized for each recipient.
            </p>
          )}
        </div>
      </div>

      {/* Custom subject input */}
      <input type="hidden" name="customSubject" value={customSubject} />

      {/* Submit button or upgrade prompt */}
      <div className="flex justify-end pt-4 border-t">
        {limitReached ? (
          <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive mb-3">
              {contactsOverLimit
                ? `Contact limit exceeded (${contactCount}/${contactLimit}). Remove contacts or upgrade.`
                : `${monthlyUsage.tier === 'trial' ? 'Trial' : 'Plan'} limit reached.`}
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/billing"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                {monthlyUsage.tier === 'trial' ? 'Start a plan' : 'Upgrade'}
              </Link>
              <Link
                href="/billing#plans"
                className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
              >
                View pricing
              </Link>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={selectedContacts.size === 0 || isBatchPending}
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBatchPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send to {selectedContacts.size} Contact{selectedContacts.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
