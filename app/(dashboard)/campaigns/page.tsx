import { getCampaigns, getCampaignPresets } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { getCustomers } from '@/lib/actions/customer'
import { getBusiness } from '@/lib/actions/business'
import { CampaignList } from '@/components/campaigns/campaign-list'
import { CampaignsPageShell } from './campaigns-shell'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Campaigns',
}

export default async function CampaignsPage() {
  const business = await getBusiness()
  if (!business) redirect('/onboarding')

  const [campaigns, presets, campaignTemplates, { customers }, monthlyUsage] = await Promise.all([
    getCampaigns({ includePresets: false }),
    getCampaignPresets(),
    getAvailableTemplates(),
    getCustomers({ limit: 200 }),
    getMonthlyUsage(),
  ])

  // Email-only templates for the QuickSendModal
  const sendTemplates = (business.message_templates || []).filter(
    (t: { channel: string }) => t.channel === 'email'
  )

  return (
    <CampaignsPageShell
      hasCampaigns={campaigns.length > 0}
      presets={presets}
      business={business}
      customers={customers}
      sendTemplates={sendTemplates}
      monthlyUsage={monthlyUsage}
    >
      <CampaignList
        campaigns={campaigns}
        templates={campaignTemplates}
      />
    </CampaignsPageShell>
  )
}
