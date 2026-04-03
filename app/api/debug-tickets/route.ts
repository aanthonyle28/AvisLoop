import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { getActiveBusiness } from '@/lib/data/active-business'

/**
 * Diagnostic endpoint for Tickets page crash. DELETE after debugging.
 *
 * Hit this after Google OAuth login when tickets exist:
 *   /api/debug-tickets?key=avisloop-debug-2026
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== 'avisloop-debug-2026') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // Step 1: Auth
  try {
    const user = await getAuthUser()
    results.auth = user ? { id: user.id, email: user.email } : null
  } catch (e) {
    results.auth = { error: String(e) }
  }

  // Step 2: Active business
  try {
    const biz = await getActiveBusiness()
    results.activeBusiness = biz ? { id: biz.id, name: biz.name, client_type: biz.client_type } : null
  } catch (e) {
    results.activeBusiness = { error: String(e) }
  }

  if (!results.activeBusiness || (results.activeBusiness as { error?: string }).error) {
    return NextResponse.json(results)
  }

  const businessId = (results.activeBusiness as { id: string }).id

  // Step 3: Web projects for this business
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('web_projects')
      .select('id, domain, portal_token, subscription_tier, business_id')
      .eq('business_id', businessId)
    results.webProjects = { data, error: error?.message ?? null }
  } catch (e) {
    results.webProjects = { error: String(e) }
  }

  // Step 4: Raw tickets query (no joins)
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase
      .from('project_tickets')
      .select('id, title, status, priority, source, project_id, business_id, created_at, is_overage', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5)
    results.rawTickets = { count, data, error: error?.message ?? null }
  } catch (e) {
    results.rawTickets = { error: String(e) }
  }

  // Step 5: Joined tickets query (same as getTicketsAcrossAllProjects)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('project_tickets')
      .select(`
        *,
        project:web_projects!project_id(id, domain, subscription_tier),
        business:businesses!business_id(name)
      `)
      .in('business_id', [businessId])
      .order('created_at', { ascending: false })
      .limit(5)
    results.joinedTickets = {
      count: data?.length ?? 0,
      firstRow: data?.[0] ? JSON.parse(JSON.stringify(data[0])) : null,
      error: error?.message ?? null,
    }
  } catch (e) {
    results.joinedTickets = { error: String(e) }
  }

  // Step 6: Try the exact function the page uses
  try {
    const { getTicketsAcrossAllProjects } = await import('@/lib/data/tickets')
    const tickets = await getTicketsAcrossAllProjects([businessId])
    results.getTicketsAcrossAllProjects = {
      count: tickets.length,
      firstTicket: tickets[0] ? {
        id: tickets[0].id,
        title: tickets[0].title,
        status: tickets[0].status,
        business_name: tickets[0].business_name,
        project: tickets[0].project,
        source: tickets[0].source,
      } : null,
    }
  } catch (e) {
    results.getTicketsAcrossAllProjects = { error: String(e) }
  }

  return NextResponse.json(results, { status: 200 })
}
