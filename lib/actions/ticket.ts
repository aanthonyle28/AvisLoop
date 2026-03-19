'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'
import {
  REVISION_LIMITS,
  DEFAULT_REVISION_LIMIT,
  OVERAGE_FEE_USD,
} from '@/lib/constants/tickets'
import type { TicketStatus, TicketMessage } from '@/lib/types/database'

interface CreateTicketInput {
  projectId: string
  title: string
  description?: string
  body?: string          // first message body (optional)
  isOverage?: boolean    // true when user confirmed $50 overage charge
  subscriptionTier?: string | null
}

type CreateTicketResult =
  | {
      success: true
      ticketId: string
      isOverage: boolean
      overageFee?: number
    }
  | {
      success: false
      error: string
      overLimit?: boolean
      currentCount?: number
      monthlyLimit?: number
    }

/**
 * Create a new ticket for a project.
 * Calls submit_ticket_with_limit_check RPC — atomic, enforces monthly limits.
 *
 * Returns overLimit: true if limit reached and isOverage was not confirmed.
 * Caller must present overage confirmation UI and re-call with isOverage: true.
 */
export async function createTicket(
  input: CreateTicketInput
): Promise<CreateTicketResult> {
  const business = await getActiveBusiness()
  if (!business) return { success: false, error: 'Business not found' }

  const supabase = await createClient()

  // Determine monthly limit from subscription tier (single source of truth)
  const tier = input.subscriptionTier ?? null
  const monthlyLimit =
    tier && REVISION_LIMITS[tier] ? REVISION_LIMITS[tier] : DEFAULT_REVISION_LIMIT

  const { data, error } = await supabase.rpc('submit_ticket_with_limit_check', {
    p_project_id: input.projectId,
    p_business_id: business.id,
    p_title: input.title,
    p_description: input.description ?? null,
    p_source: 'agency',
    p_author_name: 'Agency',
    p_body: input.body ?? null,
    p_monthly_limit: monthlyLimit,
    p_is_overage: input.isOverage ?? false,
  })

  if (error) {
    console.error('[createTicket] RPC error:', error)
    return { success: false, error: 'Failed to create ticket' }
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result) return { success: false, error: 'No result from RPC' }

  if (result.status === 'over_limit') {
    return {
      success: false,
      error: 'Monthly revision limit reached',
      overLimit: true,
      currentCount: result.current_count,
      monthlyLimit: result.monthly_limit,
    }
  }

  revalidatePath('/clients')

  return {
    success: true,
    ticketId: result.ticket_id,
    isOverage: input.isOverage ?? false,
    overageFee: input.isOverage ? OVERAGE_FEE_USD : undefined,
  }
}

/**
 * Update a ticket's status. Sets completed_at when moving to 'completed'.
 * Optionally updates internal_notes at the same time.
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  internalNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const business = await getActiveBusiness()
  if (!business) return { success: false, error: 'Business not found' }

  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  if (internalNotes !== undefined) {
    updates.internal_notes = internalNotes
  }

  const { error } = await supabase
    .from('project_tickets')
    .update(updates)
    .eq('id', ticketId)
    .eq('business_id', business.id) // C-4: ownership guard (defense in depth beyond RLS)

  if (error) {
    console.error('[updateTicketStatus] error:', error)
    return { success: false, error: 'Failed to update ticket status' }
  }

  revalidatePath('/clients')
  return { success: true }
}

/**
 * Add an agency reply message to a ticket thread.
 */
export async function addAgencyMessage(
  ticketId: string,
  body: string,
  attachmentUrls?: string[]
): Promise<{ success: boolean; error?: string }> {
  const business = await getActiveBusiness()
  if (!business) return { success: false, error: 'Business not found' }

  if (!body.trim()) return { success: false, error: 'Message body is required' }

  const supabase = await createClient()

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    business_id: business.id,
    author_type: 'agency',
    author_name: 'Agency',
    body: body.trim(),
    attachment_urls:
      attachmentUrls && attachmentUrls.length > 0 ? attachmentUrls : null,
  })

  if (error) {
    console.error('[addAgencyMessage] error:', error)
    return { success: false, error: 'Failed to send message' }
  }

  revalidatePath('/clients')
  return { success: true }
}

/**
 * Update internal notes on a ticket (agency-only field, not visible to client).
 * Fire-and-forget pattern — no revalidation needed (matches customer notes pattern).
 */
export async function updateInternalNotes(
  ticketId: string,
  notes: string
): Promise<void> {
  const business = await getActiveBusiness()
  if (!business) return

  const supabase = await createClient()
  await supabase
    .from('project_tickets')
    .update({ internal_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('business_id', business.id)
}

/**
 * Fetch messages for a ticket (callable from client components via server action).
 * Returns signed URLs for any attachments.
 */
export async function fetchTicketMessages(
  ticketId: string
): Promise<TicketMessage[]> {
  const business = await getActiveBusiness()
  if (!business) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  // Generate signed read URLs for any attachment storage paths
  const messages = data as TicketMessage[]
  for (const msg of messages) {
    if (msg.attachment_urls?.length) {
      const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
      const serviceSupabase = createServiceRoleClient()
      const signedUrls: string[] = []
      for (const path of msg.attachment_urls) {
        // If already a signed URL (starts with http), keep as-is
        if (path.startsWith('http')) {
          signedUrls.push(path)
        } else {
          const { data: urlData } = await serviceSupabase.storage
            .from('revision-attachments')
            .createSignedUrl(path, 60 * 60) // 1 hour
          signedUrls.push(urlData?.signedUrl ?? path)
        }
      }
      msg.attachment_urls = signedUrls
    }
  }

  return messages
}
