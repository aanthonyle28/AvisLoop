import { useMemo } from 'react'

/**
 * GSM-7 character set regex (standard SMS encoding).
 * Characters outside this set require Unicode (UCS-2) encoding.
 */
const GSM7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà\^{}\\\[~\]|€]*$/

/**
 * Detects if text uses GSM-7 encoding or requires Unicode.
 * GSM-7: 160 chars per segment
 * Unicode: 70 chars per segment
 */
function detectEncoding(text: string): 'GSM-7' | 'Unicode' {
  return GSM7_REGEX.test(text) ? 'GSM-7' : 'Unicode'
}

/**
 * Warning level based on character count.
 */
type WarningLevel = 'none' | 'warning' | 'danger'

interface SMSCharacterCountResult {
  length: number
  limit: number
  segments: number
  remaining: number
  encoding: 'GSM-7' | 'Unicode'
  warning: WarningLevel
  warningMessage: string | null
}

/**
 * Hook to count SMS characters with GSM-7 vs Unicode detection.
 * Provides warnings at 140+ chars (yellow) and 160+ chars (red).
 */
export function useSMSCharacterCounter(text: string): SMSCharacterCountResult {
  return useMemo(() => {
    const length = text.length
    const encoding = detectEncoding(text)

    // Segment limits depend on encoding
    const singleSegmentLimit = encoding === 'GSM-7' ? 160 : 70
    const multiSegmentLimit = encoding === 'GSM-7' ? 153 : 67 // Concatenation uses some bytes

    // Calculate segments
    let segments: number
    if (length === 0) {
      segments = 0
    } else if (length <= singleSegmentLimit) {
      segments = 1
    } else {
      segments = Math.ceil(length / multiSegmentLimit)
    }

    // Calculate effective limit for current segment count
    const limit = segments <= 1 ? singleSegmentLimit : multiSegmentLimit * segments
    const remaining = limit - length

    // Warning levels
    let warning: WarningLevel = 'none'
    let warningMessage: string | null = null

    if (length >= 160) {
      warning = 'danger'
      warningMessage = `Using ${segments} SMS segments (higher cost)`
    } else if (length >= 140) {
      warning = 'warning'
      warningMessage = `Approaching ${singleSegmentLimit} character limit`
    }

    return {
      length,
      limit,
      segments,
      remaining,
      encoding,
      warning,
      warningMessage,
    }
  }, [text])
}
