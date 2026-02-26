'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Megaphone } from '@phosphor-icons/react'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import type { CampaignWithTouches, Customer, Business, MessageTemplate } from '@/lib/types/database'

interface CampaignsPageShellProps {
  hasCampaigns: boolean
  presets: CampaignWithTouches[]
  business: Business & { message_templates?: MessageTemplate[] }
  customers: Customer[]
  sendTemplates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  children: React.ReactNode
}

export function CampaignsPageShell({
  hasCampaigns,
  presets,
  business,
  customers,
  sendTemplates,
  monthlyUsage,
  children,
}: CampaignsPageShellProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [quickSendOpen, setQuickSendOpen] = useState(false)

  const handleOneOff = () => {
    setCreateOpen(false)
    setQuickSendOpen(true)
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Automated review request sequences for completed jobs
          </p>
        </div>

        {hasCampaigns && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        )}
      </div>

      {hasCampaigns ? (
        <div className="space-y-6">
          {children}

          {/* Add another campaign */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            No campaigns yet
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Set up a campaign to automatically request reviews when you complete jobs.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      )}

      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        presets={presets}
        onOneOff={handleOneOff}
      />

      <QuickSendModal
        open={quickSendOpen}
        onOpenChange={setQuickSendOpen}
        customers={customers}
        business={business}
        templates={sendTemplates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={!!business.google_review_link}
      />
    </div>
  )
}
