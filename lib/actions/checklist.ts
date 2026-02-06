"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Dismiss or collapse the Getting Started checklist
 * Sets dismissed=true or collapsed=true in onboarding_checklist JSONB
 */
export async function updateChecklistState(
  action: 'dismiss' | 'collapse' | 'expand' | 'markSeen'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user's business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, onboarding_checklist')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return { success: false, error: 'Business not found' }
    }

    // Update checklist based on action
    const currentChecklist = (business.onboarding_checklist || {}) as Record<string, unknown>
    const now = new Date().toISOString()

    const updatedChecklist = { ...currentChecklist }
    switch (action) {
      case 'dismiss':
        updatedChecklist.dismissed = true
        updatedChecklist.dismissed_at = now
        break
      case 'collapse':
        updatedChecklist.collapsed = true
        break
      case 'expand':
        updatedChecklist.collapsed = false
        break
      case 'markSeen':
        // Set first_seen_at if not already set (for auto-collapse timing)
        if (!updatedChecklist.first_seen_at) {
          updatedChecklist.first_seen_at = now
        }
        break
    }

    const { error } = await supabase
      .from('businesses')
      .update({ onboarding_checklist: updatedChecklist })
      .eq('id', business.id)

    if (error) {
      console.error('Failed to update checklist:', error)
      return { success: false, error: 'Failed to update checklist' }
    }

    // Revalidate dashboard to refresh checklist state
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err) {
    console.error('updateChecklistState error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
