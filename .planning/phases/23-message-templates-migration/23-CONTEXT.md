# Phase 23: Message Templates & Migration - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Email and SMS messages use unified message_templates table with channel selector, replacing old email_templates. Users can create templates for either channel, default templates exist per service type per channel, and existing email_templates migrate cleanly. Campaign touch configuration references message_templates.

</domain>

<decisions>
## Implementation Decisions

### Template creation UX
- Tab-based channel selector (Email | SMS tabs) at top of template form
- Switching tabs shows channel-specific form fields
- SMS templates show live character counter with soft warnings (yellow at 140+, red at 160+, but allow save)
- SMS opt-out footer ("Reply STOP to opt out") visible in form but read-only — user knows it's there, can't edit
- Email templates use separate subject + body textarea fields (matches current pattern)

### Default templates
- Pre-written default templates with real copy, ready to use immediately
- Both email AND SMS defaults for each of the 8 service types (16 total system templates)
- System templates are read-only — "Use this template" creates an editable copy for the business
- Tone: Claude's discretion — appropriate friendly-professional tone per service type

### Migration strategy
- In-place migration: ALTER TABLE email_templates RENAME TO message_templates, then add channel column
- Create backup table (email_templates_backup) before rename for rollback safety
- Migrated templates get explicit channel = 'email' value
- Update all TypeScript types, actions, and components in Phase 23 — clean break, no compatibility layer

### Template preview
- Email preview shows subject line + body text + CTA button (full email rendering)
- SMS preview shows phone bubble mockup with body, character count, and opt-out footer
- Variable placeholders ({{business_name}}, {{customer_name}}) render with sample data in preview
- Live preview pane beside form — side-by-side layout, updates as user types

### Claude's Discretion
- Exact tone/wording for each of the 16 default templates
- Schema details for message_templates table (column names, constraints)
- UI layout specifics for tab styling
- Sample data values for placeholder preview (e.g., "John Smith", "ACME Plumbing")

</decisions>

<specifics>
## Specific Ideas

- Tab pattern should match existing Send page tabs (Quick Send | Bulk Send)
- Phone bubble mockup for SMS preview — visual representation of how it'll look on customer's phone
- "Use this template" flow for system templates creates a copy owned by the business
- Character counter should account for opt-out footer length in the limit

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-message-templates-migration*
*Context gathered: 2026-02-03*
