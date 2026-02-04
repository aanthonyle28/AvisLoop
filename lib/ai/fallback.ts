import { backOff } from 'exponential-backoff'
import { personalizeMessage, type PersonalizeResult } from './personalize'
import { checkLLMRateLimit, LLMRateLimitError } from './rate-limit'
import type { PersonalizationContext } from './prompts'

export type FallbackReason =
  | 'rate_limited'
  | 'timeout'
  | 'validation_failed'
  | 'api_error'
  | 'retry_exhausted'
  | 'missing_critical_field'

export type PersonalizeWithFallbackResult = {
  message: string
  subject?: string
  personalized: boolean
  fallbackReason?: FallbackReason
  model?: string
}

// Timeout for LLM call (3s from CONTEXT.md)
const LLM_TIMEOUT_MS = 3000

/**
 * Personalize with full fallback chain.
 * NEVER throws - always returns a result (personalized or template fallback).
 *
 * Flow:
 * 1. Check rate limit (throws if exceeded, caught and falls back)
 * 2. Try LLM personalization with timeout + retry
 * 3. Fall back to raw template on any failure
 *
 * This is the function to use in production code.
 */
export async function personalizeWithFallback(
  ctx: PersonalizationContext & { businessId: string }
): Promise<PersonalizeWithFallbackResult> {
  // Critical pre-check: Can't personalize without these
  if (!ctx.reviewLink) {
    return {
      message: ctx.template,
      personalized: false,
      fallbackReason: 'missing_critical_field',
    }
  }

  if (!ctx.customerName || !ctx.businessName) {
    return {
      message: ctx.template,
      personalized: false,
      fallbackReason: 'missing_critical_field',
    }
  }

  // Check rate limit
  try {
    await checkLLMRateLimit(ctx.businessId)
  } catch (error) {
    if (error instanceof LLMRateLimitError) {
      console.log(`LLM rate limit exceeded for business ${ctx.businessId}`)
      return {
        message: ctx.template,
        personalized: false,
        fallbackReason: 'rate_limited',
      }
    }
    // Unexpected error - fall back
    console.warn('Unexpected rate limit error:', error)
    return {
      message: ctx.template,
      personalized: false,
      fallbackReason: 'api_error',
    }
  }

  // Try personalization with retry + timeout
  try {
    const result = await backOff<PersonalizeResult>(
      () => withTimeout(personalizeMessage(ctx), LLM_TIMEOUT_MS),
      {
        numOfAttempts: 2, // Max 2 attempts (initial + 1 retry)
        startingDelay: 500, // 500ms initial delay
        timeMultiple: 2, // 500ms, 1000ms
        jitter: 'full', // Full jitter to prevent thundering herd
        retry: (error: Error) => {
          // Only retry on transient errors
          const message = error.message || ''

          // Retry on timeout
          if (message.includes('timeout') || message.includes('Timeout')) {
            return true
          }

          // Retry on rate limit from provider (429)
          if (message.includes('429') || message.includes('rate limit')) {
            return true
          }

          // Retry on server errors (5xx)
          if (
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
          ) {
            return true
          }

          // Don't retry validation failures or 4xx errors
          return false
        },
      }
    )

    return result
  } catch (error) {
    // All retries exhausted or non-retryable error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.warn('LLM personalization failed, using template fallback:', {
      error: errorMessage,
      businessId: ctx.businessId,
      channel: ctx.channel,
    })

    // Classify fallback reason
    let fallbackReason: FallbackReason = 'api_error'

    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('Timeout')
    ) {
      fallbackReason = 'timeout'
    } else if (errorMessage.includes('validation')) {
      fallbackReason = 'validation_failed'
    } else if (errorMessage.includes('retry')) {
      fallbackReason = 'retry_exhausted'
    }

    return {
      message: ctx.template,
      personalized: false,
      fallbackReason,
    }
  }
}

/**
 * Wrap a promise with a timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`))
    }, ms)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * Batch personalization for preview (multiple messages).
 * Runs in parallel with concurrency limit.
 */
export async function personalizePreviewBatch(
  contexts: Array<PersonalizationContext & { businessId: string }>,
  concurrency: number = 3
): Promise<PersonalizeWithFallbackResult[]> {
  const results: PersonalizeWithFallbackResult[] = []

  // Process in chunks for concurrency control
  for (let i = 0; i < contexts.length; i += concurrency) {
    const chunk = contexts.slice(i, i + concurrency)
    const chunkResults = await Promise.all(
      chunk.map((ctx) => personalizeWithFallback(ctx))
    )
    results.push(...chunkResults)
  }

  return results
}
