import { createClient } from '@/lib/supabase/server'
import type {
  ProjectTicket,
  TicketMessage,
  TicketWithMessages,
  TicketWithContext,
  WebProject,
} from '@/lib/types/database'

export interface TicketFilters {
  status?: string // 'submitted' | 'in_progress' | 'completed' | 'all' | ''
}

/**
 * Get all tickets for a specific project.
 * businessId is required for RLS compliance (denormalized column check).
 * Caller is responsible for providing a verified businessId (ARCH-002 pattern).
 */
export async function getProjectTickets(
  projectId: string,
  businessId: string,
  filters?: TicketFilters
): Promise<ProjectTicket[]> {
  const supabase = await createClient()

  let query = supabase
    .from('project_tickets')
    .select('*')
    .eq('project_id', projectId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getProjectTickets] error:', error)
    return []
  }
  return (data ?? []) as ProjectTicket[]
}

/**
 * Get a single ticket with its full message thread.
 * Both ticket and messages are scoped to businessId for RLS compliance.
 */
export async function getTicketWithMessages(
  ticketId: string,
  businessId: string
): Promise<TicketWithMessages | null> {
  const supabase = await createClient()

  const [ticketResult, messagesResult] = await Promise.all([
    supabase
      .from('project_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('business_id', businessId)
      .single(),
    supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: true }),
  ])

  if (ticketResult.error || !ticketResult.data) return null

  return {
    ticket: ticketResult.data as ProjectTicket,
    messages: (messagesResult.data ?? []) as TicketMessage[],
  }
}

/**
 * Count non-overage tickets submitted this calendar month for a project.
 * Used to show remaining quota in the UI before calling the RPC.
 */
export async function getMonthlyTicketCount(
  projectId: string,
  businessId: string
): Promise<number> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('project_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('business_id', businessId)
    .eq('is_overage', false)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('[getMonthlyTicketCount] error:', error)
    return 0
  }
  return count ?? 0
}

/**
 * Get all tickets across all projects for a user, joined with project and business name.
 * Used in the operator all-tickets view (Plan 73-03).
 * businessIds[] comes from getUserBusinessesWithMetadata() filtered to web_design/both.
 */
export async function getTicketsAcrossAllProjects(
  businessIds: string[],
  filters?: TicketFilters & { businessId?: string }
): Promise<TicketWithContext[]> {
  if (businessIds.length === 0) return []

  const supabase = await createClient()

  let query = supabase
    .from('project_tickets')
    .select(`
      *,
      project:web_projects!project_id(id, domain, subscription_tier),
      business:businesses!business_id(name)
    `)
    .in('business_id', businessIds)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getTicketsAcrossAllProjects] error:', error)
    return []
  }

  // Reshape joined data into TicketWithContext
  type RawRow = ProjectTicket & {
    project: Pick<WebProject, 'id' | 'domain' | 'subscription_tier'> | null
    business: { name: string } | null
  }

  return (data ?? []).map((row: unknown) => {
    const r = row as RawRow
    return {
      ...r,
      project: r.project as Pick<WebProject, 'id' | 'domain' | 'subscription_tier'>,
      business_name: r.business?.name ?? '',
    } as TicketWithContext
  })
}
