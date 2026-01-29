// server-only
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

/**
 * Generates a new API key with secure hashing.
 * Returns both the plaintext key (show to user ONCE) and the hash (store in DB).
 */
export async function generateApiKey(): Promise<{ key: string; hash: string }> {
  // Generate 32 random bytes (64 hex chars)
  const hex = randomBytes(32).toString('hex')

  // Prefix for identification
  const key = `sk_${hex}`

  // Generate salt for hashing
  const salt = randomBytes(16).toString('hex')

  // Hash the raw hex (not the sk_ prefix)
  const hashBuffer = (await scryptAsync(hex, salt, 64)) as Buffer
  const hashHex = hashBuffer.toString('hex')

  // Return key and hash in format: salt:hash
  return {
    key,
    hash: `${salt}:${hashHex}`,
  }
}

/**
 * Verifies an API key against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyApiKey(
  providedKey: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Strip sk_ prefix
    if (!providedKey.startsWith('sk_')) {
      return false
    }
    const hex = providedKey.slice(3)

    // Split stored hash into salt and hash
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) {
      return false
    }

    // Hash the provided key with the same salt
    const hashBuffer = (await scryptAsync(hex, salt, 64)) as Buffer

    // Compare using timing-safe comparison
    const storedHashBuffer = Buffer.from(hash, 'hex')

    return timingSafeEqual(hashBuffer, storedHashBuffer)
  } catch {
    // Any error in verification = invalid key
    return false
  }
}
