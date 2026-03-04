/**
 * Reputation scoring algorithm for the Audit Lead-Gen Tool.
 * Pure functions — no side effects, no DB calls, no API calls.
 *
 * Score breakdown:
 *   - Rating score:  0-60 points (based on Google star rating)
 *   - Volume score:  0-40 points (based on review count)
 *   - Total:         0-100 points → A/B/C/D/F grade
 */

import type { Grade, GapAnalysis, ReputationScore } from './types'

/**
 * Map a Google star rating to 0-60 points.
 *
 * Formula: Math.max(0, (rating - 2.0) / 3.0) * 60, rounded to nearest integer.
 * - 5.0 stars → 60 points
 * - 4.8 stars → 56 points  (note: 60 is only achievable at 5.0)
 * - 4.0 stars → 40 points
 * - 2.0 stars →  0 points
 * - null      →  0 points
 */
export function scoreRating(rating: number | null): number {
  if (rating === null || rating === undefined) return 0
  return Math.round(Math.max(0, (rating - 2.0) / 3.0) * 60)
}

/**
 * Map a review count to 0-40 points using tiered lookup.
 * Tiers reflect competitive thresholds in the home services market.
 */
export function scoreVolume(count: number | null): number {
  if (count === null || count === undefined) return 0
  if (count >= 200) return 40
  if (count >= 100) return 32
  if (count >= 50) return 24
  if (count >= 25) return 16
  if (count >= 10) return 8
  if (count >= 5) return 4
  return 0
}

/**
 * Convert a numeric score (0-100) to an A-F letter grade.
 *
 * Thresholds:
 *   85+ → A  (strong reputation, little room for improvement)
 *   70+ → B  (solid reputation, some gaps)
 *   55+ → C  (average, meaningful improvement possible)
 *   40+ → D  (below average, significant risk)
 *   <40 → F  (poor reputation, urgent action needed)
 */
export function scoreToGrade(score: number): Grade {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

/**
 * Compute a full ReputationScore from raw Google Places data.
 *
 * Generates actionable gap analysis items based on how the business
 * compares to home services benchmarks.
 *
 * Example traces:
 *   computeReputationScore(4.8, 200) → score=56+40=96, grade=A, gaps=[]
 *   computeReputationScore(3.5, 8)   → score=30+8=38,  grade=F, gaps=[rating, volume, critical, lowVisibility]
 *   computeReputationScore(null, null) → score=0, grade=F, gaps=[rating, volume, lowVisibility]
 */
export function computeReputationScore(
  rating: number | null,
  userRatingCount: number | null,
): ReputationScore {
  const ratingScore = scoreRating(rating)
  const volumeScore = scoreVolume(userRatingCount)
  const score = ratingScore + volumeScore
  const grade = scoreToGrade(score)

  const gaps: GapAnalysis[] = []

  // Critical rating check — must come before general rating gap check
  if (rating !== null && rating < 4.0) {
    gaps.push({
      area: 'Critical Rating Risk',
      current: `${rating.toFixed(1)} stars`,
      benchmark: '4.0+ stars minimum to appear in local pack',
      recommendation:
        'Prioritize responding to all negative reviews professionally and actively request reviews from satisfied customers immediately. Ratings below 4.0 suppress Google Maps visibility.',
    })
  }

  // General rating gap
  if (rating === null || rating < 4.5) {
    gaps.push({
      area: 'Star Rating',
      current: rating !== null ? `${rating.toFixed(1)} stars` : 'No rating',
      benchmark: '4.8 stars, home services median',
      recommendation:
        'A systematic follow-up sequence sent 4-24 hours after job completion significantly increases 5-star review rates. Businesses using automated sequences average 4.7+ stars within 6 months.',
    })
  }

  // Low visibility (count) check — must come before general volume gap check
  if (userRatingCount === null || userRatingCount < 10) {
    gaps.push({
      area: 'Low Visibility',
      current:
        userRatingCount !== null
          ? `${userRatingCount} reviews`
          : 'No reviews found',
      benchmark: '10+ reviews to rank in Google Maps results',
      recommendation:
        'Google Maps requires a minimum review threshold before showing businesses in local search. Reaching 10 reviews is the first critical milestone for local discoverability.',
    })
  }

  // General volume gap
  if (userRatingCount === null || userRatingCount < 50) {
    gaps.push({
      area: 'Review Volume',
      current:
        userRatingCount !== null
          ? `${userRatingCount} reviews`
          : 'No reviews',
      benchmark: '50+ reviews, competitive threshold',
      recommendation:
        'Competitors with 50+ reviews consistently outrank businesses with fewer reviews in local search. An automated review campaign can help you reach this milestone in 3-6 months.',
    })
  }

  return {
    score,
    grade,
    ratingScore,
    volumeScore,
    gaps,
  }
}
