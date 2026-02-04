import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  CustomerFeedback,
  FeedbackWithCustomer,
  CreateFeedbackInput,
  FeedbackFilters,
  FeedbackStats,
} from '@/lib/types/feedback'

/**
 * Get a single feedback record by ID.
 * Requires authenticated user with business access (RLS enforced).
 */
export async function getFeedback(id: string): Promise<FeedbackWithCustomer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_feedback')
    .select(`
      *,
      customer:customers(id, name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getFeedback error:', error)
    return null
  }

  return data as unknown as FeedbackWithCustomer
}

/**
 * Get feedback list for a business with optional filters.
 * Uses partial index for unresolved queries (fast).
 */
export async function getFeedbackForBusiness(
  businessId: string,
  filters: FeedbackFilters = {},
  page = 1,
  limit = 20
): Promise<{ data: FeedbackWithCustomer[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('customer_feedback')
    .select(`
      *,
      customer:customers(id, name, email, phone)
    `, { count: 'exact' })
    .eq('business_id', businessId)
    .order('submitted_at', { ascending: false })

  // Apply resolved filter (uses partial index when false)
  if (filters.resolved === true) {
    query = query.not('resolved_at', 'is', null)
  } else if (filters.resolved === false) {
    query = query.is('resolved_at', null)
  }

  // Apply rating filter
  if (filters.rating) {
    query = query.eq('rating', filters.rating)
  }

  // Apply search filter (feedback text only - customer name search requires separate join)
  if (filters.search) {
    query = query.ilike('feedback_text', `%${filters.search}%`)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('getFeedbackForBusiness error:', error)
    return { data: [], total: 0 }
  }

  return {
    data: (data || []) as unknown as FeedbackWithCustomer[],
    total: count || 0,
  }
}

/**
 * Get unresolved feedback count for a business.
 * Used for dashboard alerts/badges.
 */
export async function getUnresolvedFeedbackCount(businessId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('customer_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .is('resolved_at', null)

  if (error) {
    console.error('getUnresolvedFeedbackCount error:', error)
    return 0
  }

  return count || 0
}

/**
 * Get feedback statistics for a business.
 */
export async function getFeedbackStats(businessId: string): Promise<FeedbackStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_feedback')
    .select('rating, resolved_at')
    .eq('business_id', businessId)

  if (error || !data) {
    console.error('getFeedbackStats error:', error)
    return { total: 0, unresolved: 0, averageRating: 0, byRating: {} }
  }

  const total = data.length
  const unresolved = data.filter((f) => !f.resolved_at).length
  const averageRating = total > 0 ? data.reduce((sum, f) => sum + f.rating, 0) / total : 0
  const byRating: Record<number, number> = {}
  data.forEach((f) => {
    byRating[f.rating] = (byRating[f.rating] || 0) + 1
  })

  return { total, unresolved, averageRating: Math.round(averageRating * 10) / 10, byRating }
}

/**
 * Create feedback from public review page.
 * Uses service role client (bypasses RLS for public insert).
 * Token validation happens in API route before calling this.
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<CustomerFeedback | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('customer_feedback')
    .insert({
      business_id: input.business_id,
      customer_id: input.customer_id,
      enrollment_id: input.enrollment_id || null,
      rating: input.rating,
      feedback_text: input.feedback_text || null,
    })
    .select()
    .single()

  if (error) {
    console.error('createFeedback error:', error)
    return null
  }

  return data as CustomerFeedback
}

/**
 * Resolve feedback (mark as addressed by business owner).
 * Requires authenticated user with business access (RLS enforced).
 */
export async function resolveFeedback(
  feedbackId: string,
  userId: string,
  internalNotes?: string
): Promise<CustomerFeedback | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_feedback')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      internal_notes: internalNotes || null,
    })
    .eq('id', feedbackId)
    .select()
    .single()

  if (error) {
    console.error('resolveFeedback error:', error)
    return null
  }

  return data as CustomerFeedback
}

/**
 * Unresolve feedback (reopen for follow-up).
 */
export async function unresolveFeedback(feedbackId: string): Promise<CustomerFeedback | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_feedback')
    .update({
      resolved_at: null,
      resolved_by: null,
    })
    .eq('id', feedbackId)
    .select()
    .single()

  if (error) {
    console.error('unresolveFeedback error:', error)
    return null
  }

  return data as CustomerFeedback
}
