'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { render } from '@react-email/render'
import { resend } from '@/lib/email/resend'
import { ReviewRequestEmail } from '@/lib/email/templates/review-request'
import { checkSendRateLimit } from '@/lib/rate-limit'
import { sendRequestSchema } from '@/lib/validations/send'

// Constants
const COOLDOWN_DAYS = 14
const MONTHLY_LIMITS: Record<string, number> = {
  trial: 25,
  basic: 200,
  pro: 500,
}

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
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, google_review_link, default_sender_name, tier')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  if (!business.google_review_link) {
    return { error: 'Please add your Google review link in settings before sending' }
  }

  // === Get contact ===
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
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
  const monthlyLimit = MONTHLY_LIMITS[business.tier] || MONTHLY_LIMITS.basic
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
      .from('email_templates')
      .select('name, subject, body')
      .eq('id', templateId)
      .eq('business_id', business.id)
      .single()
    template = tpl
  }

  // Use custom subject or template subject or default
  const subject = customSubject || template?.subject || `${business.name} would love your feedback!`

  // === 7. Create send_log (status: 'pending') BEFORE calling API ===
  const { data: sendLog, error: logError } = await supabase
    .from('send_logs')
    .insert({
      business_id: business.id,
      contact_id: contactId,
      template_id: templateId || null,
      status: 'pending',
      subject,
    })
    .select('id')
    .single()

  if (logError || !sendLog) {
    return { error: 'Failed to create send log' }
  }

  // === 8. Render email and send via Resend ===
  const senderName = business.default_sender_name || business.name

  const html = await render(
    ReviewRequestEmail({
      customerName: contact.name,
      businessName: business.name,
      reviewLink: business.google_review_link,
      senderName,
    })
  )

  const { data: emailData, error: emailError } = await resend.emails.send(
    {
      from: `${senderName} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
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
    return { error: `Failed to send email: ${emailError.message}` }
  }

  // === 10. Update contact tracking fields ===
  await supabase
    .from('contacts')
    .update({
      last_sent_at: new Date().toISOString(),
      send_count: (contact.send_count || 0) + 1,
    })
    .eq('id', contactId)

  revalidatePath('/dashboard/contacts')
  revalidatePath('/dashboard/send')

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
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened']) // Only count successful sends

  return { count: count || 0 }
}
