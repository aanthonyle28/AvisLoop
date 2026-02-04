'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Contact, Business, MessageTemplate } from '@/lib/types/database'

interface EmailPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  business: Business
  template: MessageTemplate | null
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

export function EmailPreviewModal({
  open,
  onOpenChange,
  contact,
  business,
  template,
}: EmailPreviewModalProps) {
  const defaultSubject = template?.subject || `${business.name} would love your feedback!`
  const defaultBody = template?.body || `Thank you for choosing ${business.name}! We'd really appreciate it if you could take a moment to share your experience.`
  const senderName = business.default_sender_name || business.name

  const resolvedSubject = resolveTemplate(defaultSubject, contact, business)
  const resolvedBody = resolveTemplate(defaultBody, contact, business)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        {!contact ? (
          <div className="py-8 text-center text-muted-foreground">
            Select a contact to see the full preview
          </div>
        ) : (
          <>
            {/* From/To header */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>From: {senderName}</div>
              <div>To: {contact.email}</div>
            </div>

            {/* Subject */}
            <div className="font-semibold text-lg">{resolvedSubject}</div>

            {/* Email body styled like actual email */}
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="bg-card p-6 rounded shadow-sm max-w-lg mx-auto">
                <h2 className="text-xl font-semibold mb-4">Hi {contact.name},</h2>

                <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
                  {resolvedBody}
                </p>

                {/* Rendered CTA button (non-clickable) */}
                <div className="text-center mb-6">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
                    Leave a Review
                  </span>
                </div>

                <hr className="my-6 border-border" />

                <p className="text-sm text-muted-foreground">
                  Thanks so much,<br />
                  {senderName}
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
