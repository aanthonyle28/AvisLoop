# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 34 — Warm Palette Token Replacement

## Current Position

Phase: 33 of 39 in v2.5 milestone (Phase 1 of 7 in this milestone)
Plan: 2 of 2 in current phase (33-02 complete — phase complete)
Status: Phase complete
Last activity: 2026-02-19 — Completed 33-02-PLAN.md (Tier 2 color audit document)

Progress: [█░░░░░░░░░] ~10% (v2.5 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 172
- v2.5 plans completed: 2

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
- Tier 2 audit: 210 occurrences / 51 files / 16 categories — data-viz dots, stars, marketing stay inline; everything else Phase 35
- --error-text is distinct from --destructive — form validation text needs darker shade than button-calibrated destructive token
- Phase 35 token spec finalized: 9 new CSS vars (--warning-*, --success-*, --info-*, --error-text) needed before batch replacement

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Phase 37: Campaign form save bug (touch sequences not persisting) — scope must be investigated before planning
- Phase 39: Five server queries on /send page must be traced to new homes before redirect is added

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 33-02-PLAN.md — Tier 2 color audit. Phase 33 complete. Next: Phase 34 (palette swap)
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
