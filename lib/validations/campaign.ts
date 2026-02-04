import { z } from 'zod'

// Service type enum matching database constraint
const serviceTypeEnum = z.enum(['hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other'])

// Campaign status
const campaignStatusEnum = z.enum(['active', 'paused'])

// Message channel
const channelEnum = z.enum(['email', 'sms'])

// Campaign creation/update schema
export const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  service_type: serviceTypeEnum.nullable(),  // NULL = all services
  status: campaignStatusEnum,  // Required, form provides default
  personalization_enabled: z.boolean(),  // AI personalization toggle (default true via form)
})

export type CampaignFormData = z.infer<typeof campaignSchema>

// Single touch configuration
export const campaignTouchSchema = z.object({
  touch_number: z.number().min(1).max(4),
  channel: channelEnum,
  delay_hours: z.number().min(1, 'Minimum 1 hour delay').max(720, 'Maximum 30 days'),  // 720 hours = 30 days
  template_id: z.string().uuid().nullable(),
})

export type CampaignTouchFormData = z.infer<typeof campaignTouchSchema>

// Full campaign with touches for form submission
export const campaignWithTouchesSchema = campaignSchema.extend({
  touches: z.array(campaignTouchSchema)
    .min(1, 'At least one touch required')
    .max(4, 'Maximum 4 touches allowed')
    .refine(
      (touches) => {
        // Verify touch numbers are sequential starting from 1
        const numbers = touches.map(t => t.touch_number).sort((a, b) => a - b)
        return numbers.every((n, i) => n === i + 1)
      },
      { message: 'Touch numbers must be sequential (1, 2, 3, 4)' }
    ),
})

export type CampaignWithTouchesFormData = z.infer<typeof campaignWithTouchesSchema>

// Enrollment stop reason
const stopReasonEnum = z.enum([
  'review_clicked',
  'feedback_submitted',
  'opted_out_sms',
  'opted_out_email',
  'owner_stopped',
  'campaign_paused',
  'campaign_deleted',
  'repeat_job',
])

// Enrollment update (for stopping)
export const enrollmentUpdateSchema = z.object({
  status: z.enum(['stopped']),
  stop_reason: stopReasonEnum,
})

export type EnrollmentUpdateData = z.infer<typeof enrollmentUpdateSchema>
