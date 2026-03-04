/**
 * Type definitions for the Reputation Audit Lead-Gen Tool.
 * Used by scoring.ts, places-client.ts, and API routes.
 */

/** Result from Google Places API (New) searchText endpoint */
export interface PlacesResult {
  placeId: string
  displayName: string
  formattedAddress: string
  rating: number | null
  userRatingCount: number | null
}

/** Letter grade derived from reputation score */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

/** Actionable gap identified during audit scoring */
export interface GapAnalysis {
  area: string
  current: string
  benchmark: string
  recommendation: string
}

/** Full computed reputation score with sub-scores and gaps */
export interface ReputationScore {
  /** Overall score 0-100 */
  score: number
  /** Letter grade A-F derived from score */
  grade: Grade
  /** Rating sub-score 0-60 */
  ratingScore: number
  /** Volume sub-score 0-40 */
  volumeScore: number
  /** Actionable gap analysis items */
  gaps: GapAnalysis[]
}

/**
 * Matches the audit_reports DB table shape.
 * Stored after email gate — includes lead_email.
 */
export interface AuditReport {
  id: string
  business_name: string
  city: string
  place_id: string | null
  place_display_name: string | null
  place_address: string | null
  score: number
  grade: Grade
  rating_snapshot: number | null
  review_count_snapshot: number | null
  gaps_json: GapAnalysis[]
  lead_email: string
  audited_at: string
  view_count: number
  created_at: string
}

/**
 * Search preview returned before email gate.
 * Shows grade + score to entice email capture, but not full gap details.
 */
export interface AuditSearchPreview {
  place: {
    placeId: string
    displayName: string
    formattedAddress: string
  }
  grade: Grade
  score: number
}
