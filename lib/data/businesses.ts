import { createClient } from '@/lib/supabase/server'
import type { Business } from '@/lib/types/database'

/**
 * Return all businesses owned by the authenticated user, ordered by creation date.
 * Includes all agency metadata columns (google_rating_start, monthly_fee, etc.).
 *
 * Used by the Clients Page (/businesses) to display the full business grid.
 * Returns every business — NOT just the active one. Do not use getActiveBusiness() here.
 *
 * Returns an empty array if the user is not authenticated or has no businesses.
 */
export async function getUserBusinessesWithMetadata(): Promise<Business[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (data ?? []) as Business[]
}
