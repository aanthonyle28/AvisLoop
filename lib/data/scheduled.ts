import { createClient } from '@/lib/supabase/server'

/**
 * Get count of pending scheduled sends for the current user's business.
 * For Server Components - handles auth internally.
 */
export async function getPendingScheduledCount(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return 0
  }

  // Count pending scheduled sends
  const { count, error } = await supabase
    .from('scheduled_sends')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending scheduled count:', error)
    return 0
  }

  return count || 0
}
