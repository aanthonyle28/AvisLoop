'use client'

import { useState } from 'react'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'

interface MessagePreviewProps {
  contact: Contact | null
  business: Business
  template: EmailTemplate | null
  customSubject: string
  customBody: string
  onSubjectChange: (subject: string) => void
  onBodyChange: (body: string) => void
}

export function MessagePreview({
  contact,
  business,
  template,
  customSubject,
  customBody,
  onSubjectChange,
  onBodyChange,
}: MessagePreviewProps) {
  const [isEditingSubject, setIsEditingSubject] = useState(false)
  const [isEditingBody, setIsEditingBody] = useState(false)

  const defaultSubject = template?.subject || `${business.name} would love your feedback!`
  const defaultBody = template?.body || `Thank you for choosing ${business.name}! We'd really appreciate it if you could take a moment to share your experience.`
  const displaySubject = customSubject || defaultSubject
  const displayBody = customBody || defaultBody
  const senderName = business.default_sender_name || business.name

  if (!contact) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        Select a contact to preview the message
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/30 px-4 py-3 border-b">
        <div className="text-sm text-muted-foreground mb-1">Preview</div>
        <div className="flex items-center justify-between">
          {isEditingSubject ? (
            <input
              type="text"
              value={customSubject || defaultSubject}
              onChange={e => onSubjectChange(e.target.value)}
              onBlur={() => setIsEditingSubject(false)}
              autoFocus
              className="flex-1 px-2 py-1 border rounded text-sm font-medium"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSubject(true)}
              className="text-left group"
            >
              <span className="font-medium">{displaySubject}</span>
              <span className="ml-2 text-xs text-primary opacity-0 group-hover:opacity-100">
                Edit
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 bg-gray-50">
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-lg mx-auto">
          <h2 className="text-xl font-semibold mb-4">Hi {contact.name},</h2>

          {isEditingBody ? (
            <textarea
              value={customBody || defaultBody}
              onChange={e => onBodyChange(e.target.value)}
              onBlur={() => setIsEditingBody(false)}
              autoFocus
              rows={4}
              className="w-full px-3 py-2 border rounded text-sm text-gray-600 mb-6"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingBody(true)}
              className="text-left group w-full"
            >
              <p className="text-gray-600 mb-6">
                {displayBody}
                <span className="ml-2 text-xs text-primary opacity-0 group-hover:opacity-100">
                  Edit
                </span>
              </p>
            </button>
          )}

          <div className="text-center mb-6">
            <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
              Leave a Review
            </span>
          </div>

          <hr className="my-6 border-gray-200" />

          <p className="text-gray-500 text-sm">
            Thanks so much,<br />
            {senderName}
          </p>
        </div>
      </div>

      {/* Hidden inputs for form */}
      {customSubject && (
        <input type="hidden" name="customSubject" value={customSubject} />
      )}
      {customBody && (
        <input type="hidden" name="customBody" value={customBody} />
      )}
    </div>
  )
}
