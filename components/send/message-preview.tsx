'use client'

import type { Contact, Business, EmailTemplate } from '@/lib/types/database'

interface MessagePreviewProps {
  contact: Contact | null
  business: Business
  template: EmailTemplate | null
  onViewFull?: () => void
}

function resolveTemplate(
  text: string,
  contact: Contact | null,
  business: Business
): string {
  if (!contact) return text

  const senderName = business.default_sender_name || business.name
  return text
    .replace(/{{CUSTOMER_NAME}}/g, contact.name)
    .replace(/{{BUSINESS_NAME}}/g, business.name)
    .replace(/{{SENDER_NAME}}/g, senderName)
}

export function MessagePreview({
  contact,
  business,
  template,
  onViewFull,
}: MessagePreviewProps) {
  const defaultSubject = template?.subject || `${business.name} would love your feedback!`
  const defaultBody = template?.body || `Thank you for choosing ${business.name}! We'd really appreciate it if you could take a moment to share your experience.`

  if (!contact) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        Enter an email to preview the message
      </div>
    )
  }

  const resolvedSubject = resolveTemplate(defaultSubject, contact, business)
  const resolvedBody = resolveTemplate(defaultBody, contact, business)

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-2">Email Preview</div>

      {/* Subject - single line */}
      <div className="font-semibold text-sm mb-2 truncate">
        {resolvedSubject}
      </div>

      {/* Body - 2-3 lines clamped */}
      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
        {resolvedBody}
      </p>

      {/* View full link */}
      {onViewFull && (
        <button
          type="button"
          onClick={onViewFull}
          className="text-sm text-primary hover:underline"
        >
          View full email
        </button>
      )}
    </div>
  )
}
