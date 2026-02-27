# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.2 UX Bugs & UI Fixes (Phases 45-47) — Phase 47 COMPLETE

## Current Position

Phase: 47 of 47 (Dashboard Right Panel + Campaign Polish) — COMPLETE
Plan: 4/4 complete (47-01 ✓, 47-02 ✓, 47-03 ✓, 47-04 ✓)
Milestone: v2.5.2 UX Bugs & UI Fixes (Phases 45-47) — ALL COMPLETE
Status: Milestone complete

Progress: [██████████] 100% (Phase 47)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 234
- Phase 47 plans completed: 4/4

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for Phase 47 (Dashboard Right Panel + Campaign Polish)

- DayBucket type: { date: string, value: number } — 14 entries sorted oldest-first
- bucketByDay() is module-internal (not exported) — dashboard-specific utility
- Ratings history uses daily average (not count) to match KPI semantics
- Pipeline metrics do NOT get history arrays — only 3 outcome KPIs
- Error fallback includes history: [] for safe consumer .map() calls
- Sparkline SVG: viewBox="0 0 100 36", dashed line for empty state, gradient fill for normal
- KPI_COLORS: reviews=#F59E0B (amber), rating=#008236 (green), conversion=#2C879F (teal)
- Activity feed icons: getEventStyle() returns { Icon, bg, text } for colored circles
- Activity items are Link elements navigating to /history, /feedback, /campaigns
- Template preview: resolveTemplate() finds by template_id or falls back to system default by channel
- Radix Select: use value || undefined to trigger placeholder (empty string doesn't work)
- Custom service names: single SelectItem with joined names (Radix requires unique values)
- Campaign detail stats: flat CardContent with bg-muted/40 (no CardHeader/CardTitle overhead)
- Enrollment rows: Touch N/M using Math.max(0, current_touch - 1)

### Cross-Cutting Concerns (apply to every plan)

- **Design system**: Use existing semantic tokens and design system patterns
- **Code scalability**: Consolidate, don't duplicate
- **Dead code removal**: Audit for unused imports after each change
- **Security**: Validate all user inputs server-side, maintain RLS discipline

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

Config:
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}

## Session Continuity

Last session: 2026-02-27
Stopped at: Phase 47 complete — all 4 plans executed, verification passed (human_needed for visual checks)
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
