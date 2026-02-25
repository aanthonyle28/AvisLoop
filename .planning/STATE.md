# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.2 UX Bugs & UI Fixes — Phase 45

## Current Position

Phase: 45 of 47 (Foundation + Visual-Only Changes)
Plan: — of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-25 — v2.5.2 roadmap created (Phases 45-47)

Progress: [░░░░░░░░░░] 0% (v2.5.2 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 211
- v2.5.1 plans completed: 8

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5.2

- Campaign pause = freeze enrollments in place (`frozen` status), resume from same touch on un-pause — NOT stop/destroy
- Button variant needed: `soft` (muted background, does not compete with primary CTAs)
- Sparkline component requires `dynamic(() => import(...), { ssr: false })` — Recharts crashes in Next.js SSR without this
- Radix Select migration: `onValueChange(value)` not `onChange(event)`; reset via `value={undefined}` not `value=''`
- Sticky drawer footers: SheetContent must be flex flex-col; middle zone is flex-1 overflow-y-auto sibling; footer is shrink-0 sibling (NOT inside scroll container)
- White bg content sections in drawers: use `ring-1 ring-border` not `shadow-sm + overflow:hidden` to avoid stacking context breaking Radix portals
- `deleteCampaign` must handle both `active` AND `frozen` enrollments — not just `active`
- Cron conflict resolver edge case: if campaign is paused, auto-resolve returns null but does NOT update `enrollment_resolution` — audit this path in Phase 46

### Key Decisions (Inherited from v2.5.1)

- Activity page status options stay the same: pending, sent, delivered, bounced, complained, failed, opened
- Sidebar active state: filled icon + brand orange text, no left border, same background
- Design changes must update globals.css / design system tokens — no one-off inline overrides
- Scalability: remove replaced code, don't leave dead patterns alongside new ones
- Empty state pattern (canonical): rounded-full bg-muted p-6 mb-6 circle, h-8 w-8 icon, text-2xl font-semibold tracking-tight mb-2 title, max-w-md subtitle
- Loading skeleton pattern: always use Skeleton component, container py-6 space-y-8 for full-width pages

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Read Postgres RPC `claim_due_campaign_touches` migration file before Phase 46 campaign work — WHERE clause must exclude `frozen` enrollments
- Sparkline query: benchmark getDashboardKPIs() with daily-bucket queries before deciding server-parallel vs client-lazy loading
- Semantic tokens for soft variant: grep globals.css for `--success-bg`, `--warning-bg` etc. before writing new button variant classes

## Session Continuity

Last session: 2026-02-25
Stopped at: v2.5.2 roadmap created — ready to plan Phase 45
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
