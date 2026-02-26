# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.4 Code Review (Phases 41-44)

## Current Position

Phase: 50 (Code Review & Audit)
Plan: —
Status: Ready to plan
Last activity: 2026-02-25 — Milestone v2.5.4 started (code review of Phases 41-44)

Progress: [░░░░░░░░░░] 0% (v2.5.4 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 213
- v2.5.4 plans completed: 0

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.4

- Full audit scope: bugs, dead code, security, performance, V2 alignment, design system, accessibility
- Report + fix in same milestone (not report-only)
- Phases 41-44 scope: Activity page overhaul, Dashboard & nav polish, Cross-page consistency, Onboarding & services

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
- soft button variant: bg-muted/text-muted-foreground — use for secondary actions alongside a primary default CTA
- outline button retained for primary-action-among-equals (e.g., Send One-Off — no competing default CTA present)

### Pending Todos

- Note: Phase 45 work in progress (uncommitted changes in sidebar.tsx, bottom-nav.tsx, attention-alerts.tsx, dashboard-client.tsx) — not part of code review scope

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

## Session Continuity

Last session: 2026-02-25
Stopped at: Milestone v2.5.4 started — ready to plan Phase 50
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
