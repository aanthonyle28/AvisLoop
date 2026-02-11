'use server'

/**
 * Server actions for API key management.
 *
 * IMPORTANT: Before using, run the migration:
 * ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/crypto/api-key'

export type ApiKeyActionState = {
  success?: boolean
  key?: string
  error?: string
}

/**
 * Generates a new API key for the authenticated user's business.
 * Returns the plaintext key (shown ONCE) and stores the hash in the database.
 * Regenerating replaces the old key.
 */
export async function generateApiKeyAction(): Promise<ApiKeyActionState> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return { error: 'Business not found' }
    }

    // Generate new API key
    const { key, hash } = await generateApiKey()

    // Store hash in database (replaces old key if exists)
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ api_key_hash: hash })
      .eq('id', business.id)

    if (updateError) {
      console.error('Failed to store API key hash:', updateError)
      return { error: 'Failed to generate API key' }
    }

    // Revalidate settings page
    revalidatePath('/settings')

    // Return plaintext key (shown ONCE)
    return { success: true, key }
  } catch (err) {
    console.error('Error generating API key:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Checks if the authenticated user's business has an API key configured.
 */
export async function hasApiKey(): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('api_key_hash')
      .eq('user_id', user.id)
      .single()

    return !!business?.api_key_hash
  } catch {
    return false
  }
}
