import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCampaign } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { ArrowLeft, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/badge'

interface EditCampaignPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCampaignPageProps) {
  const { id } = await params
  const campaign = await getCampaign(id)
  return {
    title: campaign ? `Edit ${campaign.name}` : 'Campaign Not Found',
  }
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params
  const [campaign, templates] = await Promise.all([
    getCampaign(id),
    getAvailableTemplates(),
  ])

  if (!campaign) {
    notFound()
  }

  if (campaign.is_preset) {
    // Redirect to campaigns page - can't edit presets
    notFound()
  }

  return (
    <div className="container py-6 max-w-3xl">
      <Link
        href={`/campaigns/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Edit Campaign</h1>
          {campaign.personalization_enabled && (
            <Badge variant="secondary" className="gap-1">
              <Sparkle weight="fill" className="h-3 w-3 text-amber-500" />
              AI Personalized
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Configure your automated review request sequence
        </p>
      </div>

      <CampaignForm campaign={campaign} templates={templates} />
    </div>
  )
}
