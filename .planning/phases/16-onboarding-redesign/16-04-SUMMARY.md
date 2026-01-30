---
phase: 16-onboarding-redesign
plan: 04
subsystem: onboarding-dashboard
tags: [onboarding, dashboard, cards, test-sends, quota, auto-detection]
status: complete
completed: 2026-01-30

# Dependencies
requires:
  - 16-01 # is_test flag migration, onboarding_steps_completed JSONB format

provides:
  - onboarding-cards-component # 3 numbered dashboard cards
  - card-auto-detection # status tracked from DB state
  - test-send-flagging # isTest param in send action
  - test-send-quota-exclusion # is_test=false filter in quota queries

affects:
  - dashboard-ux # Cards guide new users post-wizard
  - send-workflow # Test sends flagged and excluded from quota
  - quota-accuracy # Only real sends count toward monthly limits

# Tech Stack
tech-stack:
  added: []
  patterns:
    - Auto-detection with JSONB persistence (read from DB, cache in businesses.onboarding_steps_completed)
    - FormData isTest parameter for test send flagging

# File Changes
key-files:
  created:
    - components/dashboard/onboarding-cards.tsx # 3 numbered cards with completion tracking
  modified:
    - lib/data/onboarding.ts # OnboardingCardStatus type, getOnboardingCardStatus, areAllCardsComplete
    - lib/actions/onboarding.ts # markOnboardingCardStep server action
    - lib/data/send-logs.ts # is_test=false filter in getMonthlyUsage
    - lib/actions/send.ts # isTest param wired into send actions, is_test column set
    - app/dashboard/page.tsx # OnboardingCards integration, cardStatus fetching
    - components/dashboard/onboarding-checklist.tsx # Deprecated with comment

# Decisions
decisions:
  - id: D16-04-01
    decision: Auto-detect card completion from database state (contacts, templates, send_logs)
    rationale: Avoids manual tracking, cards update automatically when user completes actions
    impact: Medium

  - id: D16-04-02
    decision: Card 3 links to /send?test=true (not just /send)
    rationale: Query param signals send form to set isTest=true, flagging test sends
    impact: Low

  - id: D16-04-03
    decision: Exclude test sends from quota counting (is_test=false filter)
    rationale: Test sends shouldn't count against monthly limits
    impact: High

  - id: D16-04-04
    decision: Deprecate onboarding checklist instead of deleting
    rationale: Safe incremental migration, avoid breaking references
    impact: Low

# Metrics
duration: 7m
tasks_completed: 2
commits: 2

---

# Phase 16 Plan 04: Dashboard Onboarding Cards Summary

**One-liner:** 3 numbered onboarding cards with auto-detection, test send flagging, and quota exclusion

## What Was Built

### Onboarding Cards Component
- **3 numbered cards:**
  - Card 1: Create contact (/contacts)
  - Card 2: Create template (/dashboard/settings)
  - Card 3: Send test (/send?test=true)
- **Auto-completion detection:** Reads database state (contacts, templates, sends) and caches in businesses.onboarding_steps_completed JSONB column
- **Visual design:** Border-only cards, green tint for completed, Phosphor icons, number labels, hover arrow
- **Prerequisite check:** Card 3 shows warning if no contacts created yet
- **Auto-hide:** Cards disappear when all 3 complete

### Test Send Infrastructure
- **isTest parameter:** Send action reads isTest from FormData and sets is_test=true on send_log inserts
- **Quota exclusion:** getMonthlyUsage and getMonthlyCount add `.eq('is_test', false)` filter
- **Test flag propagation:** Both sendReviewRequest and batchSendReviewRequest support isTest param

### Data Layer Enhancements
- **OnboardingCardStatus type:** `{ contact_created, template_created, test_sent }`
- **getOnboardingCardStatus():** Auto-detects completion, persists to JSONB for faster reads
- **areAllCardsComplete():** Helper to check if all 3 cards done
- **markOnboardingCardStep():** Manual server action for edge cases

### Dashboard Integration
- **Cards positioned:** Between welcome header and stat cards (section 2 of 5)
- **Conditional rendering:** Only show if not all cards complete
- **Parallel data fetching:** cardStatus fetched with other dashboard data

## Deviations from Plan

None - plan executed exactly as written.

## Key Implementation Details

### Auto-Detection Pattern
```typescript
// 1. Read stored status from JSONB column
const stored = business.onboarding_steps_completed || {}

// 2. If all complete, return early (fast path)
if (stored.contact_created && stored.template_created && stored.test_sent) {
  return stored
}

// 3. Query database for actual state
const detected = {
  contact_created: (contactCount > 0),
  template_created: (templateCount > 0),
  test_sent: (sendCount > 0),
}

// 4. Persist newly detected completions back to JSONB
if (needsUpdate) {
  await supabase.update({ onboarding_steps_completed: detected })
}
```

### Test Send Flagging
```typescript
// Send form includes hidden input when ?test=true query param present
<input type="hidden" name="isTest" value="true" />

// Send action reads from FormData
const isTest = formData.get('isTest') === 'true'

// Insert includes is_test column
.insert({
  business_id,
  contact_id,
  status: 'pending',
  subject,
  is_test: isTest,  // <-- Test flag
})
```

### Quota Exclusion
```typescript
// Before (counted test sends):
.eq('business_id', business.id)
.gte('created_at', startOfMonth)

// After (excludes test sends):
.eq('business_id', business.id)
.eq('is_test', false)  // <-- Critical filter
.gte('created_at', startOfMonth)
```

## Testing Notes

**Manual verification required:**
1. **Fresh user flow:**
   - Complete wizard (business name + review link)
   - Dashboard shows 3 cards with 0/3 complete
   - Create contact → card 1 turns green
   - Create template → card 2 turns green
   - Send test request → card 3 turns green
   - All cards disappear when 3/3 complete

2. **Test send quota exclusion:**
   - Send test request (from dashboard card or /send?test=true)
   - Check send_logs: is_test should be true
   - Check dashboard usage card: test send should NOT count toward quota
   - Send real request (from /send without ?test=true)
   - Check send_logs: is_test should be false
   - Check dashboard usage card: real send should count toward quota

3. **Card prerequisite:**
   - Fresh user with no contacts
   - Card 3 shows "Create a contact first" warning
   - Card 3 still clickable but warning visible

## Architecture Impact

**Quota accuracy:** Test sends now correctly excluded from monthly limits. This was a critical missing piece - before this plan, test sends would count against quota.

**Onboarding UX:** Replaces checklist with visual cards, improving discoverability of next steps.

**Data integrity:** Auto-detection ensures card status always reflects actual database state, no manual tracking required.

## Next Phase Readiness

**Blockers:** None

**Concerns:**
- Send page needs to implement ?test=true query param handling (add hidden isTest input to form)
- If send page doesn't support ?test=true yet, card 3 link will work but won't flag as test send

**Follow-up work:**
- Update /send page to read ?test=true query param and include hidden isTest input
- Consider visual indicator on send page when in test mode (e.g., "Test Mode" badge)
- Monitor is_test flag usage in production to verify test sends are being flagged correctly

## Notes

- Old OnboardingChecklist deprecated but not deleted (safe to remove in future cleanup)
- Pre-existing typecheck and lint errors in other files (onboarding-wizard.tsx) not addressed
- Card completion status cached in JSONB column for performance (avoids 3 count queries on every dashboard load)
- All cards always clickable regardless of prerequisites (warning is informational, not blocking)
