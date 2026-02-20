'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Warning } from '@phosphor-icons/react'
import Link from 'next/link'
import { QuickSendForm } from './quick-send-form'
import type { Customer, Business, MessageTemplate } from '@/lib/types/database'

interface QuickSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  prefilledCustomer?: Customer | null
}

export function QuickSendModal({
  open,
  onOpenChange,
  customers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
  prefilledCustomer,
}: QuickSendModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send One-Off Request</DialogTitle>
          <DialogDescription>
            For edge cases only. Campaigns handle review requests automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Friction warning banner */}
        <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-bg p-4">
          <Warning className="h-5 w-5 text-warning shrink-0 mt-0.5" weight="fill" />
          <div className="text-sm">
            <p className="font-medium text-warning-foreground">
              Campaigns handle review requests automatically
            </p>
            <p className="mt-1 text-warning">
              Manual sending is for one-off situations. For ongoing follow-up, set up a{' '}
              <Link href="/campaigns" className="underline font-medium hover:text-warning-foreground">
                campaign
              </Link>{' '}instead.
            </p>
          </div>
        </div>

        <QuickSendForm
          customers={customers}
          business={business}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
          prefilledCustomer={prefilledCustomer}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
