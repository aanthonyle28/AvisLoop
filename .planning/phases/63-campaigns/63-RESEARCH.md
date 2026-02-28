# Phase 63: Campaigns - Research

**Researched:** 2026-02-27
**Domain:** QA E2E Audit — Campaign management (list, detail, edit, preset picker, pause/resume freeze, template preview, analytics, conflict states)
**Confidence:** HIGH — all findings from direct codebase analysis

---

## Summary

Phase 63 is a QA E2E audit of the Campaigns module. No new features are built; all tests verify existing functionality. The Campaigns page is the automation configuration surface in V2. The test account (`audit-test@avisloop.com`) has one existing campaign ("HVAC Follow-up", hvac, active, 2 touches) and three AUDIT_ customers enrolled in it (Patricia Johnson, Marcus Rodriguez, Sarah Chen) from Phase 62.

The Campaigns module is split across three route segments: `/campaigns` (list page), `/campaigns/[id]` (detail page), and `/campaigns/new` (standalone form page). The list uses a `CampaignCard` per campaign with an inline Switch for pause/resume. The detail page fetches enrollment counts, analytics, and paginated enrollment list. The edit sheet (`CampaignForm`) opens from both the list card and the detail page. The preset picker (`CreateCampaignDialog`) is a modal dialog, not a standalone page — it opens when "New Campaign" is clicked.

The frozen enrollment behavior (CAMP-05/06) is implemented in `toggleCampaignStatus()` server action: pausing sets `status='frozen'` on active enrollments, resuming iterates through frozen enrollments and sets them back to `active` with bumped timestamps if their scheduled time is in the past. DB verification is mandatory for these requirements because the UI only shows a toast. There is a known gap: `ENROLLMENT_STATUS_LABELS` in `lib/constants/campaigns.ts` does NOT include a `frozen` entry — the campaign detail enrollment list will render an undefined label for frozen enrollments.

**Primary recommendation:** The single plan file (63-01-PLAN.md) should follow the requirement order (CAMP-01 through CAMP-10), using Playwright MCP for UI interactions and Supabase MCP for DB verification of CAMP-05, CAMP-06, and CAMP-08. The plan must explicitly test the frozen label gap as part of CAMP-05 verification.

---

## Standard Stack

This phase uses the project's existing tooling — no new libraries.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Playwright (via MCP) | 1.58.1 | Browser automation for UI testing | Already in package.json; MCP tools available |
| Supabase MCP | — | Direct DB queries to verify server-side enrollment status | Required for CAMP-05, CAMP-06, CAMP-08 |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Sonner toast assertions | Verify success/error feedback | After pause/resume, after edit save, after new campaign create |
| `getByRole` selectors | Semantic selectors (accessibility-first) | Buttons, dialogs, form fields |

---

## Architecture Patterns

### Existing Code Structure

```
app/(dashboard)/campaigns/
  page.tsx                  — Server component: getActiveBusiness() + getCampaigns() + getCampaignPresets()
  campaigns-shell.tsx       — Client shell with hasCampaigns state + CreateCampaignDialog trigger
  loading.tsx               — Skeleton (not yet audited)
  [id]/
    page.tsx                — Server component: getCampaign + getCampaignEnrollments + getCampaignAnalytics
    campaign-detail-shell.tsx — Client: status toggle + edit sheet + delete + duplicate
  new/
    page.tsx                — Standalone form (rarely reached directly, usually via CreateCampaignDialog)

components/campaigns/
  campaign-list.tsx         — Renders CampaignCard list + edit Sheet
  campaign-card.tsx         — Single campaign row: name, service badge, touch count, Switch, action buttons
  campaign-form.tsx         — React Hook Form for create/update (name, service_type, touches, personalization)
  touch-sequence-editor.tsx — Adds/removes/edits up to 4 touches with channel + delay + template selectors
  touch-sequence-display.tsx — Read-only touch display (campaign detail page) with Eye/preview buttons
  campaign-stats.tsx        — Touch performance bar charts + stop reason list (shown when totalEnrollments > 0)
  create-campaign-dialog.tsx — Dialog with 3 preset radio cards + "Custom Campaign" option
  delete-campaign-dialog.tsx — AlertDialog with enrollment impact + reassign select
  preset-picker.tsx         — Alternative preset display (compact/non-compact) used in onboarding
  template-preview-modal.tsx — Dialog showing email (subject + body) or SMS (bubble) template content

lib/actions/campaign.ts     — createCampaign, updateCampaign, deleteCampaign, duplicateCampaign, toggleCampaignStatus, stopEnrollment
lib/data/campaign.ts        — getCampaigns, getCampaign, getCampaignPresets, getCampaignEnrollments,
                              getCampaignEnrollmentCounts, getCampaignAnalytics
lib/constants/campaigns.ts  — CAMPAIGN_PRESETS (3), ENROLLMENT_STATUS_LABELS, STOP_REASON_LABELS, TOUCH_STATUS_LABELS
lib/actions/enrollment.ts   — enrollJobInCampaign, checkEnrollmentConflict
lib/actions/conflict-resolution.ts — resolveEnrollmentConflict, revertConflictResolution
```

### Pattern 1: Campaign List → Edit Sheet

**What:** `CampaignCard` renders each campaign with an edit pencil button. Clicking "Edit" calls `onEdit(campaign.id)` which is handled by `CampaignList` — it sets `editingCampaignId` state. A `Sheet` at `CampaignList` level opens with `CampaignForm` populated with the campaign's current values.

**Key behavior:** The edit sheet is NOT a page navigation — it slides in over the campaign list. After `onSuccess`, the sheet closes and `revalidatePath('/campaigns')` refreshes the list.

**When to use:** CAMP-03 tests this flow. Open edit by clicking the pencil icon on the campaign card. Change touch timing (e.g., 24 → 48 hours), save. Verify by checking the campaign detail page.

### Pattern 2: Pause/Resume via Switch Toggle

**What:** `CampaignCard` has a `Switch` that calls `toggleCampaignStatus(campaign.id)`. The action uses optimistic UI: `setOptimisticStatus(newStatus)` fires immediately; if the server action fails, it reverts to `campaign.status`. On pause: sets campaign `status='paused'` AND updates all `status='active'` enrollments to `status='frozen'`. On resume: sets campaign `status='active'` AND iterates frozen enrollments to set them back to `status='active'` (bumping scheduled times if stale).

**Key behavior:** The pause/resume Switch is ALSO available on the campaign detail page via `CampaignDetailShell`. Both trigger the same `toggleCampaignStatus()` action.

**Frozen label gap:** `ENROLLMENT_STATUS_LABELS` only has `active`, `completed`, `stopped`. It is MISSING `frozen`. After pause, if the campaign detail enrollment list renders a frozen enrollment, `ENROLLMENT_STATUS_LABELS['frozen']` returns `undefined`. The Badge renders with no text. This is a real gap — the plan must document and screenshot it.

### Pattern 3: Template Preview Modal

**What:** Both `TouchSequenceDisplay` (campaign detail, read-only) and `TouchSequenceEditor` (edit form) have Eye buttons per touch. Clicking opens `TemplatePreviewModal`. The modal resolves the template by `touch.template_id` first; if null, falls back to any system template with `is_default=true` matching the channel. If no template at all, renders "No template preview available. This touch uses an AI-generated default."

**Key behavior:** The HVAC Follow-up campaign was created with `touch.template_id = null` for both touches (copied from preset). The resolve logic falls back to finding `is_default && channel === touch.channel` system templates. If system templates exist for email/SMS, the preview shows generic system template content. If none, shows the AI-default message.

### Pattern 4: CreateCampaignDialog Preset Picker

**What:** "New Campaign" button opens `CreateCampaignDialog`. The dialog shows 3 preset radio cards (Gentle Follow-Up, Standard Follow-Up, Aggressive Follow-Up) matched from the database presets by `preset.name.toLowerCase().includes(p.id)` (conservative, standard, aggressive). Selecting a preset and clicking "Continue" calls `duplicateCampaign(preset.id, meta.name)` which creates a new non-preset copy and navigates to `/campaigns/[newId]?edit=true`.

**Critical matching logic:** The preset name in the DB must contain the string `conservative`, `standard`, or `aggressive` (case-insensitive) for the card to show its metadata (description, recommended_for). If the DB preset name doesn't match, the card shows only the DB name with no description.

**Key behavior:** `getCampaignPresets()` only returns `is_preset=true` campaigns. The DB must have 3 system presets with names matching the pattern for all 3 cards to render correctly with descriptions.

### Pattern 5: Campaign Analytics

**What:** `getCampaignAnalytics(campaignId)` queries all enrollments for the campaign and computes:
- `touchStats[4]`: per-touch counts of `sent`, `pending`, `skipped`, `failed` from `touch_N_status` columns
- `stopReasons`: count of each `stop_reason` for `status='stopped'` enrollments
- `totalEnrollments`: total enrollment row count (all statuses including frozen)
- `avgTouchesCompleted`: average number of touches where `touch_N_status='sent'`

**Key behavior:** `CampaignStats` component only renders if `totalEnrollments > 0`. After Phase 62 creates 3 AUDIT_ enrollments, the analytics section SHOULD be visible with data. The enrollment count at the top of the detail page (Active, Completed, Stopped cards) uses `getCampaignEnrollmentCounts()` which returns separate counts by status.

**DB verification for CAMP-08:** The Touch Performance stats in the UI must match the raw enrollment data. Query the enrollments table directly and compute touch stats manually to compare.

### Anti-Patterns to Avoid

- **Relying on UI-only for CAMP-05/06:** Always follow a pause or resume action with a Supabase MCP query to confirm enrollment statuses.
- **Assuming DB presets match CAMPAIGN_PRESETS constants:** The preset match depends on name string containing 'conservative'/'standard'/'aggressive'. If the DB preset was named differently, the description won't show.
- **Testing the `/campaigns/new` standalone page for CAMP-04:** The preset picker in `CreateCampaignDialog` (the modal) is different from `PresetPicker` component (used in onboarding). CAMP-04 tests the `CreateCampaignDialog` flow, not the `/campaigns/new` page.
- **Dismissing frozen label gap:** When testing CAMP-05, document the undefined label rendering in the enrollment list as a finding (not a blocker for this phase, but a bug to note).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frozen enrollment verification | Assert from UI toast only | Supabase MCP: query campaign_enrollments WHERE campaign_id=X AND status='frozen' | Toast fires even if DB update fails silently |
| Analytics accuracy check | Trust UI numbers | DB query: manually count touch_N_status='sent' per enrollment, compare with UI | UI could have calculation bugs |
| Preset matching | Inspect rendered HTML | Know the string-match rule: name.toLowerCase().includes(p.id) — check DB preset names first | Matching is non-obvious |

---

## Common Pitfalls

### Pitfall 1: ENROLLMENT_STATUS_LABELS Missing 'frozen'

**What goes wrong:** After pausing the HVAC Follow-up campaign (CAMP-05), the campaign detail enrollment list shows the 3 AUDIT_ enrollments as frozen. The badge calls `ENROLLMENT_STATUS_LABELS[enrollment.status]` which is `ENROLLMENT_STATUS_LABELS['frozen']` = `undefined`. The badge renders with no visible text.

**Why it happens:** `lib/constants/campaigns.ts` line 88-92 only defines `active`, `completed`, `stopped`. `frozen` was added as a status in Phase 46 but the label constant was not updated.

**How to avoid:** Identify this as a known gap during CAMP-05 testing. Screenshot the empty badge. Note it as a bug in the QA output document. Do NOT treat it as a test failure that blocks CAMP-05 verification — the underlying DB data (frozen status) is correct; only the display label is missing.

**Warning signs:** After pause, enrollment list rows show an empty Badge where "Frozen" should appear.

### Pitfall 2: Preset Matching Fails If DB Preset Names Changed

**What goes wrong:** `CreateCampaignDialog` matches DB presets to `CAMPAIGN_PRESETS` constant via `preset.name.toLowerCase().includes(p.id)`. If the DB system preset names were changed (e.g., renamed from "Standard Follow-Up" to something else), `.includes('standard')` fails and the card shows no description.

**Why it happens:** The DB preset and constant must stay in sync. The filter `.filter(p => p.meta)` removes unmatched presets entirely — if all 3 fail to match, the dialog shows no presets.

**How to avoid:** Before running CAMP-04, query the DB preset names directly: `SELECT name FROM campaigns WHERE is_preset=true ORDER BY name`. Verify each name contains 'conservative', 'standard', or 'aggressive'.

**Warning signs:** CreateCampaignDialog opens but shows only the "Custom Campaign" option, no preset cards.

### Pitfall 3: getCampaignEnrollmentCounts Shows 'frozen' Separately from 'active'

**What goes wrong:** The top 3 stat cards on the campaign detail page show "Active", "Completed", "Stopped" counts. The `getCampaignEnrollmentCounts()` function returns `{ active, completed, stopped, frozen }` but the page JSX only renders the first 3 cards (lines 97-116 of the detail page). Frozen enrollments are NOT included in the Active count. After pausing the campaign with 3 active enrollments, the "Active" card will show 0 and "Stopped" will show 0 — but nothing shows the 3 frozen enrollments.

**Why it happens:** The page was written before frozen status was added. The `frozen` count is fetched but not displayed.

**How to avoid:** CAMP-05 success criterion says "verified by direct DB query" — the UI stat cards are NOT the verification mechanism. Use Supabase MCP query after pausing: `SELECT status, COUNT(*) FROM campaign_enrollments WHERE campaign_id='...' GROUP BY status`. Expect `frozen: 3` (not shown in UI stats).

**Warning signs:** After pause, the Active count drops to 0, Stopped stays at 0, but 3 enrollments seem to have disappeared from the stats.

### Pitfall 4: Template Preview Shows System Default When Touch Has No Template

**What goes wrong:** The HVAC Follow-up campaign was duplicated from a preset, which has `template_id = null` on all touches. `TouchSequenceDisplay.resolveTemplate()` falls back to `templates.find(t => t.is_default && t.channel === touch.channel)`. If system templates exist in the DB (they should — 16 system templates were seeded), the preview shows a generic system template. The test may confuse this for "no template" when it's actually the system fallback.

**Why it happens:** The null `template_id` fallback to system templates is intentional design. The modal will show template content even when no business-specific template is assigned.

**How to avoid:** For CAMP-07, clicking the Eye button on touch 1 (email) should open a preview with actual template content (from system templates), not the "No template preview available" message. If the modal shows the AI-default message, it means no system templates exist in the DB for the email channel — that would be a data integrity issue.

### Pitfall 5: CampaignStats Only Renders If totalEnrollments > 0

**What goes wrong:** If AUDIT_ enrollments from Phase 62 don't exist (e.g., Phase 62 was not completed), `CampaignStats` component returns `null` and the entire analytics section is invisible. CAMP-08 would then fail with "no analytics section found."

**Why it happens:** `CampaignStats` has an early return: `if (totalEnrollments === 0) return null`.

**How to avoid:** Verify AUDIT_ enrollments exist before testing CAMP-08. Run this DB query first: `SELECT COUNT(*) FROM campaign_enrollments WHERE campaign_id = '<hvac-campaign-id>'`. If count is 0, Phase 62 prerequisites were not completed — stop and complete Phase 62 first.

### Pitfall 6: Card Click vs Action Button Click on CampaignCard

**What goes wrong:** `CampaignCard` is a clickable div that navigates to `/campaigns/[id]`. The Switch, edit, duplicate, and delete buttons have `onClick={e => e.stopPropagation()}` to prevent card navigation. If a Playwright test clicks the Switch without stopping propagation (e.g., by clicking the wrong coordinate), it may navigate to the detail page instead of toggling status.

**Why it happens:** The click-stop pattern is applied to the `div` wrapping the action area (line 124-127), not to each button individually. The Switch itself does not call `stopPropagation()`.

**How to avoid:** Use a precise selector for the Switch: `page.locator('[data-testid="campaign-status-toggle"]')` or better, locate by label: the Switch is preceded by a `<span>` with text "Active" or "Paused". Use `page.getByRole('switch')` which targets the Radix Switch rendered as `role="switch"`.

### Pitfall 7: Edit Sheet Closes on Navigation (campaign-list.tsx)

**What goes wrong:** The edit Sheet in `CampaignList` closes when `setEditingCampaignId(null)` is called from `onSuccess`. This triggers a `revalidatePath('/campaigns')` server-side. However, the local state `campaigns` array in the list won't update until Next.js revalidation completes. The closing animation may cause the test to try interacting with the form while it's still mounted.

**Why it happens:** The `onSuccess` callback immediately closes the sheet via state change, but the data refresh from `revalidatePath` is asynchronous.

**How to avoid:** After saving in the edit sheet, wait for the Sheet to fully close (wait for Sheet content to not be visible), then navigate to the detail page to verify saved changes.

---

## Code Examples

### DB Queries for Campaign Verification

```sql
-- CAMP-01: Verify campaign list data
SELECT id, name, service_type, status,
       (SELECT COUNT(*) FROM campaign_touches WHERE campaign_id = campaigns.id) as touch_count
FROM campaigns
WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
  AND is_preset = false
ORDER BY created_at DESC;
```

```sql
-- CAMP-05: Verify frozen enrollment after pause
SELECT ce.id, ce.status, c.name as customer_name
FROM campaign_enrollments ce
JOIN customers c ON ce.customer_id = c.id
WHERE ce.campaign_id = '<hvac-campaign-id>'
  AND ce.status = 'frozen';
-- Expect: 3 rows (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen)
```

```sql
-- CAMP-06: Verify active enrollment after resume
SELECT ce.id, ce.status,
       ce.touch_1_scheduled_at,
       ce.touch_1_status,
       c.name as customer_name
FROM campaign_enrollments ce
JOIN customers c ON ce.customer_id = c.id
WHERE ce.campaign_id = '<hvac-campaign-id>'
  AND ce.status = 'active';
-- Expect: 3 rows with status='active'
-- Also verify touch_1_scheduled_at was bumped to >= NOW() for any enrollment
-- where the original scheduled time was in the past
```

```sql
-- CAMP-08: Verify analytics match DB values
SELECT
  COUNT(*) as total_enrollments,
  SUM(CASE WHEN touch_1_status = 'sent' THEN 1 ELSE 0 END) as touch_1_sent,
  SUM(CASE WHEN touch_1_status = 'pending' THEN 1 ELSE 0 END) as touch_1_pending,
  SUM(CASE WHEN touch_2_status = 'sent' THEN 1 ELSE 0 END) as touch_2_sent,
  SUM(CASE WHEN touch_2_status = 'pending' THEN 1 ELSE 0 END) as touch_2_pending
FROM campaign_enrollments
WHERE campaign_id = '<hvac-campaign-id>';
-- Compare these DB values against what CampaignStats component shows in the UI
```

```sql
-- CAMP-10: Verify new campaign was created after preset duplication
SELECT id, name, service_type, status, is_preset,
       (SELECT COUNT(*) FROM campaign_touches WHERE campaign_id = campaigns.id) as touch_count
FROM campaigns
WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
ORDER BY created_at DESC
LIMIT 5;
-- The most recently created campaign (is_preset=false) should be the new one
```

```sql
-- Get the HVAC Follow-up campaign ID (needed for other queries)
SELECT id, name, service_type, status
FROM campaigns
WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
  AND is_preset = false
  AND service_type = 'hvac';
```

```sql
-- Verify DB preset names to confirm CAMP-04 preset matching will work
SELECT id, name, is_preset
FROM campaigns
WHERE is_preset = true
ORDER BY name;
-- Each name should contain 'conservative', 'standard', or 'aggressive' (case-insensitive)
```

```sql
-- Verify AUDIT_ enrollments exist before testing CAMP-08
SELECT ce.status, c.name as customer_name, ce.touch_1_status, ce.touch_1_scheduled_at
FROM campaign_enrollments ce
JOIN customers c ON ce.customer_id = c.id
WHERE c.name LIKE 'AUDIT_%'
ORDER BY c.name;
```

### Playwright Selector Patterns

```typescript
// Navigate to campaigns page
await page.goto('/campaigns')

// Click campaign card to navigate to detail (avoid action area)
await page.getByText('HVAC Follow-up').click()  // clicks campaign name text

// Pause/resume Switch on campaign card
await page.getByRole('switch').click()  // there should be one switch per campaign card
// OR by label:
await page.locator('[role="switch"]').click()

// Open edit sheet from campaign card (pencil icon)
await page.getByLabel('Edit campaign').click()

// Open New Campaign dialog
await page.getByRole('button', { name: 'New Campaign' }).click()

// Select a preset card in CreateCampaignDialog
await page.getByRole('radio', { name: /Standard Follow-Up/ }).click()
// Click Continue
await page.getByRole('button', { name: 'Continue' }).click()

// Template preview: click Eye button for touch 1
await page.getByRole('button', { name: 'Preview touch 1 template' }).click()
// Verify modal opens with content
await expect(page.getByRole('dialog')).toBeVisible()

// Verify status badge text on campaign card
await expect(page.getByText('Active')).toBeVisible()  // or 'Paused'

// In campaign edit sheet: change delay hours
await page.locator('input[type="number"]').first().fill('48')

// Save campaign edit
await page.getByRole('button', { name: 'Save Changes' }).click()
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Campaign pause stops enrollments permanently | Campaign pause freezes enrollments (status='frozen', touch position preserved) | Test must use Supabase MCP to verify 'frozen' not 'stopped' |
| Preset picker as standalone page | Preset picker inside CreateCampaignDialog (modal) | Test navigates via "New Campaign" button, not /campaigns/new |
| Edit campaign as separate page | Edit campaign as Sheet panel on campaign list | Test opens Sheet, not navigates to new route |
| Toggle status on settings page | Toggle status with Switch on campaign card | Click Switch in card action area with stopPropagation |

**Missing / Potential Bug:**

- `ENROLLMENT_STATUS_LABELS['frozen']` = `undefined` — enrollment list on detail page shows empty Badge for frozen enrollments (Phase 46 added frozen status but label constant was not updated).
- `getCampaignEnrollmentCounts()` returns `frozen` count but the detail page only renders Active/Completed/Stopped stat cards — frozen enrollments disappear from stats UI after pause.

---

## Open Questions

1. **AUDIT_ enrollments from Phase 62**
   - What we know: Phase 63 depends on Phase 62 creating 3 AUDIT_ jobs with HVAC enrollments.
   - What's unclear: Whether Phase 62 was actually completed and those enrollments exist in DB.
   - Recommendation: First step in the CAMP-08 test is to query the DB for AUDIT_ enrollments. If none exist, stop and note that Phase 62 prerequisites must be met first.

2. **System template existence for CAMP-07**
   - What we know: The code falls back to `is_default=true` system templates for preview when `template_id=null`.
   - What's unclear: Whether the 16 system templates were seeded in the test DB.
   - Recommendation: Before testing CAMP-07, query `SELECT COUNT(*) FROM message_templates WHERE is_default=true`. If 0, the preview modal will show "No template preview available" — which is still valid behavior but should be noted.

3. **CAMP-09 conflict state visibility**
   - What we know: Conflict states (`conflict`, `queue_after`, `skipped`) render in the dashboard Ready-to-Send queue. The AUDIT_ jobs from Phase 62 have enrolled normally (no conflict). To test CAMP-09, a job with `enrollment_resolution='conflict'` must exist.
   - What's unclear: Whether Phase 62 created any conflict-state jobs, or whether one needs to be created during Phase 63.
   - Recommendation: Before testing CAMP-09, query the jobs table for `enrollment_resolution IS NOT NULL`. If none exist, create a scenario: mark one AUDIT_ customer with a second HVAC job while their first enrollment is still active — this will trigger the conflict detection and set `enrollment_resolution='conflict'`.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads:
  - `app/(dashboard)/campaigns/page.tsx`
  - `app/(dashboard)/campaigns/campaigns-shell.tsx`
  - `app/(dashboard)/campaigns/[id]/page.tsx`
  - `app/(dashboard)/campaigns/[id]/campaign-detail-shell.tsx`
  - `components/campaigns/campaign-list.tsx`
  - `components/campaigns/campaign-card.tsx`
  - `components/campaigns/campaign-form.tsx`
  - `components/campaigns/touch-sequence-editor.tsx`
  - `components/campaigns/touch-sequence-display.tsx`
  - `components/campaigns/campaign-stats.tsx`
  - `components/campaigns/create-campaign-dialog.tsx`
  - `components/campaigns/delete-campaign-dialog.tsx`
  - `components/campaigns/preset-picker.tsx`
  - `components/campaigns/template-preview-modal.tsx`
  - `components/dashboard/ready-to-send-queue.tsx`
  - `lib/actions/campaign.ts`
  - `lib/actions/enrollment.ts`
  - `lib/actions/conflict-resolution.ts`
  - `lib/data/campaign.ts`
  - `lib/constants/campaigns.ts`
  - `lib/types/dashboard.ts`
- Prior phase research: `.planning/phases/62-jobs/62-RESEARCH.md` — test account data state

---

## Metadata

**Confidence breakdown:**
- Campaign UI surface (list, detail, card, edit sheet): HIGH — all components read directly
- Pause/resume freeze behavior: HIGH — action code read directly; frozen label gap confirmed in constants
- Preset picker matching logic: HIGH — string-match algorithm confirmed in create-campaign-dialog.tsx
- Template preview fallback: HIGH — resolveTemplate function confirmed in both display and editor
- Analytics calculation: HIGH — getCampaignAnalytics implementation confirmed
- DB state of AUDIT_ enrollments: MEDIUM — depends on Phase 62 completion (not yet confirmed for this phase)
- CAMP-09 conflict state availability: MEDIUM — need to query DB or create conflict during test

**Research date:** 2026-02-27
**Valid until:** Until codebase changes to campaigns components or actions
