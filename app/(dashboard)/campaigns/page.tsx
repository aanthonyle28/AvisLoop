import { getCampaigns, getCampaignPresets } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { getCustomers } from '@/lib/actions/customer'
import { getBusiness } from '@/lib/actions/business'
import { markCampaignReviewed } from '@/lib/actions/checklist'
import { CampaignList } from '@/components/campaigns/campaign-list'
import { PresetPicker } from '@/components/campaigns/preset-picker'
import { CampaignsPageClient } from '@/components/campaigns/campaigns-page-client'
import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
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

  const [campaigns, presets, campaignTemplates, { customers }, monthlyUsage] = await Promise.all([
    getCampaigns({ includePresets: false }),
    getCampaignPresets(),
    getAvailableTemplates(),
    getCustomers({ limit: 200 }),
    getMonthlyUsage(),
  ])

  const hasCustomCampaigns = campaigns.length > 0

  // Email-only templates for the QuickSendModal (from business's own templates)
  const sendTemplates = (business.message_templates || []).filter(
    (t: { channel: string }) => t.channel === 'email'
  )

  return (
    <div className="container py-6 space-y-6">
      <CampaignsPageClient
        customers={customers}
        business={business}
        templates={sendTemplates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={!!business.google_review_link}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Campaigns</h1>
            <p className="text-muted-foreground">
              Automated review request sequences for completed jobs
            </p>
          </div>

          {hasCustomCampaigns && (
            <Link href="/campaigns/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          )}
        </div>

        {!hasCustomCampaigns ? (
          // Empty state with preset picker
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 text-center">
              <h2 className="text-lg font-medium mb-2">Get started with a campaign</h2>
              <p className="text-muted-foreground mb-6">
                Choose a preset to automatically send review requests when jobs are completed.
              </p>
              <PresetPicker presets={presets} />
            </div>
          </div>
        ) : (
          // Campaign list
          <div className="space-y-6">
            <CampaignList campaigns={campaigns} templates={campaignTemplates} />

            {/* Show preset picker below list for adding more campaigns */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-medium mb-4">Add another campaign</h3>
              <PresetPicker presets={presets} compact />
            </div>
          </div>
        )}
      </CampaignsPageClient>
    </div>
  )
}
