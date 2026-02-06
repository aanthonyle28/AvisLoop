# Phase 30.1: Audit Gap Remediation

**Created:** 2026-02-06
**Status:** Planning
**Predecessor:** Phase 30 (V2 Alignment)

## Phase Goal

Address all remaining gaps identified in UX-AUDIT.md and QA-AUDIT.md that were not covered by Phase 30. Excludes landing page changes (deferred to marketing phase).

## Gap Source Analysis

| Source | Total Items | In Phase 30 | Gaps (This Phase) |
|--------|-------------|-------------|-------------------|
| UX Audit Critical | 5 | 4 | 1 |
| UX Audit High | 5 | 3 | 2 |
| UX Audit Medium | 5 | 1 | 3 (excl. landing) |
| UX Audit Low | 5 | 0 | 2 (excl. landing) |
| QA Audit Medium | 2 | 0 | 2 |
| QA Audit Low | 9 | 0 | 5 |
| **Total** | **31** | **8** | **15** |

## Scope Summary

### High Priority (Plans 01-03)

| # | Issue | Location | Audit Source |
|---|-------|----------|--------------|
| 01 | **Table skeleton loaders** | Customer, Job, History tables | UX Critical #3 |
| 02 | **Rename Send → "Manual Request"** + add friction warning | sidebar.tsx, bottom-nav.tsx | UX High #8 |
| 03 | **Campaign enrollment preview on jobs** | Jobs table, job detail | UX V2 Debt |

### Medium Priority (Plans 04-05)

| # | Issue | Location | Audit Source |
|---|-------|----------|--------------|
| 04 | Enrollment list pagination | Campaign Detail page | QA M04-01 |
| 05 | Preset guidance on new campaign | Campaign New page | QA M04-02 |

### Low Priority (Plans 06-08)

| # | Issue | Location | Audit Source |
|---|-------|----------|--------------|
| 06 | "Add Job" sidebar auto-open + terminology fixes | sidebar.tsx, various | QA L03-01, L08-01, L08-02 |
| 07 | Campaign preset timing info | Campaigns list | QA L03-02 |
| 08 | History route vs Activity label | History page | QA L07-01 |

## Excluded (Deferred to Marketing Phase)

| Issue | Reason |
|-------|--------|
| Sticky header CTA | Landing page - separate scope |
| CTA color differentiation (orange) | Landing page - separate scope |
| Demo video | Landing page - separate scope |
| Trust section (badges, logos) | Landing page - separate scope |
| Testimonial photos | Landing page - separate scope |
| Hide Customers page | Requires usage metrics first |
| Remove Send page | Requires usage metrics first |
| Z-index scale system | Low value, high effort |
| Virtual scrolling | Only needed at scale |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Friction on Send page | Warning banner + rename | V2 philosophy: manual send is escape hatch |
| Skeleton loader pattern | Reusable TableSkeleton component | Consistency across all tables |
| Enrollment preview | Show on job card + detail drawer | V2 feedback: user sees automation result |
| Pagination approach | Server-side with cursor | Campaign enrollments can be large |

## V2 Philosophy Alignment

This phase completes V2 alignment by:

1. **Send page friction** — Reinforces that manual sending is not the primary path
2. **Enrollment preview** — Shows users what automation will do (V2 feedback loop)
3. **Terminology cleanup** — "Message" not "Request" aligns with automation language

## Success Criteria

- [ ] All data tables show skeleton loader during fetch
- [ ] Send renamed to "Manual Request" with friction warning
- [ ] Jobs show campaign enrollment preview
- [ ] Campaign enrollments have pagination
- [ ] New campaign page guides users to presets
- [ ] All low-priority terminology fixes applied
- [ ] `pnpm lint && pnpm typecheck` pass

## File Impact Summary

| File | Changes |
|------|---------|
| `components/ui/table-skeleton.tsx` | NEW: Reusable table skeleton |
| `components/customers/customer-table.tsx` | Add skeleton loader |
| `components/jobs/job-table.tsx` | Add skeleton loader + enrollment preview |
| `components/history/history-table.tsx` | Add skeleton loader |
| `components/layout/sidebar.tsx` | Rename Send → Manual Request |
| `components/layout/bottom-nav.tsx` | Rename Send → Manual Request |
| `app/(dashboard)/send/page.tsx` | Add friction warning banner |
| `components/campaigns/campaign-detail.tsx` | Add enrollment pagination |
| `app/(dashboard)/campaigns/new/page.tsx` | Add preset guidance |
| Various | Terminology fixes |

## Source Documents

- `.planning/UX-AUDIT.md` — Priority Recommendations section
- `.planning/QA-AUDIT.md` — Medium and Low findings
- `.planning/V1-TO-V2-PHILOSOPHY.md` — Send page guidance
