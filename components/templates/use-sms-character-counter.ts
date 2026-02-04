import { useMemo } from 'react'

export interface SMSCharacterInfo {
  length: number
  limit: number
  encoding: 'GSM-7' | 'UCS-2'
  segments: number
  warning: 'none' | 'warning' | 'error'
  warningMessage: string | null
}

/**
 * Hook to calculate SMS character count, encoding, and segment count
 *
 * GSM-7 encoding:
 * - Standard characters: 160 chars/segment (1st), 153 chars/segment (2nd+)
 * - Extended characters (^{}[]\|~€): count as 2 characters
 *
 * UCS-2 encoding (Unicode):
 * - Any non-GSM character triggers UCS-2
 * - 70 chars/segment (1st), 67 chars/segment (2nd+)
 */
export function useSMSCharacterCounter(text: string): SMSCharacterInfo {
  return useMemo(() => {
    if (!text) {
      return {
        length: 0,
        limit: 160,
        encoding: 'GSM-7',
        segments: 0,
        warning: 'none',
        warningMessage: null,
      }
    }

    // GSM-7 basic character set
    const gsmBasic = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
    // GSM-7 extended characters (count as 2)
    const gsmExtended = '^{}\[~]|€'

    let encoding: 'GSM-7' | 'UCS-2' = 'GSM-7'
    let charCount = 0

    // Check each character
    for (const char of text) {
      if (gsmBasic.includes(char)) {
        charCount += 1
      } else if (gsmExtended.includes(char)) {
        charCount += 2
      } else {
        // Non-GSM character forces UCS-2 encoding
        encoding = 'UCS-2'
        break
      }
    }

    // If UCS-2, just use raw length
    if (encoding === 'UCS-2') {
      charCount = text.length
    }

    // Calculate segments
    let segments: number
    let limit: number

    if (encoding === 'GSM-7') {
      if (charCount <= 160) {
        segments = 1
        limit = 160
      } else {
        segments = Math.ceil(charCount / 153)
        limit = 153 * segments
      }
    } else {
      // UCS-2
      if (charCount <= 70) {
        segments = 1
        limit = 70
      } else {
        segments = Math.ceil(charCount / 67)
        limit = 67 * segments
      }
    }

    // Determine warning level
    let warning: 'none' | 'warning' | 'error' = 'none'
    let warningMessage: string | null = null

    if (segments > 2) {
      warning = 'error'
      warningMessage = 'Message exceeds 2 segments (may incur extra charges)'
    } else if (segments > 1) {
      warning = 'warning'
      warningMessage = 'Message will be split into multiple SMS segments'
    }

    return {
      length: charCount,
      limit,
      encoding,
      segments,
      warning,
      warningMessage,
    }
  }, [text])
}
