# Phase 49: Custom Services, Visual Polish & Page Subtitles — Research

**Researched:** 2026-02-25
**Domain:** React Context propagation, TypeScript typing, Tailwind CSS table styling, UI consistency patterns
**Confidence:** HIGH — all findings sourced directly from codebase inspection

---

## Summary

Phase 49 has seven success criteria across three concern areas: custom service name propagation (SVC-01..03), page subtitle consistency (SUB-01), and visual polish (VIS-01..03). All work is within existing patterns — no new libraries, no schema changes, no new routes.

The most architecturally significant task is SVC-02/03: `BusinessSettingsProvider` currently exposes only `enabledServiceTypes`, but not `customServiceNames`. Adding `customServiceNames` to the context and surfacing it in service-type selectors is the backbone of the custom-names propagation work. The service type selector (`ServiceTypeSelect`) uses a plain `<select>` element and renders standard `SERVICE_TYPE_LABELS`; it needs to optionally append custom name `<option>` elements when "other" is selected.

Page subtitles (SUB-01) already have a partial pattern: `HistoryClient` uses `&middot;` between static description and dynamic count. This pattern must be extended to all dashboard pages. The Jobs page subtitle currently shows just a count; it needs a static description prefix. Analytics and Feedback pages lack subtitles entirely.

Table row background (VIS-01, VIS-02): The `JobTable` uses a custom `<table>` (not the `Table` component from `components/ui/table.tsx`). Its `<tr>` elements have no explicit background — they render transparent, inheriting from whatever container is below. The `HistoryTable` uses the `TableRow` component from `components/ui/table.tsx` which also has no explicit background. Adding `bg-card` to each table's `<tr>` fixes both.

QuickSendModal (VIS-03) is a straightforward visual update — the Dialog wrapper and inner layout need spacing/style adjustments to match the warm design system without any structural changes.

**Primary recommendation:** Work sequentially — context first (SVC-01..03), then subtitles (SUB-01), then visual polish (VIS-01..03).

---

## Standard Stack

This phase uses only existing in-repo tools. No new packages needed.

### Core (already installed)
| Tool | Version | Purpose |
|------|---------|---------|
| React Context | 19.x | `BusinessSettingsProvider` for cross-tree state |
| Tailwind CSS | 3.4.x | Styling for tables, subtitles, modal |
| TypeScript | 5.x | Interface updates for context value |
| `@phosphor-icons/react` | 2.x | Icons in modal header |
| `class-variance-authority` | 0.7.x | Card variants (already in card.tsx) |

### No new libraries needed
All work is pure Tailwind + React patterns.

---

## Architecture Patterns

### Pattern 1: BusinessSettingsProvider Context Extension

**Current state:**
```typescript
// components/providers/business-settings-provider.tsx
interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
}
```

**Required change:** Add `customServiceNames: string[]` to the context value and update the provider.

```typescript
// After change:
interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
}
```

**Dashboard layout** (`app/(dashboard)/layout.tsx`) currently calls `getServiceTypeSettings()` which already returns `customServiceNames`:
```typescript
// lib/data/business.ts — getServiceTypeSettings() returns:
{
  serviceTypesEnabled: string[]
  serviceTypeTiming: Record<string, number>
  customServiceNames: string[]  // already fetched!
}
```

So the layout only needs to:
1. Destructure `customServiceNames` from the result
2. Pass it to `<BusinessSettingsProvider customServiceNames={customServiceNames}>`

**No extra DB query needed.** The data is already fetched.

### Pattern 2: ServiceTypeSelect with Custom Names

**Current state** (`components/jobs/service-type-select.tsx`):
- Renders a plain `<select>` element
- Shows only the 8 fixed `SERVICE_TYPES` filtered by `enabledTypes`
- No awareness of custom names

**Required change:** When "other" is in enabled types AND `customServiceNames` are provided, render each custom name as an `<option>` with value `'other'` (since the DB column is still `ServiceType = 'other'`).

```typescript
// Source: codebase analysis — ServiceTypeSelect pattern
interface ServiceTypeSelectProps {
  value: ServiceType | ''
  onChange: (value: ServiceType) => void
  error?: string
  enabledTypes?: ServiceType[]
  customServiceNames?: string[]  // ADD THIS
}

// Render pattern inside the select:
{availableTypes.map(type => {
  // For 'other' with custom names, render each custom name as separate option
  if (type === 'other' && customServiceNames && customServiceNames.length > 0) {
    return customServiceNames.map(name => (
      <option key={`other-${name}`} value="other">
        {name}
      </option>
    ))
  }
  return (
    <option key={type} value={type}>
      {SERVICE_TYPE_LABELS[type]}
    </option>
  )
})}
```

**Important constraint:** The DB `service_type` column stores `'other'` (the fixed ServiceType). Custom names are display-only — they render as `<option value="other">Pest Control</option>`. This is per the migration comment: "Display-only, not used for campaign matching."

**Where `ServiceTypeSelect` is used:**
- `components/jobs/add-job-sheet.tsx` — calls `useBusinessSettings()`, gets `enabledServiceTypes`, passes to `ServiceTypeSelect`. Needs to also destructure `customServiceNames` and pass through.
- `components/jobs/edit-job-sheet.tsx` — same pattern.

### Pattern 3: JobFilters with Custom Names

**Current state** (`components/jobs/job-filters.tsx`):
- Shows service type filter pills using `SERVICE_TYPE_LABELS[type]`
- When "other" is enabled, shows pill labeled "Other"

**Required change:** When `customServiceNames` exist, the "Other" filter pill should display as the first custom name (or a joined list, or "Other (Pest Control, Pool Cleaning)"). Decision needed: simplest approach is to show "Other" pill still but with a title/tooltip listing custom names. Alternatively, show individual pills per custom name, all filtering to `serviceType === 'other'`.

The **simplest V2-aligned approach**: When "other" is enabled and custom names exist, replace the "Other" pill label with the first custom name (or comma-joined list if short). This avoids multiple "other" filter values.

### Pattern 4: CampaignForm Service Type Selector

**Current state** (`components/campaigns/campaign-form.tsx`):
- Uses Radix `<Select>` with `SERVICE_TYPE_LABELS`
- Calls `useBusinessSettings()` for `enabledServiceTypes` only
- Shows "Other" when `other` is enabled

**Required change:** When `customServiceNames` exist, show custom names instead of "Other" in the campaign service type `<Select>`. Since campaigns match on `service_type` value (not display name), the SelectItem `value="other"` still works — just the label changes.

### Pattern 5: Page Subtitle Pattern (SUB-01)

**Existing canonical pattern** (from `HistoryClient`):
```tsx
// components/history/history-client.tsx line 154-157
<div>
  <h1 className="text-2xl font-semibold tracking-tight">Send History</h1>
  <p className="text-muted-foreground">
    Track delivery status of your sent messages &middot; {total} total
  </p>
</div>
```

**Target pattern for all pages:**
```
[Static description] · [Dynamic count]
```

**Pages to audit:**
| Page | Current State | Target |
|------|--------------|--------|
| Jobs (`JobsClient`) | `{totalJobs} {plural} total` — no static description | `Track your service jobs · {N} this month` |
| History | Already correct with `&middot;` | Keep as-is |
| Campaigns | No header in page — uses `CampaignsShell` | Need to audit `CampaignsShell` |
| Analytics | Bare `<h1>Analytics</h1>` — no subtitle | `Track review performance by service type · {N} jobs` |
| Feedback | Has icon + title but no centered dot count | Normalize to match pattern |
| Customers | Check `CustomersClient` header | Normalize |
| Dashboard | Uses greeting pattern — exempt | No change needed |
| Settings | Has sticky header with subtitle — exempt | No change needed |
| Billing | Needs audit | Check billing page |

**Key implementation note:** Count data must come from what's already loaded server-side. For Jobs, `totalJobs` is available. For Analytics, `analyticsData.length` or total jobs analyzed is available. For Campaigns, `campaigns.length` is available.

### Pattern 6: Table Row White Background (VIS-01, VIS-02)

**Jobs Table** (`components/jobs/job-table.tsx`):
- Uses custom `<table>` element (NOT the `Table` component from `ui/table.tsx`)
- `<tr>` className: `"border-t border-border transition-colors hover:bg-muted/50 cursor-pointer"`
- **Missing:** no explicit background color → rows render transparent

**History Table** (`components/history/history-table.tsx`):
- Uses `TableRow` from `components/ui/table.tsx`
- `TableRow` className: `"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"`
- **Missing:** no explicit background color

**Fix:** Add `bg-card` to each `<tr>` or `TableRow` to give rows white/card background.

For `job-table.tsx`:
```tsx
// Before:
className="border-t border-border transition-colors hover:bg-muted/50 cursor-pointer"

// After:
className="border-t border-border bg-card transition-colors hover:bg-muted/50 cursor-pointer"
```

For `history-table.tsx`:
The `TableRow` base class in `ui/table.tsx` does NOT have a background. Rather than modify the shared component (which affects all usages), apply `bg-card` as a className on the specific `TableRow` in `history-table.tsx`:
```tsx
// Before:
<TableRow className="group cursor-pointer hover:bg-muted/50" ...>

// After:
<TableRow className="group cursor-pointer bg-card hover:bg-muted/50" ...>
```

**Important:** Do NOT add `bg-card` to `ui/table.tsx` TableRow base class — that changes all usages globally. Apply it per-usage at the call site.

### Pattern 7: QuickSendModal Visual Update (VIS-03)

**Current state** (`components/send/quick-send-modal.tsx`):
- `DialogContent` has `sm:max-w-xl max-h-[90vh] overflow-y-auto`
- Warning banner: `flex items-start gap-3 rounded-lg border border-warning-border bg-warning-bg p-4`
- `DialogHeader` + `DialogTitle` + `DialogDescription` pattern

**Required changes** (visual alignment with warm design system):
- Review spacing between header, warning banner, and form
- Ensure warning banner uses current semantic tokens (already correct: `border-warning-border bg-warning-bg`)
- Confirm `DialogContent` max-width matches other modals in the app
- Check that `DialogTitle` and `DialogDescription` typography matches current standards

The warning banner is structurally correct — the Phosphor `Warning` icon, semantic color tokens, and Link are appropriate. Visual polish means tightening spacing, ensuring consistent padding, and verifying no hardcoded colors.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Custom service name display | A separate component just for custom names | Extend `ServiceTypeSelect` props and render inline |
| New context provider | A second provider just for custom names | Extend `BusinessSettingsProvider` — add field to existing context |
| Subtitle formatting | A utility component | Inline JSX with `&middot;` character, consistent with existing pattern |
| White table rows | CSS alternating row pattern | Single `bg-card` class on each `<tr>` |

**Key insight:** The custom names feature is display-only. No DB changes, no new types, no new selectors — just threading existing data through existing channels.

---

## Common Pitfalls

### Pitfall 1: Creating Multiple "Other" Options in Select
**What goes wrong:** Rendering each custom name as a separate `<option>` with different values (e.g., value="pest-control") breaks campaign matching since the DB only knows `service_type = 'other'`.
**Why it happens:** Trying to be too clever about custom name distinctness.
**How to avoid:** Always render custom name options with `value="other"` regardless of the display name. The DB stores `'other'` — custom names are purely display.
**Warning sign:** TypeScript would catch it: `ServiceType` doesn't include custom slugs.

### Pitfall 2: Modifying ui/table.tsx TableRow Base Class
**What goes wrong:** Adding `bg-card` to the `TableRow` base component changes ALL tables in the app, including potential future tables that should have transparent rows.
**Why it happens:** Wanting a global fix rather than per-usage.
**How to avoid:** Apply `bg-card` as a className prop at each call site.

### Pitfall 3: Breaking the BusinessSettingsProvider Provider/Consumer Contract
**What goes wrong:** Adding `customServiceNames` to context value type but forgetting to update the `BusinessSettingsProviderProps` interface AND the layout that creates the provider.
**Why it happens:** Partial refactor stops at the type definition.
**How to avoid:** Update in this order: (1) context interface, (2) provider props interface, (3) provider JSX, (4) dashboard layout data fetch, (5) all consumers that call `useBusinessSettings()`.

### Pitfall 4: Not Handling Empty customServiceNames Array
**What goes wrong:** Rendering "Other" options disappear when `customServiceNames = []` but "other" is still enabled.
**Why it happens:** Conditional rendering only checks length > 0.
**How to avoid:** When `customServiceNames` is empty and "other" is enabled, fall back to rendering the standard "Other" label from `SERVICE_TYPE_LABELS.other`.

### Pitfall 5: Page Subtitle Counts Requiring Extra DB Queries
**What goes wrong:** Adding "this month" counts to page subtitles requires fetching extra data (e.g., jobs completed this month vs total jobs).
**Why it happens:** Subtitle spec says "N this month" but page only has total count.
**How to avoid:** Use whatever count is already fetched — don't add new DB queries for cosmetic subtitle counts. If total is what's available, use "N total". Match what exists. The phase spec says "dynamic count" — what that count represents should match the data already loaded.

---

## Code Examples

### Extending BusinessSettingsProvider

```typescript
// Source: components/providers/business-settings-provider.tsx (current)

// BEFORE:
interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
}

interface BusinessSettingsProviderProps {
  enabledServiceTypes: ServiceType[]
  children: React.ReactNode
}

// AFTER:
interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
}

interface BusinessSettingsProviderProps {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
  children: React.ReactNode
}

export function BusinessSettingsProvider({
  enabledServiceTypes,
  customServiceNames,
  children,
}: BusinessSettingsProviderProps) {
  return (
    <BusinessSettingsContext.Provider value={{ enabledServiceTypes, customServiceNames }}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}
```

### Dashboard Layout Update

```typescript
// Source: app/(dashboard)/layout.tsx (current)

// BEFORE:
const serviceSettings = await getServiceTypeSettings()
const enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]

return (
  <BusinessSettingsProvider enabledServiceTypes={enabledServiceTypes}>

// AFTER:
const serviceSettings = await getServiceTypeSettings()
const enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]
const customServiceNames = serviceSettings?.customServiceNames || []

return (
  <BusinessSettingsProvider enabledServiceTypes={enabledServiceTypes} customServiceNames={customServiceNames}>
```

### ServiceTypeSelect with Custom Names

```typescript
// Source: components/jobs/service-type-select.tsx (extended)

interface ServiceTypeSelectProps {
  value: ServiceType | ''
  onChange: (value: ServiceType) => void
  error?: string
  enabledTypes?: ServiceType[]
  customServiceNames?: string[]  // NEW
}

// Inside render:
{availableTypes.map(type => {
  if (type === 'other' && customServiceNames && customServiceNames.length > 0) {
    return customServiceNames.map(name => (
      <option key={`other-${name}`} value="other">
        {name}
      </option>
    ))
  }
  return (
    <option key={type} value={type}>
      {SERVICE_TYPE_LABELS[type]}
    </option>
  )
})}
```

### AddJobSheet and EditJobSheet consumer

```typescript
// components/jobs/add-job-sheet.tsx
const { enabledServiceTypes, customServiceNames } = useBusinessSettings()

// Pass to ServiceTypeSelect:
<ServiceTypeSelect
  value={serviceType}
  onChange={setServiceType}
  error={state?.fieldErrors?.serviceType?.[0]}
  enabledTypes={enabledServiceTypes}
  customServiceNames={customServiceNames}
/>
```

### Page Subtitle Pattern

```tsx
// Consistent pattern for all dashboard pages:
<div>
  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  <p className="text-muted-foreground">
    {staticDescription} &middot; {dynamicCount}
  </p>
</div>
```

### Jobs Table Row Background

```tsx
// components/jobs/job-table.tsx — add bg-card to each <tr>
<tr
  key={row.id}
  onClick={() => handleRowClick(row.original)}
  className="border-t border-border bg-card transition-colors hover:bg-muted/50 cursor-pointer"
>
```

### History Table Row Background

```tsx
// components/history/history-table.tsx — add bg-card to TableRow
<TableRow
  key={row.id}
  className="group cursor-pointer bg-card hover:bg-muted/50"
  data-state={row.getIsSelected() && 'selected'}
  onClick={() => onRowClick?.(row.original)}
>
```

---

## Component Inventory

### Files that need changes

**SVC group (custom service names):**
1. `components/providers/business-settings-provider.tsx` — add `customServiceNames` to context
2. `app/(dashboard)/layout.tsx` — pass `customServiceNames` to provider
3. `components/jobs/service-type-select.tsx` — render custom name options
4. `components/jobs/add-job-sheet.tsx` — destructure + pass `customServiceNames`
5. `components/jobs/edit-job-sheet.tsx` — destructure + pass `customServiceNames`
6. `components/jobs/job-filters.tsx` — update "Other" pill label when custom names exist
7. `components/campaigns/campaign-form.tsx` — update "Other" SelectItem label when custom names exist

**Onboarding** (SVC-01 — pill rendering fix):
- `components/onboarding/steps/business-setup-step.tsx` — renders `TagBadge` for custom service pills. Issue: `TagBadge` uses `text-xs px-2 py-0.5` which may clip longer names. Fix: ensure adequate padding or use a slightly larger pill size.
- `components/settings/service-types-section.tsx` — same `TagBadge` rendering. Same fix.

**SUB group (subtitles):**
8. `components/jobs/jobs-client.tsx` — update subtitle to use static description + `&middot;` + count
9. `app/(dashboard)/analytics/page.tsx` — add subtitle below h1
10. `app/(dashboard)/feedback/page.tsx` — normalize subtitle pattern (remove icon from h1 row, add subtitle)
11. `app/(dashboard)/campaigns/*` — audit campaign page header (in `CampaignsShell`)
12. `components/customers/customers-client.tsx` — audit subtitle pattern

**VIS group (visual polish):**
13. `components/jobs/job-table.tsx` — add `bg-card` to table rows
14. `components/history/history-table.tsx` — add `bg-card` to TableRow
15. `components/send/quick-send-modal.tsx` — spacing/styling updates

### Files that do NOT need changes
- `lib/data/business.ts` — `getServiceTypeSettings()` already returns `customServiceNames`
- `lib/actions/business.ts` — `updateServiceTypeSettings` already handles custom names
- `supabase/migrations/` — schema already has `custom_service_names TEXT[]`
- `lib/types/database.ts` — `Business` interface already has `custom_service_names: string[]`
- `components/ui/table.tsx` — do NOT modify base TableRow (per-usage fix instead)

---

## Current State of Subtitle Patterns (Audited)

| Page Component | Current Header | Subtitle Present? | Needs Update? |
|----------------|----------------|-------------------|---------------|
| `jobs/jobs-client.tsx` | `<h1>Jobs</h1>` | `"{N} jobs total"` — no static description, no dot | Yes |
| `history/history-client.tsx` | `<h1>Send History</h1>` | `"Track delivery...&middot; {N} total"` | No — already correct |
| `analytics/page.tsx` | `<h1>Analytics</h1>` — inline | None | Yes |
| `feedback/page.tsx` | Icon + `<h1>Customer Feedback</h1>` | Generic description, no count | Yes (normalize) |
| `customers/customers-client.tsx` | `<h1>Customers</h1>` | Varies | Audit needed |
| `campaigns/campaigns-shell.tsx` | Audit needed | Unknown | Audit |
| `billing/page.tsx` | Separate structure | Likely has own pattern | Low priority — exempt |
| `settings/page.tsx` | Sticky header with subtitle | Already has subtitle | Exempt |
| `dashboard/page.tsx` | Greeting pattern | Own format | Exempt |

---

## Current State of TagBadge (SVC-01 — Pill Rendering)

`TagBadge` in `components/ui/tag-badge.tsx`:
```css
/* Current: px-2 py-0.5 text-xs */
'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium'
'bg-muted text-muted-foreground'
```

This renders at ~12px font size with 8px/2px padding. For custom service names like "Pest Control" or "Pool Cleaning" (long strings), this WILL clip on very narrow containers but should be readable at normal widths. The problem is more likely at the _container_ level: the `flex flex-wrap gap-1.5 pt-1` container in `business-setup-step.tsx` is correct. However, if the TagBadge is used inside a constrained container that doesn't allow wrapping, longer names could overflow.

**Fix approach:** The pill itself is fine — no size change needed. The issue is ensuring the container allows wrapping (`flex-wrap` is already present) and that `min-w-0` or `shrink-0` behaviors are correct. Also verify the TagBadge has no `max-w` or `overflow-hidden` that could clip text.

Looking at `TagBadge`: it uses `inline-flex` which respects content width naturally. No overflow clipping exists. The **real issue** is more subtle: in the onboarding `business-setup-step.tsx`, the `gap-1.5 flex flex-wrap` container is correct. The success criteria mentions "readable size without clipping or overflow" — this implies the current rendering has been reported as clipping. Most likely this is a container width constraint issue in a specific context (e.g., the input + button row taking full width, leaving no room for the tag display below).

**Investigation point for planner:** Check if the issue is in `settings/service-types-section.tsx` where tags appear inside a `rounded-lg border p-4` with a fixed internal structure, or if it's in the onboarding step. The fix is likely adding `min-h-[24px]` to the tag container or ensuring `text-sm` (not `text-xs`) on the badge.

---

## State.md Prior Decisions (Applied)

From `STATE.md`:
- `custom_service_names stored as TEXT[] — simple array, no metadata needed` → confirmed, no schema changes
- `Enter key in sub-input must call e.preventDefault()` → already implemented in both `business-setup-step.tsx` and `service-types-section.tsx`; don't break this
- `Design system: Use existing semantic tokens` → `bg-card`, `text-muted-foreground`, `border-border` throughout
- `Code scalability: Consolidate, don't duplicate. Remove replaced/dead code` → when threading `customServiceNames` through, remove any intermediate prop drilling pattern if found
- `soft button variant: bg-muted/text-muted-foreground` → use for secondary actions in QuickSendModal if any buttons change
- `Queue row card pattern: space-y-2 container + rounded-lg border border-border bg-card per row` → reference for row card patterns

---

## Open Questions

1. **What "dynamic count" for the Jobs subtitle?**
   - `totalJobs` is total, not "this month"
   - The spec says "12 this month" — does that require a new DB query?
   - Recommendation: Use `totalJobs` with label "total" unless a "this month" count is already available. Do not add a new query for cosmetic subtitle. Confirm with phase spec: success criterion says "dynamic count (e.g., Track your service jobs · 12 this month)" — "e.g." suggests the format, not the exact words. Use what's available.

2. **Campaigns page header location**
   - The `CampaignsPage` renders `CampaignsPageShell` which renders `CampaignList` as children
   - Need to audit `CampaignsShell` to find where/if a page header exists
   - Recommendation: Check `campaigns-shell.tsx` for header pattern before planning

3. **QuickSendModal "updated layout" scope**
   - The phase says "updated layout, spacing, and visual styling consistent with the current warm design system"
   - Current modal is already using semantic tokens (`border-warning-border bg-warning-bg`)
   - Specific changes needed: unclear without visual comparison
   - Recommendation: Focus on spacing consistency (DialogHeader padding, gap between warning banner and form, DialogContent padding) matching other modals like `EditJobSheet`

4. **JobFilters "Other" pill with custom names — single pill or multiple?**
   - When custom names are ["Pest Control", "Pool Cleaning"], does the filter show one "Other" pill or two?
   - Multiple pills filtering to the same `serviceType === 'other'` would work functionally
   - Single pill is simpler but less discoverable
   - Recommendation: Single pill with label from first custom name or "Other · (N services)" if multiple

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all relevant files
- `components/providers/business-settings-provider.tsx` — context definition
- `app/(dashboard)/layout.tsx` — provider instantiation
- `components/jobs/service-type-select.tsx` — current selector implementation
- `components/jobs/add-job-sheet.tsx`, `edit-job-sheet.tsx` — consumer pattern
- `components/jobs/job-filters.tsx` — filter chip pattern
- `components/campaigns/campaign-form.tsx` — campaign service type selector
- `components/jobs/job-table.tsx` — Jobs table row structure
- `components/history/history-table.tsx` — History table row structure
- `components/ui/table.tsx` — base TableRow (no background set)
- `components/send/quick-send-modal.tsx` — current modal structure
- `components/history/history-client.tsx` — canonical subtitle pattern with `&middot;`
- `lib/data/business.ts` — `getServiceTypeSettings()` returns `customServiceNames`
- `supabase/migrations/20260225072556_add_custom_service_names.sql` — schema confirmed
- `lib/types/database.ts` — `Business.custom_service_names: string[]` confirmed
- `components/ui/tag-badge.tsx` — TagBadge styling (text-xs, px-2, py-0.5)
- `components/onboarding/steps/business-setup-step.tsx` — pill rendering in onboarding
- `components/settings/service-types-section.tsx` — pill rendering in settings
- `.planning/STATE.md` — prior decisions and key constraints
- `app/globals.css` — design token values (`--card`, `--muted`, `--border` etc.)
- `tailwind.config.ts` — semantic token configuration

---

## Metadata

**Confidence breakdown:**
- Custom service name propagation (SVC): HIGH — data flow is fully understood, all files identified
- Page subtitles (SUB): HIGH — canonical pattern identified from HistoryClient; exact count wording TBD
- Table row backgrounds (VIS-01/02): HIGH — root cause identified (no bg-card), fix is one class per table
- QuickSendModal (VIS-03): MEDIUM — current structure correct, specific "updated layout" changes need visual judgment call during implementation

**Research date:** 2026-02-25
**Valid until:** 60 days (stable, no fast-moving dependencies)
