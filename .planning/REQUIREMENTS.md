# Requirements: v3.0 Agency Mode

**Milestone:** v3.0 — Agency Mode
**Created:** 2026-02-26
**Status:** Roadmap created — phases assigned

---

## Multi-Business Foundation

- [x] **FOUND-01**: User's active business is resolved via httpOnly cookie, with fallback to first business if no cookie set
- [x] **FOUND-02**: All data functions accept explicit businessId parameter instead of deriving from `.eq('user_id').single()`
- [x] **FOUND-03**: All server actions accept explicit businessId or resolve from active business cookie
- [x] **FOUND-04**: BusinessSettingsProvider carries businessId, businessName, and full businesses list for client components
- [x] **FOUND-05**: Dashboard redirect logic distinguishes "no businesses" (→ onboarding) from "no active selection" (→ auto-select first)

## Business Switching

- [x] **SWITCH-01**: User can switch between businesses via dropdown at top of sidebar
- [x] **SWITCH-02**: Switching business updates all dashboard pages to show selected business's data
- [x] **SWITCH-03**: Current business name is displayed in the sidebar next to the switcher
- [x] **SWITCH-04**: Business switching is accessible on mobile via header area

## Clients Management

- [ ] **CLIENT-01**: User can view all client businesses as a card grid on `/businesses` page
- [ ] **CLIENT-02**: Each client card shows business name, type, Google rating, and reviews gained
- [ ] **CLIENT-03**: User can click a card to open a detail drawer with full agency metadata
- [ ] **CLIENT-04**: Detail drawer shows Google ratings (start vs current), review count (start vs current), reviews gained (computed), monthly fee, start date, GBP access, competitor name + count, notes
- [ ] **CLIENT-05**: User can edit agency metadata fields in the detail drawer
- [ ] **CLIENT-06**: Notes field auto-saves (debounced, matching existing customer detail drawer pattern)
- [ ] **CLIENT-07**: Client card shows competitive review gap (difference between client and competitor review counts) as a visual indicator
- [ ] **CLIENT-08**: Detail drawer includes a competitive analysis section showing side-by-side comparison: client reviews vs competitor reviews with the gap highlighted

## Additional Business Creation

- [ ] **CREATE-01**: User can create additional businesses via "Add Business" on the Clients page
- [ ] **CREATE-02**: Additional business creation uses INSERT (not UPSERT), preserving existing businesses
- [ ] **CREATE-03**: Each new business goes through the full onboarding wizard (business basics, campaign preset, SMS consent)
- [ ] **CREATE-04**: After creating a new business, it is set as the active business and user is redirected to dashboard

## Agency Billing

- [ ] **BILL-01**: Usage limits are enforced against the sum of sends across all businesses owned by the user
- [ ] **BILL-02**: Settings/billing page displays pooled usage across all businesses

## Job Completion Form

- [ ] **FORM-01**: Each business has a unique shareable "Complete Job" form URL secured by a token (e.g., `/complete/[token]`)
- [ ] **FORM-02**: The form collects customer name, phone or email (at least one), and service type from the enabled types for that business
- [ ] **FORM-03**: Submitting the form creates a completed job + customer record and auto-enrolls in the matching campaign
- [ ] **FORM-04**: The form is mobile-optimized for on-site technician use (large touch targets, minimal fields, fast submission confirmation)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Client self-service portal | Agency owner manages everything — no client login |
| White-label branding per business | Overkill for 2-5 clients |
| Live Google API sync | Adds API dependency, rate limits, cost; manual entry sufficient |
| Cross-business analytics dashboard | Different product; each business has its own dashboard |
| Per-business billing (N subscriptions) | Major complexity with no business reason |
| Role-based access / team members | Future milestone per CLAUDE.md |
| Business archiving / deletion | Edge cases with active enrollments; defer |
| Business settings cloning | Run full wizard; setup is fast |
| Client reporting / PDF exports | Future scope |
| Automated Google review scraping | Fragile, against Google ToS |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| FOUND-01 | Phase 52 | Complete |
| FOUND-02 | Phase 53 | Complete |
| FOUND-03 | Phase 53 | Complete |
| FOUND-04 | Phase 52 | Complete |
| FOUND-05 | Phase 52 | Complete |
| SWITCH-01 | Phase 54 | Complete |
| SWITCH-02 | Phase 54 | Complete |
| SWITCH-03 | Phase 54 | Complete |
| SWITCH-04 | Phase 54 | Complete |
| CLIENT-01 | Phase 55 | Pending |
| CLIENT-02 | Phase 55 | Pending |
| CLIENT-03 | Phase 55 | Pending |
| CLIENT-04 | Phase 55 | Pending |
| CLIENT-05 | Phase 55 | Pending |
| CLIENT-06 | Phase 55 | Pending |
| CLIENT-07 | Phase 55 | Pending |
| CLIENT-08 | Phase 55 | Pending |
| CREATE-01 | Phase 56 | Pending |
| CREATE-02 | Phase 56 | Pending |
| CREATE-03 | Phase 56 | Pending |
| CREATE-04 | Phase 56 | Pending |
| BILL-01 | Phase 57 | Pending |
| BILL-02 | Phase 57 | Pending |
| FORM-01 | Phase 58 | Pending |
| FORM-02 | Phase 58 | Pending |
| FORM-03 | Phase 58 | Pending |
| FORM-04 | Phase 58 | Pending |

**Coverage:**
- v3.0 requirements: 27 total
- Mapped to phases: 27/27
- Unmapped: 0

---
*Requirements defined: 2026-02-26*
*Traceability updated: 2026-02-26 (roadmap created)*
