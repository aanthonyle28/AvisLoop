import { createClient } from '@/lib/supabase/server'
import { getLLMUsage } from '@/lib/ai/rate-limit'
import { MODEL_COSTS, MODELS } from '@/lib/ai/client'

// -----------------------------------------------------------------------
// Personalization Stats Data Functions
//
// MVP: Personalization rate is ESTIMATED at 95% because we don't yet have
// a per-send-log column tracking whether personalization was applied.
//
// TODO (25-07 or later): Add `personalized` boolean column to send_logs.
// Once that column exists, replace estimation with actual data:
//   - Query: SELECT COUNT(*) FILTER (WHERE personalized) / COUNT(*) FROM send_logs
//   - Remove isEstimated flag once real data is available
// -----------------------------------------------------------------------

// Average token estimates per personalization call
// Based on typical review request message length and LLM response
const AVG_INPUT_TOKENS = 350   // System prompt (~200) + user prompt (~150)
const AVG_OUTPUT_TOKENS = 150  // Personalized message body

// Model distribution for cost weighting (from CONTEXT.md)
const MODEL_DISTRIBUTION = {
  [MODELS.GEMINI_FLASH]: 0.70,  // 70% of calls
  [MODELS.GPT_4O_MINI]: 0.25,   // 25% of calls
  [MODELS.DEEPSEEK_V3]: 0.05,   // 5% of calls
} as const

/** Stats about personalization performance for a business. */
export interface PersonalizationStats {
  /** Percentage of sends that were personalized (0-100) */
  personalizationRate: number
  /** Whether the rate is estimated vs actual data */
  isEstimated: boolean
  /** Total campaign sends in the period */
  campaignSendsThisWeek: number
  /** Total campaign sends that used personalization (estimated) */
  personalizedSendsThisWeek: number
  /** Estimated fallback rate (100 - personalizationRate) */
  fallbackRate: number
}

/** LLM usage stats (rate limit consumption). */
export interface LLMUsageStats {
  /** Calls used in current window */
  used: number
  /** Total limit per window */
  limit: number
  /** Remaining calls */
  remaining: number
  /** When the window resets */
  resetAt: Date
  /** Usage percentage (0-100) */
  usagePercent: number
  /** Whether rate limiting is configured */
  isConfigured: boolean
}

/** Cost estimate for LLM personalization. */
export interface CostEstimate {
  /** Estimated cost per LLM call in USD */
  costPerCall: number
  /** Estimated monthly cost in USD based on current volume */
  estimatedMonthlyCost: number
  /** Whether the estimate is based on actual data or projections */
  isProjection: boolean
  /** Weekly send volume used for projection */
  weeklyVolume: number
}

/** Combined personalization summary for settings/dashboard. */
export interface PersonalizationSummary {
  stats: PersonalizationStats
  usage: LLMUsageStats
  /** Health assessment based on stats */
  health: 'great' | 'good' | 'degraded'
  /** Human-readable health message */
  healthMessage: string
  costEstimate: CostEstimate
}

// MVP estimated personalization rate (95% success rate based on
// production LLM reliability with fallback chain)
const ESTIMATED_PERSONALIZATION_RATE = 95

/**
 * Calculate estimated cost per LLM call based on weighted model distribution.
 * Returns cost in USD.
 */
function calculateWeightedCostPerCall(): number {
  let totalCost = 0

  for (const [modelId, weight] of Object.entries(MODEL_DISTRIBUTION)) {
    const costs = MODEL_COSTS[modelId as keyof typeof MODEL_COSTS]
    if (!costs) continue

    const inputCost = (AVG_INPUT_TOKENS / 1_000_000) * costs.input
    const outputCost = (AVG_OUTPUT_TOKENS / 1_000_000) * costs.output
    totalCost += (inputCost + outputCost) * weight
  }

  return totalCost
}

/**
 * Estimate monthly cost based on weekly send volume.
 * Assumes consistent weekly volume projected over 4.3 weeks/month.
 */
function estimateMonthlyCost(weeklySends: number): number {
  const costPerCall = calculateWeightedCostPerCall()
  const monthlyProjectedCalls = weeklySends * 4.3  // ~4.3 weeks per month
  return monthlyProjectedCalls * costPerCall
}

/**
 * Get personalization stats for the given business.
 * MVP: Estimates personalization rate at 95% since we don't track
 * per-send personalization status yet.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 *
 * TODO: Replace estimation with actual data once send_logs has
 * a `personalized` boolean column.
 */
export async function getPersonalizationStats(businessId: string): Promise<PersonalizationStats> {
  const supabase = await createClient()

  // Get campaign sends from the last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .not('campaign_id', 'is', null) // Only campaign sends (not manual)
    .gte('created_at', weekAgo.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  const campaignSendsThisWeek = count || 0

  // MVP: Estimate personalized count at 95% of campaign sends
  const personalizedSendsThisWeek = Math.round(
    campaignSendsThisWeek * (ESTIMATED_PERSONALIZATION_RATE / 100)
  )

  return {
    personalizationRate: campaignSendsThisWeek > 0
      ? ESTIMATED_PERSONALIZATION_RATE
      : 0,
    isEstimated: true,
    campaignSendsThisWeek,
    personalizedSendsThisWeek,
    fallbackRate: campaignSendsThisWeek > 0
      ? 100 - ESTIMATED_PERSONALIZATION_RATE
      : 0,
  }
}

/**
 * Get LLM usage stats for the given business.
 * Wraps getLLMUsage from rate-limit.ts with percentage calculation.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getLLMUsageStats(businessId: string): Promise<LLMUsageStats> {
  const usage = await getLLMUsage(businessId)

  if (!usage) {
    // Rate limiting not configured (dev mode or missing Redis)
    return emptyUsage()
  }

  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    resetAt: usage.resetAt,
    usagePercent: usage.limit > 0
      ? Math.round((usage.used / usage.limit) * 100)
      : 0,
    isConfigured: true,
  }
}

/**
 * Get combined personalization summary for dashboard/settings.
 * Merges stats + usage into a single object with health assessment.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getPersonalizationSummary(businessId: string): Promise<PersonalizationSummary> {
  const [stats, usage] = await Promise.all([
    getPersonalizationStats(businessId),
    getLLMUsageStats(businessId),
  ])

  // Determine health based on personalization rate and usage
  let health: PersonalizationSummary['health'] = 'great'
  let healthMessage = 'Personalization is working great'

  if (stats.campaignSendsThisWeek === 0) {
    health = 'good'
    healthMessage = 'No campaign sends this week'
  } else if (stats.personalizationRate < 80) {
    health = 'degraded'
    healthMessage = 'Higher than usual fallback rate - messages may not be personalized'
  } else if (stats.personalizationRate < 95) {
    health = 'good'
    healthMessage = 'Personalization is working well with occasional fallbacks'
  }

  // Override if usage is near capacity
  if (usage.isConfigured && usage.usagePercent > 90) {
    health = 'degraded'
    healthMessage = 'Approaching LLM rate limit - some messages may use template fallback'
  }

  // Calculate cost estimate
  const costPerCall = calculateWeightedCostPerCall()
  const costEstimate: CostEstimate = {
    costPerCall,
    estimatedMonthlyCost: estimateMonthlyCost(stats.campaignSendsThisWeek),
    isProjection: true,
    weeklyVolume: stats.campaignSendsThisWeek,
  }

  return {
    stats,
    usage,
    health,
    healthMessage,
    costEstimate,
  }
}

/** Empty usage for unconfigured rate limiting. */
function emptyUsage(): LLMUsageStats {
  return {
    used: 0,
    limit: 0,
    remaining: 0,
    resetAt: new Date(),
    usagePercent: 0,
    isConfigured: false,
  }
}
