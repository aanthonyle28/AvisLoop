'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { customers: [] }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { customers: [] }
  }

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
