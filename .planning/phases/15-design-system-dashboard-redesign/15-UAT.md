---
status: diagnosed
phase: 15-design-system-dashboard-redesign
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md, 15-04-SUMMARY.md]
started: 2026-01-30T04:00:00Z
updated: 2026-01-30T04:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Kumbh Sans Font Applied
expected: All text renders in Kumbh Sans font family. DevTools shows "Kumbh Sans" on body.
result: pass

### 2. Primary Color #1B44BF
expected: Primary/accent color throughout the app is #1B44BF (deep blue). Buttons, links, active states use this color.
result: pass

### 3. Border-Only Design (No Shadows)
expected: Cards and buttons have borders but NO box-shadows. Clean, flat design throughout.
result: pass

### 4. Sidebar Visual Design
expected: Sidebar has white background, #E2E2E2 border on right edge, Phosphor icons, active item has #F2F2F2 background with blue icon.
result: pass

### 5. Bottom Nav (Mobile)
expected: Mobile bottom nav shows 4 items (Dashboard, Contacts, Send, History) with Phosphor icons. No "Scheduled" item.
result: issue
reported: "Mobile bottom nav shows 5 items including Scheduled. Expected 4 items per design spec."
severity: minor

### 6. Content Background Color
expected: Main content area has light gray #F9F9F9 background color.
result: pass

### 7. Dashboard Welcome Header
expected: Dashboard shows personalized welcome message with first name extracted from business name or email.
result: pass

### 8. Dashboard Stat Cards Row
expected: Three stat cards in a row: Monthly Usage (count/limit with progress bar), Needs Attention (pending + failed counts), Review Rate (percentage with stars).
result: pass

### 9. Quick Send Panel
expected: Dashboard has inline Quick Send with contact search dropdown, template selector, and a Send button. Recently added contacts shown as chips.
result: pass

### 10. Schedule Presets (When to Send)
expected: Next to Quick Send, schedule presets shown as toggle chips: Immediately, In 1 hour, In the morning, In 24 hours, Different date. Selecting "Different date" shows datetime picker.
result: pass

### 11. Recent Activity Table
expected: Dashboard shows "Recent activity" table with columns: CONTACT (avatar + name + email), SUBJECT, STATUS (colored dot + label), DATE. "View All" link goes to /history.
result: pass

### 12. Status Badge Colors
expected: Status badges use semantic colors: Pending=yellow, Sent=blue, Delivered=green, Failed=red, Reviewed=purple. "Opened" displays as "Clicked".
result: pass

### 13. Avatar Initials
expected: Contact avatars show initials in colored circles. Same contact always gets same color (deterministic).
result: pass

### 14. Dashboard Skeleton Loading
expected: Dashboard shows skeleton loading state that matches the new layout structure (stat cards, quick send, activity table shapes).
result: skipped
reason: Cannot reliably test loading skeleton in Playwright without network interception; requires manual browser testing.

## Summary

total: 14
passed: 12
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Mobile bottom nav shows 4 items (Dashboard, Contacts, Send, History) with no Scheduled item"
  status: failed
  reason: "User reported: Mobile bottom nav shows 5 items including Scheduled. Expected 4 items per design spec."
  severity: minor
  test: 5
  root_cause: "Phase 15-02 commit ce766c0 correctly removed Scheduled from bottom nav, but commit a3d68a4 (Phase 13 fix, 6 minutes later) re-added it with all 5 items, grid-cols-5, and scheduledCount prop"
  artifacts:
    - path: "components/layout/bottom-nav.tsx"
      issue: "Contains Scheduled nav item at line 14, uses grid-cols-5 at line 31"
    - path: "components/layout/app-shell.tsx"
      issue: "Passes scheduledCount prop to BottomNav"
  missing:
    - "Remove Scheduled entry from bottom-nav.tsx nav items array"
    - "Change grid-cols-5 to grid-cols-4 in bottom-nav.tsx"
    - "Remove scheduledCount prop from BottomNav and AppShell"
  debug_session: ".planning/debug/scheduled-nav-item-showing.md"
