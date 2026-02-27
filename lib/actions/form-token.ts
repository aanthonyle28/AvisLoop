'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'

/**
 * Generate a form token for the active business's public job completion form.
 *
 * Idempotent: if the business already has a token, returns the existing one.
 * Uses auth-scoped client since this is called by an authenticated Settings page user.
 */
export async function generateFormToken(): Promise<
  { token: string } | { error: string }
> {
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  const supabase = await createClient()

  // Check if token already exists (idempotent)
  const { data: existing } = await supabase
    .from('businesses')
    .select('form_token')
    .eq('id', business.id)
    .single()

  if (existing?.form_token) {
    return { token: existing.form_token }
  }

  // Generate 24 random bytes → 32-char base64url string (192 bits of entropy)
  const token = randomBytes(24).toString('base64url')

  const { error } = await supabase
    .from('businesses')
    .update({ form_token: token })
    .eq('id', business.id)

  if (error) {
    console.error('[generateFormToken] update error:', error)
    return { error: 'Failed to generate token' }
  }

  revalidatePath('/settings')
  return { token }
}

/**
 * Regenerate the form token for the active business.
 *
 * Always generates a new token, invalidating the previous URL.
 * Uses auth-scoped client since this is called by an authenticated Settings page user.
 */
export async function regenerateFormToken(): Promise<
  { token: string } | { error: string }
> {
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  // Generate a fresh token (overwrites any existing token)
  const token = randomBytes(24).toString('base64url')

  const supabase = await createClient()

  const { error } = await supabase
    .from('businesses')
    .update({ form_token: token })
    .eq('id', business.id)

  if (error) {
    console.error('[regenerateFormToken] update error:', error)
    return { error: 'Failed to regenerate token' }
  }

  revalidatePath('/settings')
  return { token }
}
