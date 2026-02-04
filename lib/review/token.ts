import { randomBytes } from 'crypto'

// Token expiration: 30 days in milliseconds
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export interface ReviewTokenPayload {
  customerId: string
  businessId: string
  enrollmentId?: string
  timestamp: number
}

/**
 * Generate a secure, URL-safe review token.
 * Token encodes customer, business, and optional enrollment IDs with timestamp.
 * Uses cryptographically secure random data to prevent guessing.
 *
 * @example
 * const token = generateReviewToken({
 *   customerId: 'uuid-1',
 *   businessId: 'uuid-2',
 *   enrollmentId: 'uuid-3'
 * })
 * // Returns: base64url encoded string like "dXVpZC0xOnV1aWQtMjp1dWlkLTM6MTcwNDEyMzQ1Njc4OTphYmNkZWYxMjM0NTY3ODkw"
 */
export function generateReviewToken(params: {
  customerId: string
  businessId: string
  enrollmentId?: string
}): string {
  const timestamp = Date.now()
  const random = randomBytes(16).toString('hex')

  // Format: customerId:businessId:enrollmentId:timestamp:random
  // enrollmentId is empty string if not provided
  const payload = [
    params.customerId,
    params.businessId,
    params.enrollmentId || '',
    timestamp.toString(),
    random,
  ].join(':')

  // Use base64url encoding for URL safety (no +, /, or = padding issues)
  return Buffer.from(payload).toString('base64url')
}

/**
 * Parse and validate a review token.
 * Returns null if token is invalid, expired, or malformed.
 * Does NOT throw exceptions - callers check for null.
 *
 * @example
 * const data = parseReviewToken(token)
 * if (!data) {
 *   return notFound()
 * }
 * const { customerId, businessId, enrollmentId } = data
 */
export function parseReviewToken(token: string): ReviewTokenPayload | null {
  try {
    // Decode base64url
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')

    // Expect 5 parts: customerId, businessId, enrollmentId, timestamp, random
    if (parts.length !== 5) {
      return null
    }

    const [customerId, businessId, enrollmentId, timestampStr] = parts
    const timestamp = parseInt(timestampStr, 10)

    // Validate timestamp is a number
    if (isNaN(timestamp)) {
      return null
    }

    // Check token age (30 days max)
    const age = Date.now() - timestamp
    if (age > TOKEN_EXPIRY_MS) {
      console.log('Review token expired:', { age: Math.floor(age / 1000 / 60 / 60), hours: 'hours' })
      return null
    }

    // Validate required fields are non-empty
    if (!customerId || !businessId) {
      return null
    }

    return {
      customerId,
      businessId,
      enrollmentId: enrollmentId || undefined,
      timestamp,
    }
  } catch (error) {
    // Any parsing error returns null (don't expose internals)
    console.error('Token parse error:', error)
    return null
  }
}

/**
 * Check if a token is still valid (not expired).
 * Useful for quick expiration checks without full parsing.
 */
export function isTokenExpired(token: string): boolean {
  const data = parseReviewToken(token)
  return data === null
}

/**
 * Get the review page URL for a given token.
 * Uses NEXT_PUBLIC_SITE_URL for proper domain handling.
 */
export function getReviewUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/r/${token}`
}
