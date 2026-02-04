'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveFeedbackSchema } from '@/lib/validations/feedback'
import { z } from 'zod'

/**
 * Mark feedback as resolved with optional internal notes.
 * Revalidates the feedback page after success.
 */
export async function resolveFeedbackAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Parse and validate input
    const id = formData.get('id') as string
    const internalNotes = formData.get('internal_notes') as string | null

    const validated = resolveFeedbackSchema.parse({
      id,
      internal_notes: internalNotes || undefined,
    })

    // Update feedback (RLS ensures user owns the business)
    const { error } = await supabase
      .from('customer_feedback')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        internal_notes: validated.internal_notes || null,
      })
      .eq('id', validated.id)

    if (error) {
      console.error('Resolve feedback error:', error)
      return { success: false, error: 'Failed to resolve feedback' }
    }

    revalidatePath('/feedback')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }
    console.error('Resolve feedback action error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

/**
 * Reopen resolved feedback for follow-up.
 */
export async function unresolveFeedbackAction(
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update feedback (RLS ensures user owns the business)
    const { error } = await supabase
      .from('customer_feedback')
      .update({
        resolved_at: null,
        resolved_by: null,
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Unresolve feedback error:', error)
      return { success: false, error: 'Failed to reopen feedback' }
    }

    revalidatePath('/feedback')
    return { success: true }
  } catch (error) {
    console.error('Unresolve feedback action error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}
