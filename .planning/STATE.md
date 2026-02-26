# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 50 — Code Review & Audit (COMPLETE — all 3 plans done)

## Current Position

Phase: 50 of 50 (Code Review & Audit) — COMPLETE
Plan: 3 of 3 complete (50-01, 50-02, 50-03 all done)
Status: Phase 50 complete — findings report at docs/CODE-REVIEW-41-44.md ready for Phase 51 remediation
Last activity: 2026-02-26 — Completed 50-03-PLAN.md (cross-cutting audit, consolidated 27-finding report)

Progress: [██████████] ~100% (v2.5.3+ — phases 46, 49, 50 complete)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 228
- Phase 50 plans completed: 3 (50-01, 50-02, 50-03) -- PHASE COMPLETE

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for Phase 46 (Drawer Consistency + Campaign Freeze)

- SheetBody/SheetFooter pattern: form wraps both SheetBody and SheetFooter (flex flex-col flex-1 min-h-0) so submit buttons are native form children
- Edit Customer exception: uses form id attribute (form='edit-customer-form') because non-form content (SMS consent, activity) sits between form fields and footer
- All form sheets normalized to sm:max-w-lg width (512px)
- Separator components removed from Edit Customer (replaced by natural space-y-6 spacing)
- Job Detail "Complete" button normalized to default variant (primary CTA) — removed outline + custom color overrides
- Conflict resolution buttons stay in SheetBody (contextual), not SheetFooter (global actions)
- Campaign pause freezes enrollments (status='frozen') instead of stopping them -- non-terminal, preserves touch position
- Campaign resume unfreezes frozen enrollments back to 'active' and bumps stale scheduled times to NOW
- getCampaignEnrollmentCounts returns frozen count alongside active/completed/stopped

### Key Decisions for Phase 49 (Visual Polish)

- Subtitle canonical pattern: text-2xl font-semibold tracking-tight h1 + text-muted-foreground subtitle with static description + optional middot + count total
- Analytics subtitle: static description only (service type count not meaningful)
- Campaigns subtitle: static description only (count not available in shell without new prop threading)
- bg-card applied to table body rows at call site only (ui/table.tsx NOT modified)
- QuickSendModal spacing: DialogContent base already has gap-4 (grid layout) — no change needed

### Key Decisions for Phase 50 (Code Review) — COMPLETE

- Phase 50 deliverable: docs/CODE-REVIEW-41-44.md — 27 findings (0 Critical, 5 High, 11 Medium, 10 Low, 1 Info)
- F-44-01 (MEDIUM): updateServiceTypeSettings uses user_id directly — should fetch business.id first for defense-in-depth
- F-44-03 (LOW): CRM step saves empty string instead of null when no selection — normalize to null in server action
- F-44-04 (LOW): Business.custom_service_names typed as non-nullable but DB may return null — type vs runtime mismatch
- F-44-08 (LOW): CRM brand colors (bg-emerald-500 etc.) documented as acceptable exception to semantic tokens rule
- F-CC-01 (MEDIUM): space-y-6 (page content) vs space-y-8 (loading skeleton) mismatch on 6 pages — systemic fix needed
- F-01/F-02/F-03: SendLogWithContact deprecated alias in 3 history files + lib/data/send-logs.ts — must migrate together
- arrow key navigation not implemented for custom CRM radiogroup — minor accessibility gap (Tab works, arrow keys don't)

### Key Decisions for v2.5.3

- Getting Started step 2 (campaign_reviewed) triggers on campaign detail page visit — not list page
- All dashboard KPI cards link to /analytics — no scattered destinations
- CampaignSelector sentinel pattern: CAMPAIGN_CREATE = '__create_campaign__' intercepted in onChange before calling parent handler
- "Create new campaign" navigates to /campaigns page (has New Campaign button) rather than inline dialog
- Campaign preset picker: vertical stack (flex-col), sorted by CAMPAIGN_PRESETS index, no touch badges
- Frozen enrollment status: treated as "in-progress" in all deletion, reassignment, and conflict queries (use .in('status', ['active', 'frozen']))
- stopEnrollment (single enrollment by ID) keeps .eq('status', 'active') — frozen enrollments are unfrozen via campaign resume, not individually stopped
- Custom service names use value="other" in ServiceTypeSelect — DB stores enum 'other', display names are cosmetic only
- flatMap used on availableTypes array to allow returning arrays for the 'other' custom names case

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
Stopped at: Completed 50-03-PLAN.md (cross-cutting audit, consolidated findings report) -- Phase 50 COMPLETE
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
