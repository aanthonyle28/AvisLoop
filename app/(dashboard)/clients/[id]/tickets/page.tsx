import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getActiveBusiness } from '@/lib/data/active-business'
import { createClient } from '@/lib/supabase/server'
import { getProjectTickets, getMonthlyTicketCount } from '@/lib/data/tickets'
import { REVISION_LIMITS, DEFAULT_REVISION_LIMIT } from '@/lib/constants/tickets'
import { TicketsPageClient } from '@/components/tickets/tickets-page-client'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import type { WebProject } from '@/lib/types/database'

interface TicketsPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TicketsPageProps) {
  const { id } = await params
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) return { title: 'Tickets' }

  const supabase = await createClient()
  const { data: project } = await supabase
    .from('web_projects')
    .select('domain')
    .eq('id', id)
    .maybeSingle()

  return {
    title: `Tickets — ${project?.domain ?? 'Project'}`,
  }
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { id } = await params

  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const supabase = await createClient()

  // Verify project belongs to one of the user's businesses (RLS handles ownership)
  const { data: project } = await supabase
    .from('web_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!project) notFound()

  const webProject = project as WebProject
  const businessId = webProject.business_id

  // Determine monthly revision limit from project subscription tier
  const monthlyLimit = webProject.subscription_tier
    ? (REVISION_LIMITS[webProject.subscription_tier] ?? DEFAULT_REVISION_LIMIT)
    : DEFAULT_REVISION_LIMIT

  // Fetch tickets and monthly usage in parallel
  const [tickets, monthlyCount] = await Promise.all([
    getProjectTickets(id, businessId),
    getMonthlyTicketCount(id, businessId),
  ])

  return (
    <div className="container py-6 space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Clients
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {webProject.domain ?? 'Project'} Tickets
        </h1>
        {webProject.client_name && (
          <p className="text-muted-foreground mt-1">{webProject.client_name}</p>
        )}
      </div>

      {/* Client component: ticket list + drawer + new form */}
      <TicketsPageClient
        tickets={tickets}
        projectId={id}
        projectDomain={webProject.domain}
        subscriptionTier={webProject.subscription_tier}
        monthlyCount={monthlyCount}
        monthlyLimit={monthlyLimit}
      />
    </div>
  )
}
