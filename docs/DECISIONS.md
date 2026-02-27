# Product Decisions & ADRs

This document tracks key product decisions and Architecture Decision Records (ADRs).

---

## PRICING-001: Updated Pricing Tiers

**Date:** 2026-02-06
**Status:** Planned (not yet implemented)

### New Pricing Structure

| Tier | Price | Target User |
|------|-------|-------------|
| **Free Trial** | $0 (14 days?) | New users evaluating product |
| **Starter** | $49/mo | Solo operators, small businesses |
| **Growth** | $99/mo | Growing businesses, multiple technicians |
| **Pro** | $199/mo | High-volume businesses, agencies |

### Previous Pricing (to be replaced)

| Tier | Price |
|------|-------|
| Basic | $49/mo |
| Pro | $99/mo |

### Feature Differentiation (to be defined)

| Feature | Free Trial | Starter | Growth | Pro |
|---------|------------|---------|--------|-----|
| Jobs/month | Limited | ? | ? | Unlimited |
| Campaigns | 1? | ? | ? | Unlimited |
| AI Personalization | No | Yes | Yes | Yes + Priority |
| SMS | No? | Yes | Yes | Yes |
| Team members | 1 | 1 | ? | Unlimited |
| Support | Community | Email | Priority | Dedicated |

### Implementation Tasks

- [ ] Update Stripe products/prices
- [ ] Update `lib/constants/billing.ts`
- [ ] Update `app/(dashboard)/billing/page.tsx`
- [ ] Update pricing page (`app/(marketing)/pricing/page.tsx`)
- [ ] Update onboarding flow for free trial
- [ ] Add trial expiration logic

---

## AI-001: AI Personalization Strategy

**Date:** 2026-02-06
**Status:** Decided

### Decision

- **DO:** AI personalization happens automatically at send-time for all paid plans
- **DO:** Surface AI personalization in UI so users know it's happening
- **DON'T:** Build AI template creation (templates are one-time setup, low leverage)
- **DON'T:** Build template library with tiered access (adds complexity, system templates suffice)

### Rationale

1. System templates (16 total) cover most service types
2. AI personalization makes each message unique at send-time
3. Users want "set up once, runs forever" - not browsing libraries
4. Engineering effort better spent on core V2 flow

### Feature by Plan

| Plan | AI Personalization |
|------|-------------------|
| Free Trial | No (raw templates) |
| Starter | Yes |
| Growth | Yes |
| Pro | Yes + priority/better models |

---

## TEMPLATE-001: Template Visibility & Filtering

**Date:** 2026-02-06
**Status:** Partially Implemented

### Issues Identified

1. System templates have proper names but aren't clearly labeled in UI
2. Touch sequence editor shows generic "Use default template"
3. Users don't know AI personalization happens automatically
4. Too many templates shown if business only does certain services

### Implemented

- [x] **Service type filtering** - System templates only show for enabled service types
  - User-created templates always show
  - System templates filtered by `service_types_enabled` on business
  - Modified `getAvailableTemplates()` in `lib/data/message-template.ts`

### Planned Changes

- [ ] Add "System" badge to default templates in Settings
- [ ] Show actual template names in touch sequence editor dropdown
- [ ] Add AI personalization indicator: "Messages are automatically personalized by AI"
- [ ] Improve template selection UX in campaign editor

---

## UI-001: Settings Page Tabs

**Date:** 2026-02-06
**Status:** Planned

### Decision

Reorganize Settings page with tabs for better navigation.

### Current Structure (Single Long Page)

```
Settings
├── Business Profile
├── Message Templates
├── Service Types
├── AI Personalization
├── Email Authentication
├── Branded Review Link
├── Integrations
└── Danger Zone
```

### Proposed Tab Structure

```
Settings
├── [General]        - Business Profile, Branded Review Link
├── [Templates]      - Message Templates (with sub-tabs)
├── [Services]       - Service Types, Timing
├── [Integrations]   - API Keys, Zapier/Make
├── [Advanced]       - Email Auth, AI Stats, Danger Zone
```

### Implementation Tasks

- [ ] Add Tabs component to Settings page
- [ ] Group related sections under tabs
- [ ] Persist selected tab in URL (`/settings?tab=templates`)
- [ ] Mobile-friendly tab navigation

---

## UI-002: Template Section Tabs (System vs Custom)

**Date:** 2026-02-06
**Status:** Planned

### Decision

Within the Templates section, use tabs to separate system templates from user-created templates.

### Proposed Tab Structure

```
Message Templates
├── [System Templates]    - 16 default templates (read-only, can copy)
│   ├── Email (8)
│   └── SMS (8)
│
└── [Your Templates]      - User-created templates (editable)
    ├── Email
    └── SMS
```

### UX Benefits

1. **Clarity** - Users understand what's provided vs what they created
2. **Less clutter** - Don't see all 16+ templates in one list
3. **Easier editing** - Custom templates separate from read-only system ones
4. **Copy flow** - "Use this template" from System tab creates in Your Templates tab

### Implementation Tasks

- [ ] Add tabs to Message Templates section
- [ ] "System Templates" tab shows `is_default = true` templates
- [ ] "Your Templates" tab shows user-created templates
- [ ] "Copy" button on system templates creates editable copy
- [ ] Show badge count on tabs (e.g., "Your Templates (3)")
- [ ] Add "Create Template" button only on "Your Templates" tab

---

## TEMPLATE-002: Template Preview in Campaign Editor

**Date:** 2026-02-26
**Status:** Implemented (Phase 47)

### Decision

Added `TemplatePreviewModal` to the touch sequence editor so users can preview template content directly from campaign editing without navigating to Settings.

### Implementation

- Preview button on each touch in `TouchSequenceEditor`
- Modal renders template subject + body with variable placeholders highlighted
- Read-only — editing still happens in Settings

---

## ARCH-001: Multi-Business Architecture (Cookie-Based Resolver)

**Date:** 2026-02-27
**Status:** Implemented (Phase 52)

### Decision

Support multiple businesses per user account using a cookie-based active business resolver pattern instead of URL-based or session-based approaches.

### Implementation

- `active_business_id` httpOnly cookie stores the user's currently selected business
- `getActiveBusiness()` reads cookie → verifies ownership → falls back to first business
- Falls back with `.limit(1)` (not `.single()`) to avoid PGRST116 crashes when user has no businesses
- `switchBusiness()` server action sets cookie + calls `revalidatePath('/')`
- `getUserBusinesses()` fetches all businesses owned by authenticated user

### Rationale

1. **Cookie over URL**: Business context is global, not per-page — URL params would need threading everywhere
2. **Cookie over session**: Survives page refreshes, tab switches, and direct URL navigation
3. **httpOnly**: Not accessible to client JS, reducing XSS exposure
4. **Ownership verification**: Every `getActiveBusiness()` call verifies the user still owns the business (handles deletion edge case)

### Files

- `lib/data/active-business.ts` — resolver + query
- `lib/actions/active-business.ts` — switchBusiness action

---

## ARCH-002: Caller-Provides-BusinessId Pattern

**Date:** 2026-02-27
**Status:** Implemented (Phase 53)

### Decision

All data layer functions (`lib/data/*.ts`) accept an explicit `businessId` parameter. Callers (server components, server actions) are responsible for resolving business context via `getActiveBusiness()` and passing the verified ID.

### Previous Pattern (Removed)

```typescript
// BEFORE: data function resolved its own context (PGRST116 crash risk)
async function getJobs() {
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single() // ← CRASHES if user has 0 or 2+ businesses
}
```

### New Pattern

```typescript
// AFTER: caller provides verified businessId
async function getJobs(businessId: string, options?: JobFilters) {
  const { data } = await supabase
    .from('jobs')
    .select('*')
    .eq('business_id', businessId) // ← always scoped, no crash risk
}
```

### Rationale

1. **Eliminates PGRST116 crashes**: `.single()` throws when row count != 1
2. **Multi-business safe**: Works correctly when user owns multiple businesses
3. **Single point of truth**: Business context resolved once in layout, threaded everywhere
4. **Testable**: Data functions are pure — no hidden auth dependencies

### Scope

All 22 `lib/data/` functions refactored. Dead `lib/data/customer.ts` deleted (zero importers).

---

## ARCH-003: Pooled Billing at User Level

**Date:** 2026-02-27
**Status:** Implemented (Phase 57)

### Decision

Send limits are enforced at the **user level** across all owned businesses, not per-business. One global pool prevents the agency loophole where N businesses would give N × plan limit.

### Implementation

- `getPooledMonthlyUsage(userId)` aggregates `send_count` across all user-owned businesses
- Derives effective tier as the best tier user has paid for across any business
- All 3 send enforcement points updated: `sendReviewRequest()`, `batchSendReviewRequest()`, `sendSmsRequest()`
- Billing page shows "Sends this month (all businesses)"

### Rationale

1. **Closes loophole**: Agency with 10 businesses shouldn't get 10× sends for one subscription
2. **Fair pricing**: Usage is pooled, pricing is per-account
3. **Simple mental model**: "You have X sends/month total, spread however you want"

---

## ARCH-004: Insert-Only Server Actions for Business Creation

**Date:** 2026-02-27
**Status:** Implemented (Phase 56)

### Decision

Server actions for creating additional businesses (`lib/actions/create-additional-business.ts`) use explicit `.insert()` calls, never `.upsert()`. All `.update()` calls include `.eq('user_id', user.id)` ownership guard as defense in depth.

### Rationale

1. **Upsert risk**: `.upsert()` could silently overwrite an existing business if IDs collide
2. **Explicit intent**: INSERT means "create new", UPDATE means "modify existing" — never ambiguous
3. **Defense in depth**: Even though RLS protects, ownership guards in app code add another layer
4. **Separation**: Create-additional-business actions are separate from first-business onboarding actions to avoid mixing concerns

### Actions

1. `createAdditionalBusiness()` — pure INSERT, returns `{ id, name }`
2. `saveNewBusinessServices()` — UPDATE with ownership guard
3. `createNewBusinessCampaign()` — inlines campaign duplication (avoids `getActiveBusiness()` dependency)
4. `completeNewBusinessOnboarding()` — UPDATE with ownership guard

---

## ENROLLMENT-001: Frozen Enrollment Status

**Date:** 2026-02-26
**Status:** Implemented (Phase 46)

### Decision

When a campaign is paused, active enrollments transition to `frozen` status instead of `stopped`. This preserves the customer's position in the touch sequence so they can resume when the campaign is reactivated.

### State Transitions

```
active ──pause──► frozen ──resume──► active (with recalculated times)
active ──stop───► stopped (permanent, customer exits sequence)
```

### Implementation

- `toggleCampaignStatus()` sets enrollments to `frozen` on pause, back to `active` on resume
- Scheduled touch times are recalculated on resume based on pause duration
- Partial unique index expanded: `WHERE status IN ('active', 'frozen')` prevents duplicate enrollments
- Dashboard/campaign/cron queries updated to handle frozen status

### Rationale

Previous behavior (`stopped` on pause) was destructive — customers lost their place in the sequence and would restart from touch 1 if re-enrolled. Frozen preserves position, which is the expected behavior when temporarily pausing a campaign.

---

## PRODUCT-001: Landing Page Pivot to Managed Service

**Date:** 2026-02-27
**Status:** Implemented

### Decision

Redesigned the marketing landing page to position AvisLoop as a **managed agency service** rather than a self-serve SaaS tool. Copy shifted from "Get More Reviews. Automatically." to "We manage your entire Google review strategy."

### Rationale

1. **Target customer shift**: Primary users are agencies managing multiple businesses, not individual operators
2. **Higher value positioning**: Managed service commands higher prices and longer retention
3. **V3.0 alignment**: Agency mode features (multi-business, client tracking, pooled billing) support this positioning

### New Landing Page Components (V2)

- `hero-v2.tsx` — Managed service hero
- `social-proof-strip.tsx` — Trust signals
- `features-bento.tsx` — Feature grid (WhyAvisLoop)
- `services-section.tsx` — Service type showcase
- `how-it-works.tsx` — 4-step workflow
- `animated-stats.tsx` — Statistics with animations
- `animated-demo.tsx` — Product demo animation
- `pricing-section.tsx` — Updated pricing

---

## PRODUCT-002: Custom Service Names

**Date:** 2026-02-25
**Status:** Implemented (Phase 44)

### Decision

Added `custom_service_names` TEXT[] column to businesses table allowing users to define custom service labels (up to 10) when "other" service type is enabled.

### Important Constraint

Custom service names are **display-only**. They do NOT affect campaign matching, which still uses the fixed 8-value `service_types_enabled` set. Campaign targeting remains simple and predictable.

### Implementation

- Multi-tag input component during onboarding and in Settings
- Stored as PostgreSQL TEXT array with max 10 entries
- Rendered as pills in onboarding summary and settings pages
- Threaded through `BusinessSettingsProvider` for consistent access

---

## PRODUCT-003: CRM Platform Step in Onboarding

**Date:** 2026-02-25
**Status:** Implemented (Phase 44)

### Decision

Added a skippable CRM platform step to onboarding asking "What software do you use to manage jobs?" Options include ServiceTitan, Jobber, Housecall Pro, and others.

### Rationale

1. **Roadmap planning**: Know which integrations to build first (Phase 58+ and v4.0)
2. **No false promises**: Banner explicitly states "This is for our roadmap planning only. No integration will be set up now."
3. **Skippable**: Does not block onboarding completion

### Data

Captured in `software_used` field on business record.

---
