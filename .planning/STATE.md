# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.3 UX Bugs & UI Fixes Part 2 — Phase 48 (Onboarding & Dashboard Behavior Fixes)

## Current Position

Phase: 45 of 49 (Foundation Visual Changes)
Plan: 45-01 of 3
Status: In progress
Last activity: 2026-02-26 — Completed 45-01-PLAN.md (soft button variant + dashboard audit)

Progress: [░░░░░░░░░░] 0% (v2.5.3 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 213
- v2.5.3 plans completed: 2

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.3

- Getting Started step 2 = campaign detail page visit (not campaign existence)
- All KPI cards navigate to /analytics (unified destination)
- Page subtitle pattern: "Static description · X dynamic count" on every page
- Campaign preset picker: vertical stack, Standard in middle, plain-English copy
- Custom service names must propagate to all service selectors (Add Job, filters, etc.)
- Needs Attention dismiss must actually remove items (UI-only hide)
- soft button variant: bg-muted/text-muted-foreground — use for secondary actions alongside a primary default CTA
- outline button retained for primary-action-among-equals (e.g., Send One-Off — no competing default CTA present)

### Cross-Cutting Concerns (apply to every plan)

- **Design system**: Use existing semantic tokens and design system patterns. If new tokens/patterns needed, add to globals.css / tailwind.config.ts — no one-off inline overrides
- **Code scalability**: Consolidate, don't duplicate. Remove replaced/dead code when shipping new patterns
- **Dead code removal**: Audit for unused imports, unused components, dead branches after each change
- **Security**: No new client-exposed secrets, validate all user inputs server-side, maintain RLS discipline

### Key Decisions (Inherited from v2.5.2/v2.5.1)

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
Stopped at: Completed 45-01-PLAN.md — soft button variant + dashboard button audit done
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
