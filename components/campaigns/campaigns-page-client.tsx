'use client'

import { useState } from 'react'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import type { Customer, Business, MessageTemplate } from '@/lib/types/database'

interface CampaignsPageClientProps {
  children: React.ReactNode
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
}

export function CampaignsPageClient({
  children,
  customers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
}: CampaignsPageClientProps) {
  const [quickSendOpen, setQuickSendOpen] = useState(false)

  return (
    <>
      {children}

      {/* Send one-off button -- positioned at page bottom */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickSendOpen(true)}
        >
          <PaperPlaneTilt className="mr-2 h-4 w-4" />
          Send one-off request
        </Button>
      </div>

      <QuickSendModal
        open={quickSendOpen}
        onOpenChange={setQuickSendOpen}
        customers={customers}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={hasReviewLink}
      />
    </>
  )
}
