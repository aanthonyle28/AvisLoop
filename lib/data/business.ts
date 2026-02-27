import { createClient } from '@/lib/supabase/server'
import type { Business, MessageTemplate } from '@/lib/types/database'

/** Business row with nested message_templates (subset of fields selected from DB) */
export type BusinessWithTemplates = Business & {
  message_templates: MessageTemplate[]
}

/**
 * Fetch business with all templates by businessId.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 * Returns null if business not found.
 */
export async function getBusiness(businessId: string): Promise<BusinessWithTemplates | null> {
  const supabase = await createClient()

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
    .eq('id', businessId)
    .single()

  return business
}

/**
 * Fetch all email templates for the given business.
 * Includes both system defaults and user-created templates.
 * @deprecated Use getMessageTemplates from lib/data/message-template.ts with channel='email' instead.
 * This function is maintained for backward compatibility only.
 */
export async function getEmailTemplates(businessId: string) {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('message_templates')
    .select('*')
    .eq('business_id', businessId)
    .eq('channel', 'email') // Filter for email templates only
    .order('is_default', { ascending: false }) // System defaults first
    .order('created_at', { ascending: true })

  return templates || []
}

/**
 * Get business service type settings.
 * Returns which service types are enabled and their timing defaults.
 */
export async function getServiceTypeSettings(businessId: string): Promise<{
  serviceTypesEnabled: string[]
  serviceTypeTiming: Record<string, number>
  customServiceNames: string[]
} | null> {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('service_types_enabled, service_type_timing, custom_service_names')
    .eq('id', businessId)
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
