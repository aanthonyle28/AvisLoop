# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v2.5.4 Code Review (Phases 41-44) — MILESTONE COMPLETE

## Current Position

Phase: 51 of 51 (Audit Remediation) — COMPLETE
Plan: 3/3 complete
Status: Milestone complete ✓
Last activity: 2026-02-27 — Phase 51 executed and verified (3 plans, 2 waves)

Progress: [██████████] 100% (v2.5.4 milestone — 2/2 phases)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 230
- v2.5.4 plans completed: 6

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for Phase 51 (Audit Remediation) — COMPLETE

- Skeleton component pattern: <Skeleton className="h-X w-Y [structural-classes]" /> — drop bg-muted/animate-pulse/rounded
- Page spacing standardized to space-y-8 across all 6 dashboard pages
- Settings page uses single skeleton from loading.tsx (inline duplicate removed)
- handleDismiss calls acknowledgeAlert for bounced_email/stop_request types
- updateServiceTypeSettings uses fetch-first defense-in-depth pattern
- getBusiness() returns explicit BusinessWithTemplates type
- feedback-list.tsx SSR import documented (required for Server Components)
- SendLogWithCustomer is the canonical joined type — includes name, email, last_sent_at from customers
- Cooldown anchor: use customers.last_sent_at with fallback to created_at (not created_at unconditionally)
- Stub UI removal: no-op buttons replaced with TODO comments until server-side implementation exists
- custom_service_names typed string[] | null — all consumers use || [] defensively
- F-08 deferred: RESENDABLE_STATUSES export IS used by history-table.tsx — finding was incorrect

### Key Decisions for Phase 50 (Code Review) — COMPLETE

- Phase 50 deliverable: docs/CODE-REVIEW-41-44.md — 27 findings (0 Critical, 5 High, 11 Medium, 10 Low, 1 Info)
- All Critical/High/Medium resolved in Phase 51
- Low findings: 5 fixed, 5 deferred with documented rationale

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

Last session: 2026-02-27
Stopped at: v2.5.4 milestone complete — ready for /gsd:complete-milestone or next milestone
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
