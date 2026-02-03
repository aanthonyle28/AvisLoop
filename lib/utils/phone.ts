import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

export type PhoneParseResult = {
  valid: boolean
  e164?: string
  status: 'valid' | 'invalid' | 'missing'
  error?: string
}

/**
 * Parse and validate a phone number input.
 * Returns E.164 format (+15551234567) if valid.
 * Phone is optional - empty input returns { valid: true, status: 'missing' }
 */
export function parseAndValidatePhone(
  input: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): PhoneParseResult {
  // Empty = optional field, valid but missing
  if (!input || input.trim() === '') {
    return { valid: true, status: 'missing' }
  }

  try {
    const phoneNumber = parsePhoneNumber(input, defaultCountry)

    if (!phoneNumber) {
      return { valid: false, status: 'invalid', error: 'Could not parse phone number' }
    }

    if (!phoneNumber.isValid()) {
      return { valid: false, status: 'invalid', error: 'Invalid phone number' }
    }

    return {
      valid: true,
      e164: phoneNumber.format('E.164'),
      status: 'valid'
    }
  } catch {
    return { valid: false, status: 'invalid', error: 'Invalid phone format' }
  }
}

/**
 * Normalize phone number to E.164 format.
 * Returns null if invalid or empty.
 */
export function normalizePhone(
  input: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): string | null {
  const result = parseAndValidatePhone(input, defaultCountry)
  return result.e164 || null
}

/**
 * Format E.164 phone number for display.
 * Returns (512) 555-1234 for US numbers.
 * Returns +44 20 7946 0958 for international.
 */
export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return ''

  try {
    const phoneNumber = parsePhoneNumber(e164)
    if (!phoneNumber) return e164

    // US numbers: national format (512) 555-1234
    if (phoneNumber.country === 'US') {
      return phoneNumber.formatNational()
    }

    // International: +44 20 7946 0958
    return phoneNumber.formatInternational()
  } catch {
    return e164
  }
}

/**
 * Check if a phone number is valid for E.164.
 */
export function isValidE164(
  input: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): boolean {
  if (!input) return false
  return isValidPhoneNumber(input, defaultCountry)
}
