/**
 * Input sanitization and output validation for LLM personalization.
 * Triple-layer defense: sanitize inputs, validate outputs, detect violations.
 * Budget: <50ms total for all validation steps.
 */

// ============================================================
// Types
// ============================================================

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: ValidationFailureReason }

export type ValidationFailureReason =
  | 'missing_review_link'
  | 'missing_opt_out'
  | 'missing_business_name'
  | 'too_long'
  | 'contains_html'
  | 'contains_unknown_url'
  | 'contains_prohibited_content'
  | 'contains_profanity'
  | 'contains_unresolved_token'

// ============================================================
// LAYER 1: Input Sanitization (<1ms budget)
// ============================================================

/**
 * Sanitize user-controlled input before sending to LLM.
 * Prevents prompt injection from customer notes, tags, etc.
 */
export function sanitizeInput(raw: string): string {
  if (!raw) return ''

  let clean = raw

  // Remove common prompt injection phrases
  clean = clean
    .replace(/ignore\s+(previous|all|above)\s+instructions?/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/user\s*:/gi, '')
    .replace(/developer\s+mode/gi, '')
    .replace(/jailbreak/gi, '')
    .replace(/DAN\s+mode/gi, '')
    .replace(/pretend\s+you('re|are)/gi, '')
    .replace(/act\s+as\s+if/gi, '')

  // Detect and neutralize base64 encoded content (common evasion)
  if (/^[A-Za-z0-9+/=]{20,}$/.test(clean.trim())) {
    // Likely base64 - truncate to prevent injection
    clean = clean.slice(0, 20) + '...'
  }

  // Remove angle brackets that could confuse XML-style prompts
  clean = clean.replace(/[<>]/g, '')

  // Length limit
  return clean.slice(0, 500)
}

/**
 * Sanitize all input fields before building prompt.
 */
export function sanitizeAllInputs(input: {
  customerName: string
  businessName: string
  serviceType?: string
  technicianName?: string
  notes?: string
}): typeof input {
  return {
    customerName: sanitizeInput(input.customerName),
    businessName: sanitizeInput(input.businessName),
    serviceType: input.serviceType ? sanitizeInput(input.serviceType) : undefined,
    technicianName: input.technicianName ? sanitizeInput(input.technicianName) : undefined,
    notes: input.notes ? sanitizeInput(input.notes) : undefined,
  }
}

// ============================================================
// LAYER 3: Output Validation (<50ms budget)
// ============================================================

// Prohibited content patterns (compliance requirements)
const PROHIBITED_PATTERNS: RegExp[] = [
  // Incentive language (violates review platform policies)
  /give.{0,20}discount/i,
  /reward.{0,20}review/i,
  /gift.{0,20}card/i,
  /free.{0,20}service/i,

  // Fake urgency (manipulative)
  /limited\s+time/i,
  /act\s+now/i,
  /don'?t\s+miss/i,
  /expires?\s+(soon|today)/i,
  /hurry/i,

  // Pressure tactics (unethical)
  /must\s+(leave|write|give).{0,10}review/i,
  /only\s+if\s+(happy|satisfied|positive)/i,
  /leave\s+(?:a\s+)?5.?star/i,
  /positive\s+review/i,

  // Invented claims (false advertising)
  /award.?winning/i,
  /best\s+in\s+(town|city|area)/i,
  /#1\s+(rated|ranked)/i,
]

// Profanity and inappropriate content patterns (SC #9 compliance)
// Uses word boundary matching (\b) to avoid false positives on substrings
const PROFANITY_PATTERNS: RegExp[] = [
  // Common profanity (word boundaries to prevent substring matches)
  /\b(?:fuck|shit|damn|ass|bitch|bastard|crap|dick|piss|cock|cunt|whore|slut)\b/i,
  /\b(?:wtf|stfu|lmao|lmfao)\b/i,
  /\b(?:goddamn|motherfuck|bullshit|horseshit|dipshit|dumbass|jackass|asshole|arsehole)\b/i,

  // Variants with character substitution (l33t speak)
  /\b(?:f[u*@]ck|sh[i!1]t|b[i!1]tch|a[s$]{2})\b/i,

  // Sexual content
  /\b(?:sex(?:ual|y)|porn|nude|naked|erotic|orgasm|genital)\b/i,

  // Violence
  /\b(?:kill\s+(?:you|him|her|them)|murder|assault|rape|stab|shoot)\b/i,

  // Discriminatory language
  /\b(?:racist|sexist|homophob|transphob|bigot|supremac)\b/i,
  /\b(?:fag(?:got)?|dyke|tranny|retard(?:ed)?|spic|chink|kike|nigger|wetback)\b/i,

  // Threats
  /\b(?:threat(?:en)?|i'?ll\s+(?:hurt|harm|destroy|ruin))\b/i,

  // Drug references (inappropriate for business messages)
  /\b(?:cocaine|heroin|meth(?:amphetamine)?|marijuana|weed|drugs?)\b/i,
]

// Unresolved token patterns (template variables that weren't filled)
const UNRESOLVED_TOKEN_PATTERNS: RegExp[] = [
  /\{\{[^}]+\}\}/,  // {{variable}}
  /\[\[?[^\]]+\]?\]/,  // [[variable]] or [variable]
  /%[A-Z_]+%/,  // %VARIABLE%
]

/**
 * Validate LLM output before sending to customer.
 * All checks run in sequence with fail-fast on first error.
 */
export function validateOutput(
  output: string,
  context: {
    reviewLink: string
    businessName: string
    templateLength: number
    channel: 'email' | 'sms'
  }
): ValidationResult {
  // === Critical checks (<1ms) ===

  // 1. Review link must be present
  if (!output.includes(context.reviewLink)) {
    return { valid: false, reason: 'missing_review_link' }
  }

  // 2. Business name must be present (case-insensitive)
  if (!output.toLowerCase().includes(context.businessName.toLowerCase())) {
    return { valid: false, reason: 'missing_business_name' }
  }

  // 3. Length check (max 2x template length)
  if (output.length > context.templateLength * 2) {
    return { valid: false, reason: 'too_long' }
  }

  // === Security checks (<5ms) ===

  // 4. No HTML/script tags (XSS prevention)
  if (/<script|<iframe|<object|<embed|javascript:|on\w+=/i.test(output)) {
    return { valid: false, reason: 'contains_html' }
  }

  // 5. No unknown URLs (only review link allowed)
  const urlPattern = /https?:\/\/[^\s<>"']+/gi
  const urls = output.match(urlPattern) || []
  for (const url of urls) {
    // Allow the review link
    if (url.startsWith(context.reviewLink)) continue
    // Allow common URL fragments that might be split
    if (url.length < 10) continue
    // Unknown URL detected
    return { valid: false, reason: 'contains_unknown_url' }
  }

  // === Compliance checks (<10ms) ===

  // 6. No prohibited content
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(output)) {
      return { valid: false, reason: 'contains_prohibited_content' }
    }
  }

  // 7. No profanity or inappropriate content (LLM-08 requirement)
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(output)) {
      return { valid: false, reason: 'contains_profanity' }
    }
  }

  // 8. No unresolved template tokens
  for (const pattern of UNRESOLVED_TOKEN_PATTERNS) {
    if (pattern.test(output)) {
      return { valid: false, reason: 'contains_unresolved_token' }
    }
  }

  return { valid: true }
}

/**
 * Quick check for opt-out language in SMS.
 * Called separately since opt-out is appended after LLM output.
 */
export function hasOptOutLanguage(text: string): boolean {
  return /stop|unsubscribe|opt.?out/i.test(text)
}
