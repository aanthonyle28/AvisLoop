import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Validate environment variables
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Don't throw in dev - allow app to run without rate limiting configured
  console.warn('Upstash Redis not configured - rate limiting disabled')
}

// Create Redis client (or null if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

/**
 * Per-user rate limit for sending emails.
 * Allows 10 sends per minute to prevent abuse while allowing normal usage.
 * Returns { success: true } if not configured (dev mode bypass).
 */
export const sendRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:send',
    })
  : null

/**
 * Check rate limit for a user.
 * Returns { success: true, remaining: number } or { success: false } if limited.
 * Bypasses in development if Upstash not configured.
 */
export async function checkSendRateLimit(userId: string): Promise<{
  success: boolean
  remaining?: number
}> {
  if (!sendRatelimit) {
    // No rate limiting configured - allow all requests (dev mode)
    return { success: true, remaining: 999 }
  }

  const result = await sendRatelimit.limit(userId)
  return {
    success: result.success,
    remaining: result.remaining,
  }
}

/**
 * Per-API-key rate limit for webhook endpoints.
 * Allows 60 requests per minute to prevent abuse.
 * Returns { success: true } if not configured (dev mode bypass).
 */
export const webhookRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'ratelimit:webhook',
    })
  : null

/**
 * Check rate limit for webhook API key.
 * Returns rate limit details including remaining count, limit, and reset time.
 * Bypasses in development if Upstash not configured.
 */
export async function checkWebhookRateLimit(identifier: string): Promise<{
  success: boolean
  remaining: number
  limit: number
  reset: number
}> {
  if (!webhookRatelimit) {
    // No rate limiting configured - allow all requests (dev mode)
    return { success: true, remaining: 999, limit: 60, reset: 0 }
  }

  const result = await webhookRatelimit.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
  }
}
