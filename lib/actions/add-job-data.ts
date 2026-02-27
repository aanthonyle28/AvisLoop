'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'

interface AddJobCustomer {
  id: string
  name: string
  email: string
  phone?: string | null
}

export interface AddJobData {
  customers: AddJobCustomer[]
}

/**
 * Lazy-load data needed for the Add Job sheet.
 * Called on-demand when the drawer opens (not on every page load).
 * Note: enabledServiceTypes is provided by BusinessSettingsProvider context.
 */
export async function getAddJobData(): Promise<AddJobData> {
  const business = await getActiveBusiness()
  if (!business) {
    return { customers: [] }
  }

  const supabase = await createClient()

  // Fetch active customers for autocomplete (limit 200)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .eq('business_id', business.id)
    .eq('status', 'active')
    .order('name')
    .limit(200)

  return {
    customers: (customers || []) as AddJobCustomer[],
  }
}
