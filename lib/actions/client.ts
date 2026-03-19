'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clientUpdateSchema, createClientSchema } from '@/lib/validations/client'
import type { ClientUpdateInput, CreateClientInput } from '@/lib/validations/client'

/**
 * Create a new web design client:
 * 1. Inserts a businesses row with client_type = 'web_design' and owner contact fields.
 * 2. Inserts a web_projects row linked to that business with tier, fee, and portal token.
 * 3. Returns the new business ID on success.
 *
 * Uses two separate PURE INSERTs — never upsert.
 */
export async function createWebDesignClient(
  input: CreateClientInput
): Promise<{ success: true; businessId: string } | { success: false; error: string }> {
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const { businessName, ownerName, ownerEmail, ownerPhone, domain, subscriptionTier, hasReviewAddon } = parsed.data
  const monthlyFee = subscriptionTier === 'advanced' ? 299 : 199

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // 1. Insert business row — PURE INSERT
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name: businessName,
      client_type: hasReviewAddon ? 'both' : 'web_design',
      owner_name: ownerName || null,
      owner_email: ownerEmail || null,
      owner_phone: ownerPhone || null,
      domain: domain || null,
      web_design_tier: subscriptionTier,
      monthly_fee: monthlyFee,
      status: 'active',
      // Onboarding not applicable for agency-created web design clients
      onboarding_completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (bizError || !business) {
    return { success: false, error: bizError?.message ?? 'Failed to create business' }
  }

  // 2. Generate portal token (192-bit base64url, same pattern as form_token / intake_token)
  const portalToken = randomBytes(24).toString('base64url')

  // 3. Insert web_projects row — PURE INSERT
  const { error: projectError } = await supabase
    .from('web_projects')
    .insert({
      business_id: business.id,
      status: 'discovery',
      subscription_tier: subscriptionTier,
      subscription_monthly_fee: monthlyFee,
      has_review_addon: hasReviewAddon,
      client_name: ownerName || null,
      client_email: ownerEmail || null,
      client_phone: ownerPhone || null,
      domain: domain || null,
      portal_token: portalToken,
    })

  if (projectError) {
    // Roll back the business row so we don't leave an orphan
    await supabase.from('businesses').delete().eq('id', business.id).eq('user_id', user.id)
    return { success: false, error: projectError.message }
  }

  revalidatePath('/clients')
  revalidatePath('/businesses')
  return { success: true, businessId: business.id }
}

/**
 * Update editable fields for a web design client (businesses row).
 * Validates input with Zod, then persists to the database.
 * Revalidates /clients so the page reflects changes immediately.
 *
 * RLS ensures the authenticated user can only update businesses they own.
 */
export async function updateClientDetails(
  businessId: string,
  data: ClientUpdateInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!businessId || typeof businessId !== 'string') {
    return { error: 'Invalid business ID' }
  }

  const parsed = clientUpdateSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(fieldErrors).flat()[0]
    return { error: firstError ?? 'Invalid input' }
  }

  const { error } = await supabase
    .from('businesses')
    .update(parsed.data)
    .eq('id', businessId)

  if (error) {
    console.error('Failed to update client details:', error)
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true }
}
