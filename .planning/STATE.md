# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.2 UX Bugs & UI Fixes — Phase 45 complete, Phase 46 next

## Current Position

Phase: 45 of 47 (Foundation + Visual-Only Changes) — COMPLETE
Plan: 3/3 complete
Status: Phase verified ✓
Last activity: 2026-02-26 — Phase 45 executed and verified (3 plans, 2 waves)

Progress: [███░░░░░░░] 33% (v2.5.2 milestone — 1/3 phases)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 214
- v2.5.2 plans completed: 3

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.2

- soft button variant: bg-muted/text-muted-foreground — use for secondary actions alongside a primary default CTA
- outline button retained for primary-action-among-equals (e.g., Send One-Off — no competing default CTA present)
- Queue row card pattern: space-y-2 container + rounded-lg border border-border bg-card per row (not divide-y)
- Empty state border pattern: border border-border bg-card (1px solid, white bg — no dashed borders in dashboard queues)
- "Activity" renamed to "History" in navigation — route /history unchanged

### Cross-Cutting Concerns (apply to every plan)

- **Design system**: Use existing semantic tokens and design system patterns. If new tokens/patterns needed, add to globals.css / tailwind.config.ts — no one-off inline overrides
- **Code scalability**: Consolidate, don't duplicate. Remove replaced/dead code when shipping new patterns
- **Dead code removal**: Audit for unused imports, unused components, dead branches after each change
- **Security**: No new client-exposed secrets, validate all user inputs server-side, maintain RLS discipline

### Key Decisions (Inherited)

- Activity page status options: pending, sent, delivered, bounced, complained, failed, opened
- Sidebar active state: filled icon + brand orange text, no left border, same background
- Design changes must update globals.css / design system tokens — no one-off inline overrides
- Empty state pattern (canonical): rounded-full bg-muted p-6 mb-6 circle, h-8 w-8 icon, text-2xl font-semibold tracking-tight mb-2 title, max-w-md subtitle
- Loading skeleton pattern: always use Skeleton component, container py-6 space-y-8 for full-width pages
- custom_service_names stored as TEXT[] — simple array, no metadata needed
- Enter key in sub-input must call e.preventDefault() to prevent parent form submission

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

## Session Continuity

Last session: 2026-02-26
Stopped at: Phase 45 complete — ready to plan Phase 46
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
