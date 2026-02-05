# Phase 23: Onboarding & Setup Polish - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Streamline the new-user onboarding experience: grant a silent bonus credit at signup, simplify the setup checklist (4 steps, no template creation), celebrate completion with a subtle transition, and provide a functional Help & Support submenu with checklist restart, feedback, and support access. No new onboarding capabilities or additional setup steps beyond what's defined.

</domain>

<decisions>
## Implementation Decisions

### Bonus credit mechanics
- Grant +1 bonus send credit at signup (immediately, not after checklist completion)
- Credit is a one-time grant that persists through plan changes — if used, it's gone; plan upgrades/downgrades don't re-grant
- UI shows standard plan quota number (bonus credit is not reflected in displayed quota)
- Subtle acknowledgment via Sonner toast notification: "You have 1 bonus send to get started!" — shown after onboarding begins or on first dashboard visit
- Backend-only tracking; no special UI badge or send page indicator

### Checklist simplification
- 4 steps: Set up your profile → Choose a template → Add a contact → Send your first request
- "Create template" step removed; replaced with "Choose a template" (selecting an existing template from the send page dropdown)
- Template step completes when user selects a template from the dropdown on the send page
- Step labels are action-oriented ("Set up your profile", "Choose a template", "Add a contact", "Send your first request")
- Keep current step ordering behavior (don't change existing sequential/unlocking logic)

### Completion celebration
- Subtle transition: checklist items fade to completed state, area transitions to a completed chip/banner: "Setup complete" with small subtext "You're ready to send."
- No confetti or heavy animation — clean, professional tone
- Clicking the completed chip/banner reopens the setup drawer
- Drawer when reopened after completion shows: header "Setup checklist (Completed)" with two actions: "Restart setup" (secondary, with confirmation dialog) and "Hide from home" (primary)
- "Hide from home" collapses the space — page content shifts up, toast confirms: "Setup checklist hidden. You can reopen it from Account → Help."
- Restart requires confirmation dialog: "Are you sure? This will reset your checklist progress." with Cancel/Restart buttons
- Restart shows previously completed steps as pre-completed (if underlying data still exists, e.g. profile exists → step shows done)

### Help & Support menu
- Nested submenu within the account dropdown (hover/click to expand)
- Three items in v1:
  1. **Setup checklist** — Reopens the setup drawer / restarts checklist
  2. **Send feedback** — Links to external form (Tally/Typeform/Google Form) for structured feedback
  3. **Contact support** — mailto: link pre-filled with context (subject, user ID, org ID, page name, browser, timestamp)
- Feedback form fields (external): "What were you trying to do?", "What happened?", "What should happen instead?", optional screenshot upload, optional email (prefilled) + "OK to contact me" checkbox
- Contact support mailto auto-includes metadata in the email body (org ID, user ID, current page, browser, timestamp)

### Claude's Discretion
- Checklist item visibility in Help & Support menu (whether to show "Setup checklist" when checklist is still active on dashboard vs only after hiding)
- Exact toast timing and placement for bonus credit notification
- Feedback form provider choice (Tally vs Typeform vs Google Form)
- mailto: template formatting for contact support metadata
- Transition animation timing for completion state change

</decisions>

<specifics>
## Specific Ideas

- Completed chip on send page should say "Setup complete" with a checkmark — clicking reopens drawer
- Toast when hiding checklist: "Setup checklist hidden. You can reopen it from Account → Help."
- Restart should show steps as pre-completed if the underlying data still exists (smart detection, not fresh start)
- Help & Support as nested submenu matches the existing account dropdown pattern

</specifics>

<deferred>
## Deferred Ideas

- In-app feedback form (currently using external form service) — future enhancement
- In-app support chat/ticketing — future phase
- Settings → Business Profile "Run setup checklist" shortcut — nice-to-have, not in scope

</deferred>

---

*Phase: 23-onboarding-setup-polish*
*Context gathered: 2026-02-02*
