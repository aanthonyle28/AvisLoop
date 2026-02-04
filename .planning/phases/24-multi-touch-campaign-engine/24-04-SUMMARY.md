---
phase: 24-multi-touch-campaign-engine
plan: 04
subsystem: backend-data-layer
tags: [campaigns, data-functions, server-actions, crud, supabase]

requires:
  - 24-01: Campaign database schema and types
  - lib/validations/campaign.ts: Validation schemas already existed

provides:
  - lib/data/campaign.ts: Campaign data fetching functions
  - lib/actions/campaign.ts: Campaign CRUD server actions

affects:
  - 24-06: Campaign UI will consume these functions/actions
  - 24-07: Job completion hook will call getActiveCampaignForJob

tech-stack:
  patterns:
    - Server-only data layer with RLS security
    - Atomic campaign + touches CRUD operations
    - Preset protection (cannot edit/delete system presets)
    - Enrollment lifecycle management (pause stops enrollments)

key-files:
  created:
    - lib/data/campaign.ts
    - lib/actions/campaign.ts

decisions:
  - name: Atomic touch replacement on update
    rationale: Delete all touches and re-insert ensures clean state
    phase: 24-04

  - name: Manual rollback on touch insert failure
    rationale: Supabase doesn't support transactions, so manually delete campaign if touches fail
    phase: 24-04

  - name: Pause stops all active enrollments
    rationale: Prevents new touches from sending when campaign is paused
    phase: 24-04

  - name: Delete blocked by active enrollments
    rationale: Prevents data integrity issues with in-flight enrollments
    phase: 24-04

metrics:
  duration: 5 minutes
  completed: 2026-02-04
---

# Phase 24 Plan 04: Campaign Data Functions & Actions Summary

**One-liner:** Campaign CRUD data functions and server actions with preset protection, enrollment lifecycle management, and RLS security

## What Was Built

Created complete backend data layer for campaign management following established patterns from message-template.ts.

### Data Functions (lib/data/campaign.ts)

**Query functions:**
- `getCampaigns()` - Fetch business campaigns with optional preset inclusion and service type filtering
- `getCampaign()` - Single campaign with touches by ID
- `getCampaignPresets()` - System presets only for duplication
- `getCampaignEnrollments()` - Enrollments with customer/job details, status filtering
- `getCampaignEnrollmentCounts()` - Quick stats (active/completed/stopped counts)
- `getActiveCampaignForJob()` - Find matching active campaign prioritizing service-type match over "all services"

**Key patterns:**
- All functions use RLS via authenticated Supabase client
- Touch arrays sorted by touch_number for UI consistency
- Preset campaigns have business_id=NULL and is_preset=true
- Service type NULL semantics: NULL = "all services" campaign

### Server Actions (lib/actions/campaign.ts)

**Mutation actions:**
- `createCampaign()` - Insert campaign + touches atomically with unique constraint handling
- `updateCampaign()` - Update campaign and replace touches (delete all, insert new)
- `deleteCampaign()` - Delete with active enrollment check (blocks if enrollments exist)
- `duplicateCampaign()` - Copy preset or existing campaign with new name
- `toggleCampaignStatus()` - Pause/resume with enrollment lifecycle (pause stops all active enrollments)
- `stopEnrollment()` - Manually stop single enrollment with stop_reason='owner_stopped'

**Key patterns:**
- Preset protection: Cannot edit/delete system presets
- Manual rollback on touch insert failure (no transaction support)
- Cache revalidation via revalidatePath('/campaigns')
- ActionState return type matches message-template patterns

## Technical Implementation

### Campaign + Touches Atomicity

Campaign creation/update handles campaign and touches as atomic operation:

```typescript
// Insert campaign
const { data: campaign } = await supabase.from('campaigns').insert({...}).single()

// Insert touches
const touchInserts = touches.map(touch => ({ campaign_id: campaign.id, ... }))
await supabase.from('campaign_touches').insert(touchInserts)

// Manual rollback if touches fail
if (touchError) {
  await supabase.from('campaigns').delete().eq('id', campaign.id)
}
```

### Pause Lifecycle Management

When campaign is paused, all active enrollments are stopped:

```typescript
if (newStatus === 'paused') {
  await supabase.from('campaign_enrollments').update({
    status: 'stopped',
    stop_reason: 'campaign_paused',
    stopped_at: new Date().toISOString(),
  }).eq('campaign_id', campaignId).eq('status', 'active')
}
```

### Preset vs User Campaigns

System presets have business_id=NULL. RLS policies allow all users to SELECT presets but only business owners to SELECT their own campaigns:

```sql
-- From 20260204_create_campaigns.sql
WHERE is_preset = true OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
```

Actions check is_preset flag to prevent edit/delete operations.

### Service Type Matching Priority

getActiveCampaignForJob() prioritizes service-specific campaigns over "all services":

```typescript
.or(`service_type.eq.${serviceType},service_type.is.null`)
.order('service_type', { ascending: false, nullsFirst: false })  // Specific match first
```

## Testing Notes

All functions compile successfully (npm run typecheck + npm run lint pass).

**Manual testing checklist for Phase 24-06 UI:**
- [ ] getCampaigns returns both business campaigns and presets
- [ ] createCampaign validates touches array (min 1, max 4)
- [ ] updateCampaign prevents editing system presets
- [ ] deleteCampaign blocks if active enrollments exist
- [ ] duplicateCampaign creates editable copy from preset
- [ ] toggleCampaignStatus stops enrollments when pausing
- [ ] getActiveCampaignForJob prioritizes service-type match

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

**1. Atomic touch replacement on update**
- Delete all touches and re-insert rather than diffing/merging
- Simpler logic, ensures clean state
- Performance impact minimal (max 4 touches per campaign)

**2. Manual rollback on touch insert failure**
- Supabase doesn't support transactions in client library
- Manually delete campaign if touches fail to insert
- Alternative would be database-level trigger, but this is simpler

**3. Pause stops all active enrollments**
- When campaign is paused, set all enrollments to stopped with stop_reason='campaign_paused'
- Prevents confusing state where campaign is paused but enrollments continue
- Resume does NOT re-activate stopped enrollments (they stay stopped)

**4. Delete blocked by active enrollments**
- Count active enrollments before allowing delete
- User must manually stop or wait for completion
- Prevents orphaned enrollments or cascading deletes

## Files Changed

### Created
- `lib/data/campaign.ts` (223 lines) - Campaign data fetching functions
- `lib/actions/campaign.ts` (347 lines) - Campaign CRUD server actions

### Modified
None (validation schema lib/validations/campaign.ts already existed from earlier plan)

## Next Phase Readiness

**Phase 24-06 (Campaign UI) can proceed immediately.**

Required by 24-06:
- ✅ getCampaigns() for campaign list view
- ✅ getCampaignPresets() for preset gallery
- ✅ createCampaign() for campaign form submission
- ✅ updateCampaign() for edit flow
- ✅ deleteCampaign() for delete button
- ✅ duplicateCampaign() for "Use this preset" flow
- ✅ toggleCampaignStatus() for pause/resume toggle
- ✅ getCampaignEnrollments() for enrollment list
- ✅ stopEnrollment() for manual enrollment stop

**Phase 24-07 (Job Completion Hook) can proceed immediately.**

Required by 24-07:
- ✅ getActiveCampaignForJob() to find matching campaign when job completes

## Links

- **Plan:** `.planning/phases/24-multi-touch-campaign-engine/24-04-PLAN.md`
- **Schema:** `supabase/migrations/20260204_create_campaigns.sql`
- **Types:** `lib/types/database.ts` (Campaign, CampaignWithTouches, etc.)
- **Validation:** `lib/validations/campaign.ts`
- **Commits:** 3ad7322, cd512b9
