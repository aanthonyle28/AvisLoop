import { randomBytes, createHmac, timingSafeEqual } from 'crypto'

// Token expiration: 30 days in milliseconds
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

// HMAC secret — falls back to a random key per process to avoid crash,
// but production MUST set REVIEW_TOKEN_SECRET for token portability across deploys.
const TOKEN_SECRET = process.env.REVIEW_TOKEN_SECRET || randomBytes(32).toString('hex')

if (!process.env.REVIEW_TOKEN_SECRET) {
  console.warn('REVIEW_TOKEN_SECRET not set — review tokens will not survive redeploys')
}

export interface ReviewTokenPayload {
  customerId: string
  businessId: string
  enrollmentId?: string
  timestamp: number
}

/**
 * Compute HMAC-SHA256 signature for a token payload.
 */
function signPayload(payload: string): string {
  return createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex')
}

/**
 * Generate a secure, URL-safe review token with HMAC signature.
 * Token encodes customer, business, and optional enrollment IDs with timestamp.
 * HMAC prevents forgery even if token structure is known.
 *
 * Format: base64url(customerId:businessId:enrollmentId:timestamp:random:hmac)
 */
export function generateReviewToken(params: {
  customerId: string
  businessId: string
  enrollmentId?: string
}): string {
  const timestamp = Date.now()
  const random = randomBytes(16).toString('hex')

  // Payload without signature
  const payload = [
    params.customerId,
    params.businessId,
    params.enrollmentId || '',
    timestamp.toString(),
    random,
  ].join(':')

  // Sign the payload
  const hmac = signPayload(payload)

  // Append signature
  const signedPayload = payload + ':' + hmac

  return Buffer.from(signedPayload).toString('base64url')
}

/**
 * Parse and validate a review token.
 * Verifies HMAC signature, expiration, and structure.
 * Returns null if token is invalid, expired, forged, or malformed.
 */
export function parseReviewToken(token: string): ReviewTokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')

    // Expect 6 parts: customerId, businessId, enrollmentId, timestamp, random, hmac
    if (parts.length !== 6) {
      return null
    }

    const [customerId, businessId, enrollmentId, timestampStr, random, hmac] = parts

    // Reconstruct payload (without hmac) and verify signature
    const payload = [customerId, businessId, enrollmentId, timestampStr, random].join(':')
    const expectedHmac = signPayload(payload)

    // Timing-safe comparison to prevent timing attacks
    const hmacBuffer = Buffer.from(hmac, 'utf-8')
    const expectedBuffer = Buffer.from(expectedHmac, 'utf-8')
    if (hmacBuffer.length !== expectedBuffer.length || !timingSafeEqual(hmacBuffer, expectedBuffer)) {
      return null
    }

    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) {
      return null
    }

    // Check token age (30 days max)
    const age = Date.now() - timestamp
    if (age > TOKEN_EXPIRY_MS) {
      return null
    }

    if (!customerId || !businessId) {
      return null
    }

    return {
      customerId,
      businessId,
      enrollmentId: enrollmentId || undefined,
      timestamp,
    }
  } catch {
    return null
  }
}

/**
 * Check if a token is still valid (not expired).
 */
export function isTokenExpired(token: string): boolean {
  const data = parseReviewToken(token)
  return data === null
}

/**
 * Get the review page URL for a given token.
 */
export function getReviewUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/r/${token}`
}
