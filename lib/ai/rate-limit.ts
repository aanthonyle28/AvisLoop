import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// LLM rate limit per business: 100 calls/hour
// Matches CONTEXT.md "Rate limiting per business: 100 LLM calls/hour"
const LLM_RATE_LIMIT = 100
const LLM_RATE_WINDOW = '1 h' as const

// Lazy-initialized rate limiter (only if Redis configured)
let llmRateLimiter: Ratelimit | null = null

function getLLMRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null // Dev mode bypass
  }

  if (!llmRateLimiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    llmRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LLM_RATE_LIMIT, LLM_RATE_WINDOW),
      analytics: true,
      prefix: 'ratelimit:llm',
    })
  }

  return llmRateLimiter
}

export class LLMRateLimitError extends Error {
  constructor(
    public readonly businessId: string,
    public readonly remaining: number,
    public readonly resetAt: Date
  ) {
    super(`LLM rate limit exceeded for business ${businessId}`)
    this.name = 'LLMRateLimitError'
  }
}

/**
 * Check LLM rate limit for a business.
 * Returns remaining count if within limit.
 * Throws LLMRateLimitError if exceeded.
 *
 * @throws LLMRateLimitError if rate limit exceeded
 */
export async function checkLLMRateLimit(businessId: string): Promise<{
  remaining: number
  resetAt: Date
}> {
  const limiter = getLLMRateLimiter()

  if (!limiter) {
    // No rate limiting configured (dev mode)
    return { remaining: 999, resetAt: new Date() }
  }

  const { success, remaining, reset } = await limiter.limit(businessId)
  const resetAt = new Date(reset)

  if (!success) {
    throw new LLMRateLimitError(businessId, remaining, resetAt)
  }

  return { remaining, resetAt }
}

/**
 * Get current LLM usage for a business (for analytics/UI).
 * Does not decrement counter.
 */
export async function getLLMUsage(businessId: string): Promise<{
  used: number
  limit: number
  remaining: number
  resetAt: Date
} | null> {
  const limiter = getLLMRateLimiter()

  if (!limiter) {
    return null // Rate limiting not configured
  }

  // Use getRemaining to check without consuming
  const { remaining, reset } = await limiter.getRemaining(businessId)

  return {
    used: LLM_RATE_LIMIT - remaining,
    limit: LLM_RATE_LIMIT,
    remaining,
    resetAt: new Date(reset),
  }
}
