---
status: diagnosed
trigger: "Investigate why the mobile bottom nav in AvisLoop shows 5 items including 'Scheduled' when the Phase 15-02 design spec says it should only show 4 items (Dashboard, Contacts, Send, History — no Scheduled)."
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:00:00Z
---

## Current Focus

hypothesis: Scheduled nav item was not actually removed from the nav items array or was re-added in a later phase
test: Read bottom-nav.tsx and app-shell.tsx to check nav items configuration
expecting: Will find Scheduled still present in nav items array
next_action: Read components/layout/bottom-nav.tsx

## Symptoms

expected: Mobile bottom nav should show 4 items (Dashboard, Contacts, Send, History) - no Scheduled
actual: Mobile bottom nav shows 5 items including "Scheduled"
errors: None - UI displays incorrectly
reproduction: View mobile bottom nav component
started: Phase 15-02 claims to have removed it, but it's still showing

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:00:00Z
  checked: components/layout/bottom-nav.tsx lines 10-16
  found: Nav items array contains 5 items including { icon: CalendarBlank, label: 'Scheduled', href: '/scheduled' } at line 14
  implication: The Scheduled nav item was never actually removed from the items array

- timestamp: 2026-01-29T00:00:00Z
  checked: components/layout/bottom-nav.tsx line 31
  found: Grid uses grid-cols-5 (5 columns)
  implication: Layout is configured for 5 items, not 4

- timestamp: 2026-01-29T00:00:00Z
  checked: components/layout/bottom-nav.tsx lines 19-20, 35
  found: scheduledCount prop still exists and is used to show badge count on Scheduled item
  implication: Despite Phase 15-02 claiming to remove scheduledCount prop, it's still present and functional

- timestamp: 2026-01-29T00:00:00Z
  checked: components/layout/app-shell.tsx lines 6, 13, 24
  found: AppShell still accepts and passes scheduledCount prop to BottomNav
  implication: The prop was never removed from the parent component either

- timestamp: 2026-01-29T00:00:00Z
  checked: git log for bottom-nav.tsx
  found: Commit ce766c0 (Phase 15-02) correctly removed Scheduled and changed grid-cols-5 to grid-cols-4
  implication: The removal WAS implemented initially

- timestamp: 2026-01-29T00:00:00Z
  checked: git commit a3d68a4 (after ce766c0)
  found: Commit a3d68a4 "fix(13): add Scheduled nav item to sidebar and bottom nav" re-added Scheduled AFTER it was removed in Phase 15-02
  implication: A later commit reversed the Phase 15-02 changes

- timestamp: 2026-01-29T00:00:00Z
  checked: git log chronology
  found: Commit order was ce766c0 (Phase 15-02 removes Scheduled) → a3d68a4 (Phase 13 fix re-adds Scheduled)
  implication: Phase 13 "fix" was committed AFTER Phase 15-02, reversing the design decision

## Resolution

root_cause: Phase 15-02 correctly removed Scheduled from the bottom nav in commit ce766c0 (items array reduced from 5 to 4, grid-cols changed from 5 to 4, scheduledCount prop removed). However, commit a3d68a4 "fix(13): add Scheduled nav item to sidebar and bottom nav" was committed AFTER Phase 15-02 and re-added everything that was removed: CalendarBlank icon + Scheduled entry to items array, grid-cols changed back to 5, and scheduledCount prop/badge logic restored. This appears to be a Phase 13 retroactive fix that conflicted with the Phase 15 design decision to have only 4 mobile nav items.
fix: N/A (diagnosis only)
verification: N/A (diagnosis only)
files_changed: []
