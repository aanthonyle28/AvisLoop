'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { render } from '@react-email/render'
import { resend, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { ReviewRequestEmail } from '@/lib/email/templates/review-request'
import { checkSendRateLimit } from '@/lib/rate-limit'
import { sendRequestSchema, batchSendSchema } from '@/lib/validations/send'
import { COOLDOWN_DAYS, MONTHLY_SEND_LIMITS } from '@/lib/constants/billing'
import { getActiveBusiness } from '@/lib/data/active-business'
import type { BatchSendActionState } from '@/lib/types/database'

export type SendActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { sendLogId: string }
}

/**
 * Send a review request email to a contact.
 * Implements all business rules: auth, rate limit, cooldown, opt-out, monthly limit.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Rate limit check (per-user)
 * 3. Get business + contact + template
 * 4. Check cooldown (14 days since last send)
 * 5. Check opt-out status
 * 6. Check monthly limit
 * 7. Create send_log (status: 'pending')
 * 8. Send via Resend
 * 9. Update send_log (status: 'sent' or 'failed')
 * 10. Update contact tracking fields
 */
export async function sendReviewRequest(
  _prevState: SendActionState | null,
  formData: FormData
): Promise<SendActionState> {
  const supabase = await createClient()

  // === 1. Authenticate user ===
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to send review requests' }
  }

  // === 2. Rate limit check ===
  const rateLimitResult = await checkSendRateLimit(user.id)
  if (!rateLimitResult.success) {
    return { error: 'Rate limit exceeded. Please wait before sending more emails.' }
  }

  // === Parse and validate input ===
  const isTest = formData.get('isTest') === 'true'

  const parsed = sendRequestSchema.safeParse({
    contactId: formData.get('contactId'),
    templateId: formData.get('templateId') || undefined,
    customSubject: formData.get('customSubject') || undefined,
    customBody: formData.get('customBody') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { contactId, templateId, customSubject } = parsed.data

  // === 3. Get business ===
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  // Fetch additional business fields needed for sending
  const { data: bizData, error: businessError } = await supabase
    .from('businesses')
    .select('name, google_review_link, default_sender_name, tier')
    .eq('id', business.id)
    .single()

  if (businessError || !bizData) {
    return { error: 'Please create a business profile first' }
  }

  // === Get contact ===
  const { data: contact, error: contactError } = await supabase
    .from('customers')
    .select('id, name, email, status, opted_out, last_sent_at, send_count')
    .eq('id', contactId)
    .eq('business_id', business.id) // Security: ensure contact belongs to this business
    .single()

  if (contactError || !contact) {
    return { error: 'Contact not found' }
  }

  // === 4. Check cooldown ===
  if (contact.last_sent_at) {
    const lastSent = new Date(contact.last_sent_at)
    const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)

    if (new Date() < cooldownEnd) {
      const daysRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      return {
        error: `Please wait ${daysRemaining} more day${daysRemaining === 1 ? '' : 's'} before sending to this contact again`
      }
    }
  }

  // === 5. Check opt-out ===
  if (contact.opted_out) {
    return { error: 'This contact has opted out of receiving review requests' }
  }

  if (contact.status === 'archived') {
    return { error: 'Cannot send to archived contacts' }
  }

  // === 6. Check monthly limit ===
  const monthlyLimit = MONTHLY_SEND_LIMITS[bizData.tier] || MONTHLY_SEND_LIMITS.basic
  const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)

  if (monthlyCount >= monthlyLimit) {
    return {
      error: `Monthly send limit reached (${monthlyLimit}). Upgrade your plan for more sends.`
    }
  }

  // === Get template (optional - fall back to default) ===
  let template: { name: string; subject: string; body: string } | null = null

  if (templateId) {
    const { data: tpl } = await supabase
      .from('message_templates')
      .select('name, subject, body')
      .eq('id', templateId)
      .eq('business_id', business.id)
      .eq('channel', 'email')
      .single()
    template = tpl
  }

  // Use custom subject or template subject or default
  const subject = customSubject || template?.subject || `${bizData.name} would love your feedback!`

  // === 7. Create send_log (status: 'pending') BEFORE calling API ===
  const { data: sendLog, error: logError } = await supabase
    .from('send_logs')
    .insert({
      business_id: business.id,
      customer_id: contactId,
      template_id: templateId || null,
      status: 'pending',
      subject,
      is_test: isTest,
    })
    .select('id')
    .single()

  if (logError || !sendLog) {
    return { error: 'Failed to create send log' }
  }

  // === 8. Render email and send via Resend ===
  const senderName = bizData.default_sender_name || bizData.name

  const html = await render(
    ReviewRequestEmail({
      customerName: contact.name,
      businessName: bizData.name,
      reviewLink: bizData.google_review_link || '',
      senderName,
    })
  )

  const { data: emailData, error: emailError } = await resend.emails.send(
    {
      from: `${senderName} <${RESEND_FROM_EMAIL}>`,
      to: contact.email,
      subject,
      html,
      tags: [
        { name: 'send_log_id', value: sendLog.id },
        { name: 'business_id', value: business.id },
      ],
    },
    { idempotencyKey: `send-${sendLog.id}` }
  )

  // === 9. Update send_log with result ===
  await supabase
    .from('send_logs')
    .update({
      status: emailError ? 'failed' : 'sent',
      provider_id: emailData?.id || null,
      error_message: emailError?.message || null,
    })
    .eq('id', sendLog.id)

  if (emailError) {
    console.error('Email send failed:', emailError)
    return { error: 'Failed to send email. Please try again later.' }
  }

  // === 10. Update contact tracking fields ===
  await supabase
    .from('customers')
    .update({
      last_sent_at: new Date().toISOString(),
      send_count: (contact.send_count || 0) + 1,
    })
    .eq('id', contactId)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/contacts')
  revalidatePath('/campaigns')

  return { success: true, data: { sendLogId: sendLog.id } }
}

/**
 * Helper to get monthly send count for a business.
 * Counts sends from the first of the current month.
 */
async function getMonthlyCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<{ count: number }> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('is_test', false) // Exclude test sends from quota
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened']) // Only count successful sends

  return { count: count || 0 }
}

/**
 * Send review requests to multiple contacts in a batch.
 * Validates all contacts, checks quota fits full batch, categorizes eligible/skipped contacts.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Parse and validate input (contactIds array, templateId, customSubject)
 * 3. Get business + tier
 * 4. Check business has google_review_link
 * 5. Check monthly quota (full batch must fit in remaining quota)
 * 6. Fetch all requested contacts in ONE query
 * 7. Categorize contacts: eligible vs skipped (cooldown, opted_out, archived, not_found)
 * 8. Loop through eligible contacts:
 *    - Create send_log (status: 'pending')
 *    - Render and send email via Resend
 *    - Update send_log (status: 'sent' or 'failed')
 *    - Update contact tracking fields
 * 9. Return structured results with sent/skipped/failed counts and details
 *
 * Note: No rate limit applied (batch has its own 25-cap control)
 */
export async function batchSendReviewRequest(
  _prevState: BatchSendActionState | null,
  formData: FormData
): Promise<BatchSendActionState> {
  const supabase = await createClient()

  // === 1. Authenticate user ===
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to send review requests' }
  }

  // === 2. Parse and validate input ===
  const isTest = formData.get('isTest') === 'true'
  const contactIdsRaw = formData.get('contactIds')
  let contactIds: string[] = []

  try {
    contactIds = JSON.parse(contactIdsRaw as string)
  } catch {
    return { error: 'Invalid contact IDs format' }
  }

  const parsed = batchSendSchema.safeParse({
    contactIds,
    templateId: formData.get('templateId') || undefined,
    customSubject: formData.get('customSubject') || undefined,
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message || 'Validation failed' }
  }

  const { contactIds: validatedContactIds, templateId, customSubject } = parsed.data

  // === 3. Get business ===
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  const { data: bizData, error: businessError } = await supabase
    .from('businesses')
    .select('name, google_review_link, default_sender_name, tier')
    .eq('id', business.id)
    .single()

  if (businessError || !bizData) {
    return { error: 'Please create a business profile first' }
  }

  // === 4. Check monthly quota (full batch must fit) ===
  const monthlyLimit = MONTHLY_SEND_LIMITS[bizData.tier] || MONTHLY_SEND_LIMITS.basic
  const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)
  const remainingQuota = monthlyLimit - monthlyCount

  if (validatedContactIds.length > remainingQuota) {
    return {
      error: `Insufficient quota. You have ${remainingQuota} sends remaining this month. Batch requires ${validatedContactIds.length} sends.`
    }
  }

  // === 6. Fetch all requested contacts in ONE query ===
  const { data: contacts, error: contactsError } = await supabase
    .from('customers')
    .select('id, name, email, status, opted_out, last_sent_at, send_count')
    .in('id', validatedContactIds)
    .eq('business_id', business.id)

  if (contactsError) {
    return { error: 'Failed to fetch contacts' }
  }

  // === 7. Categorize contacts: eligible vs skipped ===
  const cooldownDate = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
  const contactMap = new Map(contacts.map(c => [c.id, c]))

  const eligible: typeof contacts = []
  const skipped: Array<{ contactId: string; contactName: string; reason: string }> = []

  for (const contactId of validatedContactIds) {
    const contact = contactMap.get(contactId)

    if (!contact) {
      skipped.push({
        contactId,
        contactName: 'Unknown',
        reason: 'not_found'
      })
      continue
    }

    // Check eligibility
    if (contact.status === 'archived') {
      skipped.push({
        contactId: contact.id,
        contactName: contact.name,
        reason: 'archived'
      })
      continue
    }

    if (contact.opted_out) {
      skipped.push({
        contactId: contact.id,
        contactName: contact.name,
        reason: 'opted_out'
      })
      continue
    }

    if (contact.last_sent_at && new Date(contact.last_sent_at) > cooldownDate) {
      skipped.push({
        contactId: contact.id,
        contactName: contact.name,
        reason: 'cooldown'
      })
      continue
    }

    // Contact is eligible
    eligible.push(contact)
  }

  // === Get template (optional - fall back to default) ===
  let template: { name: string; subject: string; body: string } | null = null

  if (templateId) {
    const { data: tpl } = await supabase
      .from('message_templates')
      .select('name, subject, body')
      .eq('id', templateId)
      .eq('business_id', business.id)
      .eq('channel', 'email')
      .single()
    template = tpl
  }

  const defaultSubject = customSubject || template?.subject || `${bizData.name} would love your feedback!`
  const senderName = bizData.default_sender_name || bizData.name

  // === 8. Loop through eligible contacts and send ===
  const results: Array<{
    contactId: string
    contactName: string
    status: 'sent' | 'failed'
    reason?: string
  }> = []

  for (const contact of eligible) {
    try {
      // Create send_log (status: 'pending')
      const { data: sendLog, error: logError } = await supabase
        .from('send_logs')
        .insert({
          business_id: business.id,
          customer_id: contact.id,
          template_id: templateId || null,
          status: 'pending',
          subject: defaultSubject,
          is_test: isTest,
        })
        .select('id')
        .single()

      if (logError || !sendLog) {
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          status: 'failed',
          reason: 'log_creation_failed'
        })
        continue
      }

      // Render email
      const html = await render(
        ReviewRequestEmail({
          customerName: contact.name,
          businessName: bizData.name,
          reviewLink: bizData.google_review_link || '',
          senderName,
        })
      )

      // Send via Resend
      const { data: emailData, error: emailError } = await resend.emails.send(
        {
          from: `${senderName} <${RESEND_FROM_EMAIL}>`,
          to: contact.email,
          subject: defaultSubject,
          html,
          tags: [
            { name: 'send_log_id', value: sendLog.id },
            { name: 'business_id', value: business.id },
          ],
        },
        { idempotencyKey: `send-${sendLog.id}` }
      )

      // Update send_log with result
      await supabase
        .from('send_logs')
        .update({
          status: emailError ? 'failed' : 'sent',
          provider_id: emailData?.id || null,
          error_message: emailError?.message || null,
        })
        .eq('id', sendLog.id)

      if (emailError) {
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          status: 'failed',
          reason: emailError.message
        })
        continue
      }

      // Update contact tracking fields
      await supabase
        .from('customers')
        .update({
          last_sent_at: new Date().toISOString(),
          send_count: (contact.send_count || 0) + 1,
        })
        .eq('id', contact.id)

      results.push({
        contactId: contact.id,
        contactName: contact.name,
        status: 'sent'
      })
    } catch (error) {
      results.push({
        contactId: contact.id,
        contactName: contact.name,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown_error'
      })
    }
  }

  // === 9. Build structured response ===
  const sent = results.filter(r => r.status === 'sent').length
  const failed = results.filter(r => r.status === 'failed').length

  const details = [
    ...results.map(r => ({
      contactId: r.contactId,
      contactName: r.contactName,
      status: r.status as 'sent' | 'failed',
      reason: r.reason
    })),
    ...skipped.map(s => ({
      contactId: s.contactId,
      contactName: s.contactName,
      status: 'skipped' as const,
      reason: s.reason
    }))
  ]

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/contacts')
  revalidatePath('/campaigns')

  return {
    success: true,
    data: {
      sent,
      skipped: skipped.length,
      failed,
      details
    }
  }
}
