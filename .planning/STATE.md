# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.1 Bug Fixes & Polish — activity page fixes, dashboard polish, sidebar redesign, cross-page consistency

## Current Position

Phase: 41 of 4 (activity-page-overhaul)
Plan: 41-01 of 2 in phase 41
Status: In progress
Last activity: 2026-02-25 — Completed 41-01-PLAN.md (resend logic, page header, inline retry)

Progress: [█░░░░░░░░░] 10% (v2.5.1 milestone, 4 phases, plan 1/~10 complete)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 198
- v2.5.1 plans completed: 1

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
Stopped at: Completed 41-01-PLAN.md — resend logic, page header, inline retry fixed
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
