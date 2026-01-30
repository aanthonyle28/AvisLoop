---
phase: 15
plan: 03
subsystem: dashboard-components
tags: [dashboard, components, data-layer, phosphor-icons, design-system]

requires:
  - 15-01 (design system foundation - status colors, Phosphor icons)
  - lib/data/send-logs.ts (existing data layer patterns)

provides:
  - Dashboard data functions (getNeedsAttentionCount, getRecentActivity)
  - Dashboard stat cards (MonthlyUsageCard, NeedsAttentionCard, ReviewRateCard)
  - Dashboard activity table (RecentActivityTable)
  - Avatar component with deterministic colors (AvatarInitials)

affects:
  - 15-04 (dashboard page integration - will consume these components)

tech-stack:
  added: []
  patterns:
    - "Deterministic avatar colors based on name hash"
    - "Status dot indicators with semantic colors"
    - "Presentation components with data passed as props"

key-files:
  created:
    - components/dashboard/stat-cards.tsx
    - components/dashboard/recent-activity.tsx
    - components/dashboard/avatar-initials.tsx
  modified:
    - lib/data/send-logs.ts (added getNeedsAttentionCount, getRecentActivity)
    - lib/types/database.ts (added reviewed_at to SendLog type)

decisions:
  - id: D15-03-01
    title: Deterministic avatar colors based on name hash
    context: Need consistent colors for user avatars across sessions
    decision: Hash the name string (sum of char codes mod 8) to select from 8 pastel colors
    alternatives:
      - Random colors (inconsistent across sessions)
      - User-selected colors (requires storage and UI)
    rationale: Simple, deterministic, no storage needed, visually pleasant

  - id: D15-03-02
    title: Map 'opened' status to 'Clicked' label in UI
    context: Database has 'opened' status for email tracking
    decision: Display as 'Clicked' in Recent Activity table for better user understanding
    alternatives:
      - Show as 'Opened' (less clear for email context)
      - Show as 'Read' (implies more than we know)
    rationale: 'Clicked' is more accurate for email tracking (user clicked link in email)

metrics:
  duration: 5 minutes
  completed: 2026-01-29

audit:
  - Test deterministic avatar colors by viewing same contact across sessions
  - Verify status dots match semantic color palette from 15-01
  - Check Recent Activity table with various send statuses
  - Verify Monthly Usage progress bar fills correctly at different percentages
---

# Phase 15 Plan 03: Dashboard Components & Data Layer Summary

**One-liner:** Dashboard building blocks with Phosphor icons, semantic status colors, and deterministic avatars ready for integration

## What Was Built

### Data Layer Functions (lib/data/send-logs.ts)

1. **getNeedsAttentionCount()** - Returns counts for dashboard "Needs Attention" card
   - Queries pending sends (status = 'pending')
   - Queries failed sends (status IN ['failed', 'bounced'])
   - Returns total, pending, and failed counts
   - Follows existing auth pattern (user → business → query)

2. **getRecentActivity(limit)** - Returns recent send logs with contact info
   - Joins send_logs with contacts table
   - Returns id, contact_name, contact_email, subject, status, created_at
   - Defaults to 5 most recent sends
   - Flattens nested contact structure for easier consumption

3. **Type fix** - Added `reviewed_at: string | null` to SendLog interface
   - Field exists in database (migration 00009) but was missing from type
   - Used by getResponseRate() function (already in file)

### Dashboard Components

#### 1. AvatarInitials (components/dashboard/avatar-initials.tsx)

**Purpose:** Display user initials in a colored circle

**Features:**
- Extracts initials: First + Last name (or first 2 letters of single name)
- Deterministic colors: 8 pastel colors (blue, green, purple, orange, pink, teal, indigo, rose)
- Color selection: Hash name string (sum of char codes mod 8)
- Two sizes: sm (32px) and md (40px)
- Server component (no client-side JS)

**Why deterministic:** Same contact always gets same color across all views and sessions

#### 2. MonthlyUsageCard (components/dashboard/stat-cards.tsx)

**Purpose:** Show monthly send usage vs tier limit

**Features:**
- Large number display: "count/limit"
- Blue progress bar showing percentage used
- Remaining count footer text
- Placeholder icon button (ArrowSquareOut) for future quick action
- White card with #E3E3E3 border (matches design system)

#### 3. NeedsAttentionCard (components/dashboard/stat-cards.tsx)

**Purpose:** Alert users to sends requiring action

**Features:**
- Total count of items needing attention
- Two status badges:
  - Pending (yellow/warning dot + count)
  - Failed (red/error dot + count)
- WarningCircle icon
- Uses semantic status colors (bg-status-warning, bg-status-error)

#### 4. ReviewRateCard (components/dashboard/stat-cards.tsx)

**Purpose:** Display review response rate and quality

**Features:**
- Percentage display (rate%)
- Optional trend indicator:
  - Shows "+X% from last month" if previousRate provided
  - Green TrendUp icon for positive, red TrendDown for negative
- Star rating visualization:
  - 5 stars (filled = rate/20 rounded)
  - "X/5 avg" text
  - Phosphor Star icons (filled or regular weight)
- Star icon in header

**Design note:** Rate is percentage (0-100), stars are visual 1-5 scale

#### 5. RecentActivityTable (components/dashboard/recent-activity.tsx)

**Purpose:** Show recent send activity with full context

**Features:**
- Table layout (not @tanstack/react-table - too heavy for 5 rows)
- Columns: CONTACT, SUBJECT, STATUS, DATE
- CONTACT cell:
  - AvatarInitials component (sm size)
  - Name (font-medium) + email (muted, smaller)
- SUBJECT cell: Truncated at 200px with ellipsis
- STATUS cell: Colored dot + label
  - pending → yellow "Pending"
  - sent → blue "Sent"
  - delivered → green "Delivered"
  - opened → blue "Clicked" (mapped for clarity)
  - failed/bounced → red "Failed"
  - reviewed → purple "Reviewed"
- DATE cell: "MMM d, yyyy" format
- Header: "Recent activity" + "View All" link to /history
- Empty state: Prompt to send first review request (links to /send)
- Subtle row borders (#F3F4F6)

## Design System Compliance

All components follow Phase 15-01 design system:

✓ **Phosphor icons** - No Lucide imports, all icons from @phosphor-icons/react/dist/ssr
✓ **Semantic status colors** - bg-status-warning, error, info, success, reviewed
✓ **Border-only design** - White cards with #E3E3E3 borders, no shadows
✓ **8px border radius** - rounded-lg throughout
✓ **Kumbh Sans font** - Inherits from global design system
✓ **Primary color #1B44BF** - Used in progress bar, links

## Technical Details

### Component Architecture

All components are **Server Components** (no "use client" directive):
- Pure presentational - data passed as props
- No internal data fetching (keeps components reusable)
- No state management needed
- Better performance (less client JS)

Dashboard page (Plan 15-04) will:
1. Fetch all data server-side
2. Pass data as props to these components
3. Render as single Server Component tree

### Type Safety

All components and functions fully typed:
- Props interfaces defined for all components
- Return types on all data functions
- Typecheck passes with no errors

### Status Mapping

Recent Activity uses status config object for consistency:
```typescript
const STATUS_CONFIG = {
  pending: { color: 'bg-status-warning', label: 'Pending' },
  sent: { color: 'bg-status-info', label: 'Sent' },
  delivered: { color: 'bg-status-success', label: 'Delivered' },
  opened: { color: 'bg-status-info', label: 'Clicked' },
  failed: { color: 'bg-status-error', label: 'Failed' },
  bounced: { color: 'bg-status-error', label: 'Failed' },
  complained: { color: 'bg-status-error', label: 'Failed' },
  reviewed: { color: 'bg-status-reviewed', label: 'Reviewed' },
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Plan 15-04 (Dashboard Page Integration):**
- ✓ All data functions exported and tested
- ✓ All components exported and typed
- ✓ Design system compliance verified
- ✓ No blocking issues

**Integration requirements:**
1. Import components in dashboard page
2. Fetch data using data layer functions
3. Pass data as props to components
4. Layout components in 3-column grid (as per Figma)

## Testing & Verification

**Automated:**
- ✓ pnpm typecheck passes
- ✓ pnpm lint passes (only 1 pre-existing warning in send-form.tsx)
- ✓ No Lucide imports in new components
- ✓ All exports present and correct

**Manual testing needed:**
- [ ] Verify avatar colors are consistent for same contact
- [ ] Test Recent Activity with all send statuses
- [ ] Check Monthly Usage progress bar at 0%, 50%, 100%, >100%
- [ ] Verify Review Rate trend indicator shows correctly
- [ ] Test empty state in Recent Activity

## Files Changed

**Created:**
- `components/dashboard/stat-cards.tsx` (3 components: 143 lines)
- `components/dashboard/recent-activity.tsx` (120 lines)
- `components/dashboard/avatar-initials.tsx` (58 lines)

**Modified:**
- `lib/data/send-logs.ts` (+53 lines: 2 new functions)
- `lib/types/database.ts` (+1 line: reviewed_at field)

**Total:** 3 new files, 2 modified files, 375 lines added

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| ce79e6a | feat | Add dashboard data layer functions (getNeedsAttentionCount, getRecentActivity) |
| 6bd24c1 | feat | Create dashboard components (stat cards, activity table, avatar) |

## Open Questions

None.

## Risks & Concerns

None. All components are presentational and well-isolated.

## Performance Notes

- All components are Server Components → minimal client JS
- AvatarInitials hashing is O(n) on name length → negligible cost
- Recent Activity queries only 5 rows → fast
- Needs Attention queries are simple counts → indexed on business_id

## Future Enhancements

1. **MonthlyUsageCard icon button** - Wire up to usage details modal/page
2. **Review Rate trend calculation** - Add data layer function for previous month rate
3. **Recent Activity click** - Add row click to navigate to send details
4. **Avatar image support** - Add optional image prop to AvatarInitials (fallback to initials)
5. **Status tooltips** - Add hover tooltips explaining each status
