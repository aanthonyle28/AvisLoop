'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clientUpdateSchema } from '@/lib/validations/client'
import type { ClientUpdateInput } from '@/lib/validations/client'

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
