# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.3 UX Bugs & UI Fixes Part 2 — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-25 — Milestone v2.5.3 started

Progress: [░░░░░░░░░░] 0% (v2.5.3 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 211
- v2.5.3 plans completed: 0

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.3

- Getting Started step 2 = campaign detail page visit (not campaign existence)
- All KPI cards navigate to /analytics (unified destination)
- Page subtitle pattern: "Static description · X dynamic count" on every page
- Campaign preset picker: vertical stack, Standard in middle, plain-English copy
- Custom service names must propagate to all service selectors (Add Job, filters, etc.)
- Needs Attention dismiss must actually remove items (UI-only hide)

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

Last session: 2026-02-25
Stopped at: Defining requirements for v2.5.3
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
