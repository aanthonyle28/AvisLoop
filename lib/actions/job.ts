'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { jobSchema } from '@/lib/validations/job'
import { enrollJobInCampaign } from '@/lib/actions/enrollment'

export type JobActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }
}

/**
 * Create a new job for the user's business.
 * Validates customer belongs to same business.
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

  // Parse and validate input
  const parsed = jobSchema.safeParse({
    customerId: formData.get('customerId'),
    serviceType: formData.get('serviceType'),
    status: formData.get('status') || 'completed',
    notes: formData.get('notes') || '',
    enrollInCampaign: formData.get('enrollInCampaign') === 'true' || formData.get('enrollInCampaign') === null,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { customerId, serviceType, status, notes, enrollInCampaign } = parsed.data

  // Validate customer belongs to this business (prevent cross-tenant data leak)
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
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
      customer_id: customerId,
      service_type: serviceType,
      status,
      notes: notes || null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Enroll in campaign if status is 'completed' and enrollInCampaign is true
  if (status === 'completed' && enrollInCampaign !== false) {
    // enrollInCampaign defaults to true if not specified
    // enrollJobInCampaign handles:
    // - Finding matching campaign (service-type specific or "all services")
    // - Checking 30-day cooldown
    // - Canceling existing enrollments (repeat job)
    // - Calculating touch 1 timing from business's service_type_timing (SVCT-03)
    const enrollResult = await enrollJobInCampaign(newJob.id)

    // Don't fail the job creation if enrollment fails - just log
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
  return { success: true, data: { id: newJob.id } }
}

/**
 * Update an existing job.
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
  const parsed = jobSchema.safeParse({
    customerId: formData.get('customerId'),
    serviceType: formData.get('serviceType'),
    status: formData.get('status') || 'completed',
    notes: formData.get('notes') || '',
    enrollInCampaign: formData.get('enrollInCampaign') === 'true' || formData.get('enrollInCampaign') === null,
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

  // Get current job to check status change
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status, completed_at')
    .eq('id', jobId)
    .single()

  // Determine completed_at value
  let completedAt: string | null = currentJob?.completed_at || null
  if (status === 'completed' && currentJob?.status !== 'completed') {
    // Status changing to completed - set timestamp
    completedAt = new Date().toISOString()
  } else if (status === 'do_not_send') {
    // Status is do_not_send - clear timestamp
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
      completed_at: completedAt,
    })
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  // Enroll in campaign if status changed to 'completed' and enrollInCampaign is true
  if (status === 'completed' && currentJob?.status !== 'completed' && enrollInCampaign !== false) {
    // enrollInCampaign defaults to true if not specified
    // enrollJobInCampaign handles:
    // - Finding matching campaign (service-type specific or "all services")
    // - Checking 30-day cooldown
    // - Canceling existing enrollments (repeat job)
    // - Calculating touch 1 timing from business's service_type_timing (SVCT-03)
    const enrollResult = await enrollJobInCampaign(jobId)

    // Don't fail the job update if enrollment fails - just log
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
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

  // Delete job (RLS handles ownership check)
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true }
}

/**
 * Mark job as completed (sets status and completed_at).
 * Also enrolls job in campaign by default.
 */
export async function markJobCompleted(
  jobId: string,
  enrollInCampaign: boolean = true
): Promise<JobActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  // Enroll in campaign if enrollInCampaign is true (default)
  if (enrollInCampaign) {
    const enrollResult = await enrollJobInCampaign(jobId)

    // Don't fail the job update if enrollment fails - just log
    if (!enrollResult.success && !enrollResult.skipped) {
      console.warn('Enrollment failed:', enrollResult.error)
    }
  }

  revalidatePath('/jobs')
  return { success: true }
}

/**
 * Mark job as do-not-send.
 */
export async function markJobDoNotSend(jobId: string): Promise<JobActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'do_not_send',
      completed_at: null,
    })
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true }
}
