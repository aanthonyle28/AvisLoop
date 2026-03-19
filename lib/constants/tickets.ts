/**
 * Monthly revision ticket limits per web design subscription tier.
 *
 * Basic:    2 revisions/month
 * Advanced: 4 revisions/month
 *
 * To change limits: edit here only — single source of truth.
 * DO NOT hardcode these values in components or data functions.
 */
export const REVISION_LIMITS: Record<string, number> = {
  basic: 2,
  advanced: 4,
} as const

/** Overage fee in USD when a client exceeds their monthly limit */
export const OVERAGE_FEE_USD = 50

/** Default monthly limit for projects with no tier set (treat as basic) */
export const DEFAULT_REVISION_LIMIT = REVISION_LIMITS.basic
