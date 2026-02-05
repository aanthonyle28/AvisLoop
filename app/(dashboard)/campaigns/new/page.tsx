import Link from 'next/link'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'New Campaign | AvisLoop',
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

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">New Campaign</h1>
        <p className="text-muted-foreground">
          Create an automated review request sequence for completed jobs
        </p>
      </div>

      <CampaignForm templates={templates} />
    </div>
  )
}
