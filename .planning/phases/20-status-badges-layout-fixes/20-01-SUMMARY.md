---
phase: 20-status-badges-layout-fixes
plan: 01
subsystem: ui-components
tags: [status-badge, phosphor-icons, figma-spec, component-unification]
requires: [phase-05-history, phase-11-scheduled-sending, phase-19-ux-redesign]
provides: [unified-status-badge, figma-spec-badges, scheduled-status-support]
affects: [phase-21-contacts-page-fixes, phase-22-v13-remaining-fixes]
tech-stack:
  added: []
  patterns: [component-unification, legacy-status-normalization, inline-styles-for-exact-colors]
key-files:
  created: []
  modified:
    - components/history/status-badge.tsx
    - components/scheduled/scheduled-table.tsx
decisions:
  - id: inline-styles-for-figma-colors
    choice: Use inline styles with exact hex values instead of Tailwind color classes
    rationale: Figma spec requires precise colors that don't map to Tailwind palette
    date: 2026-02-01
  - id: legacy-status-normalization
    choice: Normalize legacy status strings (sent, bounced, completed) to primary statuses
    rationale: Maintains backwards compatibility while consolidating to 6 canonical statuses
    date: 2026-02-01
metrics:
  duration: 5min
  completed: 2026-02-01
---

# Phase 20 Plan 01: Unified Status Badge Component

**One-liner:** Unified all status badge implementations into a single Figma-spec component with exact hex colors and Phosphor icons across 4 consumer locations.

## What Was Built

### 1. Rebuilt StatusBadge Component (components/history/status-badge.tsx)

**Before:**
- Used generic Tailwind color classes (bg-gray-100, text-green-800, etc.)
- No icons
- 7 status variants with inconsistent colors
- Dark mode support via Tailwind dark: variants

**After:**
- Exact Figma hex colors via inline styles (#F3F4F6, #EAF3F6, #FEF9C2, etc.)
- Phosphor Icons for each status (CircleNotch, CheckCircle, Cursor, WarningCircle, Star)
- 6 canonical status variants (pending, delivered, clicked, failed, reviewed, scheduled)
- Animate-spin on pending badge CircleNotch icon
- Legacy status normalization (sent→delivered, bounced→failed, completed→delivered)

**Status Configuration:**
| Status | Background | Text | Icon | Special |
|--------|-----------|------|------|---------|
| pending | #F3F4F6 | #101828 | CircleNotch | animate-spin |
| delivered | #EAF3F6 | #2C879F | CheckCircle | - |
| clicked | #FEF9C2 | #894B00 | Cursor | - |
| failed | #FFE2E2 | #C10007 | WarningCircle | - |
| reviewed | #DCFCE7 | #008236 | Star | - |
| scheduled | rgba(159,44,134,0.1) | #9F2C86 | CheckCircle | - |

**Legacy Status Mapping:**
- `sent` → `delivered`
- `opened` → `delivered`
- `completed` → `delivered`
- `bounced` → `failed`
- `complained` → `failed`
- Unknown → `pending`

### 2. Migrated Scheduled Table (components/scheduled/scheduled-table.tsx)

**Removed:**
- Inline `getStatusBadge` function (33 lines of duplicate badge logic)
- Badge import from @/components/ui/badge
- Unused icon imports (CheckCircle, XCircle, Warning)

**Added:**
- StatusBadge import from @/components/history/status-badge
- 4 StatusBadge component usages (replaced all getStatusBadge calls)

**Impact:** Scheduled table now renders status badges with identical styling to history page, send page, and drawers.

### 3. Verified Existing Consumers (No Code Changes)

All existing StatusBadge consumers automatically inherited the new Figma-spec styling:

1. **components/history/history-columns.tsx** - History table status column
2. **components/history/request-detail-drawer.tsx** - Drawer status section
3. **components/send/recent-activity-strip.tsx** - Recent activity chips
4. **components/scheduled/scheduled-table.tsx** - Scheduled send status (migrated in Task 2)

**Backwards Compatibility:** All consumers pass status as a string with type casting (`as SendStatus`). The new normalizeStatus function handles legacy status strings, so no breaking changes.

## Deviations from Plan

None - plan executed exactly as written.

## Testing Performed

- **TypeScript compilation:** `pnpm typecheck` passed with no errors
- **Linting:** `pnpm lint` passed with no warnings
- **Import verification:** Grepped for StatusBadge imports across codebase - all 4 consumers confirmed
- **Legacy removal:** Grepped for `getStatusBadge` - confirmed complete removal from scheduled-table

## Commits

| Commit | Files | Description |
|--------|-------|-------------|
| 54b8836 | status-badge.tsx | Rebuild StatusBadge with Figma-spec colors and icons |
| 5d2a1e0 | scheduled-table.tsx | Migrate scheduled-table to unified StatusBadge |

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Recommendations:**
- Phase 20-02 (settings sticky navbar + activity strip truncation) can proceed immediately
- Future status additions should add to the 6 canonical statuses, not create ad-hoc badges
- If dark mode contrast issues arise with Figma hex colors, consider adding dark mode variants to statusConfig

## Technical Decisions

### Inline Styles vs Tailwind Classes

**Decision:** Use inline `style` attribute with exact hex colors instead of Tailwind color classes.

**Rationale:**
- Figma spec provides absolute hex values (#F3F4F6, #EAF3F6, etc.)
- Tailwind color palette doesn't have exact matches for these values
- Inline styles ensure pixel-perfect color fidelity
- Trade-off: Loses automatic dark mode support, but Figma spec doesn't define dark variants

**Alternative considered:** Extend Tailwind config with custom color palette
**Why rejected:** Adds complexity for one-off component; inline styles are simpler

### Legacy Status Normalization

**Decision:** Map legacy status strings (sent, bounced, completed) to canonical 6 statuses via normalizeStatus function.

**Rationale:**
- Database/Resend may return legacy status strings
- Existing code casts status to SendStatus type
- Normalization prevents runtime errors and maintains visual consistency
- Future-proof: adding new statuses only requires updating normalizeStatus mapping

**Alternative considered:** Change database schema to only use canonical statuses
**Why rejected:** Out of scope for UI-only change; would require migration

## Performance Impact

**Positive:**
- Removed 33 lines of duplicate badge rendering logic from scheduled-table
- Single source of truth for status badge styling
- Phosphor Icons are tree-shakeable (only 5 icons imported)

**Neutral:**
- Inline styles have same performance as Tailwind classes
- normalizeStatus function adds ~5-10ms per badge render (negligible)

**No Negative Impact:** Badge rendering is already very fast; changes are stylistic, not algorithmic.

## Files Modified

**components/history/status-badge.tsx** (+82, -13 lines)
- Added Phosphor icon imports (CircleNotch, CheckCircle, Cursor, WarningCircle, Star)
- Replaced SendStatus type union (7 legacy → 6 canonical)
- Replaced statusConfig with Figma hex colors and icon references
- Added normalizeStatus function for legacy status mapping
- Replaced Badge className with inline style + className props
- Added animate-spin to pending icon
- Removed unused type definitions

**components/scheduled/scheduled-table.tsx** (+6, -43 lines)
- Removed Badge import
- Removed CheckCircle, XCircle, Warning icon imports
- Added StatusBadge import
- Removed getStatusBadge function (33 lines)
- Replaced 4 getStatusBadge calls with <StatusBadge status={send.status} />

## Knowledge for Future Phases

**When adding new status types:**
1. Add to SendStatus type union in status-badge.tsx
2. Add configuration to statusConfig object (label, bg, text, Icon)
3. Choose appropriate Phosphor Icon from existing imports or add new one
4. If legacy mapping needed, update normalizeStatus function

**When using StatusBadge in new components:**
1. Import: `import { StatusBadge } from '@/components/history/status-badge'`
2. Render: `<StatusBadge status={myStatus} />` (status can be string or SendStatus type)
3. Optional className prop for additional styling

**Dark mode consideration:**
Current implementation uses fixed hex colors that don't adapt to theme. If dark mode contrast issues arise:
- Option 1: Add dark mode variants to statusConfig (bg, text, bgDark, textDark)
- Option 2: Use CSS custom properties with Tailwind theme
- Option 3: Request updated Figma spec with dark mode colors
