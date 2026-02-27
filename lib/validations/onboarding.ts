import { z } from 'zod'
import { SERVICE_TYPES } from './job'

// Step 1: Business Basics (required)
export const businessBasicsSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100).trim(),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
})

// Step 2: Review Destination (skippable)
export const reviewDestinationSchema = z.object({
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      (val) => !val || val.includes('google'),
      'Must be a Google review URL'
    )
    .optional()
    .or(z.literal('')),
})

// Step 3: Services Offered (required)
export const servicesOfferedSchema = z.object({
  serviceTypes: z.array(z.enum(SERVICE_TYPES)).min(1, 'Select at least one service type'),
  customServiceNames: z.array(
    z.string().min(1).max(50).trim()
  ).max(10).optional().default([]),
})

// Step 4 (legacy): Software Used (skippable) — kept for backward compatibility
export const SOFTWARE_OPTIONS = [
  { value: 'servicetitan', label: 'ServiceTitan' },
  { value: 'jobber', label: 'Jobber' },
  { value: 'housecall_pro', label: 'Housecall Pro' },
  { value: 'none', label: 'None / Other' },
] as const

// Step 3 (v2 wizard): CRM Platform selection — logo card options
export const CRM_PLATFORMS = [
  { value: 'jobber', label: 'Jobber', abbr: 'JB', color: 'bg-emerald-500' },
  { value: 'housecall_pro', label: 'Housecall Pro', abbr: 'HC', color: 'bg-blue-500' },
  { value: 'servicetitan', label: 'ServiceTitan', abbr: 'ST', color: 'bg-red-500' },
  { value: 'gorilladesk', label: 'GorillaDesk', abbr: 'GD', color: 'bg-orange-500' },
  { value: 'fieldpulse', label: 'FieldPulse', abbr: 'FP', color: 'bg-violet-500' },
] as const

export const CRM_SPECIAL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'other', label: 'Other' },
] as const

export const softwareUsedSchema = z.object({
  softwareUsed: z.string().max(100).optional().or(z.literal('')),
})

// Step 7: SMS Consent (required)
export const smsConsentSchema = z.object({
  acknowledged: z.literal(true, {
    message: 'You must acknowledge SMS consent requirements',
  }),
})

// Type exports
export type BusinessBasicsInput = z.infer<typeof businessBasicsSchema>
export type ReviewDestinationInput = z.infer<typeof reviewDestinationSchema>
export type ServicesOfferedInput = z.infer<typeof servicesOfferedSchema>
export type SoftwareUsedInput = z.infer<typeof softwareUsedSchema>
export type SMSConsentInput = z.infer<typeof smsConsentSchema>
