import { Star, TrendUp, TrendDown, Globe, Ticket } from '@phosphor-icons/react/dist/ssr'
import { InteractiveCard } from '@/components/ui/card'
import type { Business, WebProject } from '@/lib/types/database'

interface BusinessCardProps {
  business: Business
  isActive: boolean
  webProject?: WebProject | null
  openTicketCount?: number
}

function formatServiceType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}



export function BusinessCard({ business, isActive, webProject, openTicketCount = 0 }: BusinessCardProps) {
  const clientType = business.client_type

  // Service type badge: show first enabled type + overflow count
  // Only shown for reputation and both clients (web_design clients don't have HVAC/plumbing)
  const enabledTypes = business.service_types_enabled ?? []
  const primaryType = enabledTypes[0]
  const overflowCount = enabledTypes.length - 1
  const serviceTypeLabel = primaryType
    ? `${formatServiceType(primaryType)}${overflowCount > 0 ? ` +${overflowCount}` : ''}`
    : 'No services'

  // Google rating display — NUMERIC columns come back as strings from PostgREST
  const rating = business.google_rating_current !== null
    ? Number(business.google_rating_current)
    : null

  // Reviews gained: current - start (null if both are null)
  const reviewCountCurrent = business.review_count_current
  const reviewCountStart = business.review_count_start
  const bothNull = reviewCountCurrent === null && reviewCountStart === null
  const reviewsGained = bothNull
    ? null
    : (reviewCountCurrent ?? 0) - (reviewCountStart ?? 0)

  // Competitive gap indicator
  const competitorCount = business.competitor_review_count
  const hasCurrentCount = reviewCountCurrent !== null
  const hasCompetitorCount = competitorCount !== null
  const competitiveGap =
    hasCurrentCount && hasCompetitorCount
      ? (reviewCountCurrent ?? 0) - (competitorCount ?? 0)
      : null

  // Web design display values
  const isWebDesign = clientType === 'web_design' || clientType === 'both'
  const domain = webProject?.domain ?? null

  const tier = webProject?.subscription_tier ?? null

  return (
    <InteractiveCard hoverAccent="amber" className="p-6 h-full flex flex-col">
      {/* Header row: business name + active badge */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 className="font-semibold text-base leading-tight truncate">
          {business.name}
        </h3>
        {isActive && (
          <span className="shrink-0 text-xs font-medium text-success">
            Active
          </span>
        )}
      </div>

      {/* Client type badge — only shown for web_design and both */}
      {clientType === 'web_design' && (
        <div className="mb-3">
          <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
            Web Design
          </span>
        </div>
      )}
      {clientType === 'both' && (
        <div className="mb-3">
          <span className="inline-block text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
            Web + Review
          </span>
        </div>
      )}

      {/* Service type badge — shown for reputation and both clients only */}
      {(clientType === 'reputation' || clientType === 'both') && (
        <div className="mb-4">
          <span className="inline-block text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {serviceTypeLabel}
          </span>
        </div>
      )}

      {/* Conditional content based on client type */}
      {isWebDesign ? (
        /* Web design fields: domain, tier, tickets */
        <div className="space-y-3 flex-1">
          {/* Domain */}
          <div className="flex items-center gap-1.5">
            <Globe size={14} weight="regular" className="text-muted-foreground shrink-0" />
            {domain ? (
              <span className="text-sm text-foreground truncate">{domain}</span>
            ) : (
              <span className="text-sm text-muted-foreground">No domain set</span>
            )}
          </div>

          {/* Subscription tier chip */}
          {tier && (
            <div>
              <span className="inline-block text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {tier === 'basic' ? 'Basic' : 'Advanced'}
              </span>
            </div>
          )}

          {/* Open ticket count */}
          {openTicketCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Ticket size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {openTicketCount} open ticket{openTicketCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Reputation fields: Google rating, reviews gained, competitive gap */
        <>
          {/* Google rating */}
          <div className="flex items-center gap-1.5 mb-3">
            {rating !== null ? (
              <>
                <Star
                  size={16}
                  weight="fill"
                  className="text-amber-400 shrink-0"
                />
                <span className="text-2xl font-bold leading-none">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">/ 5.0</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No rating</span>
            )}
          </div>

          {/* Reviews gained */}
          <div className="mb-2">
            {reviewsGained === null ? (
              <span className="text-xs text-muted-foreground">No review data</span>
            ) : reviewsGained > 0 ? (
              <span className="text-xs font-medium text-success">
                +{reviewsGained} reviews gained
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">0 reviews gained</span>
            )}
          </div>

          {/* Competitive gap indicator */}
          <div>
            {!hasCurrentCount && !hasCompetitorCount ? (
              <span className="text-xs text-muted-foreground">No competitor data</span>
            ) : !hasCurrentCount || !hasCompetitorCount ? (
              <span className="text-xs text-muted-foreground">Incomplete data</span>
            ) : competitiveGap !== null && competitiveGap > 0 ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <TrendUp size={12} weight="bold" className="shrink-0" />
                {competitiveGap} ahead of {business.competitor_name ?? 'competitor'}
              </span>
            ) : competitiveGap !== null && competitiveGap < 0 ? (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <TrendDown size={12} weight="bold" className="shrink-0" />
                {Math.abs(competitiveGap)} behind {business.competitor_name ?? 'competitor'}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Tied with {business.competitor_name ?? 'competitor'}
              </span>
            )}
          </div>
        </>
      )}
    </InteractiveCard>
  )
}
