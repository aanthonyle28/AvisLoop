'use client'

import { CampaignCard } from './campaign-card'
import { FirstVisitHint } from '@/components/onboarding/first-visit-hint'
import type { CampaignWithTouches } from '@/lib/types/database'

interface CampaignListProps {
  campaigns: CampaignWithTouches[]
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No campaigns yet
      </div>
    )
  }

  return (
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
              <CampaignCard campaign={campaign} />
            </div>
          </FirstVisitHint>
        ) : (
          <CampaignCard key={campaign.id} campaign={campaign} />
        )
      ))}
    </div>
  )
}
