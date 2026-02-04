'use client'

import { CampaignCard } from './campaign-card'
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
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}
