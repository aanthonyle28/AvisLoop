# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.1 Bug Fixes & Polish — activity page fixes, dashboard polish, sidebar redesign, cross-page consistency

## Current Position

Phase: 43 (cross-page-consistency) — in progress
Plan: 01 and 02 of ? complete
Status: In progress
Last activity: 2026-02-25 — Completed 43-01 loading skeleton standardization + 43-02 empty state normalization

Progress: [█████░░░░░] 55% (v2.5.1 milestone, 2/4 phases complete + 43 in progress, 7/8+ plans)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 203
- v2.5.1 plans completed: 7

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.1

- Activity page status options stay the same: pending, sent, delivered, bounced, complained, failed, opened
- Chip filter style matches Jobs page pattern (rounded-full for status, bg-primary when active)
- CRM onboarding step is skippable and second-to-last (before SMS consent)
- Needs Attention dismiss is UI-only (hides from list, doesn't resolve underlying issue)
- Sidebar active state: filled icon + brand orange text, no left border, same background
- Design changes must update globals.css / design system tokens — no one-off inline overrides
- Scalability: remove replaced code, don't leave dead patterns alongside new ones — consolidate, don't duplicate
- RESENDABLE_STATUSES = ['failed', 'bounced'] — complained excluded because webhook sets opted_out=true, retry silently fails
- Inline retry uses bulkResendRequests([id]) — single-item reuse of bulk action, no drawer needed
- Date preset chips use local useState (not URL) — chip highlight resets on nav but dates preserved in URL; reverse-computation from URL is fragile
- updateDateRange sets from/to atomically in a single replace() call — prevents double re-render
- onCancel in RequestDetailDrawer is optional — server-side cancel not yet implemented
- Loading skeleton pattern: always use Skeleton component (never raw bg-muted animate-pulse divs), container py-6 space-y-8 for full-width pages, container max-w-4xl py-6 space-y-8 for constrained pages
- No inline Suspense in page.tsx when loading.tsx exists — making page async uses loading.tsx as single state, eliminates double-loading
- Settings page is the exception: loading.tsx handles route-level, inline Suspense handles streaming within page (both coexist correctly)
- Empty state pattern (canonical): rounded-full bg-muted p-6 mb-6 circle, h-8 w-8 icon, text-2xl font-semibold tracking-tight mb-2 title, max-w-md subtitle — all 5 pages normalized (jobs, history, feedback, customers, analytics)
- Empty state feedback variant: no action button by design — feedback comes from review funnel only; subtitle mb-8 omitted when no button follows

### Key Decisions (Inherited from v2.5/v2.6)

- Amber as accent only, blue stays primary — amber at warm lightness fails WCAG AA on white
- BusinessSettingsProvider context for shared business settings (eliminates prop drilling)
- Enrollment conflict forceCooldownOverride is conditional on previous campaign being a real campaign
- Review cooldown configurable 7-90 days in Settings (default 30)

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Google OAuth: VERIFIED WORKING — NEXT_PUBLIC_SITE_URL must be https://app.avisloop.com in Vercel production env vars
- v2.6 paused at plan 5/8 — resume after v2.5.1 completes

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 43-01 (loading skeleton standardization) and 43-02 (empty state normalization). Phase 43 in progress.
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
