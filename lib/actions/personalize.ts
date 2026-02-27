'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'
import {
  personalizeWithFallback,
  personalizePreviewBatch,
  type PersonalizeWithFallbackResult,
} from '@/lib/ai/fallback'
import type { PersonalizationContext } from '@/lib/ai/prompts'

// ============================================================
// Types
// ============================================================

export type PersonalizePreviewResult = {
  error?: string
  success?: boolean
  data?: {
    original: string
    personalized: string
    subject?: string
    personalizedSubject?: string
    wasPersonalized: boolean
    fallbackReason?: string
    model?: string
  }
}

export type PersonalizePreviewBatchResult = {
  error?: string
  success?: boolean
  data?: {
    samples: Array<{
      customerId: string
      customerName: string
      isRepeatCustomer: boolean
      original: string
      personalized: string
      subject?: string
      personalizedSubject?: string
      wasPersonalized: boolean
      fallbackReason?: string
      model?: string
    }>
  }
}

// ============================================================
// Single Preview Action
// ============================================================

/**
 * Personalize a single template for a specific customer.
 * Returns both original and personalized versions for comparison.
 *
 * Used by preview UI to show before/after personalization.
 */
export async function personalizePreview(input: {
  templateBody: string
  templateSubject?: string
  customerId: string
  channel: 'email' | 'sms'
  touchNumber?: number
  serviceType?: string
}): Promise<PersonalizePreviewResult> {
  const business = await getActiveBusiness()
  if (!business) return { error: 'Business not found' }

  const supabase = await createClient()

  // Fetch additional business fields needed for personalization
  const { data: bizData } = await supabase
    .from('businesses')
    .select('name, google_review_link')
    .eq('id', business.id)
    .single()

  if (!bizData) return { error: 'Business not found' }

  if (!bizData.google_review_link) {
    return { error: 'Google review link not configured. Set it in business settings.' }
  }

  // === Get customer (RLS-safe: scoped to business) ===
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, send_count')
    .eq('id', input.customerId)
    .eq('business_id', business.id)
    .single()

  if (!customer) return { error: 'Customer not found' }

  // === Build personalization context ===
  const ctx: PersonalizationContext & { businessId: string } = {
    template: input.templateBody,
    customerName: customer.name,
    businessName: bizData.name,
    serviceType: input.serviceType,
    touchNumber: (input.touchNumber || 1) as 1 | 2 | 3 | 4,
    channel: input.channel,
    reviewLink: bizData.google_review_link,
    isRepeatCustomer: (customer.send_count || 0) > 1,
    businessId: business.id,
  }

  // === Call personalization ===
  const result = await personalizeWithFallback(ctx)

  return {
    success: true,
    data: {
      original: input.templateBody,
      personalized: result.message,
      subject: input.templateSubject,
      personalizedSubject: result.subject,
      wasPersonalized: result.personalized,
      fallbackReason: result.fallbackReason,
      model: result.model,
    },
  }
}

// ============================================================
// Batch Preview Action
// ============================================================

/**
 * Personalize a template for 3-5 sample customers.
 * Returns diverse samples (mix of repeat + new customers) for UI display.
 *
 * Used by preview UI to show how personalization varies across customers.
 */
export async function personalizePreviewBatchAction(input: {
  templateBody: string
  templateSubject?: string
  channel: 'email' | 'sms'
  touchNumber?: number
  serviceType?: string
}): Promise<PersonalizePreviewBatchResult> {
  const business = await getActiveBusiness()
  if (!business) return { error: 'Business not found' }

  const supabase = await createClient()

  // Fetch additional business fields needed for personalization
  const { data: bizData } = await supabase
    .from('businesses')
    .select('name, google_review_link')
    .eq('id', business.id)
    .single()

  if (!bizData) return { error: 'Business not found' }

  if (!bizData.google_review_link) {
    return { error: 'Google review link not configured. Set it in business settings.' }
  }

  // === Get diverse sample customers ===
  // Fetch up to 5 active customers: mix of repeat (send_count > 1) and new
  const { data: repeatCustomers } = await supabase
    .from('customers')
    .select('id, name, send_count')
    .eq('business_id', business.id)
    .eq('status', 'active')
    .eq('opted_out', false)
    .gt('send_count', 1)
    .order('send_count', { ascending: false })
    .limit(2)

  const { data: newCustomers } = await supabase
    .from('customers')
    .select('id, name, send_count')
    .eq('business_id', business.id)
    .eq('status', 'active')
    .eq('opted_out', false)
    .lte('send_count', 1)
    .order('created_at', { ascending: false })
    .limit(3)

  const sampleCustomers = [
    ...(repeatCustomers || []),
    ...(newCustomers || []),
  ].slice(0, 5)

  if (sampleCustomers.length === 0) {
    return { error: 'No active customers found for preview' }
  }

  // === Build contexts for batch personalization ===
  const contexts: Array<PersonalizationContext & { businessId: string }> =
    sampleCustomers.map((customer) => ({
      template: input.templateBody,
      customerName: customer.name,
      businessName: bizData.name,
      serviceType: input.serviceType,
      touchNumber: (input.touchNumber || 1) as 1 | 2 | 3 | 4,
      channel: input.channel,
      reviewLink: bizData.google_review_link!,
      isRepeatCustomer: (customer.send_count || 0) > 1,
      businessId: business.id,
    }))

  // === Run batch personalization (concurrency-limited) ===
  const results = await personalizePreviewBatch(contexts, 3)

  // === Map results to samples ===
  const samples = sampleCustomers.map((customer, index) => {
    const result = results[index] as PersonalizeWithFallbackResult
    return {
      customerId: customer.id,
      customerName: customer.name,
      isRepeatCustomer: (customer.send_count || 0) > 1,
      original: input.templateBody,
      personalized: result.message,
      subject: input.templateSubject,
      personalizedSubject: result.subject,
      wasPersonalized: result.personalized,
      fallbackReason: result.fallbackReason,
      model: result.model,
    }
  })

  return {
    success: true,
    data: { samples },
  }
}
