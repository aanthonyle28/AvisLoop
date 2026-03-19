import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Per-request cached auth user lookup.
 *
 * React.cache() ensures getUser() is called at most once per server-side
 * request, even when multiple Server Components call it concurrently.
 * This prevents the race condition where parallel getUser() calls each
 * attempt to refresh an expired JWT using the same one-time refresh token,
 * causing all but the first to fail.
 *
 * Usage: call getAuthUser() in any data function that needs the current user.
 * The first call creates the Supabase client and validates auth; subsequent
 * calls within the same request return the cached result instantly.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})
