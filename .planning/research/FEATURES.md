# Feature Landscape: v3.0 Agency Mode

**Domain:** Home Service SaaS — Multi-Business Agency Management
**Researched:** 2026-02-26
**Confidence:** HIGH (based on user requirements gathering + codebase analysis)
**Milestone type:** Subsequent — adding agency capabilities to existing single-business app

---

## Context

AvisLoop currently operates as a single-business app: one user = one business. v3.0 adds multi-business ownership for agency operators who manage 2-5 client businesses from a single account.

The user IS the agency — they create and manage all client businesses themselves. There is no client self-service portal, no role-based access, no white-labeling.

---

## Table Stakes

Features that are required for the multi-business model to function at all.

| Feature | Why Required | Complexity | Notes |
|---------|-------------|------------|-------|
| **Business switcher in sidebar** | Must be able to switch context between businesses | MEDIUM | DropdownMenu at top of sidebar, calls server action to set cookie |
| **Context isolation per business** | All pages must scope to selected business — jobs, campaigns, history, etc. | HIGH | 86 `.single()` calls need refactoring across 20+ files |
| **Data function refactor** | `getBusiness()` currently assumes one business per user — throws with 2+ | HIGH | Mechanical but extensive; every page-level fetch affected |
| **Multiple business creation** | Must be able to create additional businesses after initial onboarding | MEDIUM | Separate insert path (not upsert which would overwrite first business) |
| **Full onboarding per business** | Each new business needs complete setup: name, review link, services, campaign preset | MEDIUM | Reuse existing wizard with different save path |
| **Cookie-based active business** | Server Components need to know which business is active without URL changes | LOW | httpOnly cookie + server action + revalidatePath |

---

## Differentiators

Features that make agency management actually useful beyond basic context switching.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Clients page (/businesses)** | Card grid showing all client businesses at a glance | MEDIUM | New page with card grid + detail drawer |
| **Agency metadata tracking** | Google ratings (start vs now), reviews gained, monthly fee, competitor info | LOW | 10 new columns on businesses table, editable in detail drawer |
| **Client detail drawer** | Full client profile: ratings, reviews gained, fees, GBP access, competitor, notes | MEDIUM | Sheet component with form fields |
| **Reviews gained calculation** | `current_count - start_count` shown prominently on client cards | LOW | Computed field, not stored |
| **Unified agency billing** | One subscription covers all client businesses, usage pooled | MEDIUM | Sum sends across all businesses vs plan limit |
| **Business name in sidebar** | Shows current business name next to switcher dropdown | LOW | Pass business name from layout to sidebar |

---

## Anti-Features

Features that seem related but are deliberately excluded from v3.0.

| Feature | Why Excluded | Alternative |
|---------|-------------|-------------|
| **Client self-service portal** | Agency owner manages everything — clients don't log in | Owner uses full app per business |
| **White-label branding per business** | Overkill for 2-5 clients; adds significant complexity | Use business name in sidebar, that's it |
| **Live Google API sync** | Fetching real-time Google ratings adds API dependency, rate limits, cost | Manual entry of Google ratings (update monthly) |
| **Cross-business analytics dashboard** | Aggregating KPIs across businesses is a different product | Each business has its own dashboard; clients page shows summary cards |
| **Per-business billing** | Managing N Stripe subscriptions for N clients adds huge complexity | One subscription, pooled usage |
| **Role-based access / team members** | "One user = one account" constraint from CLAUDE.md | Out of scope, future milestone |
| **Client reporting / exports** | Generating PDF reports per client is future scope | Use dashboard screenshots for now |
| **Automated Google review scraping** | SERP scraping is fragile and against ToS | Manual entry of ratings/counts |
| **Business templates / cloning** | Copy settings from one business to create another | Run full wizard; settings are quick to set |
| **Business archiving / deletion** | Dangerous operation, edge cases with active enrollments | Defer to future; businesses persist |

---

## Feature Details

### Business Switcher

- Position: Top of sidebar, above navigation
- Shows: Current business name + chevron down icon
- Dropdown: List of all user's businesses with radio-style selection
- Footer: "View All Clients" link → /businesses
- Mobile: Accessible from hamburger menu or dedicated section

### Clients Page (/businesses)

- URL: `/businesses`
- Layout: Card grid (responsive: 1 col mobile, 2-3 cols desktop)
- Each card shows: Business name, business type, Google rating, reviews gained since start
- Click card → opens BusinessDetailDrawer
- "Add Business" button in header → starts onboarding wizard
- Navigation: Add to sidebar between existing items or as a top-level section

### Client Detail Drawer

- Opens from card click on Clients page
- Sections:
  - **Overview**: Name, business type, start date
  - **Google Performance**: Rating start → current, review count start → current, reviews gained
  - **Business Details**: Monthly fee, GBP access toggle, competitor name + count
  - **Notes**: Free-text area (auto-save like customer detail drawer)
- Actions: "Switch to Business" button, "Edit Business Settings" link

### Onboarding for Additional Businesses

- Trigger: "Add Business" on Clients page
- Flow: Same 3-step wizard (business basics, campaign preset, SMS consent)
- Key difference: INSERT not UPSERT — preserves existing businesses
- After completion: Set new business as active, redirect to dashboard

### Unified Billing

- One Stripe customer, one subscription
- Usage = SUM of sends across ALL businesses
- Plan limits apply to total, not per-business
- Settings page shows pooled usage

---

## Feature Dependencies

```
[Cookie-based business context] ← Foundation, everything depends on this
  └── [Business switcher] ← Needs context + list of businesses
  └── [Data function refactor] ← Needs context resolver
      └── [All existing pages work with multi-business] ← Needs refactored data functions
  └── [Clients page] ← Needs list of businesses + agency metadata
      └── [Client detail drawer] ← Needs agency metadata columns
  └── [Additional business onboarding] ← Needs separate insert path
  └── [Unified billing] ← Needs pooled usage counting
```

---

## Suggested Build Order

1. **Foundation**: Schema migration (agency columns) + business resolver (cookie + getActiveBusiness)
2. **Data Refactor**: Replace all .single() calls with explicit businessId
3. **Switcher UI**: Business switcher in sidebar + page-level context threading
4. **Clients Page**: New /businesses page with card grid + detail drawer
5. **Onboarding**: Separate path for additional business creation
6. **Billing**: Pool usage across businesses

---

*Feature research for: v3.0 Agency Mode*
*Researched: 2026-02-26*
*Confidence: HIGH — based on user requirements + codebase analysis*
