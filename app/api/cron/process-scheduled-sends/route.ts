import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { resend, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { ReviewRequestEmail } from '@/lib/email/templates/review-request'
import { render } from '@react-email/render'
import { COOLDOWN_DAYS, MONTHLY_SEND_LIMITS } from '@/lib/constants/billing'
import type { ScheduledSend } from '@/lib/types/database'

/**
 * Cron endpoint for processing scheduled sends.
 * Invoked by Vercel Cron every minute.
 *
 * Flow:
 * 1. Authenticate via CRON_SECRET header
 * 2. Atomically claim due scheduled sends via RPC (race-safe)
 * 3. For each claimed scheduled send:
 *    - Fetch business data
 *    - Check monthly quota
 *    - Fetch all contacts in one query
 *    - Re-validate each contact (cooldown, opt-out, archived)
 *    - Send emails via Resend
 *    - Update send_log and contact records
 *    - Update scheduled_send status
 * 4. Return structured JSON with counts
 */
export async function GET(request: Request) {
  // === 1. Authenticate via CRON_SECRET ===
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set')
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  const expectedAuth = `Bearer ${cronSecret}`
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    // === 1b. Recover stuck "processing" records (stale > 10 min) ===
    const { data: recovered } = await supabase.rpc('recover_stuck_scheduled_sends', { stale_minutes: 10 })
    if (recovered && (recovered as unknown[]).length > 0) {
      console.warn(`Recovered ${(recovered as unknown[]).length} stuck scheduled sends`)
    }

    // === 2. Atomically claim due scheduled sends via RPC ===
    const { data: claimedSends, error: claimError } = await supabase
      .rpc('claim_due_scheduled_sends', { limit_count: 50 })

    if (claimError) {
      console.error('Failed to claim scheduled sends:', claimError)
      return NextResponse.json({
        ok: false,
        error: 'Failed to claim scheduled sends',
      }, { status: 500 })
    }

    // If no sends to process, return early
    if (!claimedSends || claimedSends.length === 0) {
      return NextResponse.json({
        ok: true,
        timestamp: new Date().toISOString(),
        claimed: 0,
        results: { processed: 0, sent: 0, failed: 0, skipped: 0 }
      })
    }

    // === 3. Process each claimed scheduled send ===
    let totalProcessed = 0
    let totalSent = 0
    let totalFailed = 0
    let totalSkipped = 0

    for (const scheduledSend of claimedSends as ScheduledSend[]) {
      try {
        totalProcessed++

        // === 3a. Fetch business data ===
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, google_review_link, default_sender_name, tier')
          .eq('id', scheduledSend.business_id)
          .single()

        if (businessError || !business) {
          await updateScheduledSendFailed(supabase, scheduledSend.id, 'Business not found')
          totalFailed++
          continue
        }

        if (!business.google_review_link) {
          await updateScheduledSendFailed(supabase, scheduledSend.id, 'Business missing google_review_link')
          totalFailed++
          continue
        }

        // === 3b. Check monthly quota ===
        const monthlyLimit = MONTHLY_SEND_LIMITS[business.tier] || MONTHLY_SEND_LIMITS.basic
        const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)

        const remainingQuota = monthlyLimit - (monthlyCount || 0)
        if (remainingQuota <= 0) {
          await updateScheduledSendFailed(supabase, scheduledSend.id, 'Monthly quota exceeded')
          totalFailed++
          continue
        }

        // === 3c. Fetch all contacts in one query ===
        const { data: contacts, error: contactsError } = await supabase
          .from('customers')
          .select('id, name, email, status, opted_out, last_sent_at, send_count')
          .in('id', scheduledSend.contact_ids)
          .eq('business_id', scheduledSend.business_id)

        if (contactsError) {
          await updateScheduledSendFailed(supabase, scheduledSend.id, `Failed to fetch contacts: ${contactsError.message}`)
          totalFailed++
          continue
        }

        const contactsMap = new Map(contacts?.map(c => [c.id, c]) || [])

        // === 3d. Re-validate each contact and categorize ===
        type PartialContact = {
          id: string
          name: string
          email: string
          status: string
          opted_out: boolean
          last_sent_at: string | null
          send_count: number
        }
        const eligibleContacts: PartialContact[] = []
        const skippedReasons: Record<string, string> = {}

        for (const contactId of scheduledSend.contact_ids) {
          const contact = contactsMap.get(contactId)

          if (!contact) {
            skippedReasons[contactId] = 'not_found'
            totalSkipped++
            continue
          }

          if (contact.status === 'archived') {
            skippedReasons[contactId] = 'archived'
            totalSkipped++
            continue
          }

          if (contact.opted_out) {
            skippedReasons[contactId] = 'opted_out'
            totalSkipped++
            continue
          }

          // Check cooldown
          if (contact.last_sent_at) {
            const lastSent = new Date(contact.last_sent_at)
            const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
            if (new Date() < cooldownEnd) {
              skippedReasons[contactId] = 'cooldown'
              totalSkipped++
              continue
            }
          }

          eligibleContacts.push(contact)
        }

        // === 3e. Fetch template if specified ===
        let template: { name: string; subject: string; body: string } | null = null

        if (scheduledSend.template_id) {
          const { data: tpl } = await supabase
            .from('message_templates')
            .select('name, subject, body')
            .eq('id', scheduledSend.template_id)
            .eq('business_id', scheduledSend.business_id)
            .eq('channel', 'email')
            .single()
          template = tpl
        }

        // Determine subject
        const subject = scheduledSend.custom_subject || template?.subject || `${business.name} would love your feedback!`
        const senderName = business.default_sender_name || business.name

        // === 3f. Send emails to eligible contacts ===
        const sendLogIds: string[] = []
        let sentCount = 0
        let failedCount = 0

        let runningMonthlyCount = monthlyCount || 0

        for (const contact of eligibleContacts) {
          // Check if we've hit quota (in case batch spans quota boundary)
          if (runningMonthlyCount >= monthlyLimit) {
            skippedReasons[contact.id] = 'quota_exceeded_during_batch'
            totalSkipped++
            continue
          }

          try {
            // Create send_log
            const { data: sendLog, error: logError } = await supabase
              .from('send_logs')
              .insert({
                business_id: business.id,
                customer_id: contact.id,
                template_id: scheduledSend.template_id || null,
                status: 'pending' as const,
                subject,
              })
              .select('id')
              .single()

            if (logError || !sendLog) {
              failedCount++
              totalFailed++
              continue
            }

            sendLogIds.push(sendLog.id)

            // Render and send email
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
                from: `${senderName} <${RESEND_FROM_EMAIL}>`,
                to: contact.email,
                subject,
                html,
                tags: [
                  { name: 'send_log_id', value: sendLog.id },
                  { name: 'business_id', value: business.id },
                  { name: 'scheduled_send_id', value: scheduledSend.id },
                ],
              },
              { idempotencyKey: `scheduled-send-${scheduledSend.id}-${sendLog.id}` }
            )

            // Update send_log with result
            await supabase
              .from('send_logs')
              .update({
                status: emailError ? ('failed' as const) : ('sent' as const),
                provider_id: emailData?.id || null,
                error_message: emailError?.message || null,
              })
              .eq('id', sendLog.id)

            if (emailError) {
              failedCount++
              totalFailed++
            } else {
              // Update contact tracking (atomic increment)
              await supabase.rpc('increment_customer_send_count', {
                p_customer_id: contact.id,
                p_sent_at: new Date().toISOString(),
              })

              sentCount++
              totalSent++
              runningMonthlyCount++
            }
          } catch (err) {
            console.error(`Failed to send to contact ${contact.id}:`, err)
            failedCount++
            totalFailed++
          }
        }

        // === 3g. Update scheduled_send record ===
        const finalStatus = sentCount > 0 ? 'completed' : 'failed'
        const errorMessage = sentCount === 0 && eligibleContacts.length === 0
          ? `All contacts skipped: ${Object.values(skippedReasons).join(', ')}`
          : sentCount === 0 && failedCount > 0
          ? `All sends failed`
          : failedCount > 0
          ? `Partial success: ${sentCount} sent, ${failedCount} failed, ${totalSkipped} skipped`
          : null

        await supabase
          .from('scheduled_sends')
          .update({
            status: finalStatus as 'completed' | 'failed',
            executed_at: new Date().toISOString(),
            send_log_ids: sendLogIds.length > 0 ? sendLogIds : null,
            error_message: errorMessage,
          })
          .eq('id', scheduledSend.id)

      } catch (err) {
        console.error(`Failed to process scheduled send ${scheduledSend.id}:`, err)
        await updateScheduledSendFailed(
          supabase,
          scheduledSend.id,
          err instanceof Error ? err.message : 'Unknown error'
        )
        totalFailed++
      }
    }

    // === 4. Return structured JSON response ===
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      claimed: claimedSends.length,
      results: {
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        skipped: totalSkipped,
      }
    })

  } catch (err) {
    console.error('Cron handler error:', err)
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Helper to get monthly send count for a business.
 */
async function getMonthlyCount(
  supabase: ReturnType<typeof createServiceRoleClient>,
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
    .in('status', ['sent', 'delivered', 'opened'])

  return { count: count || 0 }
}

/**
 * Helper to update scheduled_send to failed status.
 */
async function updateScheduledSendFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  scheduledSendId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('scheduled_sends')
    .update({
      status: 'failed' as const,
      executed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('id', scheduledSendId)
}
