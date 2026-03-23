import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// ─────────────────────────────────────────────────────────────────────────────
// Portal-specific types (subset of WebProject / ProjectTicket for public view)
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalProject {
  id: string
  business_id: string
  domain: string | null
  client_name: string | null
  subscription_tier: string | null
  status: string
}

export interface PortalQuota {
  used: number
  limit: number
  remaining: number
}

export interface PortalTicketMessage {
  id: string
  author_type: 'agency' | 'client'
  author_name: string | null
  body: string
  attachment_urls: string[] | null
  created_at: string
}

export interface PortalTicket {
  id: string
  title: string
  description: string | null
  status: string
  source: string
  created_at: string
  updated_at: string
  ticket_messages: PortalTicketMessage[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Data functions — all use service-role (no auth context on public portal)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a web_projects row by its portal_token.
 * Uses service-role to bypass RLS on a public (unauthenticated) route.
 * Returns null if no matching project — caller should call notFound().
 */
export async function resolvePortalToken(token: string): Promise<PortalProject | null> {
  const supabase = createServiceRoleClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('web_projects')
    .select('id, business_id, domain, client_name, subscription_tier, status')
    .eq('portal_token', token)
    .single()

  if (error || !data) return null

  return data as PortalProject
}

/**
 * Count revision tickets submitted in the current calendar month for a project
 * and return quota details based on the subscription tier.
 *
 * Tier limits:
 *   starter  → 2 revisions/month
 *   growth   → Unlimited (represented as -1)
 *   pro      → Unlimited (represented as -1)
 *   unknown  → 2 (fail-safe default)
 */
export async function getPortalQuota(
  projectId: string,
  tier: string | null
): Promise<PortalQuota> {
  const supabase = createServiceRoleClient()

  // Growth and Pro have unlimited revisions
  const isUnlimited = tier === 'growth' || tier === 'pro'

  const startOfCurrentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('project_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', startOfCurrentMonth.toISOString())

  const used = error ? 0 : (count ?? 0)

  if (isUnlimited) {
    // -1 signals unlimited to the UI
    return { used, limit: -1, remaining: -1 }
  }

  const limit = 2 // starter and unknown default
  const remaining = Math.max(0, limit - used)

  return { used, limit, remaining }
}

/**
 * Get all tickets for a project with their message threads.
 * Ordered most-recent first; messages ordered chronologically within each ticket.
 * Returns empty array on error — never throws.
 */
export async function getPortalTickets(projectId: string): Promise<PortalTicket[]> {
  const supabase = createServiceRoleClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('project_tickets')
    .select(
      'id, title, description, status, source, created_at, updated_at, ticket_messages(id, author_type, author_name, body, attachment_urls, created_at)'
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: true, referencedTable: 'ticket_messages' })

  if (error) {
    console.error('[getPortalTickets] error:', error)
    return []
  }

  // Generate signed read URLs for attachment storage paths
  const tickets = (data ?? []) as PortalTicket[]
  for (const ticket of tickets) {
    for (const msg of ticket.ticket_messages) {
      if (msg.attachment_urls?.length) {
        const signedUrls: string[] = []
        for (const path of msg.attachment_urls) {
          if (path.startsWith('http')) {
            signedUrls.push(path)
          } else {
            const { data: urlData } = await supabase.storage
              .from('revision-attachments')
              .createSignedUrl(path, 60 * 60) // 1 hour
            signedUrls.push(urlData?.signedUrl ?? path)
          }
        }
        msg.attachment_urls = signedUrls
      }
    }
  }

  return tickets
}
