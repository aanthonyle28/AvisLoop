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

  // Revalidate dashboard to refresh onboarding status
  revalidatePath('/dashboard')

  return { success: true }
}
