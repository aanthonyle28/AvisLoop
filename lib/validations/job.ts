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

// Job statuses as const array
export const JOB_STATUSES = ['completed', 'do_not_send'] as const

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
  completed: 'Completed',
  do_not_send: 'Do Not Send',
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
export const jobSchema = z.object({
  customerId: z
    .string()
    .uuid('Please select a valid customer'),
  serviceType: z.enum(SERVICE_TYPES),
  status: z
    .enum(JOB_STATUSES)
    .default('completed'),
  notes: z
    .string()
    .max(1000, 'Notes must be under 1000 characters')
    .optional()
    .or(z.literal('')),
})

// Infer types from schema
export type JobInput = z.infer<typeof jobSchema>
export type ServiceTypeValue = typeof SERVICE_TYPES[number]
export type JobStatusValue = typeof JOB_STATUSES[number]
