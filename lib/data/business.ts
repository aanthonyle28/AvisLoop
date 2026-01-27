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
  // (businesses.default_template_id -> email_templates, email_templates.business_id -> businesses)
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      email_templates!email_templates_business_id_fkey (
        id,
        name,
        subject,
        body,
        is_default,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  return business
}

/**
 * Fetch all templates for the current user's business.
 * Includes both system defaults and user-created templates.
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
    .from('email_templates')
    .select('*')
    .eq('business_id', business.id)
    .order('is_default', { ascending: false }) // System defaults first
    .order('created_at', { ascending: true })

  return templates || []
}
