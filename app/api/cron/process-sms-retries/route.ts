import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processSmsRetryItem } from '@/lib/actions/sms-retry'
import type { SmsRetryQueueItem } from '@/lib/sms/types'

// Vercel cron authorization header
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Process SMS retry queue.
 * Called by Vercel cron every 1 minute.
 *
 * Flow:
 * 1. Authenticate via CRON_SECRET header
 * 2. Recover stuck retries (processing > 10 minutes)
 * 3. Atomically claim due retries via RPC (FOR UPDATE SKIP LOCKED)
 * 4. Process each claimed retry item
 * 5. Return structured JSON with counts for monitoring
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (if configured)
  const authHeader = request.headers.get('Authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('Invalid cron authorization')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = await createClient()

  try {
    // 1. Recover stuck retries (processing > 10 minutes)
    const { data: recovered } = await supabase.rpc('recover_stuck_sms_retries', {
      stale_minutes: 10,
    })

    if (recovered && (recovered as unknown[]).length > 0) {
      console.log(`Recovered ${(recovered as unknown[]).length} stuck SMS retries`)
    }

    // 2. Claim due retries (atomic with SKIP LOCKED)
    const { data: retries, error: claimError } = await supabase.rpc('claim_due_sms_retries', {
      limit_count: 50,
    })

    if (claimError) {
      console.error('Failed to claim SMS retries:', claimError)
      return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
    }

    if (!retries || retries.length === 0) {
      return NextResponse.json({
        processed: 0,
        success: 0,
        failed: 0,
        duration: Date.now() - startTime,
      })
    }

    console.log(`Claimed ${retries.length} SMS retries for processing`)

    // 3. Process each retry
    let successCount = 0
    let failedCount = 0

    for (const retry of retries as SmsRetryQueueItem[]) {
      try {
        const result = await processSmsRetryItem(retry)
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
      } catch (error) {
        console.error(`Error processing retry ${retry.id}:`, error)
        failedCount++

        // Mark as failed to prevent infinite loop
        await supabase
          .from('sms_retry_queue')
          .update({
            status: 'failed',
            last_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', retry.id)
      }
    }

    const duration = Date.now() - startTime
    console.log(`SMS retry cron complete: ${successCount} success, ${failedCount} failed, ${duration}ms`)

    return NextResponse.json({
      processed: retries.length,
      success: successCount,
      failed: failedCount,
      duration,
    })
  } catch (error) {
    console.error('SMS retry cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
