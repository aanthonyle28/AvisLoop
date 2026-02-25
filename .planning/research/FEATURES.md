# Feature Landscape: v2.5.2 UX Bugs & UI Fixes

**Domain:** Home Service SaaS — UX Polish, Drawer Consistency, Dashboard Redesign
**Researched:** 2026-02-25
**Confidence:** HIGH (codebase direct analysis + verified against shadcn/ui official docs + PatternFly design system + 2025 SaaS UX research)
**Milestone type:** Subsequent — all backend features exist; focus is UI consistency and UX polish

---

## Context

This is a polish pass, not a feature-addition milestone. Every backend feature is built. The question
is: **What UI/UX changes make the product feel professionally finished and internally consistent?**

The user's reference image shows: KPI cards with light gray backgrounds, small sparkline charts
(green/orange/red lines), trend percentages, a pipeline counter row, and recent activity with
colored circle icons and generous spacing.

The five improvement areas from the research brief:
1. Drawer/sheet design consistency (white content grouping, sticky action buttons)
2. Dashboard right panel KPI redesign (gray-background cards + sparklines)
3. Button hierarchy (secondary action variant that doesn't compete with primary CTAs)
4. Campaign pause/freeze/resume UX (freeze enrollments in place)
5. Touch sequence template preview (show email/SMS content inline per touch)

Navigation rename: "Activity" → "History" (confirmed as the more conventional SaaS label for
a chronological audit log vs. a live activity feed).

---

## Table Stakes

Features users expect in a polished SaaS product. Missing these makes the product feel unfinished.

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|--------------|------------|----------------|-------|
| **Sticky action buttons in drawers** | In any Sheet/Drawer with scrollable content, primary actions (Save, Submit) must be visible without scrolling — the #1 SaaS sheet UX rule | LOW | Actions are inline at form bottom; scroll required to reach them | `flex flex-col h-full` + `flex-1 overflow-y-auto` + `SheetFooter` pattern (shadcn/ui official) |
| **Consistent drawer content grouping** | Related fields should be visually grouped (white/card background, rounded corners, padding) — the "request details drawer" already does this; others don't | LOW | RequestDetailDrawer uses sections; CustomerDetailDrawer uses bare Separators; AddJobSheet uses `p-4 border rounded-lg bg-muted/30` only for new-customer sub-form | Request drawer is the reference pattern; align all drawers |
| **Drawer header consistency** | All drawers should have the same header structure (title + description + close button) | LOW | Implemented across all drawers via SheetHeader | Good — already consistent |
| **Queue row visual distinction** | ReadyToSend rows use `divide-y` without card-like backgrounds; reference image shows white bg + border-radius per row | LOW | Current: `divide-y divide-border` flat rows; no white bg | Should match reference image: `bg-card border rounded-lg` per row |
| **Activity renamed to History** | "History" is the established SaaS convention for chronological past-event logs (browser history, order history, audit log); "Activity" implies a live social feed | LOW | Sidebar label reads "Activity" with `href="/history"` (route already named correctly) | Rename sidebar label only; route stays `/history` |
| **Button visual hierarchy is legible** | Users must instantly identify the primary action without reading labels — when primary and secondary buttons look too similar, task completion drops | LOW | current `default` + `outline` + `ghost` + `secondary` work, but `outline` is used for both "secondary supporting action" and "tertiary low-emphasis action" causing visual noise | Need a `soft` variant for mid-weight actions that don't need a border |
| **Campaign pause communicates what happens** | Toggle labeled "Active/Paused" with a Switch is industry-standard (Mailchimp, ActiveCampaign, HubSpot all use this pattern) — but no explanation of what "paused" means for in-flight enrollments | LOW | Switch toggles `status` between 'active'/'paused'; tooltip or copy explaining freeze behavior is absent | Add short explanation text or tooltip: "Paused campaigns don't send new touches; active enrollments are frozen in place" |
| **Touch sequence shows what will be sent** | Users setting up a campaign touch should see a preview of the template body — selecting "Use default template" and saving without seeing what it says is a trust gap | MEDIUM | TouchSequenceEditor shows channel + delay + template name dropdown; no preview of body content | Collapsible preview panel per touch row, triggered by an eye icon or "Preview" button |

---

## Differentiators

Features that lift AvisLoop above average SaaS polish for its price point.

| Feature | Value Proposition | Complexity | Existing State | Notes |
|---------|-------------------|------------|----------------|-------|
| **Sparkline micro-charts in KPI cards** | Research confirms: pairing a KPI number with a 7-30 day sparkline is the strongest single improvement to dashboard comprehension — user sees both current state AND trend trajectory | HIGH | KPI cards show value + trend % only; no chart | Requires computing daily data points per metric (last 30 days); render with a lightweight SVG path or a tiny recharts LineChart; accent the latest data point with a dot |
| **Colored circle icons in activity feed** | The reference image shows activity feed items with colored background circles (green for reviews, blue for sends, orange for feedback) instead of plain muted-color icons; much higher visual scan speed | LOW | `<Icon size={13} className="text-muted-foreground" />` flat icons — no background circle, no semantic color | Pattern: `<div className="h-7 w-7 rounded-full bg-[color]/15 flex items-center justify-center"><Icon className="text-[color]" /></div>` |
| **KPI card gray background in right panel** | Reference image shows right-panel KPI cards with `bg-muted/50` or `bg-[#f4f4f5]` backgrounds — makes cards feel like distinct data blocks, not flat list rows | LOW | Current right panel KPI cards use `bg-card` with `hover:bg-muted/30`; no resting background distinction | Add `bg-muted/40 rounded-lg` as default resting state; remove on-hover only bg change |
| **Drawer content sections use white card grouping** | Grouping related fields into rounded `bg-white/bg-card` panels (like the request-detail drawer's section pattern) creates visual hierarchy and makes long drawers scannable without needing to read every label | LOW | AddJobSheet has muted/30 only for the new-customer sub-form; JobDetailDrawer uses bare Separators; CustomerDetailDrawer uses bare Separators | Standardize all drawers to use `bg-muted/30 rounded-lg p-4` or `rounded-lg border p-4` for each logical section |
| **Soft/tertiary button variant** | Removes the current ambiguity where `outline` buttons serve both "second-most-important action" and "low-emphasis action" roles — a `soft` variant (muted filled background, no border) clearly signals "tertiary/non-competing" | LOW | No `soft` variant in button.tsx; `secondary` fills similar role but with `bg-secondary` which competes visually with `default` in dark mode | Add `soft: "bg-muted text-muted-foreground hover:bg-muted/70"` variant to button CVA; use for dismiss/cancel/low-priority actions in drawers |
| **Campaign pause freeze behavior** | When a campaign is paused, in-flight enrollments should freeze at their current touch position and resume from that exact touch when re-activated — not restart from Touch 1 | MEDIUM | `toggleCampaignStatus` sets campaign.status='paused'; cron processor `WHERE status='active'` already skips paused campaigns' enrollments; resume behavior needs verification that `current_touch` is preserved | Audit that cron skips paused-campaign enrollments; add "Frozen" badge to affected enrollment rows; verify resume picks up from `current_touch` not touch 1 |
| **Touch preview expand/collapse** | Tapping an expand icon next to a touch row shows the first 3-5 lines of the template body inline — building trust and reducing "what will this actually say?" anxiety | MEDIUM | TouchSequenceEditor is a 3-column grid (channel, delay, template dropdown); no preview panel | Add a fourth row below each touch card (hidden by default) with template body preview, triggered by `Eye` icon button |

---

## Anti-Features

Features that seem desirable but create problems, add complexity, or contradict the product's design goals.

| Feature | Why Requested | Why to Avoid | Alternative |
|---------|---------------|--------------|-------------|
| **Full drag-and-drop email builder in touch preview** | "Let users see and edit the template inline" | Way out of scope for a polish pass; Unlayer/Bee embeds are >100KB JS payloads; editing happens in Settings > Templates | Read-only inline preview only; link to "Edit template" in Settings |
| **Campaign pause should delete active enrollments** | "Clean slate when pausing" | Destructive and irreversible; industry standard (Mailchimp, ActiveCampaign) is freeze-in-place, not delete | Freeze behavior — pause preserves enrollment state, resume sends next scheduled touch |
| **Sparklines with axis labels and tooltips** | "More data is better" | Sparklines work precisely because they have NO labels — they show trend direction, not exact values. Adding axes negates the space benefit and creates visual noise | Sparkline = trend shape only; exact value is the large bold number above it |
| **Replace all `outline` buttons with `soft`** | "Visual consistency" | `outline` is correct for some contexts (form Cancel, secondary CTA with equal weight) — blanket replacement would reduce hierarchy not improve it | Use `soft` only where current `outline` is overloaded for low-emphasis / tertiary use |
| **Rename History route to `/activity`** | "Match the old label" | The route was already named `/history` correctly; renaming it would break bookmarks and existing links in emails | Keep `/history` route; rename only the sidebar display label |
| **Activity feed with real-time WebSocket updates** | "Make it feel live" | Not scoped here; adds server infrastructure; current polling-on-page-load is appropriate for this product's usage cadence | Keep server-rendered activity feed; add optimistic UI for user-triggered actions only |
| **Per-touch unsubscribe links** | "Compliance" | Already handled by email sending layer (Resend includes unsubscribe); adding UI for this in the touch editor creates confusion | Don't surface this in the campaign editor UI; it's transparent to the business owner |

---

## Feature Details by Area

### Area 1: Drawer/Sheet Consistency

**Current state (from codebase analysis):**
- `request-detail-drawer.tsx` — best in class; uses named section headings (`<h3 className="text-sm font-medium mb-3">`), proper grouping
- `customer-detail-drawer.tsx` — uses `<Separator />` between sections, no visual card grouping
- `add-job-sheet.tsx` — new-customer sub-form uses `p-4 border rounded-lg bg-muted/30`; other fields are bare
- `job-detail-drawer.tsx` — uses `<Separator />` between sections
- `edit-customer-sheet.tsx`, `edit-job-sheet.tsx` — form fields only, no grouping

**Target pattern** (from shadcn/ui official pattern + PatternFly guidelines):
```tsx
// SheetContent structure for drawers with scrollable content + sticky actions
<SheetContent className="flex flex-col">
  <SheetHeader>...</SheetHeader>
  <div className="flex-1 overflow-y-auto py-4 space-y-4">
    {/* Logical section */}
    <div className="rounded-lg bg-muted/30 p-4 space-y-3">
      <h3 className="text-sm font-medium">Section Name</h3>
      {/* fields */}
    </div>
  </div>
  <div className="border-t pt-4 flex gap-2">
    {/* Sticky action buttons */}
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</SheetContent>
```

**Implementation notes:**
- `flex flex-col` on SheetContent removes the need for `overflow-y-auto` on SheetContent itself
- The scrollable wrapper gets `flex-1 overflow-y-auto`
- Actions in a sticky bottom div (NOT inside `SheetFooter` unless SheetFooter is styled correctly — watch for `overflow` parent conflicts)
- Section grouping uses `bg-muted/30 rounded-lg p-4` consistently

**Affected files:**
- `components/ui/sheet.tsx` — May need to adjust SheetContent className default to `flex flex-col`
- `components/jobs/add-job-sheet.tsx`
- `components/jobs/edit-job-sheet.tsx`
- `components/jobs/job-detail-drawer.tsx`
- `components/customers/customer-detail-drawer.tsx`
- `components/customers/add-customer-sheet.tsx`
- `components/customers/edit-customer-sheet.tsx`

---

### Area 2: Dashboard Right Panel KPI Redesign

**Current state (from codebase analysis):**
- `right-panel-default.tsx` — KPI cards: `bg-card p-4 hover:bg-muted/30`; plain white resting state
- Activity feed icons: flat muted-foreground icons, no background circle
- Pipeline counters: `grid grid-cols-3 divide-x divide-border rounded-lg border bg-muted/30` — already good

**Target state (from reference image + research):**
- KPI cards: `bg-muted/40 rounded-xl p-4` resting background (light gray)
- KPI cards: sparkline in bottom-right area (40px tall, 80px wide SVG)
- Activity feed: colored circle icons per event type
  - `touch_sent` → blue (`bg-blue-100 text-blue-600`)
  - `review_click` → amber (`bg-amber-100 text-amber-600`)
  - `feedback_submitted` → orange (`bg-orange-100 text-orange-600`)
  - `enrollment` → green (`bg-green-100 text-green-600`)
- Activity rows: more vertical padding (`py-2` instead of `py-1.5`), larger icon circle (`h-8 w-8`)

**Sparkline data requirements:**
The sparkline needs 7-30 daily data points per metric. This requires either:
- A new dashboard data query returning daily bucket counts
- Or computing from existing `send_logs` grouped by `DATE(created_at)`

**Complexity: HIGH** — sparklines require new data infrastructure; the colored icon circles are LOW complexity.

**Recommended split:** Ship colored icon circles in Phase 1 (visual-only, no data changes). Add sparklines as a separate phase once the daily data query is built.

---

### Area 3: Button Hierarchy

**Current state (from button.tsx):**
```
default   — bg-primary, filled                  (CTA / primary action)
destructive — bg-destructive, filled             (delete / irreversible)
outline   — border + transparent bg              (secondary OR tertiary — OVERLOADED)
secondary — bg-secondary, filled                 (currently underused)
ghost     — no bg/border, hover bg              (lowest emphasis)
link      — text only, underline                 (inline navigation)
```

**The problem:** `outline` is used for both:
1. Secondary actions of moderate importance (e.g., "Edit Customer" next to "Archive")
2. Low-importance dismiss/cancel actions (e.g., "Remove from queue" X button on hover)

When users see three `outline` buttons in a row with one `default` button, the visual hierarchy breaks — it looks like three equal secondary choices instead of one primary + two supporting.

**Recommended addition — `soft` variant:**
```tsx
soft: "bg-muted text-muted-foreground hover:bg-muted/70"
```

Usage guidance:
- `default` — primary CTA (one per section)
- `outline` — secondary action of moderate importance (complements primary)
- `soft` — tertiary/low-emphasis (cancel, dismiss, remove, "re-evaluate", "back to search")
- `ghost` — icon-only inline actions, table/list row actions
- `destructive` — delete/irreversible only

**Affected files:**
- `components/ui/button.tsx` — add `soft` variant
- `components/jobs/add-job-sheet.tsx` — "Or select existing customer" → `soft`
- `components/jobs/job-detail-drawer.tsx` — "Re-evaluate", "Re-evaluate" conflict buttons → `soft`
- `components/dashboard/ready-to-send-queue.tsx` — dismiss button → `ghost`, "Queue" button → `outline`, cancel-like actions → `soft`

---

### Area 4: Campaign Pause/Freeze/Resume

**Current state (from campaign-card.tsx + codebase):**
- `toggleCampaignStatus` sets `campaign.status = 'paused' | 'active'`
- Campaign cron processor (`/api/cron/process-campaign-touches`) queries `WHERE status='active' AND current_touch=N AND touch_N_sent_at IS NULL`
- Since it joins on campaign status via enrollments → campaigns, pausing a campaign means touches are NOT sent (they are skipped in the WHERE clause)
- However: NO UI indication to user that existing enrollments are frozen vs. stopped
- Campaign card shows "Active" / "Paused" text + Switch — no explanation of freeze behavior

**What "pause" should mean (industry standard):**
- New jobs: Cannot be enrolled in a paused campaign (enrollment should fail gracefully or fall back to auto-detect)
- Existing enrollments: Frozen at current touch position — `touch_N_scheduled_at` dates still exist but cron skips them
- Resume: Active enrollments continue from `current_touch` — NOT restarted from touch 1
- The `touch_N_scheduled_at` dates will be stale on resume (the originally scheduled time has passed) — the cron should treat a "recently resumed" enrollment's next touch as due-now or schedule-now

**Verification needed:**
- Confirm cron skips paused-campaign enrollments (likely YES — the WHERE clause on campaign status)
- Confirm that on resume, enrollments with stale `touch_N_scheduled_at` in the past are picked up as due (likely YES — `touch_N_scheduled_at <= NOW()`)
- If not, the fix is to either bump scheduled dates on resume OR ensure cron treats past-due as "send now"

**UI changes needed:**
- Campaign card: Add tooltip or description text below switch: "Paused campaigns freeze active sequences. Resume to continue from where they left off."
- Paused campaign indicator on enrollment row in dashboard (LOW complexity — show a "Frozen" badge on queue items whose campaign is paused)

**Affected files:**
- `components/campaigns/campaign-card.tsx` — tooltip text
- `app/api/cron/process-campaign-touches/route.ts` — verify pause behavior
- `components/dashboard/ready-to-send-queue.tsx` — frozen badge for paused-campaign queue items

---

### Area 5: Touch Sequence Template Preview

**Current state (from touch-sequence-editor.tsx):**
- 3-column grid per touch: Channel (Select) | Delay (Input + hours) | Template (Select dropdown)
- Template options: "Use default template" + named user templates
- No preview of what the template body says
- User selects "HVAC Follow-up Email" from a dropdown and has no idea what words will be sent

**Target pattern:**
- Each touch row has a collapsible preview panel below it
- Triggered by an `Eye` icon button in the touch card header
- Preview shows: template subject (for email) + first 100 chars of body
- Channel determines what preview looks like (email = subject + body excerpt; SMS = body excerpt only)
- When "Use default template" is selected, show the system default for that channel/service type

**Data requirements:**
- `touch-sequence-editor.tsx` receives `templates: MessageTemplate[]` already
- When "default" is selected, need to find the system template for the campaign's service type + channel
- The campaign form has access to `serviceType`; this needs to be passed through to the editor

**Complexity: MEDIUM** — the preview render itself is simple (no iframe, just text display); the tricky part is resolving "default template" to the actual system template body.

**Pattern:**
```tsx
// Touch card with expandable preview
<Card>
  <CardContent className="pt-4">
    <div className="flex items-start gap-4">
      {/* ... existing 3-column touch config ... */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setPreviewOpen(!previewOpen)}
        aria-label="Preview template"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>

    {/* Expandable preview */}
    {previewOpen && (
      <div className="mt-3 rounded-lg bg-muted/30 p-3 text-sm border-t">
        {touch.channel === 'email' && <p className="font-medium text-xs text-muted-foreground mb-1">Subject</p>}
        {touch.channel === 'email' && <p className="text-sm mb-2">{resolvedTemplate?.subject || '(default subject)'}</p>}
        <p className="text-xs text-muted-foreground mb-1">Message</p>
        <p className="text-sm line-clamp-3">{resolvedTemplate?.body || '(default message)'}</p>
        <button className="text-xs text-primary mt-1 hover:underline">Edit template →</button>
      </div>
    )}
  </CardContent>
</Card>
```

**Affected files:**
- `components/campaigns/touch-sequence-editor.tsx`
- `components/campaigns/campaign-form.tsx` — pass serviceType to editor for default template resolution

---

### Area 6: Queue Row Visual Distinction

**Current state:**
```tsx
<div className={cn(
  'flex items-center justify-between transition-colors',
  isSelected ? 'bg-muted' : 'hover:bg-muted/50',
)}>
```
Flat rows separated only by `divide-y divide-border`.

**Target state (from reference image):**
Each queue row is a distinct white card with rounded corners and subtle border:
```tsx
<div className={cn(
  'flex items-center justify-between rounded-lg border bg-card p-2 transition-colors',
  isSelected ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/30',
)}>
```
Rows in a `space-y-1.5` container instead of `divide-y`.

**Affected files:**
- `components/dashboard/ready-to-send-queue.tsx` — job list container + row className

---

## Feature Dependencies

```
[Sticky Drawer Actions]
  └── requires ──> [flex flex-col on SheetContent] (CSS only)
  └── affects ──> add-job-sheet, edit-job-sheet, customer-detail-drawer, job-detail-drawer, add-customer-sheet, edit-customer-sheet

[Drawer Content Section Grouping]
  └── independent ──> visual-only change per drawer
  └── reference pattern ──> request-detail-drawer.tsx (already correct)

[Soft Button Variant]
  └── adds to ──> components/ui/button.tsx
  └── used in ──> drawers, queue, job/conflict actions

[Queue Row White Cards]
  └── independent ──> ready-to-send-queue.tsx visual only

[Activity Rename]
  └── affects ──> sidebar.tsx label only (route stays /history)
  └── affects ──> bottom-nav.tsx label

[Right Panel KPI Gray Backgrounds]
  └── independent ──> right-panel-default.tsx visual only

[Right Panel Colored Icon Circles]
  └── independent ──> right-panel-default.tsx visual only
  └── no data changes

[Sparklines in KPI Cards]
  └── requires ──> new daily data query (dashboard data layer)
  └── requires ──> sparkline render component (SVG or recharts)
  └── higher effort ──> separate phase from colored icon circles

[Campaign Pause Freeze UX]
  └── part 1 (copy/tooltip) ──> campaign-card.tsx, no logic change
  └── part 2 (verify cron) ──> read api/cron/process-campaign-touches
  └── part 3 (frozen badge) ──> ready-to-send-queue.tsx (add frozen badge when campaign.status='paused')

[Touch Sequence Preview]
  └── requires ──> serviceType passed to touch-sequence-editor
  └── requires ──> system template lookup by channel + serviceType
  └── adds ──> collapsible preview panel per touch card
  └── links to ──> Settings > Templates (edit template button)
```

---

## MVP Recommendation

### Phase 1 — Visual-Only (No Data Changes, 1-2 days)

All of these require no new queries, no schema changes, pure UI.

- [ ] Queue rows: white card per row (`bg-card border rounded-lg`)
- [ ] Right panel KPI cards: gray resting background (`bg-muted/40`)
- [ ] Right panel activity feed: colored circle icons
- [ ] "Activity" → "History" in sidebar and bottom-nav labels
- [ ] `soft` button variant added to button.tsx
- [ ] Drawer section grouping: `bg-muted/30 rounded-lg p-4` per logical section in all drawers
- [ ] Sticky drawer actions: `flex flex-col` + `flex-1 overflow-y-auto` + bottom action strip

### Phase 2 — Behavior (Logic Verification + Light Changes, 1-2 days)

- [ ] Campaign pause: add tooltip/description text to campaign card
- [ ] Campaign pause: verify cron skips paused-campaign enrollments; verify resume picks up from current_touch
- [ ] Campaign pause: "Frozen" badge on queue items where campaign is paused
- [ ] Touch sequence: template preview collapse/expand panel per touch
- [ ] Touch sequence: `serviceType` plumbed to editor for default template resolution

### Phase 3 — Sparklines (Data + Component, separate phase)

- [ ] Daily bucket query for each KPI metric (last 30 days)
- [ ] Sparkline SVG component (40px tall, ~80px wide, no axes)
- [ ] Integrate into right-panel KPI cards and/or main KPI widget cards

---

## Complexity & Confidence Matrix

| Feature | Complexity | Confidence | Source |
|---------|------------|------------|--------|
| Sticky drawer actions (flex pattern) | LOW | HIGH | shadcn/ui official patterns page |
| Drawer section grouping | LOW | HIGH | Codebase analysis (request-detail-drawer is reference) |
| Queue row white cards | LOW | HIGH | Codebase analysis + reference image |
| KPI card gray backgrounds | LOW | HIGH | Reference image + research (neutral base colors trend) |
| Colored circle icons in activity feed | LOW | HIGH | Reference image + codebase analysis |
| Activity → History rename | LOW | HIGH | WebSearch (industry UX convention) + existing route already /history |
| `soft` button variant | LOW | HIGH | PatternFly + ButtonHierarchy research + codebase analysis |
| Campaign pause tooltip/copy | LOW | HIGH | Codebase analysis (toggleCampaignStatus exists) |
| Campaign pause cron verification | LOW-MEDIUM | MEDIUM | Codebase analysis (WHERE clause logic; cron file unread) |
| Touch sequence preview panel | MEDIUM | HIGH | Codebase analysis (templates prop already available) |
| Sparkline component + data | HIGH | MEDIUM | Research (sparkline pattern well-established); data query is the unknown |

---

## Sources

- [shadcn/ui: Sheet with Sticky Header and Footer](https://www.shadcn.io/patterns/sheet-multi-section-5) — HIGH confidence
- [shadcn/ui: React Sheet with Action Buttons in Footer](https://www.shadcn.io/patterns/sheet-multi-section-4) — HIGH confidence
- [PatternFly: Button Design Guidelines](https://www.patternfly.org/components/button/design-guidelines/) — HIGH confidence
- [cieden.com: How to create button hierarchy](https://cieden.com/book/atoms/button/how-to-create-button-hierarchy) — MEDIUM confidence
- [uitop.design: Top Dashboard Design Trends 2025](https://uitop.design/blog/design/top-dashboard-design-trends/) — MEDIUM confidence
- [Smashing Magazine: UX Strategies for Real-Time Dashboards 2025](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/) — HIGH confidence
- [uxdesign.cc: Design Thoughtful Dashboards for B2B SaaS](https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d) — MEDIUM confidence
- [Mailchimp API: Pause Automated Email](https://mailchimp.com/developer/marketing/api/automation-email/pause-automated-email/) — HIGH confidence (industry reference for freeze-in-place pattern)
- [lollypop.design: SaaS Navigation Menu Design 2025](https://lollypop.design/blog/2025/december/saas-navigation-menu-design/) — MEDIUM confidence
- Codebase direct analysis — HIGH confidence (all files surveyed 2026-02-25)
- User's reference image + product brief — HIGH confidence (direct requirements)

---

*Feature research for: AvisLoop v2.5.2 UX Bugs & UI Fixes*
*Researched: 2026-02-25*
*Context: Subsequent milestone. All backend functionality exists. Research focus is UX polish + consistency.*
