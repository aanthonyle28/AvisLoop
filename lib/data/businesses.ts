import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import type { Business } from '@/lib/types/database'

/**
 * Return all businesses owned by the authenticated user, ordered by creation date.
 * Includes all agency metadata columns (google_rating_start, monthly_fee, etc.).
 *
 * Used by the Clients Page (/businesses) to display the full business grid.
 * Returns every business — NOT just the active one. Do not use getActiveBusiness() here.
 *
 * Uses getAuthUser() for per-request deduplication to avoid concurrent refresh token
 * race conditions when called alongside getActiveBusiness().
 *
 * Returns an empty array if the user is not authenticated or has no businesses.
 */
export async function getUserBusinessesWithMetadata(): Promise<Business[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (data ?? []) as Business[]
}
