import { z } from 'zod'

// Service types as const array for Zod enum
export const SERVICE_TYPES = [
  'hvac',
  'plumbing',
  'electrical',
  'cleaning',
  'roofing',
  'painting',
  'handyman',
  'other',
] as const

// Job statuses as const array - V2 three-state workflow
// scheduled: Job created, work not yet done (no campaign enrollment)
// completed: Work finished, triggers campaign enrollment
// do_not_send: Explicitly blocked from review request
export const JOB_STATUSES = ['scheduled', 'completed', 'do_not_send'] as const

// Display labels for UI (proper casing)
export const SERVICE_TYPE_LABELS: Record<typeof SERVICE_TYPES[number], string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  roofing: 'Roofing',
  painting: 'Painting',
  handyman: 'Handyman',
  other: 'Other',
}

export const JOB_STATUS_LABELS: Record<typeof JOB_STATUSES[number], string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  do_not_send: 'Do Not Send',
}

// Status descriptions for UI tooltips/help text
export const JOB_STATUS_DESCRIPTIONS: Record<typeof JOB_STATUSES[number], string> = {
  scheduled: 'Job created, waiting for technician to complete work',
  completed: 'Work finished — customer will be enrolled in review campaign',
  do_not_send: 'Job complete but no review request will be sent',
}

// Default timing in hours (for campaign first touch)
export const DEFAULT_TIMING_HOURS: Record<typeof SERVICE_TYPES[number], number> = {
  hvac: 24,
  plumbing: 48,
  electrical: 24,
  cleaning: 4,
  roofing: 72,
  painting: 48,
  handyman: 24,
  other: 24,
}

// Job creation/update schema
// V2: Default status is 'scheduled' (work not yet done)
export const jobSchema = z.object({
  customerId: z
    .string()
    .uuid('Please select a valid customer'),
  serviceType: z.enum(SERVICE_TYPES),
  status: z
    .enum(JOB_STATUSES)
    .default('scheduled'),
  notes: z
    .string()
    .max(1000, 'Notes must be under 1000 characters')
    .optional()
    .or(z.literal('')),
  enrollInCampaign: z.boolean().optional().default(true),
})

// Infer types from schema
export type JobInput = z.infer<typeof jobSchema>
export type ServiceTypeValue = typeof SERVICE_TYPES[number]
export type JobStatusValue = typeof JOB_STATUSES[number]
