'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusiness } from '@/lib/data/business'
import type { Customer } from '@/lib/types/database'

/**
 * Get customers for autocomplete component.
 * Returns minimal customer data (id, name, email, phone) for fast autocomplete.
 * Used by Add Job form for smart customer selection.
 */
export async function getCustomersForAutocomplete(): Promise<Pick<Customer, 'id' | 'name' | 'email' | 'phone'>[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const business = await getBusiness()
  if (!business) return []

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .eq('business_id', business.id)
    .eq('status', 'active')
    .order('name')
    .limit(500)

  if (error) {
    console.error('Error fetching customers for autocomplete:', error)
    return []
  }

  return data ?? []
}
