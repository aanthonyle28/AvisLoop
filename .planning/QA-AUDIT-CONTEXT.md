# QA Test & UX Audit - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Systematically test every page, button, and feature in the AvisLoop authenticated dashboard. Verify the v2.0 campaign-first model is coherent across all surfaces. Cross-check displayed data against database queries. Identify UX gaps, broken flows, legacy references, orphaned features, and design inconsistencies. No public pages (landing, pricing, review funnel) in scope.

</domain>

<decisions>
## Implementation Decisions

### Audit Scope & Depth
- Full coverage, equal weight across all dashboard pages (no page deprioritized)
- Dashboard-only: no public pages (/r/[token], landing, pricing)
- Exhaustive interaction testing: open every dialog, fill every form, test every dropdown, toggle every switch
- Cross-check data consistency: displayed KPIs, stats, and lists verified against DB queries
- Test at desktop (1280px) and mobile (375px) widths
- Test in both light mode and dark mode for every page

### Pass/Fail Criteria
- **Hard fail on legacy references**: Any mention of "contacts" (should be "customers"), old single-send language, or v1 paradigm is a bug
- **3-tier severity**: Critical (broken functionality), Medium (confusing UX, wrong data, design issues), Low (cosmetic, minor copy)
- **Product-sense gaps flagged**: Features that work but feel disconnected from campaign-first workflow are findings
- **UI polish check**: Padding, alignment, spacing consistency, and basic design quality audited per page
- **Orphaned features check**: Pages, buttons, or features belonging to old v1 single-send model that shouldn't exist in v2 are findings
- **Empty states tested**: Navigate to each page with no data, verify empty state message, illustration, and CTA
- **Basic accessibility**: Buttons labeled, forms have labels, no keyboard traps (not full ARIA audit)
- **External service UI verified**: Stripe, Resend, Twilio UI elements checked with test keys where available

### Testing Approach
- **Authentication**: Log in via Playwright UI (fill email/password on login page)
- **Screenshots**: Capture every page visited as baseline documentation, plus extra shots for issues found
- **Dual account testing**: Fresh account for onboarding and empty states, populated account for full dashboard testing
- **Combined approach**: Start with user journey walkthrough (sign up -> onboard -> add job -> campaign enrolls -> dashboard -> analytics), then page-by-page sweep for remaining coverage

### Output Format
- **Organization**: By page, with findings sorted by severity within each page section
- **Scorecard**: Per-page grades (Pass / Needs Work / Fail) plus overall dashboard health score
- **Location**: `docs/QA-AUDIT.md`
- **Fix suggestions**: Every finding includes specific actionable fix recommendation (file, component, what to change)

### Claude's Discretion
- Order of page-by-page sweep after user journey
- Which test credentials to use (or create)
- Screenshot naming convention and storage location
- How to structure the user journey walkthrough steps
- Exact mobile breakpoint testing methodology

</decisions>

<specifics>
## Specific Ideas

- The shift from single-send to campaigns is the #1 lens: every page should make sense in a world where the primary workflow is Job -> Campaign Enrollment -> Multi-Touch Sequence -> Review Funnel
- "Contacts" language anywhere in the authenticated dashboard is a bug (renamed to "Customers" in Phase 20)
- Manual send still exists but should not feel like the primary workflow
- Campaign-related features should feel prominent and well-connected
- Dark mode is not secondary polish — it should be tested with equal rigor

</specifics>

<deferred>
## Deferred Ideas

- Public page testing (landing page, pricing, review funnel /r/[token]) — separate audit
- Full accessibility audit (WCAG compliance, screen reader testing) — separate effort
- Performance testing (load times, query optimization) — separate concern
- Automated regression test suite — future phase after audit identifies what to test

</deferred>

---

*QA Test & UX Audit*
*Context gathered: 2026-02-04*
