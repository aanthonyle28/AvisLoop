'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getActiveBusiness } from '@/lib/data/active-business'
import { sendReviewRequest } from './send'

const MAX_BATCH_SIZE = 25

export async function bulkResendRequests(sendLogIds: string[]): Promise<{
  success: boolean
  error?: string
  totalSuccess: number
  totalFailed: number
}> {
  if (!sendLogIds.length) {
    return { success: false, error: 'No messages selected', totalSuccess: 0, totalFailed: 0 }
  }

  if (sendLogIds.length > MAX_BATCH_SIZE) {
    return { success: false, error: `Maximum ${MAX_BATCH_SIZE} messages at a time`, totalSuccess: 0, totalFailed: 0 }
  }

  const business = await getActiveBusiness()
  if (!business) {
    return { success: false, error: 'Business not found', totalSuccess: 0, totalFailed: 0 }
  }

  const supabase = await createClient()

  // Fetch send logs to get customer_id and template_id, scoped to business
  const { data: logs, error: logsError } = await supabase
    .from('send_logs')
    .select('id, customer_id, template_id, status')
    .in('id', sendLogIds)
    .eq('business_id', business.id)

  if (logsError || !logs) {
    return { success: false, error: 'Failed to fetch send logs', totalSuccess: 0, totalFailed: 0 }
  }

  // Only resend failed/bounced/complained
  const resendable = logs.filter((l) =>
    ['failed', 'bounced', 'complained'].includes(l.status)
  )

  if (!resendable.length) {
    return { success: false, error: 'No failed messages found to retry', totalSuccess: 0, totalFailed: 0 }
  }

  let totalSuccess = 0
  let totalFailed = 0

  for (const log of resendable) {
    const formData = new FormData()
    formData.append('contactId', log.customer_id)
    if (log.template_id) {
      formData.append('templateId', log.template_id)
    }

    const result = await sendReviewRequest(null, formData)

    if (result.success) {
      totalSuccess++
    } else {
      totalFailed++
    }
  }

  revalidatePath('/history')

  return {
    success: totalSuccess > 0,
    totalSuccess,
    totalFailed,
  }
}
