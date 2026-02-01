'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'
import { MessagePreview } from '@/components/send/message-preview'
import { ArrowClockwise, X, Link as LinkIcon, CaretDown } from '@phosphor-icons/react'
import { format } from 'date-fns'
import type { SendLogWithContact, Business, EmailTemplate } from '@/lib/types/database'
import type { SendStatus } from './status-badge'
import { COOLDOWN_DAYS } from '@/lib/constants/billing'

interface RequestDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: SendLogWithContact | null
  business: Business
  templates: EmailTemplate[]
  onResend: (contactId: string, templateId: string | null) => Promise<void>
  onCancel: (requestId: string) => Promise<void>
}

export function RequestDetailDrawer({
  open,
  onOpenChange,
  request,
  business,
  templates,
  onResend,
  onCancel,
}: RequestDetailDrawerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  if (!request) return null

  // Determine if contact is on cooldown
  const isOnCooldown = request.contacts && (() => {
    // We don't have last_sent_at on SendLogWithContact, so check request created_at
    const lastSent = new Date(request.created_at)
    const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    return new Date() < cooldownEnd
  })()

  // For now, we don't have opted_out on SendLogWithContact, so we'll default to false
  const isOptedOut = false

  const canResend = !isOnCooldown && !isOptedOut && request.status !== 'pending'
  const canCancel = request.status === 'pending'

  // Mock contact object for MessagePreview
  const mockContact = {
    id: request.contact_id,
    business_id: request.business_id,
    name: request.contacts.name,
    email: request.contacts.email,
    phone: null,
    status: 'active' as const,
    opted_out: false,
    last_sent_at: request.created_at,
    send_count: 1,
    created_at: request.created_at,
    updated_at: request.updated_at,
  }

  // Find the template used for this request
  const usedTemplate = templates.find(t => t.id === request.template_id) || null

  const handleResend = async () => {
    setIsResending(true)
    try {
      await onResend(request.contact_id, selectedTemplateId || request.template_id)
    } finally {
      setIsResending(false)
    }
  }

  const handleCancel = async () => {
    setIsCanceling(true)
    try {
      await onCancel(request.id)
      onOpenChange(false)
    } finally {
      setIsCanceling(false)
    }
  }

  const handleCopyLink = () => {
    if (business.google_review_link) {
      navigator.clipboard.writeText(business.google_review_link)
    }
  }

  // Get initials for avatar
  const initials = request.contacts.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Details</SheetTitle>
          <SheetDescription>
            View details and take action on this review request
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Recipient Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Recipient</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{request.contacts.name}</p>
                <p className="text-sm text-muted-foreground truncate">{request.contacts.email}</p>
              </div>
            </div>
          </div>

          {/* Send Details */}
          <div>
            <h3 className="text-sm font-medium mb-3">Send Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template:</span>
                <span className="font-medium">{usedTemplate?.name || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent:</span>
                <span className="font-medium">
                  {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium truncate max-w-[200px]" title={request.subject}>
                  {request.subject}
                </span>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Status</h3>
            <StatusBadge status={request.status as SendStatus} />
            {request.error_message && (
              <p className="text-sm text-destructive mt-2">{request.error_message}</p>
            )}
          </div>

          {/* Email Preview */}
          <div>
            <h3 className="text-sm font-medium mb-3">Email Preview</h3>
            <MessagePreview
              contact={mockContact}
              business={business}
              template={usedTemplate}
              compact={false}
            />
          </div>

          {/* Resend Section */}
          {canResend && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-3">Resend Request</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Template</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedTemplateId
                          ? templates.find(t => t.id === selectedTemplateId)?.name
                          : usedTemplate?.name || 'Default Template'}
                        <CaretDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      <DropdownMenuItem onSelect={() => setSelectedTemplateId(null)}>
                        Default Template
                      </DropdownMenuItem>
                      {templates.map(template => (
                        <DropdownMenuItem
                          key={template.id}
                          onSelect={() => setSelectedTemplateId(template.id)}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full"
                >
                  <ArrowClockwise className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Resending...' : 'Resend Request'}
                </Button>
              </div>
            </div>
          )}

          {/* Cooldown/Opted Out Message */}
          {!canResend && request.status !== 'pending' && (
            <div className="border-t pt-6">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                {isOnCooldown && (
                  <p>This contact is on cooldown. You can resend in a few days.</p>
                )}
                {isOptedOut && (
                  <p>This contact has opted out of receiving review requests.</p>
                )}
              </div>
            </div>
          )}

          {/* Cancel Section for Pending */}
          {canCancel && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-3 text-destructive">Cancel Request</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This request is still pending. You can cancel it before it&apos;s sent.
              </p>
              <Button
                onClick={handleCancel}
                disabled={isCanceling}
                variant="destructive"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                {isCanceling ? 'Canceling...' : 'Cancel Request'}
              </Button>
            </div>
          )}

          {/* Copy Review Link */}
          {business.google_review_link && (
            <div className="border-t pt-6">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy Review Link
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
