# Phase 32: Post-Onboarding Guidance - Research

**Researched:** 2026-02-06
**Domain:** User Onboarding / Feature Discovery
**Confidence:** HIGH

## Summary

Instead of a guided tour, this phase implements two lighter-weight onboarding patterns:
1. **Dashboard Checklist** - Persistent "Getting Started" card tracking key milestones
2. **Contextual Tooltip Hints** - First-visit hints on key pages

These patterns are less intrusive than tours and better suited for SaaS products where users return repeatedly. Research shows checklists have 70%+ completion rates when items are achievable within the first session.

## Key Decisions (2026-02-06 Discussion)

| Decision | Resolution |
|----------|------------|
| Campaign item | "Review your campaign" — users already pick preset in onboarding, this confirms settings |
| Review tracking | Track `campaign_enrollments.stop_reason = 'review_clicked'` — actual funnel success |
| Job default status | Default to `scheduled` in Add Job form, with "remember preference" option |
| Existing users | Show checklist if all items incomplete (no current users, natural filter) |
| Hint pages | Jobs + Campaigns (both get tooltip hints) |
| Auto-collapse | After 3 days, collapse to header only. X button to fully dismiss anytime |
| Mobile FAB | Already exists — no blocker |

## Standard Stack

### Core
| Component | Approach | Why |
|-----------|----------|-----|
| Checklist data | Supabase user_metadata or businesses table | Persists across devices, survives logout |
| Tooltip hints | localStorage | Per-device is acceptable for hints |
| Tooltip UI | Radix Tooltip or custom positioned div | Already have Radix in stack |

### No New Dependencies Required
- Checklist: Pure React component with Supabase data
- Tooltips: Use existing Radix Tooltip primitive or simple CSS positioning

## Architecture Patterns

### Pattern 1: Database-Persisted Checklist

**What:** Store checklist state in database, not localStorage
**Why:** Survives logout, works across devices, can be queried for analytics
**Where to store:**
- Option A: `businesses.onboarding_checklist` JSONB column
- Option B: `user_metadata` in Supabase auth (less flexible)
- **Recommended:** Option A - businesses table, easier to query and extend

**Schema:**
```sql
-- Add to businesses table
ALTER TABLE businesses ADD COLUMN onboarding_checklist JSONB DEFAULT '{
  "first_job_added": false,
  "campaign_setup": false,
  "job_completed": false,
  "first_review": false,
  "dismissed": false
}'::jsonb;
```

### Pattern 2: Checklist Component

**What:** Card component that renders checklist items with completion state
**Where:** Dashboard page, conditionally rendered for new users

```typescript
// Checklist items - V2 aligned (Updated 2026-02-06)
const CHECKLIST_ITEMS = [
  {
    id: 'first_job_added',
    title: 'Add your first job',
    description: 'Log a job to start collecting reviews',
    href: '/jobs?action=add',
    cta: 'Add Job',
    // Detection: jobs count > 0
  },
  {
    id: 'campaign_reviewed',
    title: 'Review your campaign',
    description: 'Check your timing and message sequence',
    href: '/campaigns',
    cta: 'View Campaign',
    // Detection: user has active campaign (created during onboarding)
    // Purpose: Verify timing is right for their business, preview messages
  },
  {
    id: 'job_completed',
    title: 'Complete a job',
    description: 'Mark a job as completed to trigger automation',
    href: '/jobs',
    cta: 'View Jobs',
    // Detection: jobs with status='completed' > 0
  },
  {
    id: 'first_review_click',
    title: 'Get your first review click',
    description: 'A customer clicked through to leave a review',
    href: '/analytics',
    cta: 'View Analytics',
    // Detection: campaign_enrollments.stop_reason = 'review_clicked' > 0
    // This is actual funnel success — customer went to Google
  },
]
```

### Pattern 3: Auto-Detection of Completion

**What:** Check actual data to determine if checklist item is complete
**Why:** More reliable than manual tracking, reflects real state

```typescript
async function getChecklistState(businessId: string) {
  const [jobs, campaigns, completedJobs, reviewClicks] = await Promise.all([
    getJobCount(businessId),
    getCampaignCount(businessId),
    getCompletedJobCount(businessId),
    getReviewClickCount(businessId), // campaign_enrollments.stop_reason = 'review_clicked'
  ])

  return {
    first_job_added: jobs > 0,
    campaign_reviewed: campaigns > 0, // User has campaign (created during onboarding)
    job_completed: completedJobs > 0,
    first_review_click: reviewClicks > 0, // Actual funnel success
  }
}
```

### Pattern 4: Tooltip Hints with localStorage

**What:** Show tooltip once per page, track in localStorage
**Why:** Simple, doesn't need database, per-device is acceptable

```typescript
// Hook for first-visit hints
function useFirstVisitHint(pageId: string) {
  const [hasSeenHint, setHasSeenHint] = useLocalStorage(
    `hint-${pageId}-seen`,
    false
  )

  const dismissHint = useCallback(() => {
    setHasSeenHint(true)
  }, [setHasSeenHint])

  return {
    showHint: !hasSeenHint,
    dismissHint,
  }
}
```

### Pattern 5: Tooltip Positioning

**What:** Position tooltip relative to target element
**Options:**
- Use Radix Tooltip with `open` controlled state
- Use CSS `position: absolute` with offset calculation
- Use Floating UI (if already installed)

**Recommended:** Radix Tooltip (already in stack)

```tsx
// Jobs page hint
function JobsPageHint() {
  const { showHint, dismissHint } = useFirstVisitHint('jobs-page')

  if (!showHint) return null

  return (
    <Tooltip open={true}>
      <TooltipTrigger asChild>
        <span data-hint-target="add-job-button" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">Add your first job here</p>
        <p className="text-muted-foreground text-sm">
          Log completed jobs to start collecting reviews automatically.
        </p>
        <Button size="sm" variant="ghost" onClick={dismissHint}>
          Got it
        </Button>
      </TooltipContent>
    </Tooltip>
  )
}
```

## V2 Philosophy Alignment

### Checklist Items (V2 Aligned)
| Item | V2 Principle Reinforced |
|------|------------------------|
| Add first job | Jobs are the primary action |
| Review your campaign | Automation handles messaging (verify settings) |
| Complete a job | Completion triggers automation |
| Get first review click | System delivers results (funnel success) |

### DO NOT Include
- "Add your first customer" (V1 pattern)
- "Send a review request" (V1 pattern)
- "Import customers" (V1 pattern)

### Tooltip Hints (V2 Aligned)
| Page | Hint Target | Message |
|------|-------------|---------|
| Jobs | Add Job button | "Add your first job here — this triggers automatic review requests" |
| Campaigns | Campaign card/settings | "Review your timing and messages to match your business" |

## Recommended File Structure

```
components/
├── onboarding/
│   ├── getting-started-checklist.tsx  # Dashboard checklist card
│   └── first-visit-hint.tsx           # Reusable hint wrapper
lib/
├── data/
│   └── checklist.ts                   # Checklist state queries
├── hooks/
│   └── use-first-visit-hint.ts        # localStorage hint tracking
```

## Implementation Phases

### Wave 1: Database & Checklist
1. Add `onboarding_checklist` column to businesses table
2. Create checklist data functions (get/update state)
3. Build GetStartedChecklist component
4. Add to dashboard (conditionally rendered)

### Wave 2: Tooltip Hints
1. Create useFirstVisitHint hook
2. Build FirstVisitHint component
3. Add hint to Jobs page (pointing at Add Job button)
4. Test and polish

## Common Pitfalls

### Pitfall 1: Checklist Never Auto-Completes
**Problem:** User completes action but checklist doesn't update
**Solution:** Query actual data state, don't rely on manual updates

### Pitfall 2: Hint Blocks Interaction
**Problem:** Tooltip prevents clicking the target button
**Solution:** Use `pointerEvents: none` on overlay, or position hint adjacent to target

### Pitfall 3: Checklist Visible to Existing Users
**Problem:** Users who completed onboarding before this feature see checklist
**Solution:** Only show if `onboarding_completed_at` is recent (e.g., last 30 days) OR if all items incomplete

## Success Metrics

- Checklist completion rate (target: 70%+)
- Time to first job (should decrease)
- Hint dismiss rate (if too high, hint is annoying)
- Feature adoption within 7 days of signup

## Open Questions (Resolved 2026-02-06)

1. **Should checklist be collapsible?**
   - ✅ DECIDED: Auto-collapse after 3 days, show just header. X button to fully dismiss anytime.

2. **What happens after all items complete?**
   - ✅ DECIDED: Show congratulations message, user can dismiss with X.

3. **Should hints show on mobile?**
   - ✅ DECIDED: Yes. Mobile FAB for Add Job already exists.

4. **What about existing users?**
   - ✅ DECIDED: Show checklist if all items incomplete (no current users, natural filter for new signups)

## Related Improvements (Out of Scope for Phase 32)

The following improvements were identified during planning but are out of scope:

1. **Job form default status**: Default to `scheduled` in Add Job form, with localStorage preference for "remember my choice". This should be a separate task/phase.

2. **Auto-open Add Job sheet**: When navigating to `/jobs?action=add`, auto-open the Add Job sheet. Related to checklist "Add your first job" link.

## Metadata

**Confidence:** HIGH - Simple patterns, no new dependencies, proven UX
**Research date:** 2026-02-06
**Valid until:** 2026-03-06
