'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { businessMetadataSchema } from '@/lib/validations/business-metadata'
import type { BusinessMetadataInput } from '@/lib/validations/business-metadata'

/**
 * Update agency metadata fields for a business.
 * Validates input with Zod, then persists to the database.
 * Revalidates /businesses so the Clients Page grid reflects the change immediately.
 *
 * RLS ensures the authenticated user can only update businesses they own.
 */
export async function updateBusinessMetadata(
  businessId: string,
  data: BusinessMetadataInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!businessId || typeof businessId !== 'string') {
    return { error: 'Invalid business ID' }
  }

  const parsed = businessMetadataSchema.safeParse(data)
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
    console.error('Failed to update business metadata:', error)
    return { error: error.message }
  }

  revalidatePath('/businesses')
  return { success: true }
}

/**
 * Update agency_notes for a business (fire-and-forget auto-save).
 * No revalidatePath — notes auto-save should not trigger a full page re-render.
 *
 * RLS ensures the authenticated user can only update businesses they own.
 */
export async function updateBusinessNotes(
  businessId: string,
  notes: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!businessId || typeof businessId !== 'string') {
    return { error: 'Invalid business ID' }
  }

  if (typeof notes !== 'string' || notes.length > 10000) {
    return { error: 'Notes must be under 10,000 characters' }
  }

  const { error } = await supabase
    .from('businesses')
    .update({ agency_notes: notes })
    .eq('id', businessId)

  if (error) {
    console.error('Failed to update business notes:', error)
    return { error: error.message }
  }

  return { success: true }
}
