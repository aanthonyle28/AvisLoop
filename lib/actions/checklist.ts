"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getActiveBusiness } from '@/lib/data/active-business'

/**
 * Dismiss or collapse the Getting Started checklist
 * Sets dismissed=true or collapsed=true in onboarding_checklist JSONB
 */
export async function updateChecklistState(
  action: 'dismiss' | 'collapse' | 'expand' | 'markSeen' | 'reset'
): Promise<{ success: boolean; error?: string }> {
  const VALID_ACTIONS = ['dismiss', 'collapse', 'expand', 'markSeen', 'reset'] as const
  if (!VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
    return { success: false, error: 'Invalid action' }
  }

  try {
    const business = await getActiveBusiness()
    if (!business) {
      return { success: false, error: 'Business not found' }
    }

    const supabase = await createClient()

    // Fetch current checklist state
    const { data: bizData } = await supabase
      .from('businesses')
      .select('onboarding_checklist')
      .eq('id', business.id)
      .single()

    // Update checklist based on action
    const currentChecklist = (bizData?.onboarding_checklist || {}) as Record<string, unknown>
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
      case 'reset':
        // Reset dismissed state to show checklist again
        updatedChecklist.dismissed = false
        updatedChecklist.dismissed_at = null
        updatedChecklist.collapsed = false
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

/**
 * Mark the campaign as reviewed in the Getting Started checklist.
 * Called from the campaigns page on load so the checklist item
 * only completes when the user actually visits /campaigns.
 */
export async function markCampaignReviewed(): Promise<{ success: boolean }> {
  try {
    const business = await getActiveBusiness()
    if (!business) return { success: false }

    const supabase = await createClient()

    const { data: bizData } = await supabase
      .from('businesses')
      .select('onboarding_checklist')
      .eq('id', business.id)
      .single()

    const current = (bizData?.onboarding_checklist || {}) as Record<string, unknown>

    // Short-circuit if already marked — avoids unnecessary DB write
    if (current.campaign_reviewed === true) return { success: true }

    const { error } = await supabase
      .from('businesses')
      .update({
        onboarding_checklist: { ...current, campaign_reviewed: true }
      })
      .eq('id', business.id)

    if (error) {
      console.error('Failed to mark campaign reviewed:', error)
      return { success: false }
    }

    revalidatePath('/dashboard')
    revalidatePath('/campaigns')
    return { success: true }
  } catch (err) {
    console.error('markCampaignReviewed error:', err)
    return { success: false }
  }
}
