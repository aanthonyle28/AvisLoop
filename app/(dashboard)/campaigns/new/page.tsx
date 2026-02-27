import Link from 'next/link'
import { Lightbulb, ArrowRight, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getActiveBusiness } from '@/lib/data/active-business'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'New Campaign',
}

export default async function NewCampaignPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const templates = await getAvailableTemplates(activeBusiness.id)

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <Link
        href="/campaigns"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaigns
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Campaign</h1>
        <p className="text-muted-foreground">
          Create an automated review request sequence for completed jobs
        </p>
      </div>

      {/* Preset guidance callout */}
      <div className="mb-8 rounded-lg border border-info-border bg-info-bg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-info shrink-0 mt-0.5" weight="fill" />
          <div className="flex-1">
            <p className="font-medium text-info-foreground">
              New to campaigns? Start with a preset
            </p>
            <p className="mt-1 text-sm text-info">
              Campaign presets are pre-configured sequences optimized for different follow-up styles.
              Choose Gentle, Standard, or Aggressive Follow-Up based on your preference.
            </p>
            <Link
              href="/campaigns#presets"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-info hover:text-info-foreground"
            >
              View presets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <CampaignForm templates={templates} />
    </div>
  )
}
