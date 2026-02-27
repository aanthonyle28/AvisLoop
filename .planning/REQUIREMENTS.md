# Requirements: v3.0 Agency Mode

**Milestone:** v3.0 — Agency Mode
**Created:** 2026-02-26
**Status:** Requirements defined

---

## Multi-Business Foundation

- [ ] **FOUND-01**: User's active business is resolved via httpOnly cookie, with fallback to first business if no cookie set
- [ ] **FOUND-02**: All data functions accept explicit businessId parameter instead of deriving from `.eq('user_id').single()`
- [ ] **FOUND-03**: All server actions accept explicit businessId or resolve from active business cookie
- [ ] **FOUND-04**: BusinessSettingsProvider carries businessId, businessName, and full businesses list for client components
- [ ] **FOUND-05**: Dashboard redirect logic distinguishes "no businesses" (→ onboarding) from "no active selection" (→ auto-select first)

## Business Switching

- [ ] **SWITCH-01**: User can switch between businesses via dropdown at top of sidebar
- [ ] **SWITCH-02**: Switching business updates all dashboard pages to show selected business's data
- [ ] **SWITCH-03**: Current business name is displayed in the sidebar next to the switcher
- [ ] **SWITCH-04**: Business switching is accessible on mobile via header area

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
| FOUND-01 | — | Pending |
| FOUND-02 | — | Pending |
| FOUND-03 | — | Pending |
| FOUND-04 | — | Pending |
| FOUND-05 | — | Pending |
| SWITCH-01 | — | Pending |
| SWITCH-02 | — | Pending |
| SWITCH-03 | — | Pending |
| SWITCH-04 | — | Pending |
| CLIENT-01 | — | Pending |
| CLIENT-02 | — | Pending |
| CLIENT-03 | — | Pending |
| CLIENT-04 | — | Pending |
| CLIENT-05 | — | Pending |
| CLIENT-06 | — | Pending |
| CLIENT-07 | — | Pending |
| CLIENT-08 | — | Pending |
| CREATE-01 | — | Pending |
| CREATE-02 | — | Pending |
| CREATE-03 | — | Pending |
| CREATE-04 | — | Pending |
| BILL-01 | — | Pending |
| BILL-02 | — | Pending |

**Coverage:**
- v3.0 requirements: 23 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 23

---
*Requirements defined: 2026-02-26*
