import Link from 'next/link'
import { Lightbulb, ArrowRight, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { CampaignForm } from '@/components/campaigns/campaign-form'

export const metadata = {
  title: 'New Campaign',
}

export default async function NewCampaignPage() {
  const templates = await getAvailableTemplates()

  return (
    <div className="container py-6 max-w-3xl">
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
      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" weight="fill" />
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-200">
              New to campaigns? Start with a preset
            </p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Campaign presets are pre-configured sequences optimized for different follow-up styles.
              Choose Conservative, Standard, or Aggressive based on your preference.
            </p>
            <Link
              href="/campaigns#presets"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
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
