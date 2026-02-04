import { createClient } from '@/lib/supabase/server'
import type { MessageTemplate, MessageChannel } from '@/lib/types/database'

/**
 * Fetch all message templates for the current user's business.
 * Optionally filter by channel (email/sms).
 */
export async function getMessageTemplates(
  channel?: MessageChannel
): Promise<MessageTemplate[]> {
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

  let query = supabase
    .from('message_templates')
    .select('*')
    .eq('business_id', business.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (channel) {
    query = query.eq('channel', channel)
  }

  const { data } = await query
  return data || []
}

/**
 * Fetch a single message template by ID.
 * Returns null if not found or not authorized.
 */
export async function getMessageTemplate(
  templateId: string
): Promise<MessageTemplate | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // RLS handles authorization - only returns if user owns the business
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  return data
}

/**
 * Get default system templates.
 * These are templates where is_default = true.
 * Used for "Use this template" feature.
 */
export async function getDefaultMessageTemplates(
  channel?: MessageChannel
): Promise<MessageTemplate[]> {
  const supabase = await createClient()

  let query = supabase
    .from('message_templates')
    .select('*')
    .eq('is_default', true)
    .order('name', { ascending: true })

  if (channel) {
    query = query.eq('channel', channel)
  }

  const { data } = await query
  return data || []
}

/**
 * Get templates available for sending.
 * Includes both user-created and default templates.
 * Useful for template selectors in send forms.
 */
export async function getAvailableTemplates(
  channel?: MessageChannel
): Promise<MessageTemplate[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return []
  }

  // Get user's templates + defaults
  let query = supabase
    .from('message_templates')
    .select('*')
    .or(`business_id.eq.${business.id},is_default.eq.true`)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (channel) {
    query = query.eq('channel', channel)
  }

  const { data } = await query
  return data || []
}
