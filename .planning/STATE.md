# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 47 — Dashboard Right Panel + Campaign Polish

## Current Position

Phase: 47 of 51 (Dashboard Right Panel + Campaign Polish)
Plan: 3/4 complete (47-01 ✓, 47-02 ✓, 47-03 ✓)
Status: In progress

Progress: [███░░░░░░░] Phase 47 plan 3/4

## Performance Metrics

**Velocity:**
- Total plans completed (project): 234
- Phase 47 plans completed: 3/4

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for Phase 47 (Dashboard Right Panel + Campaign Polish)

- DayBucket: { date: string (YYYY-MM-DD), value: number } — exported from lib/types/dashboard.ts
- KPIMetric.history is optional (history?: DayBucket[]) — won't break existing consumers
- bucketByDay() is module-internal (not exported) — dashboard-specific utility
- Ratings history uses daily average (not count) — matches averageRating KPI semantics (1-5 scale)
- Conversion history derived from sendsHistoryResult.reviewed_at — avoids extra DB query
- Pipeline metrics (requestsSentThisWeek, activeSequences, pendingQueued) do NOT get history
- Error fallback history: [] on outcome metrics — safe for .map() without null checks
- Promise.all in getDashboardKPIs now has 14 parallel queries (11 existing + 3 history)
- TemplatePreviewModal null state: show "AI-generated default" message (expected, not an error)
- resolveTemplate() falls back to first system template (is_default=true) matching channel when template_id is null
- Touch progress: Math.max(0, enrollment.current_touch - 1) — current_touch is NEXT to send, so subtract 1
- Campaign detail stats cards: flat CardContent (no CardHeader/CardTitle) + bg-muted/40 for warm weight

### Key Decisions for Phase 51 (Audit Remediation)

- Skeleton component pattern: <Skeleton className="h-X w-Y [structural-classes]" /> — drop bg-muted/animate-pulse/rounded
- Page spacing standardized to space-y-8 across all 6 dashboard pages
- Settings page uses single skeleton from loading.tsx (inline duplicate removed)
- handleDismiss calls acknowledgeAlert for bounced_email/stop_request types
- updateServiceTypeSettings uses fetch-first defense-in-depth pattern
- getBusiness() returns explicit BusinessWithTemplates type
- feedback-list.tsx SSR import documented (required for Server Components)
- SendLogWithCustomer is the canonical joined type — includes name, email, last_sent_at from customers
- Cooldown anchor: use customers.last_sent_at with fallback to created_at (not created_at unconditionally)
- Stub UI removal: no-op buttons replaced with TODO comments until server-side implementation exists
- custom_service_names typed string[] | null — all consumers use || [] defensively
- F-08 deferred: RESENDABLE_STATUSES export IS used by history-table.tsx — finding was incorrect

### Cross-Cutting Concerns

- **Design system**: Use existing semantic tokens
- **Dead code removal**: Audit for unused imports after each change
- **Security**: Validate all user inputs server-side, maintain RLS discipline

Config:
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced"
}

## Session Continuity

Last session: 2026-02-27
Stopped at: Phase 47 Plan 03 complete — TemplatePreviewModal, Preview buttons in TouchSequenceEditor, campaign detail page visual polish
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
