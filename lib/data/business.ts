import { createClient } from '@/lib/supabase/server'

/**
 * Fetch current user's business with all templates.
 * For use in Server Components to load initial form data.
 * Returns null if no business exists yet.
 */
export async function getBusiness() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  // Use explicit FK hint to resolve ambiguity from circular relationship
  // (businesses.default_template_id -> message_templates, message_templates.business_id -> businesses)
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      message_templates!message_templates_business_id_fkey (
        id,
        name,
        subject,
        body,
        channel,
        service_type,
        is_default,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  return business
}

/**
 * Fetch all email templates for the current user's business.
 * Includes both system defaults and user-created templates.
 * @deprecated Use getMessageTemplates from lib/data/message-template.ts with channel='email' instead.
 * This function is maintained for backward compatibility only.
 */
export async function getEmailTemplates() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  // Get user's business first
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return []
  }

  const { data: templates } = await supabase
    .from('message_templates')
    .select('*')
    .eq('business_id', business.id)
    .eq('channel', 'email') // Filter for email templates only
    .order('is_default', { ascending: false }) // System defaults first
    .order('created_at', { ascending: true })

  return templates || []
}

/**
 * Get business service type settings.
 * Returns which service types are enabled and their timing defaults.
 */
export async function getServiceTypeSettings(): Promise<{
  serviceTypesEnabled: string[]
  serviceTypeTiming: Record<string, number>
  customServiceNames: string[]
} | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('service_types_enabled, service_type_timing, custom_service_names')
    .eq('user_id', user.id)
    .single()

  if (!business) return null

  return {
    serviceTypesEnabled: business.service_types_enabled || [],
    serviceTypeTiming: business.service_type_timing || {
      hvac: 24, plumbing: 48, electrical: 24, cleaning: 4,
      roofing: 72, painting: 48, handyman: 24, other: 24
    },
    customServiceNames: business.custom_service_names || [],
  }
}
