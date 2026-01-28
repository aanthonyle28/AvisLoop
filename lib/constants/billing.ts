// Billing tier configuration
// Single source of truth for all billing-related constants

export const TIER_LIMITS = {
  trial: { sends: 25, contacts: Infinity },
  basic: { sends: 200, contacts: 200 },
  pro: { sends: 500, contacts: Infinity },
} as const

export const MONTHLY_SEND_LIMITS: Record<string, number> = {
  trial: 25,
  basic: 200,
  pro: 500,
}

export const COOLDOWN_DAYS = 14

export type TierName = keyof typeof TIER_LIMITS
