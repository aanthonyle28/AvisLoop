import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolvePortalToken, getPortalQuota, getPortalTickets } from '@/lib/data/portal'
import { ClientPortal } from './client-portal'

interface Props {
  params: Promise<{ token: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Client Portal',
    robots: 'noindex, nofollow',
  }
}

/**
 * Public client portal page — no authentication required.
 *
 * Flow:
 * 1. Resolve web_projects row from portal_token (service-role, bypasses RLS)
 * 2. Fetch quota and ticket history in parallel
 * 3. Render ClientPortal with all data as props
 *
 * /portal/* is intentionally NOT in middleware APP_ROUTES — it stays public.
 */
export default async function PortalPage({ params }: Props) {
  const { token } = await params

  // Resolve project via portal_token (service-role inside resolvePortalToken)
  const project = await resolvePortalToken(token)
  if (!project) notFound()

  // Fetch quota and tickets in parallel
  const [quota, tickets] = await Promise.all([
    getPortalQuota(project.id, project.subscription_tier),
    getPortalTickets(project.id),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ClientPortal
        token={token}
        project={project}
        quota={quota}
        initialTickets={tickets}
      />
    </div>
  )
}
