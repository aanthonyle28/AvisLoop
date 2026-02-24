# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.6 Dashboard Command Center — two-column task-oriented layout with contextual right panel

## Current Position

Phase: 40 (Phase 1 of 1 in v2.6 milestone)
Plan: 05 of ~8 complete
Status: In progress
Last activity: 2026-02-24 — Completed 40-05-PLAN.md (mobile responsive dashboard: MobileBottomSheet + KPISummaryBar)

Progress: [█████░░░░░] ~62% (v2.6 milestone, est. 8 plans)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 197
- v2.6 plans completed: 5

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
- DashboardShell embeds DashboardPanelProvider internally — no separate wrapper needed for common usage
- key={panelView.type} on content div triggers clean re-mount + animate-in on each panel view change
- DashboardClient uses inner/outer split: outer passes RightPanelDefault to DashboardShell, inner DashboardContent accesses useDashboardPanel context as children
- Alert rows keep inline action buttons even in compact form — right panel detail (Plan 04) adds context, not replaces
- Enroll All button only shows when enrollable jobs exist (completed, no conflict, has campaign, not one_off)
- DashboardDetailContent rendered as detailContent prop to DashboardShell — renders inside Provider so useDashboardPanel() works correctly
- Alert detail data extracted from description strings via regex (no schema changes needed)
- RightPanelJobDetail fetches its own data on mount via getReadyToSendJobWithCampaign (self-contained, no prop drilling)
- MobileBottomSheet uses CSS transitions (not Radix Dialog) — simpler, no new dependency
- mobileSheetMode 'kpi-full' is a virtual mode local to DashboardContent — not added to RightPanelView union
- panelView reset to 'default' (e.g. from within detail components after action) also closes the mobile sheet automatically
- KPISummaryBar receives onClick prop rather than panel setter — keeps it decoupled and generic

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

Last session: 2026-02-24
Stopped at: Completed 40-05-PLAN.md — mobile responsive dashboard with MobileBottomSheet and KPISummaryBar.
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
