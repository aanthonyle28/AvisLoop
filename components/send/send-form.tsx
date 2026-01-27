'use client'

import { useActionState, useEffect, useState } from 'react'
import { sendReviewRequest } from '@/lib/actions/send'
import { ContactSelector } from './contact-selector'
import { MessagePreview } from './message-preview'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface SendFormProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
}

export function SendForm({
  contacts,
  business,
  templates,
  monthlyUsage,
}: SendFormProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(
    templates.find(t => t.is_default) || templates[0] || null
  )
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [state, formAction, isPending] = useActionState(sendReviewRequest, null)

  // Handle successful send
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      // Reset form after showing success
      setTimeout(() => {
        setSelectedContact(null)
        setCustomSubject('')
        setCustomBody('')
        setShowSuccess(false)
      }, 3000)
    }
  }, [state?.success])

  const atLimit = monthlyUsage.count >= monthlyUsage.limit

  if (showSuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          Review Request Sent!
        </h2>
        <p className="text-green-700">
          Your message to {selectedContact?.name} has been sent successfully.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Error display */}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Unable to send</p>
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Limit warning */}
      {atLimit && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">Monthly limit reached</p>
          <p className="text-sm text-yellow-700">
            You&apos;ve used all {monthlyUsage.limit} sends this month.
            {monthlyUsage.tier !== 'pro' && ' Upgrade to Pro for more sends.'}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Contact selection + template */}
        <div className="space-y-6">
          <ContactSelector
            contacts={contacts}
            selectedId={selectedContact?.id || null}
            onSelect={setSelectedContact}
          />

          {templates.length > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Template</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={selectedTemplate?.id || ''}
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value)
                  setSelectedTemplate(tpl || null)
                  setCustomSubject('') // Reset custom values when template changes
                  setCustomBody('')
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
        </div>

        {/* Right column: Preview */}
        <div>
          <MessagePreview
            contact={selectedContact}
            business={business}
            template={selectedTemplate}
            customSubject={customSubject}
            customBody={customBody}
            onSubjectChange={setCustomSubject}
            onBodyChange={setCustomBody}
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={!selectedContact || isPending || atLimit}
          className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Review Request'
          )}
        </button>
      </div>
    </form>
  )
}
