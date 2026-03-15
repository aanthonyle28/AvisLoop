'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'

/**
 * Generate an intake token for the active business's public client intake form.
 *
 * Idempotent: if the business already has a token, returns the existing one.
 * Uses auth-scoped client since this is called by an authenticated Businesses page user.
 */
export async function generateIntakeToken(): Promise<
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
    .select('intake_token')
    .eq('id', business.id)
    .single()

  if (existing?.intake_token) {
    return { token: existing.intake_token }
  }

  // Generate 24 random bytes → 32-char base64url string (192 bits of entropy)
  const token = randomBytes(24).toString('base64url')

  const { error } = await supabase
    .from('businesses')
    .update({ intake_token: token })
    .eq('id', business.id)

  if (error) {
    console.error('[generateIntakeToken] update error:', error)
    return { error: 'Failed to generate token' }
  }

  revalidatePath('/businesses')
  return { token }
}

/**
 * Regenerate the intake token for the active business.
 *
 * Always generates a new token, invalidating the previous URL.
 */
export async function regenerateIntakeToken(): Promise<
  { token: string } | { error: string }
> {
  const business = await getActiveBusiness()
  if (!business) {
    return { error: 'Business not found' }
  }

  const token = randomBytes(24).toString('base64url')

  const supabase = await createClient()

  const { error } = await supabase
    .from('businesses')
    .update({ intake_token: token })
    .eq('id', business.id)

  if (error) {
    console.error('[regenerateIntakeToken] update error:', error)
    return { error: 'Failed to regenerate token' }
  }

  revalidatePath('/businesses')
  return { token }
}
