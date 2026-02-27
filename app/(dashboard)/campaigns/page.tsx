import { getActiveBusiness } from '@/lib/data/active-business'
import { getCampaigns, getCampaignPresets } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { getBusiness } from '@/lib/data/business'
import { getCustomers } from '@/lib/actions/customer'
import { CampaignList } from '@/components/campaigns/campaign-list'
import { CampaignsPageShell } from './campaigns-shell'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Campaigns',
}

export default async function CampaignsPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const businessId = activeBusiness.id

  const [business, campaigns, presets, campaignTemplates, { customers }, monthlyUsage] = await Promise.all([
    getBusiness(businessId),
    getCampaigns(businessId, { includePresets: false }),
    getCampaignPresets(),
    getAvailableTemplates(businessId),
    getCustomers({ limit: 200 }),
    getMonthlyUsage(businessId),
  ])

  if (!business) redirect('/onboarding')

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
