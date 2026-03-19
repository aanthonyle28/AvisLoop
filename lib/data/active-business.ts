import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import type { Business } from '@/lib/types/database'

/**
 * Cookie name for the active business selection.
 * Exported so switchBusiness() can reference the same constant without duplication.
 */
export const ACTIVE_BUSINESS_COOKIE = 'active_business_id'

/**
 * Resolve which business is currently active for the authenticated user.
 *
 * Wrapped in React.cache() so multiple Server Components calling this in the
 * same request (e.g., layout + page) share a single result instead of each
 * creating independent Supabase clients and calling getUser() concurrently.
 * This eliminates the refresh-token race condition that caused auth failures
 * and redirects to /login during business switching.
 *
 * Resolution order:
 * 1. If `active_business_id` cookie is set and references a business the user owns → return that business
 * 2. If cookie is missing or references a business the user does NOT own → fall back to the first
 *    business by created_at (using .limit(1), NOT .single(), to handle zero-business users gracefully)
 * 3. If the user has no businesses → return null
 *
 * IMPORTANT: Do NOT call cookies().set() here. Server Components cannot set cookies —
 * only Server Actions can. This function is safe to call from any Server Component.
 */
export const getActiveBusiness = cache(async (): Promise<Business | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const cookieStore = await cookies()
  const supabase = await createClient()

  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value

  // If cookie is present, attempt to fetch the specified business with ownership check
  if (activeId) {
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', activeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (business) {
      return business
    }
    // Cookie references a business the user doesn't own (or it was deleted) — fall through to fallback
  }

  // Fallback: return the first business ordered by created_at.
  // CRITICAL: Use .limit(1) with array access, NOT .single().
  // .single() throws PGRST116 on both zero rows AND multiple rows.
  // .limit(1) returns an empty array when the user has no businesses.
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  return data?.[0] ?? null
})

/**
 * Return all businesses owned by the authenticated user, ordered by creation date.
 * Used by the layout to populate the business switcher dropdown.
 *
 * Wrapped in React.cache() for per-request deduplication (same rationale as getActiveBusiness).
 * Returns an empty array if the user is not authenticated or has no businesses.
 */
export const getUserBusinesses = cache(async (): Promise<Array<{ id: string; name: string }>> => {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return data ?? []
})
