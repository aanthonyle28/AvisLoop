/**
 * Monthly revision ticket limits per web design subscription tier.
 *
 * Starter:  2 revisions/month
 * Growth:   Unlimited (-1)
 * Pro:      Unlimited (-1)
 *
 * -1 means unlimited — callers must check for this value and skip enforcement.
 *
 * To change limits: edit here only — single source of truth.
 * DO NOT hardcode these values in components or data functions.
 */
export const REVISION_LIMITS: Record<string, number> = {
  starter: 2,
  growth: -1,
  pro: -1,
} as const

/** Returns true if the tier has unlimited revisions */
export function isUnlimitedTier(tier: string | null | undefined): boolean {
  if (!tier) return false
  return REVISION_LIMITS[tier] === -1
}

/** Overage fee in USD when a client exceeds their monthly limit */
export const OVERAGE_FEE_USD = 50

/** Default monthly limit for projects with no tier set (treat as starter) */
export const DEFAULT_REVISION_LIMIT = REVISION_LIMITS.starter
