# Phase 45: Foundation + Visual-Only Changes - Research

**Researched:** 2026-02-25
**Domain:** CVA button variants, navigation labels, dashboard queue row styling
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 45 is a pure UI change phase — no DB migrations, no API changes, no behavior changes. All five tasks are isolated, low-risk edits to existing components. The work divides into three plan files:

1. **45-01 (BTN-01, BTN-02):** Add `soft` button variant to `button.tsx` CVA; audit dashboard buttons and switch secondary actions to `soft`.
2. **45-02 (NAV-01):** Change the string `'Activity'` to `'History'` in two places — `sidebar.tsx` and `bottom-nav.tsx`. The `/history` route is unchanged.
3. **45-03 (DQ-01, DQ-02, DQ-03, DQ-04):** Change queue row layout from `divide-y` flat rows to individual card units with `rounded-lg` + `border`; change empty state borders from `border-dashed` to `border`; wire empty-state "Add Jobs" button to `openAddJob()` instead of `<Link href="/jobs">`.

**Primary recommendation:** Work in three entirely isolated passes — button CVA first (establishes the variant), nav rename second (two-line change), queue styling third (purely Tailwind class edits plus one hook import).

---

## Standard Stack

This phase uses only what is already installed. No new packages.

### Core (already in project)

| Library | Purpose | Version |
|---------|---------|---------|
| `class-variance-authority` | CVA — button variant system | `^0.7.1` (in package.json) |
| `@radix-ui/react-slot` | `asChild` pattern in Button | `^1.2.4` |
| `@phosphor-icons/react` | Icons in nav + queue | `^2.1.10` |
| `next/navigation` | `usePathname` in nav | latest |

### No New Installations Needed

All work is Tailwind class changes, a CVA variant addition, string label edits, and a React hook call (`useAddJob`). Zero new dependencies.

---

## Architecture Patterns

### Pattern 1: Adding a CVA Variant

**File:** `C:\AvisLoop\components\ui\button.tsx`

The current CVA `variants.variant` object has 6 entries: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Adding `soft` is a single new key in this object.

**Current structure (lines 11–22):**
```typescript
variants: {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-white hover:bg-destructive/90 ...",
    outline: "border bg-background hover:bg-secondary hover:text-secondary-foreground ...",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
    link: "text-primary underline-offset-4 hover:underline ...",
  },
```

**Soft variant intent (per BTN-01):** Muted background, doesn't compete with primary CTAs. Looking at existing tokens:
- `bg-muted` = `hsl(36 10% 94%)` in light — a warm off-white, clearly subordinate to `bg-primary` (`hsl(0 0% 20%)` dark)
- `text-muted-foreground` = `hsl(30 6% 40%)` — readable but quiet
- Hover: `bg-muted/80` or `bg-secondary` (both work; `bg-secondary` at `hsl(36 15% 92%)` is slightly warmer)

**Recommended `soft` variant classes:**
```typescript
soft: "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/60 dark:hover:bg-muted/80",
```

This sits between `ghost` (no background) and `secondary` (same muted-zone but slightly more saturated). The result is a button that reads as tertiary — present but not demanding attention.

The `VariantProps` TypeScript union is derived automatically from the CVA object — adding the key is sufficient, no additional type annotation required.

### Pattern 2: Navigation Label Rename

**File:** `C:\AvisLoop\components\layout\sidebar.tsx` — line 37:
```typescript
const mainNav: NavItem[] = [
  ...
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
  ...
]
```
Change `'Activity'` → `'History'`.

**File:** `C:\AvisLoop\components\layout\bottom-nav.tsx` — line 14:
```typescript
const items = [
  ...
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
]
```
Change `'Activity'` → `'History'`.

The route `/history` (pointing to `app/(dashboard)/history/`) remains unchanged. The icon (`ClockCounterClockwise`) is already appropriate for "History" — no icon change needed.

**Scope verification:** Searched for other occurrences of the label string in layout components. These two array definitions are the only places the "Activity" nav label is defined. There are no other files that reference these arrays or hardcode "Activity" as a nav label.

### Pattern 3: Queue Row Card Styling

**File:** `C:\AvisLoop\components\dashboard\ready-to-send-queue.tsx`

**Current job list container (line 508):**
```tsx
<div className="divide-y divide-border">
  {displayJobs.map((job) => {
    return (
      <div
        key={job.id}
        className={cn(
          'flex items-center justify-between transition-colors',
          isSelected ? 'bg-muted' : 'hover:bg-muted/50',
        )}
      >
```

**DQ-01 target:** Change from flat `divide-y` rows to white card units with border-radius.

**Recommended approach:**
- Remove `divide-y divide-border` from the container div, replace with `space-y-2`
- Add `rounded-lg border border-border bg-card` (or `bg-background`) to each row `div`
- The selected state `bg-muted` and hover `hover:bg-muted/50` can stay, but the card border ensures visual separation even without background change

**New container:**
```tsx
<div className="space-y-2">
```

**New row:**
```tsx
<div
  key={job.id}
  className={cn(
    'flex items-center justify-between transition-colors rounded-lg border border-border',
    isSelected ? 'bg-muted' : 'bg-card hover:bg-muted/50',
  )}
>
```

### Pattern 4: Empty State Border (DQ-02)

**File:** `C:\AvisLoop\components\dashboard\ready-to-send-queue.tsx`

**Current empty state (lines 490–504):**
```tsx
{jobs.length === 0 && !hasJobHistory && (
  <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-border">
    ...
    <Button asChild size="sm">
      <Link href="/jobs">
        <Plus className="h-4 w-4 mr-1" />
        Add Job
      </Link>
    </Button>
  </div>
)}
```

**DQ-02 change:** `border-2 border-dashed border-border` → `border border-border` + add `bg-card` (or `bg-background`) for the white background.

**DQ-04 change (same block):** Replace `<Button asChild size="sm"><Link href="/jobs">` with a button that calls `openAddJob()`. This requires importing `useAddJob` from `@/components/jobs/add-job-provider`.

**`useAddJob` availability:** `AddJobProvider` wraps the entire dashboard layout (`app/(dashboard)/layout.tsx` lines 27-28). `ReadyToSendQueue` is rendered inside `DashboardContent` which is inside `DashboardShell` which is inside `DashboardClient` — all within this provider tree. The hook call is safe.

**New empty state button:**
```tsx
const { openAddJob } = useAddJob()
// ...
<Button size="sm" onClick={openAddJob}>
  <Plus className="h-4 w-4 mr-1" />
  Add Jobs
</Button>
```

Note the requirement says "Add Jobs" (plural) in DQ-04.

### Pattern 5: Needs Attention Empty State (DQ-03)

**File:** `C:\AvisLoop\components\dashboard\attention-alerts.tsx`

**Current empty state (lines 214–220):**
```tsx
{visibleAlerts.length === 0 ? (
  <div className="flex items-center gap-3 py-8 text-center justify-center">
    <CheckCircle weight="fill" className="size-5 text-success" />
    <p className="text-sm text-muted-foreground">
      No issues — everything is running smoothly
    </p>
  </div>
) : (
```

DQ-03 says this must match the Ready to Send empty state treatment: solid border + white background. Since the Needs Attention empty state currently has NO border at all (just a centered div), DQ-03 means adding `rounded-lg border border-border bg-card` to this div.

**New empty state div:**
```tsx
<div className="flex items-center gap-3 py-8 text-center justify-center rounded-lg border border-border bg-card">
```

### Pattern 6: BTN-02 — Dashboard Button Audit

Per the codebase grep for `variant="outline"` and `variant="secondary"` in `components/dashboard`:

**Candidates for `soft` variant** (secondary actions that do not need border emphasis):

| File | Line | Button | Current Variant | Switch to `soft`? |
|------|------|--------|-----------------|-------------------|
| `dashboard-client.tsx` | 261 | "View Campaigns" header button | `outline` | Yes — secondary header action |
| `attention-alerts.tsx` | 103 | "Retry" failed send | `outline` | Yes — secondary action |
| `attention-alerts.tsx` | 112 | Contextual action (bounced email) | `outline` | Yes |
| `attention-alerts.tsx` | 120 | Contextual action (unresolved feedback) | `outline` | Yes |
| `ready-to-send-queue.tsx` | 271 | "Skip" in conflict resolution | `outline` | Yes — secondary vs "Replace" primary |
| `ready-to-send-queue.tsx` | 284 | "Queue" in conflict resolution | `outline` | Yes |
| `ready-to-send-queue.tsx` | 304 | "Queued" dropdown trigger | `outline` | Yes |
| `ready-to-send-queue.tsx` | 328 | "Will Replace" dropdown trigger | `outline` | Yes |
| `ready-to-send-queue.tsx` | 362 | "Skip" (pre-flight conflict) | `outline` | Yes |
| `ready-to-send-queue.tsx` | 375 | "Queue" (pre-flight conflict) | `outline` | Yes |
| `ready-to-send-queue.tsx` | 411 | "Send One-Off" for completed jobs | `outline` | Maybe — check if it should keep border |
| `right-panel-job-detail.tsx` | 208 | Various | `outline` | Out of scope for Phase 45 (right panel is Phase 46) |
| `right-panel-attention-detail.tsx` | 123, 198 | Various | `outline` | Out of scope for Phase 45 |

**Conservative approach for BTN-02:** Focus on buttons directly in `dashboard-client.tsx`, `ready-to-send-queue.tsx`, and `attention-alerts.tsx` that are clearly secondary (not primary CTAs, not destructive). The "View Campaigns" header button, the conflict resolution secondary options (Skip, Queue), and the alert action buttons are safe candidates.

**"Send One-Off" at line 411** — this is the primary action for completed one-off jobs. It should stay `outline` or potentially remain as `soft` — the requirement says "secondary dashboard actions", and this IS a call-to-action. Use judgment here: if the one-off row has no primary "Complete" button (it's already completed), then "Send One-Off" is the only action. It could stay `outline` to give it slightly more visual weight than pure `soft`. This is a judgment call for the planner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Soft button styling | Custom CSS class | CVA variant in `button.tsx` | Consistent with existing pattern; TypeScript-typed; works with all size variants automatically |
| "Add Job" drawer trigger | `window.location.href = '/jobs'` | `useAddJob()` hook | Provider already installed at layout level; opens sheet inline without navigation |

---

## Common Pitfalls

### Pitfall 1: TypeScript type for new CVA variant
**What goes wrong:** Adding the variant key to CVA but forgetting the TypeScript types won't auto-update — HOWEVER, CVA derives the type from the object, so the type updates automatically. No manual type declaration needed.
**How to avoid:** Just add the key to the `variants.variant` object. `VariantProps<typeof buttonVariants>` will include `soft` automatically.

### Pitfall 2: `useAddJob` not available in `ReadyToSendQueue`
**What goes wrong:** Calling `useAddJob()` in a component that isn't wrapped by `AddJobProvider`.
**How to avoid:** Confirmed: `AddJobProvider` is at `app/(dashboard)/layout.tsx` (line 27), wrapping all dashboard pages. `ReadyToSendQueue` renders inside `DashboardClient` which renders inside `DashboardContent`, all within the provider tree. Safe to call.

### Pitfall 3: Changing `divide-y` without adjusting padding
**What goes wrong:** Removing `divide-y` from queue rows and adding `space-y-2` + card borders, but leaving the existing `py-2.5 pl-3 pr-1` padding on the row button — this can look cramped or misaligned with the new card container.
**How to avoid:** Review padding on the inner `<button>` element (line 524: `py-2.5 pl-3 pr-1`) and the action div (`pr-3`). Keep the same padding — it should work fine inside a card. The card-level padding comes from the row div having `rounded-lg border`.

### Pitfall 4: Two empty states in `ready-to-send-queue.tsx`
**What goes wrong:** There are TWO empty states (lines 481–487 and 490–504). The first is `jobs.length === 0 && hasJobHistory` (all caught up — no border styling needed). The second is `jobs.length === 0 && !hasJobHistory` (no jobs yet — THIS is the one needing the border fix for DQ-02 and DQ-04).
**How to avoid:** Only the `!hasJobHistory` empty state gets the border + white background treatment and the Add Jobs button fix.

### Pitfall 5: Skeleton components use `divide-y` too
**What goes wrong:** `ReadyToSendQueueSkeleton` (lines 839–873) also has `divide-y divide-border` on its row container. If DQ-01 changes the live list to `space-y-2` cards, the skeleton should match visually.
**How to avoid:** Update `ReadyToSendQueueSkeleton` rows to use `space-y-2` and add `rounded-lg border` to skeleton row divs as well. Similarly check `AttentionAlertsSkeleton`.

---

## Code Examples

### Adding `soft` to CVA (button.tsx)

```typescript
// In the variants.variant object, after `secondary`:
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
soft: "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/60 dark:hover:bg-muted/80",
ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
```

### Nav label change (sidebar.tsx)

```typescript
// Line 37 — change 'Activity' to 'History'
{ icon: ClockCounterClockwise, label: 'History', href: '/history' },
```

### Nav label change (bottom-nav.tsx)

```typescript
// Line 14 — change 'Activity' to 'History'
{ icon: ClockCounterClockwise, label: 'History', href: '/history' },
```

### Queue row card styling (ready-to-send-queue.tsx)

```tsx
// Container: replace divide-y divide-border with space-y-2
<div className="space-y-2">

// Each row div: add rounded-lg border
<div
  key={job.id}
  className={cn(
    'flex items-center justify-between transition-colors rounded-lg border border-border',
    isSelected ? 'bg-muted' : 'bg-card hover:bg-muted/50',
  )}
>
```

### Empty state fix (ready-to-send-queue.tsx)

```tsx
// Add useAddJob hook at top of component
const { openAddJob } = useAddJob()

// No-history empty state: change border class + button
<div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-border bg-card">
  <div className="rounded-full bg-muted p-3 mb-3">
    <Briefcase className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm text-muted-foreground mb-3">
    No jobs yet — add a completed job to get started
  </p>
  <Button size="sm" onClick={openAddJob}>
    <Plus className="h-4 w-4 mr-1" />
    Add Jobs
  </Button>
</div>
```

### Needs Attention empty state (attention-alerts.tsx)

```tsx
// Add rounded-lg border border-border bg-card to the all-clear empty state
<div className="flex items-center gap-3 py-8 text-center justify-center rounded-lg border border-border bg-card">
  <CheckCircle weight="fill" className="size-5 text-success" />
  <p className="text-sm text-muted-foreground">
    No issues — everything is running smoothly
  </p>
</div>
```

---

## File Inventory

Complete list of files that will change:

| File | Plan | Changes |
|------|------|---------|
| `components/ui/button.tsx` | 45-01 | Add `soft` variant to CVA |
| `components/dashboard/dashboard-client.tsx` | 45-01 | Switch "View Campaigns" button to `soft` |
| `components/dashboard/ready-to-send-queue.tsx` | 45-01 + 45-03 | Switch secondary buttons to `soft`; card row styling; empty state border + Add Jobs button |
| `components/dashboard/attention-alerts.tsx` | 45-01 + 45-03 | Switch secondary buttons to `soft`; empty state border |
| `components/layout/sidebar.tsx` | 45-02 | `'Activity'` → `'History'` label |
| `components/layout/bottom-nav.tsx` | 45-02 | `'Activity'` → `'History'` label |

No other files change. No migrations. No API changes.

---

## Open Questions

1. **`soft` exact hover color:** `hover:bg-muted/80` vs `hover:bg-secondary`. Both are in the muted zone. `bg-muted/80` feels more consistent (same token, just alpha). The planner can use either — recommend `hover:bg-muted/80` for token consistency.

2. **"Send One-Off" button (line 411) — keep `outline` or switch to `soft`?** This is the only action for one-off completed jobs. It's not a _primary_ CTA but it IS the actionable next step. Recommend keeping `outline` for slightly more visual presence — it still adds a border that reads as "actionable" vs pure `soft`. BTN-02 says "secondary actions" — "Send One-Off" is arguably the primary action for one-off rows, so excluding it from the `soft` switch is defensible.

3. **Skeleton sync:** `ReadyToSendQueueSkeleton` and `AttentionAlertsSkeleton` both use `divide-y divide-border`. They should be updated to match the card pattern. This is not explicitly in the requirements (DQ-01 through DQ-04 refer to the live queue) but visually it would look odd if the skeleton and live state had different layouts. Recommend including skeleton updates in 45-03.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `C:\AvisLoop\components\ui\button.tsx` — complete CVA structure, all 6 current variants
- `C:\AvisLoop\components\layout\sidebar.tsx` — mainNav array, 'Activity' label at line 37
- `C:\AvisLoop\components\layout\bottom-nav.tsx` — items array, 'Activity' label at line 14
- `C:\AvisLoop\components\dashboard\ready-to-send-queue.tsx` — full component; row structure lines 508–748; empty states lines 481–504
- `C:\AvisLoop\components\dashboard\attention-alerts.tsx` — AlertRow component; empty state lines 214–220
- `C:\AvisLoop\components\dashboard\dashboard-client.tsx` — header buttons line 257–266
- `C:\AvisLoop\components\jobs\add-job-provider.tsx` — `useAddJob` hook, `openAddJob` function
- `C:\AvisLoop\app\(dashboard)\layout.tsx` — `AddJobProvider` at layout level confirms hook availability
- `C:\AvisLoop\app\globals.css` — design tokens: `--muted`, `--secondary`, `--muted-foreground`
- `C:\AvisLoop\tailwind.config.ts` — color system mappings
- `C:\AvisLoop\.planning\REQUIREMENTS.md` — exact requirement text for BTN-01, BTN-02, NAV-01, DQ-01–DQ-04

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing project dependencies, no new packages
- Architecture patterns: HIGH — direct codebase inspection, exact line numbers
- Pitfalls: HIGH — found from reading the actual component code (two empty states, skeleton mismatch)
- Button audit candidates: HIGH — from grep of dashboard components

**Research date:** 2026-02-25
**Valid until:** Stable — no external dependencies; valid until component files change
