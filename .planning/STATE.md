# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 33 — Hardcoded Color Audit (v2.5 start)

## Current Position

Phase: 33 of 39 in v2.5 milestone (Phase 1 of 7 in this milestone)
Plan: 1 of 2 in current phase (33-01 complete)
Status: In progress
Last activity: 2026-02-19 — Completed 33-01-PLAN.md (layout chrome tokenization)

Progress: [█░░░░░░░░░] ~5% (v2.5 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 171
- v2.5 plans completed: 1

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5

- Amber as accent only, blue stays primary — amber at warm lightness fails WCAG AA on white (2.2:1); blue stays primary for buttons/focus rings
- Phase 33 (color audit) MUST run before Phase 34 (palette swap) — hardcoded hex bypasses token system
- Manual Request elimination (Phase 39) is last — most regression risk; /send becomes redirect not deletion
- Onboarding storage key must version to `'onboarding-draft-v2'` when steps change (Phase 38)
- Campaign form save bug must be fixed in Phase 37 before any campaign form layout changes
- Dark mode calibration must be independent of light mode (higher saturation needed for warm hues in dark)
- bg-secondary for active nav state (replaces bg-[#F2F2F2]) — --secondary is 0 0% 92%, semantically correct for muted interactive surface
- Redundant dark: overrides removed — bg-card, bg-background, border-border are already mode-aware; dark:bg-X overrides add noise
- Button component for all interactive elements — raw button elements replaced with Button primitive for consistency and future theming

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Phase 37: Campaign form save bug (touch sequences not persisting) — scope must be investigated before planning
- Phase 39: Five server queries on /send page must be traced to new homes before redirect is added

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 33-01-PLAN.md — layout chrome tokenization, SUMMARY.md created
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
