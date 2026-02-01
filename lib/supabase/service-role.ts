import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for server-only operations that bypass RLS.
 * Used by cron jobs and background tasks where there is no user session.
 *
 * NEVER import this in client components or expose the service role key.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
