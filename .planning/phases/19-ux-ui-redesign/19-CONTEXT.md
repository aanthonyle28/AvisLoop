# Phase 19: UX/UI Redesign — Send-First Dashboard - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the app's core IA and UI: the dashboard becomes a Send-first home page with Quick Send / Bulk Send tabs, the onboarding checklist is rebuilt as a collapsible setup progress component, navigation is simplified to 3 pages + account menu, loading states are modernized, toasts become actionable, and the Requests page gains resend/detail actions. This phase covers all layout, component, and interaction changes for desktop and mobile.

**Not in scope:** New backend features, new API endpoints beyond what's needed for the UI, billing logic changes, or marketing/landing page changes.

</domain>

<decisions>
## Implementation Decisions

### Send Page Layout & Tabs

**Quick Send tab:**
- Preset bar at top: Template dropdown + Schedule presets (inline fields, not drawer)
- Schedule presets trimmed to 3 + custom: Immediately, In 1 hour, Morning (9AM), Custom Date
- Template + schedule selections persist across sessions (localStorage or DB per user)
- After send: clear contact/name fields, keep template + schedule presets
- Recipient entry: email field with search + inline existing-contact detection
  - If email matches existing contact: auto-fill name (editable, but does NOT update stored contact)
  - If not found: user enters name, contact auto-created on send (no separate "Add contact" step)
- Contact chips below email field labeled "Added Today" (recently added contacts, not recently sent)
- Preview section: compact preview (2-3 lines visible by default), click to expand full preview
- Template change updates preview in real-time
- After successful send: toast with "View details" link (does NOT auto-open drawer)

**Bulk Send tab:**
- Reuses existing contacts table component with checkboxes + send-focused filter chips added
- Filter chips above table: Never sent, Added today, Sent > X days, Issues
- Sticky bottom action bar slides up when contacts selected (Gmail-style)
  - Bar content: "X selected" + Send request (primary) + Clear selection + More
  - Stays visible while scrolling
- Supports "Send to selected (X)" and "Send to all filtered (Y)"
  - "Send to all filtered" shows total matching filter count
  - Single confirmation dialog: shows total, eligible count, skipped count, template/schedule summary + Send button
- Template + schedule inline in the flow (shared Send Settings module as inline fields)

**Shared elements (both tabs):**
- Compact status strip at top: Monthly Usage, Review Rate, Needs Attention
  - Needs Attention card: clickable → links to filtered Requests page
  - Monthly Usage: informational by default; shows "Manage plan" / "Upgrade" link at 80-90% usage; blocking state at limit
  - Review Rate: informational only
- Recent Activity strip below stat cards
  - Quick Send tab: individual items ("John · Delivered · 2m")
  - Bulk Send tab: batch summaries ("24 delivered · 2m ago")
  - Clicking an item opens Request detail drawer (on Send page, no navigation)
  - "View all" links to Requests page

### Onboarding Checklist UX

**Collapsed state:**
- Top-right pill/chip in header area: "Complete Setup: X/Y >" (matches mockup)
- Click expands to side drawer (slides from right)

**Checklist steps (core — required for "Setup complete"):**
1. Add first contact — CTA opens inline add contact drawer
2. Review link set — auto-completes if already entered during onboarding wizard
3. Choose a message (or accept default) — CTA opens template picker
4. Send your first request — substep: optional "Preview & test your message"
   - Test modal with 2 options: "Send real email to me" (primary, free test-to-self doesn't consume credits, limit once/day) + "Preview without sending" (secondary)
   - Step completes as either "Test email sent" or "Previewed"
   - Step also completes if user sends any real request (test is not a hard requirement)

**Bonus step (conditional, shown after core complete):**
- "Try Bulk Send" — only shown if user has 3+ contacts, imported CSV, or sent 3+ individual requests
- Not required for "Setup complete" status

**Missing review link behavior:**
- Send button becomes disabled with inline text: "Add review link to enable sending" + CTA to add link

**Completion behavior:**
- Phase A (immediate): small chip near Send header "Setup complete ✓" with "×" to dismiss, click reopens checklist
- Phase B (after dismiss or ~7 days/10 sends): remove chip from Send page, move "Setup checklist" to Help menu and Settings → Business Profile

### Navigation & Loading

**Desktop sidebar:**
- Fixed position (full viewport height, content scrolls independently)
- 3 main nav items: Send, Contacts, Requests
- Account button at bottom opens popover dropdown (Claude account menu style, anchored to bottom of sidebar)
  - Menu items: Apps/Integrations, Settings, Billing, Help & Support, Logout

**Mobile:**
- 3-item bottom nav: Send, Contacts, Requests
- Avatar/account button in top-right of page header, opens same account menu

**Loading states (replacing current skeletons):**
- Thin progress bar at top of page (YouTube/GitHub style) for page transitions
- Subtle pulse skeletons with softer colors and smoother animation for content areas
- Both approaches combined: progress bar for navigation, pulse skeletons for content loading

### Toasts, History Actions & Drawers

**Actionable toasts:**
- Send success: toast with "View details" link → opens Request detail drawer
- Delete/archive actions: toast with "Undo" button + auto-dismiss timer
- Both View details and Undo supported depending on action context

**Requests page (sent/scheduled history):**
- Resend: both inline row action + full controls in drawer
  - Row: small icon/button appears on hover (or kebab menu), tooltip "Resend"
  - Only shown when resend is allowed (not unsubscribed, not in cooldown)
  - Disabled state with tooltip: "Available in 12 days" or "Contact opted out"
  - Drawer: full Resend with options (change template, schedule, see context)
- Delete/Cancel: only for scheduled/pending sends. Sent history is permanent.

**Request detail drawer content:**
- Recipient info (name, email)
- Template used
- Sent time
- Current status with delivery events timeline
- Full email preview as sent (what recipient saw)
- Action buttons: Resend (with template/schedule options), Copy link, Mark as reviewed

### Claude's Discretion
- Exact animation timings and easing curves
- Skeleton pulse color values and animation speed
- Progress bar color and thickness
- Drawer width and transition timing
- Toast auto-dismiss duration (suggest 5-8 seconds for action toasts)
- Exact filter chip set for Bulk Send table
- How to persist last-used template/schedule (localStorage vs DB — localStorage likely sufficient)
- Popover positioning logic for Account menu

</decisions>

<specifics>
## Specific Ideas

- Account menu styled like Claude's account menu — popover anchored to bottom of sidebar
- Sticky bottom action bar for Bulk Send inspired by Gmail's selection bar
- "Added Today" label for contact chips (not "Recently Added")
- Monthly Usage card: smart CTA based on usage level (normal → nothing, 80-90% → "Manage plan", limit → blocking)
- Test-to-self sends are free (don't consume credits), limited to once/day per user
- Bulk bonus step is contextual — only appears when relevant (3+ contacts, CSV import, or 3+ individual sends)
- "Setup complete" chip has two lifecycle phases: visible with dismiss → removed and moved to settings/help
- Tab-aware Recent Activity: individual sends on Quick Send tab, batch summaries on Bulk Send tab

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-ux-ui-redesign*
*Context gathered: 2026-02-01*
