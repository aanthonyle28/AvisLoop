import { createClient } from '@/lib/supabase/server'
import type { OnboardingChecklist } from '@/lib/types/database'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'

// Re-export for backwards compatibility
export { CHECKLIST_ITEMS, type ChecklistItemId }

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
  const [jobsResult, completedJobsResult, reviewClicksResult, businessResult] = await Promise.all([
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

    // Count review clicks (funnel success - customer clicked through to Google)
    // This tracks campaign_enrollments stopped with 'review_clicked' reason
    supabase
      .from('campaign_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('stop_reason', 'review_clicked'),

    // Get stored checklist state (for dismissed/collapsed/campaign_reviewed flags)
    supabase
      .from('businesses')
      .select('onboarding_checklist')
      .eq('id', businessId)
      .single(),
  ])

  const jobCount = jobsResult.count ?? 0
  const completedJobCount = completedJobsResult.count ?? 0
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
    campaign_reviewed: storedChecklist?.campaign_reviewed ?? false, // Requires actual /campaigns visit
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
