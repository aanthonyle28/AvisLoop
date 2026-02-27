'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_BUSINESS_COOKIE } from '@/lib/data/active-business'

/**
 * Switch the active business for the current user.
 *
 * Validates authentication and ownership before setting the httpOnly cookie.
 * Calls revalidatePath('/', 'layout') to trigger a full re-render of all pages
 * so the new business context is reflected immediately.
 *
 * @param businessId - UUID of the business to switch to
 * @returns {} on success, { error: string } on failure
 */
export async function switchBusiness(businessId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership — .single() is correct here because we query by primary key with
  // ownership check, which always returns exactly 0 or 1 rows. The PGRST116 error on
  // 0 rows is the desired "not found" signal.
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  // Set the httpOnly cookie — this persists the active business selection for 1 year.
  // No domain is set so the cookie is scoped to the current host only, which is correct
  // for the app subdomain (unlike the Supabase auth cookie which uses .avisloop.com
  // for cross-subdomain SSO).
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACTIVE_BUSINESS_COOKIE,
    value: businessId,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  // Trigger full layout re-render so all server components pick up the new business context
  revalidatePath('/', 'layout')

  return {}
}
