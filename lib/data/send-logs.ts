import { createClient } from '@/lib/supabase/server'
import { escapeLikePattern } from '@/lib/actions/contact'
import type { SendLogWithContact } from '@/lib/types/database'

/**
 * Get send logs for the current user's business.
 * For Server Components - handles auth internally.
 */
export async function getSendLogs(options?: {
  limit?: number
  offset?: number
  contactId?: string
  query?: string          // NEW: Search by contact name or email
  status?: string         // NEW: Filter by status (pending, sent, delivered, etc.)
  dateFrom?: string       // NEW: Filter by date range start (ISO string)
  dateTo?: string         // NEW: Filter by date range end (ISO string)
}): Promise<{ logs: SendLogWithContact[]; total: number }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { logs: [], total: 0 }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { logs: [], total: 0 }
  }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  // Build query
  let query = supabase
    .from('send_logs')
    .select('*, contacts!inner(name, email)', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (options?.contactId) {
    query = query.eq('contact_id', options.contactId)
  }

  // Search filter (query): Use Supabase's or filter with referencedTable option
  if (options?.query) {
    const escapedQuery = escapeLikePattern(options.query)
    query = query.or(`name.ilike.%${escapedQuery}%,email.ilike.%${escapedQuery}%`, {
      referencedTable: 'contacts'
    })
  }

  // Status filter: Simple equality filter on status column
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Date range filter: Use gte/lte on created_at
  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options?.dateTo) {
    // Add time component to include the entire end day
    const endOfDay = new Date(options.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endOfDay.toISOString())
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching send logs:', error)
    return { logs: [], total: 0 }
  }

  return {
    logs: data as SendLogWithContact[],
    total: count || 0,
  }
}

/**
 * Get monthly send count for usage display.
 */
export async function getMonthlyUsage(): Promise<{
  count: number
  limit: number
  tier: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { count: 0, limit: 0, tier: 'none' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, tier')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { count: 0, limit: 0, tier: 'none' }
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  const limits: Record<string, number> = {
    trial: 25,
    basic: 200,
    pro: 500,
  }

  return {
    count: count || 0,
    limit: limits[business.tier] || limits.basic,
    tier: business.tier,
  }
}

/**
 * Get send stats for a specific contact.
 */
export async function getContactSendStats(contactId: string): Promise<{
  totalSent: number
  lastSentAt: string | null
  canSend: boolean
  cooldownEnds: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { totalSent: 0, lastSentAt: null, canSend: false, cooldownEnds: null }
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('last_sent_at, send_count, opted_out, status')
    .eq('id', contactId)
    .single()

  if (!contact) {
    return { totalSent: 0, lastSentAt: null, canSend: false, cooldownEnds: null }
  }

  const COOLDOWN_DAYS = 14
  let canSend = contact.status === 'active' && !contact.opted_out
  let cooldownEnds: string | null = null

  if (contact.last_sent_at) {
    const lastSent = new Date(contact.last_sent_at)
    const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)

    if (new Date() < cooldownEnd) {
      canSend = false
      cooldownEnds = cooldownEnd.toISOString()
    }
  }

  return {
    totalSent: contact.send_count || 0,
    lastSentAt: contact.last_sent_at,
    canSend,
    cooldownEnds,
  }
}
