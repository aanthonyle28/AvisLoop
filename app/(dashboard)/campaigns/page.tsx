import { getCampaigns, getCampaignPresets } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getBusiness } from '@/lib/actions/business'
import { markCampaignReviewed } from '@/lib/actions/checklist'
import { CampaignList } from '@/components/campaigns/campaign-list'
import { CampaignsPageShell } from './campaigns-shell'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Campaigns',
}

export default async function CampaignsPage() {
  // Mark campaign as reviewed for Getting Started checklist (ONB-05)
  // Short-circuits on second+ visit (reads flag, skips write)
  await markCampaignReviewed()

  const business = await getBusiness()
  if (!business) redirect('/onboarding')

  const [campaigns, presets, campaignTemplates] = await Promise.all([
    getCampaigns({ includePresets: false }),
    getCampaignPresets(),
    getAvailableTemplates(),
  ])

  return (
    <CampaignsPageShell
      hasCampaigns={campaigns.length > 0}
      presets={presets}
    >
      <CampaignList
        campaigns={campaigns}
        templates={campaignTemplates}
        enabledServiceTypes={business.service_types_enabled || []}
      />
    </CampaignsPageShell>
  )
}
