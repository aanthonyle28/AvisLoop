'use client'

import { useState } from 'react'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'

interface MessagePreviewProps {
  contact: Contact | null
  business: Business
  template: EmailTemplate | null
  compact?: boolean
}

export function MessagePreview({
  contact,
  business,
  template,
  compact = true,
}: MessagePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const defaultSubject = template?.subject || `${business.name} would love your feedback!`
  const defaultBody = template?.body || `Thank you for choosing ${business.name}! We'd really appreciate it if you could take a moment to share your experience.`
  const senderName = business.default_sender_name || business.name

  if (!contact) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        Enter an email to preview the message
      </div>
    )
  }

  const showCompact = compact && !isExpanded

  return (
    <div className="rounded-lg border overflow-hidden transition-all duration-300">
      <div className="bg-muted/30 px-4 py-3 border-b">
        <div className="text-sm text-muted-foreground mb-1">Preview</div>
        <div className="font-medium">{defaultSubject}</div>
      </div>

      <div className="p-6 bg-gray-50">
        <div className={`bg-white rounded-lg p-6 shadow-sm max-w-lg mx-auto ${showCompact ? 'line-clamp-container' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">Hi {contact.name},</h2>

          <p className={`text-gray-600 mb-6 ${showCompact ? 'line-clamp-3' : ''}`}>
            {defaultBody}
          </p>

          {showCompact && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-sm text-primary hover:underline mb-4"
            >
              Show full preview
            </button>
          )}

          {!showCompact && (
            <>
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

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-sm text-primary hover:underline mt-4"
              >
                Collapse preview
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
