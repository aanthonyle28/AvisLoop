'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { jobSchema, type CSVJobRow } from '@/lib/validations/job'
import { enrollJobInCampaign, stopEnrollmentsForJob } from '@/lib/actions/enrollment'
import { parseAndValidatePhone } from '@/lib/utils/phone'

export type JobActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }
}

export interface BulkJobCreateResult {
  success: boolean
  error?: string
  data?: {
    jobsCreated: number
    customersCreated: number
    customersLinked: number
    skipped: number
  }
}

/**
 * Create a new job for the user's business.
 * V2: Supports two modes:
 * 1. Existing customer (customerId provided)
 * 2. New customer inline (customerName + customerEmail + optional customerPhone)
 */
export async function createJob(
  _prevState: JobActionState | null,
  formData: FormData
): Promise<JobActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create jobs' }
  }

  // Get user's business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Extract form data
  const customerId = formData.get('customerId') as string | null
  const customerName = formData.get('customerName') as string | null
  const customerEmail = formData.get('customerEmail') as string | null
  const customerPhone = formData.get('customerPhone') as string | null
  const serviceType = (formData.get('serviceType') as string) || ''
  const status = (formData.get('status') as string) || 'scheduled'
  const notes = (formData.get('notes') as string) || ''
  const enrollInCampaignValue = formData.get('enrollInCampaign')
  const enrollInCampaign = enrollInCampaignValue === 'true' || enrollInCampaignValue === null
  const campaignId = formData.get('campaignId') as string | null
  const campaignOverride = formData.get('campaignOverride') as string | null

  // Defensive check: service type must be provided and valid before Zod validation
  if (!serviceType) {
    return {
      error: 'Service type is required',
      fieldErrors: { serviceType: ['Please select a service type'] },
    }
  }

  // Determine customer ID - either existing or create new
  let finalCustomerId = customerId

  if (!customerId && customerName && customerEmail) {
    // Check if customer already exists with this email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .eq('email', customerEmail.toLowerCase().trim())
      .single()

    if (existingCustomer) {
      // Customer already exists with this email - use existing
      finalCustomerId = existingCustomer.id
    } else {
      // Create new customer as side effect
      const phoneResult = customerPhone ? parseAndValidatePhone(customerPhone) : null

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          name: customerName.trim(),
          email: customerEmail.toLowerCase().trim(),
          phone: phoneResult?.e164 || customerPhone || null,
          phone_status: phoneResult?.status || 'missing',
          status: 'active',
          opted_out: false,
          sms_consent_status: 'unknown',
          tags: [],
        })
        .select('id')
        .single()

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError)
        return { error: 'Failed to create customer' }
      }

      finalCustomerId = newCustomer.id
    }
  }

  if (!finalCustomerId) {
    return {
      error: 'Customer is required',
      fieldErrors: { customerId: ['Please select or create a customer'] }
    }
  }

  // Validate job fields
  const parsed = jobSchema.safeParse({
    customerId: finalCustomerId,
    serviceType,
    status,
    notes,
    enrollInCampaign,
    campaignOverride,
  })

  if (!parsed.success) {
    console.error('[createJob] validation error:', parsed.error.flatten().fieldErrors)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  // Validate customer belongs to this business (prevent cross-tenant data leak)
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', finalCustomerId)
    .eq('business_id', business.id)
    .single()

  if (customerError || !customer) {
    return { fieldErrors: { customerId: ['Please select a valid customer'] } }
  }

  // Insert job
  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({
      business_id: business.id,
      customer_id: finalCustomerId,
      service_type: parsed.data.serviceType,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      campaign_override: parsed.data.campaignOverride,
      completed_at: parsed.data.status === 'completed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createJob] insert error:', error.code, error.message)
    return { error: error.message }
  }

  // Enroll in campaign if status is 'completed' and enrollInCampaign is true
  // Honor campaign_override: 'one_off'/'dismissed' skip enrollment, UUID targets specific campaign
  const override = parsed.data.campaignOverride
  if (parsed.data.status === 'completed' && parsed.data.enrollInCampaign !== false && override !== 'one_off' && override !== 'dismissed') {
    const effectiveCampaignId = override || campaignId
    const enrollResult = await enrollJobInCampaign(newJob.id, effectiveCampaignId ? { campaignId: effectiveCampaignId } : undefined)
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
  revalidatePath('/customers')
  revalidatePath('/dashboard')
  return { success: true, data: { id: newJob.id } }
}

/**
 * Update an existing job.
 * V2: Handles status transitions including 'scheduled' -> 'completed'
 */
export async function updateJob(
  _prevState: JobActionState | null,
  formData: FormData
): Promise<JobActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to update jobs' }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  // Extract job ID
  const jobId = formData.get('jobId') as string
  if (!jobId) {
    return { error: 'Job ID is required' }
  }

  // Parse and validate input
  const campaignOverride = formData.get('campaignOverride') as string | null
  const parsed = jobSchema.safeParse({
    customerId: formData.get('customerId'),
    serviceType: formData.get('serviceType'),
    status: formData.get('status') || 'scheduled',
    notes: formData.get('notes') || '',
    enrollInCampaign: formData.get('enrollInCampaign') === 'true' || formData.get('enrollInCampaign') === null,
    campaignOverride,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { customerId, serviceType, status, notes, enrollInCampaign } = parsed.data

  // Validate customer belongs to this business
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('business_id', business.id)
    .single()

  if (!customer) {
    return { fieldErrors: { customerId: ['Please select a valid customer'] } }
  }

  // Get current job to check status change and current campaign_override
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status, completed_at, campaign_override')
    .eq('id', jobId)
    .single()

  // Determine completed_at value based on status transition
  let completedAt: string | null = currentJob?.completed_at || null
  if (status === 'completed' && currentJob?.status !== 'completed') {
    // Status changing to completed (from scheduled or do_not_send) - set timestamp
    completedAt = new Date().toISOString()
  } else if (status === 'scheduled' || status === 'do_not_send') {
    // Status is not completed - clear timestamp
    completedAt = null
  }

  // Update job (RLS handles ownership check)
  const { error } = await supabase
    .from('jobs')
    .update({
      customer_id: customerId,
      service_type: serviceType,
      status,
      notes: notes || null,
      campaign_override: parsed.data.campaignOverride,
      completed_at: completedAt,
    })
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  const override = parsed.data.campaignOverride
  const campaignId = formData.get('campaignId') as string | null
  const wasCompleted = currentJob?.status === 'completed'
  const isNowCompleted = status === 'completed'
  const previousOverride = currentJob?.campaign_override as string | null

  // --- Enrollment / unenrollment logic ---

  // Case 1: Status moving AWAY from completed → stop any active enrollments
  if (wasCompleted && !isNowCompleted) {
    await stopEnrollmentsForJob(jobId, 'owner_stopped')
  }

  // Case 2: Already completed, campaign choice changed → stop old enrollment, maybe re-enroll
  if (wasCompleted && isNowCompleted && override !== previousOverride) {
    // Stop existing enrollments first
    await stopEnrollmentsForJob(jobId, 'owner_stopped')

    // Re-enroll if new choice is a campaign (not one_off/dismissed, not do_not_send)
    if (override !== 'one_off' && override !== 'dismissed' && enrollInCampaign !== false) {
      const effectiveCampaignId = override || campaignId
      const enrollResult = await enrollJobInCampaign(jobId, effectiveCampaignId
        ? { campaignId: effectiveCampaignId, forceCooldownOverride: true }
        : { forceCooldownOverride: true })
      if (!enrollResult.success && !enrollResult.skipped) {
        console.warn('Re-enrollment failed:', enrollResult.error)
      }
    }
  }

  // Case 3: Transitioning TO completed (fresh enrollment)
  if (!wasCompleted && isNowCompleted && enrollInCampaign !== false && override !== 'one_off' && override !== 'dismissed') {
    const effectiveCampaignId = override || campaignId
    const enrollResult = await enrollJobInCampaign(jobId, effectiveCampaignId ? { campaignId: effectiveCampaignId } : undefined)
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
  revalidatePath('/customers')
  revalidatePath('/dashboard')
  revalidatePath('/campaigns')
  return { success: true, data: { id: jobId } }
}

/**
 * Delete a job.
 */
export async function deleteJob(jobId: string): Promise<JobActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete jobs' }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  // Delete job scoped to business
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Mark job as completed (sets status and completed_at).
 * Also enrolls job in campaign by default.
 * V2: This is THE trigger for campaign automation.
 */
export async function markJobComplete(
  jobId: string,
  enrollInCampaign: boolean = true
): Promise<JobActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  // Fetch the job's campaign_override before updating
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('campaign_override')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single()

  const override = currentJob?.campaign_override as string | null

  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  // Enroll in campaign if enrollInCampaign is true (default)
  // Honor campaign_override: 'one_off'/'dismissed' skip enrollment, UUID targets specific campaign
  if (enrollInCampaign && override !== 'one_off' && override !== 'dismissed') {
    const enrollOpts = override ? { campaignId: override } : undefined
    const enrollResult = await enrollJobInCampaign(jobId, enrollOpts)

    // Don't fail the job update if enrollment fails - just log
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}

// Keep old name for backward compatibility
export const markJobCompleted = markJobComplete

/**
 * Mark job as do-not-send.
 */
export async function markJobDoNotSend(jobId: string): Promise<JobActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'do_not_send',
      completed_at: null,
    })
    .eq('id', jobId)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true }
}

/**
 * Bulk create jobs with customers (for CSV import).
 * Creates customers as side effect if they don't exist (by email).
 * Jobs are created with 'completed' status (historical import).
 * Campaign enrollment is SKIPPED for bulk imports.
 */
export async function bulkCreateJobsWithCustomers(
  rows: CSVJobRow[]
): Promise<BulkJobCreateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  // Fetch existing customers by email for deduplication
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('id, email')
    .eq('business_id', business.id)

  const existingEmailMap = new Map(
    (existingCustomers || []).map(c => [c.email.toLowerCase(), c.id])
  )

  let jobsCreated = 0
  let customersCreated = 0
  let customersLinked = 0
  let skipped = 0

  for (const row of rows) {
    try {
      const emailLower = row.customerEmail.toLowerCase()
      let customerId = existingEmailMap.get(emailLower)

      if (customerId) {
        // Link to existing customer
        customersLinked++
      } else {
        // Create new customer
        const phoneResult = row.customerPhone ? parseAndValidatePhone(row.customerPhone) : null

        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            business_id: business.id,
            name: row.customerName.trim(),
            email: emailLower.trim(),
            phone: phoneResult?.e164 || row.customerPhone || null,
            phone_status: phoneResult?.status || 'missing',
            status: 'active',
            opted_out: false,
            sms_consent_status: 'unknown',
            tags: [],
          })
          .select('id')
          .single()

        if (customerError || !newCustomer) {
          console.error('Error creating customer:', customerError)
          skipped++
          continue
        }

        customerId = newCustomer.id
        existingEmailMap.set(emailLower, customerId)
        customersCreated++
      }

      // Parse completion date (default to now if not provided)
      const completionDate = row.completionDate
        ? new Date(row.completionDate)
        : new Date()

      // Create job with completed status (historical import)
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          business_id: business.id,
          customer_id: customerId,
          service_type: row.serviceType,
          status: 'completed',  // Historical jobs are completed
          completed_at: completionDate.toISOString(),
          notes: row.notes || null,
        })

      if (jobError) {
        console.error('Error creating job:', jobError)
        skipped++
        continue
      }

      jobsCreated++

      // Note: Campaign enrollment skipped for historical imports
      // Add optional enrollInCampaign parameter if needed later
    } catch (err) {
      console.error('Error processing row:', err)
      skipped++
    }
  }

  revalidatePath('/jobs')
  revalidatePath('/customers')

  return {
    success: true,
    data: {
      jobsCreated,
      customersCreated,
      customersLinked,
      skipped,
    },
  }
}
