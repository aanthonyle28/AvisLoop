'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getActiveBusiness } from '@/lib/data/active-business'
import { scheduleSendSchema } from '@/lib/validations/schedule'
import type { ScheduleActionState, ScheduledSend } from '@/lib/types/database'

/**
 * Schedule a review request for future delivery.
 * Validates input, confirms scheduledFor is in the future, inserts scheduled_sends row.
 */
export async function scheduleReviewRequest(
  _prevState: ScheduleActionState | null,
  formData: FormData
): Promise<ScheduleActionState> {
  // Parse contact IDs
  const contactIdsRaw = formData.get('contactIds')
  let contactIds: string[] = []
  try {
    contactIds = JSON.parse(contactIdsRaw as string)
  } catch {
    return { error: 'Invalid contact IDs format' }
  }

  const parsed = scheduleSendSchema.safeParse({
    contactIds,
    templateId: formData.get('templateId') || undefined,
    customSubject: formData.get('customSubject') || undefined,
    scheduledFor: formData.get('scheduledFor'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message || 'Validation failed' }
  }

  const { contactIds: validatedIds, templateId, customSubject, scheduledFor } = parsed.data

  // Validate date is in the future
  const scheduleDate = new Date(scheduledFor)
  if (scheduleDate.getTime() <= Date.now() + 60_000) {
    return { error: 'Scheduled time must be at least 1 minute in the future' }
  }

  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  const supabase = await createClient()

  // Insert scheduled send
  const { data: scheduled, error: insertError } = await supabase
    .from('scheduled_sends')
    .insert({
      business_id: business.id,
      contact_ids: validatedIds,
      template_id: templateId || null,
      custom_subject: customSubject || null,
      scheduled_for: scheduledFor,
      status: 'pending',
    })
    .select('id, scheduled_for')
    .single()

  if (insertError || !scheduled) {
    return { error: 'Failed to create scheduled send' }
  }

  revalidatePath('/scheduled')
  revalidatePath('/campaigns')

  return {
    success: true,
    data: {
      scheduledSendId: scheduled.id,
      scheduledFor: scheduled.scheduled_for,
    },
  }
}

/**
 * Cancel a pending scheduled send.
 * Only allows cancellation if the send is still pending.
 */
export async function cancelScheduledSend(id: string): Promise<{ error?: string; success?: boolean }> {
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  const supabase = await createClient()

  // Update only if pending and belongs to this business
  const { data: updated, error: updateError } = await supabase
    .from('scheduled_sends')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (updateError || !updated) {
    return { error: 'Unable to cancel. The send may have already been processed.' }
  }

  revalidatePath('/scheduled')
  return { success: true }
}

/**
 * Get scheduled sends for the current user's business.
 */
export async function getScheduledSends(): Promise<ScheduledSend[]> {
  const business = await getActiveBusiness()
  if (!business) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('scheduled_sends')
    .select('*')
    .eq('business_id', business.id)
    .order('scheduled_for', { ascending: true })

  return (data as ScheduledSend[]) || []
}

/**
 * Bulk cancel multiple pending scheduled sends.
 * Only cancels sends that are still pending and belong to the authenticated business.
 */
export async function bulkCancelScheduledSends(
  ids: string[]
): Promise<{ error?: string; success?: boolean; count?: number }> {
  // Validate ids array
  if (!ids || ids.length === 0) {
    return { error: 'No scheduled sends selected' }
  }
  if (ids.length > 50) {
    return { error: 'Cannot cancel more than 50 scheduled sends at once' }
  }

  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  const supabase = await createClient()

  // Update only pending sends that belong to this business
  const { data: updated, error: updateError } = await supabase
    .from('scheduled_sends')
    .update({ status: 'cancelled' })
    .in('id', ids)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .select('id')

  if (updateError) {
    return { error: 'Failed to cancel scheduled sends' }
  }

  const count = updated?.length || 0
  if (count === 0) {
    return { error: 'No pending sends were found to cancel' }
  }

  revalidatePath('/scheduled')
  return { success: true, count }
}

/**
 * Bulk reschedule multiple pending scheduled sends to a new date/time.
 * Only reschedules sends that are still pending and belong to the authenticated business.
 */
export async function bulkRescheduleScheduledSends(
  ids: string[],
  newScheduledFor: string
): Promise<{ error?: string; success?: boolean; count?: number }> {
  // Validate ids array
  if (!ids || ids.length === 0) {
    return { error: 'No scheduled sends selected' }
  }
  if (ids.length > 50) {
    return { error: 'Cannot reschedule more than 50 scheduled sends at once' }
  }

  // Validate newScheduledFor is in the future
  const scheduleDate = new Date(newScheduledFor)
  if (scheduleDate.getTime() <= Date.now() + 60_000) {
    return { error: 'New scheduled time must be at least 1 minute in the future' }
  }

  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  const supabase = await createClient()

  // Update only pending sends that belong to this business
  const { data: updated, error: updateError } = await supabase
    .from('scheduled_sends')
    .update({ scheduled_for: newScheduledFor })
    .in('id', ids)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .select('id')

  if (updateError) {
    return { error: 'Failed to reschedule sends' }
  }

  const count = updated?.length || 0
  if (count === 0) {
    return { error: 'No pending sends were found to reschedule' }
  }

  revalidatePath('/scheduled')
  return { success: true, count }
}
