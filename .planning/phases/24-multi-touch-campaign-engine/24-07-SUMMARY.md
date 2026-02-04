---
phase: 24-multi-touch-campaign-engine
plan: 07
subsystem: campaign-ui
tags: [campaigns, ui, radix, switch, presets]
dependencies:
  requires: [24-03-campaign-validation, 24-04-campaign-crud]
  provides: [campaigns-page, campaign-list, preset-picker]
  affects: [24-08-campaign-editor, 24-09-campaign-detail]
tech-stack:
  added: [@radix-ui/react-switch]
  patterns: [optimistic-ui, preset-cards]
key-files:
  created:
    - app/(dashboard)/campaigns/page.tsx
    - app/(dashboard)/campaigns/loading.tsx
    - components/campaigns/campaign-list.tsx
    - components/campaigns/campaign-card.tsx
    - components/campaigns/preset-picker.tsx
    - components/ui/switch.tsx
  modified:
    - package.json
decisions: []
metrics:
  duration: 4m 20s
  completed: 2026-02-04
---

# Phase 24 Plan 07: Campaigns List UI & Preset Picker Summary

**One-liner:** Campaign list page with status toggle, action menu, and preset picker cards showing touch sequences

## What Was Built

### Campaign Page & Loading State
- `/campaigns` page with empty state and list view
- Conditional rendering: preset picker for first-time users, list view for existing campaigns
- Loading state with skeleton placeholders
- "New Campaign" button appears when campaigns exist

### Campaign List Components
- `CampaignList` wrapper component for campaign cards
- `CampaignCard` component displaying:
  - Campaign name (linked to detail page)
  - Service type badge (or "All Services" for NULL)
  - Touch counts: total, email count, SMS count
  - Status toggle switch (Active/Paused)
  - Dropdown menu: Edit, Duplicate, Delete actions
- Optimistic UI updates for status toggle
- Server action integration for all mutations

### Preset Picker
- 3-card layout for Conservative/Standard/Aggressive presets
- Touch sequence visualization with channel icons and timing
- Compact mode for "add another campaign" section
- Click-to-duplicate flow redirects to edit page
- Visual indicators: email (envelope icon), SMS (chat icon)
- Timing display: hours or days based on delay

### UI Components
- Added Switch component using `@radix-ui/react-switch`
- Installed Radix Switch package (v1.1.2)

## Technical Implementation

### Status Toggle Pattern
```typescript
// Optimistic updates with revert on error
const [optimisticStatus, setOptimisticStatus] = useState(campaign.status)
const handleStatusToggle = () => {
  const newStatus = optimisticStatus === 'active' ? 'paused' : 'active'
  setOptimisticStatus(newStatus)
  startTransition(async () => {
    const result = await toggleCampaignStatus(campaign.id)
    if (result.error) {
      setOptimisticStatus(campaign.status) // Revert
      toast.error(result.error)
    }
  })
}
```

### Preset Matching
- Matches database presets with `CAMPAIGN_PRESETS` constants by name substring
- Displays preset metadata (description, recommended services)
- Touch visualization uses campaign_touches array from database

### Empty State Strategy
- No campaigns: Full preset picker with description
- Has campaigns: List + compact preset picker below

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blocks:** None

**Enables:**
- Plan 24-08: Campaign editor (full page with touch configuration)
- Plan 24-09: Campaign detail page (performance stats, enrollments)

**Notes:**
- Switch component now available for reuse across app
- Campaign list page is main entry point for campaign management
- Preset picker flow creates campaign copy and redirects to editor

## Testing Notes

### Verification Completed
- ✅ TypeScript compilation passes (except unrelated Stripe version issue)
- ✅ ESLint passes with no warnings
- ✅ Campaign page structure created with proper metadata
- ✅ Components use correct type imports from database.ts
- ✅ Service type labels imported from job validations

### Manual Testing Required
- Navigate to `/campaigns` with no campaigns → see preset picker
- Create campaign via preset → redirects to edit page
- Campaign list shows correct touch counts and channels
- Status toggle updates campaign status
- Dropdown actions call correct server actions

## Performance Considerations

- Page uses Promise.all to fetch campaigns and presets in parallel
- Loading state prevents layout shift during data fetch
- Optimistic updates reduce perceived latency for status toggle
- Campaign cards use hover effects for visual feedback

## Security Notes

- All mutations go through server actions with business ownership checks
- Campaign deletion confirms before action
- No client-side campaign data manipulation

---

**Status:** ✅ Complete
**Commits:** 570c557
**Dependencies satisfied:** Campaign data functions, actions, and validations from plans 24-03 and 24-04
