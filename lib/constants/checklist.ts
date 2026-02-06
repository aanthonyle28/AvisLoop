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
