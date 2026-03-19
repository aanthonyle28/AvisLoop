import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Business, WebProject, WebProjectStatus } from '@/lib/types/database'

/**
 * A business enriched with web project data and revision ticket count.
 * Used exclusively by the /clients page (web design CRM).
 */
export interface WebDesignClient extends Business {
  web_project: Pick<WebProject, 'id' | 'project_name' | 'page_count' | 'status' | 'launched_at' | 'portal_token'> | null
  revisions_used_this_month: number
}

/**
 * Return all businesses with client_type 'web_design' or 'both',
 * joined with their web_projects row and a count of revision tickets created
 * in the current calendar month.
 *
 * Returns an empty array if the user is not authenticated.
 */
export async function getWebDesignClients(): Promise<WebDesignClient[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  // Fetch all web design / both businesses, joined with their web project
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*, web_projects(*)')
    .eq('user_id', user.id)
    .in('client_type', ['web_design', 'both'])
    .order('created_at', { ascending: true })

  if (error || !businesses || businesses.length === 0) {
    return []
  }

  const businessIds = businesses.map((b) => b.id)

  // Count revision tickets created in the current UTC calendar month
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const { data: tickets } = await supabase
    .from('project_tickets')
    .select('business_id')
    .in('business_id', businessIds)
    .gte('created_at', startOfMonth.toISOString())

  // Build map of businessId -> revision count
  const revisionCountMap: Record<string, number> = {}
  for (const ticket of tickets ?? []) {
    const bid = ticket.business_id as string
    revisionCountMap[bid] = (revisionCountMap[bid] ?? 0) + 1
  }

  // Attach web_project (first element or null) and revisions_used_this_month
  return businesses.map((business) => {
    const rawProjects = business.web_projects
    const webProjectsArray = Array.isArray(rawProjects) ? rawProjects : rawProjects ? [rawProjects] : []
    const rawProject = webProjectsArray[0] ?? null

    const web_project = rawProject
      ? {
          id: rawProject.id as string,
          project_name: rawProject.project_name as string | null,
          page_count: rawProject.page_count as number | null,
          status: rawProject.status as WebProjectStatus,
          launched_at: rawProject.launched_at as string | null,
          portal_token: rawProject.portal_token as string | null,
        }
      : null

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { web_projects: _wp, ...rest } = business

    return {
      ...(rest as Business),
      web_project,
      revisions_used_this_month: revisionCountMap[business.id] ?? 0,
    }
  })
}

/**
 * Return the total monthly recurring revenue (MRR) for all active web design clients.
 * Sums monthly_fee across businesses with client_type 'web_design' or 'both'
 * where status = 'active'.
 *
 * Returns 0 if not authenticated or no active clients.
 */
export async function getClientMrrSummary(): Promise<number> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return 0
  }

  const { data } = await supabase
    .from('businesses')
    .select('monthly_fee')
    .eq('user_id', user.id)
    .in('client_type', ['web_design', 'both'])
    .eq('status', 'active')

  if (!data) return 0

  return data.reduce((sum, row) => {
    const fee = typeof row.monthly_fee === 'number' ? row.monthly_fee : 0
    return sum + fee
  }, 0)
}
