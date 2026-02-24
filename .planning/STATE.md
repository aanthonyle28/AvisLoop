# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.6 Dashboard Command Center — two-column task-oriented layout with contextual right panel

## Current Position

Phase: 40 (Phase 1 of 1 in v2.6 milestone)
Plan: Not started
Status: Requirements defined, ready for planning
Last activity: 2026-02-23 — Milestone v2.6 started, Phase 40 scoped

Progress: [░░░░░░░░░░] 0% (v2.6 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 192
- v2.6 plans completed: 0

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.6

- Right panel is dashboard-only — other pages retain current drawer behavior
- Reuse JobDetailDrawer elements for right panel content, but Jobs page keeps its own separate drawer instance
- Mobile strategy: bottom sheet for right panel content (not full-screen overlay)
- Enroll All requires confirmation dialog (not one-click)
- No address field on customers (skip for now)
- NotificationBell removed entirely — dashboard badge + subtitle replaces it
- Needs Attention detail panel shows contextual content (failed: error+retry, low rating: feedback+resolve)
- Getting Started consolidated into right panel — pill and drawer removed from dashboard

### Key Decisions (Inherited from v2.5)

- Amber as accent only, blue stays primary — amber at warm lightness fails WCAG AA on white
- BusinessSettingsProvider context for shared business settings (eliminates prop drilling)
- Enrollment conflict forceCooldownOverride is conditional on previous campaign being a real campaign
- Review cooldown configurable 7-90 days in Settings (default 30)

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Google OAuth: VERIFIED WORKING — NEXT_PUBLIC_SITE_URL must be https://app.avisloop.com in Vercel production env vars

## Session Continuity

Last session: 2026-02-23
Stopped at: Milestone v2.6 initialized, Phase 40 requirements defined. Ready for /gsd:plan-phase 40.
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
