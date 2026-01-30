import { createClient } from '@/lib/supabase/server'
import type { ScheduledSendWithDetails, SendLogDetail, ScheduledSend } from '@/lib/types/database'

/**
 * Get count of pending scheduled sends for the current user's business.
 * For Server Components - handles auth internally.
 */
export async function getPendingScheduledCount(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return 0
  }

  // Count pending scheduled sends
  const { count, error } = await supabase
    .from('scheduled_sends')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending scheduled count:', error)
    return 0
  }

  return count || 0
}

/**
 * Get scheduled sends with per-contact send_log details for completed sends.
 * For Server Components - handles auth internally.
 */
export async function getScheduledSendsWithDetails(): Promise<ScheduledSendWithDetails[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return []
  }

  // Fetch all scheduled sends
  const { data: scheduledSends } = await supabase
    .from('scheduled_sends')
    .select('*')
    .eq('business_id', business.id)
    .order('scheduled_for', { ascending: true })

  if (!scheduledSends || scheduledSends.length === 0) {
    return []
  }

  // For completed sends with send_log_ids, fetch send_logs in parallel
  const sendsWithDetails = await Promise.all(
    (scheduledSends as ScheduledSend[]).map(async (send) => {
      // Only fetch send_logs for completed sends with send_log_ids
      if (send.status === 'completed' && send.send_log_ids && send.send_log_ids.length > 0) {
        const { data: sendLogs } = await supabase
          .from('send_logs')
          .select('id, contact_id, status, error_message, contacts!inner(name, email)')
          .in('id', send.send_log_ids)
          .eq('business_id', business.id)

        // Map the response to match SendLogDetail type
        // Note: Supabase returns contacts as an array from the join, so we take the first element
        const mappedSendLogs: SendLogDetail[] = (sendLogs || []).map((log) => {
          const contactData = Array.isArray(log.contacts) ? log.contacts[0] : log.contacts
          return {
            id: log.id,
            contact_id: log.contact_id,
            status: log.status,
            error_message: log.error_message,
            contacts: contactData as { name: string; email: string },
          }
        })

        return {
          ...send,
          sendLogs: mappedSendLogs,
        }
      }

      // Return send without sendLogs for non-completed or empty send_log_ids
      return {
        ...send,
        sendLogs: [],
      }
    })
  )

  return sendsWithDetails
}
