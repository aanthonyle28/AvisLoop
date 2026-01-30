'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Mark onboarding as complete for the current user's business.
 * Sets onboarding_completed_at to current timestamp and revalidates dashboard.
 *
 * @returns Success or error object
 */
export async function markOnboardingComplete(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in to complete onboarding' }
  }

  // Update business with completion timestamp
  const { error } = await supabase
    .from('businesses')
    .update({
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate dashboard and onboarding to refresh status
  revalidatePath('/dashboard')
  revalidatePath('/onboarding')

  return { success: true }
}

/**
 * Mark a specific onboarding card step as complete.
 * Used for manual completion triggers when auto-detection isn't immediate enough.
 *
 * @param step - The card step to mark complete
 * @returns Success or error object
 */
export async function markOnboardingCardStep(
  step: 'contact_created' | 'template_created' | 'test_sent'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_steps_completed')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'No business found' }
  }

  const current = (business.onboarding_steps_completed || {}) as Record<string, boolean>
  current[step] = true

  const { error } = await supabase
    .from('businesses')
    .update({ onboarding_steps_completed: current })
    .eq('id', business.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
