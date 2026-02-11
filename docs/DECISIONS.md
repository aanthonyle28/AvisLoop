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
