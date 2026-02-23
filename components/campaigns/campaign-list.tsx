'use client'

import { useState } from 'react'
import { CampaignCard } from './campaign-card'
import { CampaignForm } from './campaign-form'
import { FirstVisitHint } from '@/components/onboarding/first-visit-hint'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { CampaignWithTouches, MessageTemplate } from '@/lib/types/database'

interface CampaignListProps {
  campaigns: CampaignWithTouches[]
  templates: MessageTemplate[]
}

export function CampaignList({ campaigns, templates }: CampaignListProps) {
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)

  const editingCampaign = editingCampaignId
    ? campaigns.find(c => c.id === editingCampaignId) || null
    : null

  if (campaigns.length === 0) return null

  return (
    <>
      <div className="space-y-4">
        {campaigns.map((campaign, index) => (
          index === 0 ? (
            <FirstVisitHint
              key={campaign.id}
              hintId="campaigns-overview"
              title="Review your campaign settings"
              description="Campaigns run automatically when jobs are completed. Check your timing and message sequence to match your business."
              side="bottom"
            >
              <div>
                <CampaignCard
                  campaign={campaign}
                  onEdit={(id) => setEditingCampaignId(id)}
                />
              </div>
            </FirstVisitHint>
          ) : (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={(id) => setEditingCampaignId(id)}
            />
          )
        ))}
      </div>

      {/* Edit Campaign Sheet */}
      <Sheet
        open={!!editingCampaign}
        onOpenChange={(open) => !open && setEditingCampaignId(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Edit Campaign</SheetTitle>
            <SheetDescription>
              Update your campaign settings and touch sequence
            </SheetDescription>
          </SheetHeader>
          {editingCampaign && (
            <div className="mt-6">
              <CampaignForm
                campaign={editingCampaign}
                templates={templates}
                onSuccess={() => setEditingCampaignId(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
