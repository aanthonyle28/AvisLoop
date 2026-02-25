# Phase 42: Dashboard & Navigation Polish — Research

**Researched:** 2026-02-24
**Domain:** React UI styling (Tailwind CSS, Phosphor Icons, local component state)
**Confidence:** HIGH

---

## Summary

Phase 42 is a pure UI polish phase with no new data-fetching, server actions, or schema changes. All four requirements are surgical edits to existing components:

1. **DASH-01** — Remove `border-l-2` left colored border from `AlertRow` in `attention-alerts.tsx`; match icon sizing (`size-5`) and row layout to Ready to Send rows.
2. **DASH-02** — Add an X dismiss button to each `AlertRow` that hides it from the rendered list via local `useState` (UI-only, no backend call).
3. **DASH-03** — Replace the "no jobs yet" empty state in `ready-to-send-queue.tsx` with a dashed-border container, `Briefcase` icon in a circle, and correct copy.
4. **NAV-01** — Rewrite the `NavLink` active state in `sidebar.tsx`: remove `border-l-2 border-accent`, switch icon to `weight="fill"`, change active text color to `text-accent`, keep background unchanged.

No new libraries, no API changes, no schema changes needed. All work is confined to three files.

**Primary recommendation:** Edit `attention-alerts.tsx`, `ready-to-send-queue.tsx`, and `sidebar.tsx` directly. Use existing Phosphor icon weights (fill vs regular) and Tailwind token classes already defined in the design system.

---

## Standard Stack

This phase requires no new libraries. Everything needed already exists in the project.

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@phosphor-icons/react` | ^2.1.10 | Icon system — all nav icons | Already used in sidebar and dashboard |
| Tailwind CSS | ^3.4.1 | Utility styling | Design system backbone |
| React `useState` | (built-in) | Local dismiss state | UI-only hide, no persistence needed |
| `cn()` from `@/lib/utils` | — | Conditional class merging | Project-standard pattern |

### Phosphor Icon Weight System (HIGH confidence — verified via Context7)
Phosphor icons accept a `weight` prop with these values:
- `"regular"` — outline/stroke style (current sidebar default)
- `"fill"` — solid filled style (target for active nav state)
- `"bold"` — heavier stroke
- `"duotone"` — two-tone

Switching active icon from `weight="regular"` to `weight="fill"` requires **no import changes** — the same icon component supports all weights via the prop.

---

## Architecture Patterns

### Pattern 1: Local Dismiss with useState (DASH-02)

The dismiss requirement says "UI-only (hides from list, doesn't resolve underlying issue)." The clean pattern is a `dismissedIds` state set tracked at the `AttentionAlerts` parent level, filtering the `displayedAlerts` array before render.

```tsx
// In AttentionAlerts component
const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))
const displayedAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, 3)

const handleDismiss = (id: string) => {
  setDismissedIds(prev => new Set([...prev, id]))
}
```

Then pass `onDismiss` to `AlertRow` and render an X button. The dismiss is client-only: a page refresh restores the alert. This matches the stated decision ("hides from list, doesn't resolve underlying issue").

**Why not at AlertRow level?** Keeping dismissed state at the parent avoids needing to track "is this row visible" from the outside and ensures the "show more" count stays accurate.

**AlertRow X button placement:**
- Mirror the Ready to Send row pattern: icon-sm ghost button on the right
- `onClick` calls `e.stopPropagation()` then `onDismiss(alert.id)`
- Slot it into the existing `hidden lg:flex` desktop action area

### Pattern 2: Dashed Border Empty State (DASH-03)

The project already uses this pattern for dashed empty states. The standard pattern:

```tsx
<div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-border">
  <div className="rounded-full bg-muted p-3 mb-3">
    <Briefcase className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm text-muted-foreground mb-3">
    No jobs yet — add a completed job to get started
  </p>
  <Button asChild size="sm">
    <Link href="/jobs">
      <Plus className="h-4 w-4 mr-1" />
      Add Job
    </Link>
  </Button>
</div>
```

**Note:** The "all caught up" empty state (when `hasJobHistory` is true) should keep its current appearance (CheckCircle + text only, no dashed border). Only the "no jobs yet" empty state (when `!hasJobHistory`) gets the dashed border treatment.

### Pattern 3: Sidebar Active State Redesign (NAV-01)

**Current active state:**
```tsx
// Line 82-83 in sidebar.tsx
isActive
  ? "bg-secondary dark:bg-muted text-foreground border-l-2 border-accent"
  : "text-foreground/70 dark:text-muted-foreground hover:bg-secondary/70 dark:hover:bg-muted/70 border-l-2 border-transparent"
```

**Current icon:**
```tsx
<Icon size={20} weight="regular" className={cn("shrink-0", isActive ? "text-accent" : "")} />
```

**Target active state (NAV-01 requirements):**
- Remove `border-l-2` entirely from both active and inactive states (currently inactive has `border-l-2 border-transparent` as a width placeholder)
- Keep `bg-secondary dark:bg-muted` background on active
- Change text color: active uses `text-accent` (brand orange) instead of `text-foreground`
- Icon: `weight="fill"` when active, `weight="regular"` when inactive

**New NavLink classes:**
```tsx
isActive
  ? "bg-secondary dark:bg-muted text-accent"
  : "text-foreground/70 dark:text-muted-foreground hover:bg-secondary/70 dark:hover:bg-muted/70"
```

**New icon weight:**
```tsx
<Icon
  size={20}
  weight={isActive ? "fill" : "regular"}
  className="shrink-0"
/>
```

Note: When `weight="fill"` is used on a Phosphor icon, the icon is naturally colored by the parent text color (inherits `currentColor`). Since the Link already has `text-accent` on active, the fill icon will naturally appear in brand orange without needing a separate class on the icon element.

### Anti-Patterns to Avoid

- **Adding a separate class to the icon for active color:** Unnecessary — Phosphor icons use `currentColor` by default, inheriting from the parent Link's text color.
- **Using a separate `dismissedAlerts` server action:** DASH-02 is explicitly UI-only. No backend call, no `useTransition`, no server action needed.
- **Inline style overrides for the dashed border:** Use `border-dashed border-2 border-border` utility classes, not inline styles. Per the prior decision: "Design changes must update globals.css / design system tokens — no one-off inline overrides." (Tailwind utility classes for border style are system-level, not one-off overrides.)
- **Removing the collapsed sidebar left-border placeholder:** Check that the `border-l-2 border-transparent` removal on inactive items does not break the collapsed sidebar icon alignment. With the current sidebar, the `border-l-2` adds `2px` of left visual spacing. Removing it shortens the NavLink by 2px on the left — verify alignment is still clean.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dismiss state | Custom hooks, localStorage, server | `useState<Set<string>>` in parent | Spec says UI-only, no persistence |
| Dashed border container | Custom CSS | `border-2 border-dashed border-border rounded-lg` | Already a Tailwind utility |
| Icon fill toggle | Custom SVG or icon replacement | Phosphor `weight="fill" \| "regular"` prop | Same import, same component, just different prop |
| Active color token | New CSS variable | `text-accent` (already `--accent: 21 58% 53%` = warm amber/orange) | Design system already defines the brand orange |

---

## Common Pitfalls

### Pitfall 1: Forgetting the "show more" count needs to use filtered alerts
**What goes wrong:** If dismiss filters at the `AlertRow` level instead of parent, the "View all (N)" count still shows the unfiltered total.
**How to avoid:** Filter `alerts` → `visibleAlerts` at `AttentionAlerts` parent before slicing to `displayedAlerts`. Base badge count and "View all" count on `visibleAlerts.length`.

### Pitfall 2: Stop-propagation missing on dismiss X button
**What goes wrong:** Clicking X triggers the row's `onClick` (opens right panel detail) AND dismisses the item. Double action.
**How to avoid:** `e.stopPropagation()` in the dismiss handler, exactly like the existing retry/acknowledge buttons do in lines 110-153 of `attention-alerts.tsx`.

### Pitfall 3: AlertRow skeleton still has border-l-2
**What goes wrong:** `AttentionAlertsSkeleton` in `attention-alerts.tsx` (lines 241-266) independently renders `border-l-2 border-l-muted` on skeleton rows. If DASH-01 removes borders from real rows but not the skeleton, there's a flash of skeleton with borders before real content loads.
**How to avoid:** Remove `border-l-2` and `border-l-muted` from the skeleton row div at line 252 as well.

### Pitfall 4: Collapsed sidebar icon color after border removal
**What goes wrong:** In collapsed state, the NavLink text is not visible (label hidden), so the only visual active indicator is the icon color + background. Removing the left border is fine here — the `bg-secondary` + `text-accent fill icon` combination provides sufficient affordance.
**How to avoid:** Verify collapsed sidebar active state visually. The `bg-secondary` pill around the icon will show clearly.

### Pitfall 5: The icon inherits text-accent from NavLink, not from className
**What goes wrong:** Leaving `className={cn("shrink-0", isActive ? "text-accent" : "")}` on the icon element after adding `text-accent` to the parent Link creates a redundant class but causes no bug. However, the current code sets `text-accent` only on the icon (line 94), not on the parent Link.
**What to verify:** The target design says **text** should also be brand orange (not just the icon). So `text-accent` moves to the parent Link `className` for both icon and label. Remove the per-icon className conditional entirely.

---

## Code Examples

### DASH-01 + DASH-02: AlertRow with no border-l and dismiss button

```tsx
// Source: direct modification of components/dashboard/attention-alerts.tsx

// Remove getBorderColor function entirely — no longer needed

// New AlertRow div (lines 88-94):
<div
  className={cn(
    'flex items-start justify-between gap-3 px-3 py-2.5 cursor-pointer transition-colors',
    isSelected ? 'bg-muted' : 'hover:bg-muted/50',
  )}
  onClick={onSelect}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.() }}
>
```

Icon in AlertRow should use `size-5` to match Ready to Send rows (which use `h-5 w-5`). Current code already uses `size-4` — increase to `size-5`:

```tsx
// SeverityIcon: change size-4 to size-5
<XCircle weight="fill" className="size-5 text-destructive shrink-0" />
<WarningCircle weight="fill" className="size-5 text-warning shrink-0" />
<Info weight="fill" className="size-5 text-info shrink-0" />
```

AlertRowProps needs `onDismiss`:
```tsx
interface AlertRowProps {
  alert: AttentionAlert
  isSelected: boolean
  onSelect?: () => void
  onDismiss?: (id: string) => void  // new
}
```

Dismiss X button in the desktop action area (inside `hidden lg:flex` div):
```tsx
<Button
  size="icon-sm"
  variant="ghost"
  className="text-muted-foreground hover:text-foreground"
  onClick={(e) => { e.stopPropagation(); onDismiss?.(alert.id) }}
  aria-label="Dismiss alert"
>
  <X className="size-4" />
</Button>
```

### DASH-03: Ready to Send "no jobs yet" empty state

```tsx
// Replace lines 588-601 in ready-to-send-queue.tsx
{jobs.length === 0 && !hasJobHistory && (
  <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-border">
    <div className="rounded-full bg-muted p-3 mb-3">
      <Briefcase className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground mb-3">
      No jobs yet — add a completed job to get started
    </p>
    <Button asChild size="sm">
      <Link href="/jobs">
        <Plus className="h-4 w-4 mr-1" />
        Add Job
      </Link>
    </Button>
  </div>
)}
```

Note: `Briefcase` is already imported in `sidebar.tsx`. In `ready-to-send-queue.tsx`, check current imports — it does not import `Briefcase`. Add it to the phosphor import line.

### NAV-01: Sidebar active state

```tsx
// New NavLink className (sidebar.tsx lines 79-86):
className={cn(
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
  isActive
    ? "bg-secondary dark:bg-muted text-accent"
    : "text-foreground/70 dark:text-muted-foreground hover:bg-secondary/70 dark:hover:bg-muted/70",
  collapsed && "justify-center px-2",
  item.badge && "relative"
)}

// New icon (remove className conditional entirely):
<Icon
  size={20}
  weight={isActive ? "fill" : "regular"}
  className="shrink-0"
/>
```

---

## File Impact Map

| File | Lines Affected | Changes |
|------|---------------|---------|
| `components/dashboard/attention-alerts.tsx` | 28-48, 56, 88-94, 99, 110-153, 189-239, 241-266 | Remove getBorderColor, remove border-l-2 from AlertRow, fix icon to size-5, add dismiss button + state, update skeleton |
| `components/dashboard/ready-to-send-queue.tsx` | 6-21 (imports), 588-601 | Add Briefcase import, replace empty state JSX |
| `components/layout/sidebar.tsx` | 79-107 | Remove border-l-2, add text-accent active, fill icon weight |

No changes required to:
- `globals.css` (brand orange `--accent` already defined)
- Any types or server actions
- `bottom-nav.tsx` (scope is sidebar only per NAV-01)
- Any other dashboard components

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| Left colored border as severity indicator in AlertRow | No border — icon only | Matches Ready to Send rows which never had borders |
| Acknowledge via overflow menu to clear alerts | Client-only X dismiss | Simpler UX, no backend roundtrip |
| Active nav: border-l-2 + outline icon | Active nav: no border + fill icon + accent text | More modern, cohesive with mobile bottom-nav pattern |

The bottom nav (`bottom-nav.tsx`) already uses the correct pattern: active items get `text-accent` with no border treatment. NAV-01 aligns the sidebar with this existing pattern.

---

## Open Questions

1. **Should dismiss survive page navigation?**
   - What we know: Decision says "UI-only (hides from list, doesn't resolve underlying issue)"
   - What's unclear: "UI-only" could mean session-only (not even localStorage) or tab-only (loses on navigation)
   - Recommendation: Plain `useState` (resets on page reload/navigation). Simplest implementation matching spec. If persistence needed, it would have been called out as a backend action.

2. **Mobile dismiss for AttentionAlerts**
   - What we know: Desktop action area (`hidden lg:flex`) gets the X button. Mobile uses overflow `DropdownMenu`.
   - What's unclear: Should "Dismiss" be added to the mobile DropdownMenu as well?
   - Recommendation: Yes — add a "Dismiss" item to the mobile DropdownMenu in AttentionAlerts to maintain feature parity. Calling `onDismiss(alert.id)` from `DropdownMenuItem.onClick` (with `e.stopPropagation()` already handled by DropdownMenu).

3. **Collapsed sidebar: icon-only active state visual**
   - What we know: In collapsed state, `bg-secondary` pill around icon + fill weight is the only indicator.
   - What's unclear: Whether the result is visually distinct enough (the `text-accent` color will apply to the icon fill since icon inherits `currentColor`).
   - Recommendation: This is fine. The accent orange fill icon on secondary background is clearly distinct from muted regular icons. No additional treatment needed.

---

## Sources

### Primary (HIGH confidence)
- `/phosphor-icons/react` via Context7 — verified `weight` prop accepts `"fill" | "regular"`, uses `currentColor` by default, same component handles all weights
- Direct codebase reading of `attention-alerts.tsx`, `ready-to-send-queue.tsx`, `sidebar.tsx`, `globals.css`, `bottom-nav.tsx`

### Secondary (MEDIUM confidence)
- `globals.css` CSS token `--accent: 21 58% 53%` confirmed as brand warm orange/amber (~HSL 21° 58% 53%)
- Existing `bottom-nav.tsx` active pattern (`text-accent`, no border) — establishes mobile precedent that NAV-01 mirrors to sidebar

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all tools already in project
- Architecture patterns: HIGH — directly derived from codebase reading + Phosphor docs
- Pitfalls: HIGH — derived from reading the actual component code (e.g., skeleton has its own border-l-2 classes, icon is size-4 not size-5)

**Research date:** 2026-02-24
**Valid until:** 60 days (stable Tailwind + Phosphor icons, slow-moving domain)
