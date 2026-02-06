import { createClient } from '@/lib/supabase/server'
import type { OnboardingChecklist } from '@/lib/types/database'

/**
 * Checklist items definition - V2 aligned
 * DO NOT add customer-related items (V1 pattern)
 *
 * Updated 2026-02-06: Changed "Set up campaign" to "Review your campaign"
 * since users already pick preset during onboarding. Changed to track actual
 * review clicks (funnel success) via campaign_enrollments.stop_reason.
 */
export const CHECKLIST_ITEMS = [
  {
    id: 'first_job_added' as const,
    title: 'Add your first job',
    description: 'Log a job to start collecting reviews',
    href: '/jobs?action=add',
    cta: 'Add Job',
  },
  {
    id: 'campaign_reviewed' as const,
    title: 'Review your campaign',
    description: 'Check your timing and message sequence',
    href: '/campaigns',
    cta: 'View Campaign',
  },
  {
    id: 'job_completed' as const,
    title: 'Complete a job',
    description: 'Mark a job as completed to trigger automation',
    href: '/jobs',
    cta: 'View Jobs',
  },
  {
    id: 'first_review_click' as const,
    title: 'Get your first review click',
    description: 'A customer clicked through to leave a review',
    href: '/analytics',
    cta: 'View Analytics',
    // Detection: campaign_enrollments.stop_reason = 'review_clicked' > 0
    // This is actual funnel success - customer went to Google
  },
] as const

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]['id']

/**
 * Compute checklist state by querying actual data
 * More reliable than manual tracking - reflects real state
 */
export async function getChecklistState(businessId: string): Promise<{
  items: Record<ChecklistItemId, boolean>
  dismissed: boolean
  dismissedAt: string | null
  collapsed: boolean
  firstSeenAt: string | null
  allComplete: boolean
  completedCount: number
}> {
  const supabase = await createClient()

  // Parallel fetch all counts needed
  const [jobsResult, completedJobsResult, campaignsResult, reviewClicksResult, businessResult] = await Promise.all([
    // Count all jobs
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),

    // Count completed jobs
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'completed'),

    // Count active campaigns
    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'active'),

    // Count review clicks (funnel success - customer clicked through to Google)
    // This tracks campaign_enrollments stopped with 'review_clicked' reason
    supabase
      .from('campaign_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('stop_reason', 'review_clicked'),

    // Get stored checklist state (for dismissed/collapsed flags)
    supabase
      .from('businesses')
      .select('onboarding_checklist')
      .eq('id', businessId)
      .single(),
  ])

  const jobCount = jobsResult.count ?? 0
  const completedJobCount = completedJobsResult.count ?? 0
  const campaignCount = campaignsResult.count ?? 0
  const reviewClickCount = reviewClicksResult.count ?? 0

  // Parse stored checklist state
  const storedChecklist = businessResult.data?.onboarding_checklist as OnboardingChecklist | null
  const dismissed = storedChecklist?.dismissed ?? false
  const dismissedAt = storedChecklist?.dismissed_at ?? null
  const collapsed = storedChecklist?.collapsed ?? false
  const firstSeenAt = storedChecklist?.first_seen_at ?? null

  // Compute item completion from actual data
  const items: Record<ChecklistItemId, boolean> = {
    first_job_added: jobCount > 0,
    campaign_reviewed: campaignCount > 0, // Has active campaign (from onboarding preset)
    job_completed: completedJobCount > 0,
    first_review_click: reviewClickCount > 0, // Actual funnel success
  }

  const completedCount = Object.values(items).filter(Boolean).length
  const allComplete = completedCount === CHECKLIST_ITEMS.length

  return {
    items,
    dismissed,
    dismissedAt,
    collapsed,
    firstSeenAt,
    allComplete,
    completedCount,
  }
}
