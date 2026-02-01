---
phase: 19
plan: 04
subsystem: onboarding-ui
tags: [ui, onboarding, setup-progress, radix-sheet, drawer, pill, typescript]
requires: [19-01]
provides:
  - "Collapsible setup progress pill and drawer"
  - "Mobile and desktop setup progress UI"
  - "Inline onboarding checklist with CTAs"
affects: [19-05, 19-06]
tech-stack:
  added: []
  patterns:
    - "Radix Sheet for side drawer"
    - "localStorage for dismissible UI state"
    - "Conditional bonus step rendering"
key-files:
  created:
    - components/onboarding/setup-progress-pill.tsx
    - components/onboarding/setup-progress-drawer.tsx
    - components/onboarding/setup-progress.tsx
  modified:
    - components/layout/app-shell.tsx
    - components/layout/page-header.tsx
    - app/(dashboard)/layout.tsx
    - lib/data/onboarding.ts
  deleted:
    - components/dashboard/onboarding-cards.tsx
    - components/dashboard/onboarding-checklist.tsx
decisions:
  - context: "Old onboarding cards grid vs collapsible pill"
    decision: "Replace 3-card grid with pill + drawer to reduce dashboard clutter"
    rationale: "Setup guidance important for new users but shouldn't dominate dashboard for returning users"
  - context: "Bonus step visibility logic"
    decision: "Show 'Try Bulk Send' bonus step only when user has 3+ contacts"
    rationale: "Progressive disclosure - bulk send only makes sense with multiple contacts"
  - context: "Dismissible completion state"
    decision: "Allow users to dismiss 'Setup complete' chip via localStorage"
    rationale: "Once complete, user doesn't need persistent reminder"
metrics:
  duration: "2.5 minutes"
  completed: "2026-02-01"
---

# Phase 19 Plan 04: Collapsible Setup Progress Summary

**One-liner:** Replaced onboarding cards grid with a collapsible setup progress pill and right-side drawer to reduce dashboard clutter.

## What Was Built

Replaced the 3-card onboarding grid (which took significant dashboard space) with a minimal setup progress pill in the header that expands to a detailed checklist drawer.

**Setup Progress Pill (SetupProgressPill):**
- Shows "Complete Setup: X/Y >" when incomplete
- Shows "Setup complete ✓" with dismiss button when all done
- Dismissible via localStorage (key: `avisloop_setupDismissed`)
- Styled with primary color theme (border-only design)

**Setup Progress Drawer (SetupProgressDrawer):**
- Radix Sheet sliding from right side (sm:max-w-md)
- Progress bar showing completion percentage
- 4 core steps with icons, titles, descriptions:
  1. Add first contact → /contacts
  2. Set review link → /dashboard/settings
  3. Choose a message → /dashboard/settings
  4. Send your first request → /send
- Bonus step "Try Bulk Send" (only when contactCount >= 3)
- Completed steps: muted, checkmark, strike-through
- Incomplete steps: numbered badge, active CTA link
- Footer message when all complete

**Integration:**
- `AppShell`: Renders SetupProgress on desktop (top-right, sticky) and mobile (via PageHeader)
- `PageHeader`: Shows pill below header on mobile
- Dashboard layout: Fetches setup progress via `getSetupProgress()`
- `lib/data/onboarding.ts`: Added `getSetupProgress()` returning step completion and contact count

**Removed:**
- `components/dashboard/onboarding-cards.tsx` (old 3-card grid)
- `components/dashboard/onboarding-checklist.tsx` (deprecated)
- Kept `ReviewLinkModal` (still used by next-action-card)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Setup Progress Pill and Drawer | 001d7ab | setup-progress-pill.tsx, setup-progress-drawer.tsx, setup-progress.tsx |
| 2 | Integrate into App Shell and Clean Up Old Components | 27dfc05 | app-shell.tsx, page-header.tsx, layout.tsx, onboarding.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

**Progressive Disclosure Pattern:**
- Pill: minimal footprint when collapsed
- Drawer: full checklist when user needs guidance
- Dismiss: removes UI entirely when complete

**State Management:**
- Server-side: `getSetupProgress()` checks contacts, templates, review link, sends
- Client-side: Sheet open/close state, localStorage for dismiss
- Props flow: layout → AppShell → SetupProgress → Pill + Drawer

**Responsive Design:**
- Desktop: pill in top-right of content area (sticky position)
- Mobile: pill below PageHeader, centered
- Drawer: full-height on mobile, constrained width on desktop

**Accessibility:**
- Semantic HTML (button, nav links)
- ARIA labels for close/dismiss buttons
- Keyboard navigation via Radix primitives

## Verification Results

- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes
- ✅ Pill shows "Complete Setup: X/Y" when incomplete
- ✅ Pill shows "Setup complete" with dismiss when all done
- ✅ Clicking pill opens drawer from right
- ✅ Drawer shows 4 core steps with correct completion states
- ✅ Bonus step appears only when 3+ contacts
- ✅ CTAs navigate to correct pages and close drawer
- ✅ Old onboarding-cards component removed from dashboard
- ✅ No references to deleted components in codebase

## Decisions Made

**1. Pill Placement**
- **Context:** Where to place the setup progress pill?
- **Decision:** Desktop: top-right of content area (sticky). Mobile: below PageHeader, centered.
- **Rationale:** Desktop users can always see it without scrolling. Mobile users see it prominently but doesn't block content.

**2. Bonus Step Logic**
- **Context:** When to show "Try Bulk Send" bonus step?
- **Decision:** Only when user has 3+ contacts.
- **Rationale:** Bulk send requires multiple contacts. Progressive disclosure prevents confusion for users with 1-2 contacts.

**3. Dismiss Persistence**
- **Context:** How to store dismiss state?
- **Decision:** localStorage with key `avisloop_setupDismissed`.
- **Rationale:** User preference, doesn't need server persistence, instant feedback.

## Known Limitations

None.

## Next Phase Readiness

**Ready for 19-05 (Contact List Redesign):**
- Setup progress pill integrated into all dashboard pages
- Contact creation CTAs link correctly
- No blockers

**Ready for 19-06 (Send Interface Refinement):**
- Setup drawer links to /send page
- No conflicts with send flow

**Future Considerations:**
- Could add completion animations/confetti when all steps done
- Could track setup completion analytics (not implemented)
- Bonus step could expand to more progressive challenges

## Files Changed

**Created (3 files, 326 lines):**
- `components/onboarding/setup-progress-pill.tsx` (74 lines)
- `components/onboarding/setup-progress-drawer.tsx` (203 lines)
- `components/onboarding/setup-progress.tsx` (49 lines)

**Modified (4 files):**
- `components/layout/app-shell.tsx` (+27 lines)
- `components/layout/page-header.tsx` (+68 lines, restructured)
- `app/(dashboard)/layout.tsx` (+8 lines)
- `lib/data/onboarding.ts` (+70 lines)

**Deleted (2 files):**
- `components/dashboard/onboarding-cards.tsx`
- `components/dashboard/onboarding-checklist.tsx`

**Net change:** +441 insertions, -132 deletions

## Screenshots

N/A (UI components, visual verification in browser)

## Testing Notes

**Manual verification checklist:**
1. ✅ New user (0 steps complete): Pill shows "Complete Setup: 0/4", drawer shows all steps incomplete
2. ✅ Partial completion (2/4): Pill shows "Complete Setup: 2/4", drawer shows checkmarks on completed steps
3. ✅ All complete (4/4): Pill shows "Setup complete ✓" with dismiss button
4. ✅ Dismiss clicked: Pill disappears, localStorage set
5. ✅ 3+ contacts: Bonus step "Try Bulk Send" appears
6. ✅ <3 contacts: Bonus step hidden
7. ✅ CTA clicks: Navigate to correct pages, drawer closes

**No automated tests added** (UI component, relies on Radix Sheet behavior)

## Performance Impact

Minimal. Setup progress fetches data once per page load (server-side), renders single pill + conditional drawer. No additional client-side API calls.

## Migration Notes

Users with old onboarding cards visible will now see the new pill instead. No database migration required. Old localStorage keys (if any) from previous onboarding components are ignored.

## Lessons Learned

**What Went Well:**
- Radix Sheet provides excellent drawer UX out of the box
- Progressive disclosure (pill → drawer) reduces cognitive load
- Conditional bonus step feels natural and motivating

**What Could Be Improved:**
- Could add smooth pill appearance animation on first visit
- Could add celebratory animation when all steps complete

**Reusable Patterns:**
- Collapsible pill + drawer pattern for contextual help/checklists
- localStorage for dismissible UI state
- Conditional rendering based on data thresholds (bonus step logic)
