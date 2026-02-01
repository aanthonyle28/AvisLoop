# Phase 21: Email Preview & Template Selection - Research

**Researched:** 2026-02-01
**Domain:** React UI patterns, Radix UI Dialog, Next.js navigation, email preview rendering
**Confidence:** HIGH

## Summary

Phase 21 introduces an improved email preview experience and template selection flow. The research focused on three key areas: (1) creating a compact preview snippet that's always visible, (2) implementing a full-preview modal with rendered email content, and (3) adding navigation options to the template dropdown.

The codebase already has most primitives in place: Radix UI Dialog component for modals, MessagePreview component for basic previews, SendSettingsBar with template dropdown, and React Email components for email rendering. The phase will enhance these existing patterns rather than introducing new dependencies.

**Primary recommendation:** Refactor MessagePreview to support two distinct modes (compact snippet vs. full modal), add a "Create Template" option to the template dropdown with router.push navigation, and render the full email preview using the existing React Email template structure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | ^1.1.15 | Modal/dialog primitives | Already integrated, accessible, composable Dialog API with controlled state |
| next/navigation | latest | Client-side routing | Next.js App Router standard for programmatic navigation |
| @react-email/components | ^1.0.6 | Email template rendering | Already used for actual email sending, ensures preview matches sent email |
| CSS line-clamp | Native | Multi-line text truncation | Modern CSS standard, supported in all major browsers except IE |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind utility classes | ^3.4.1 | Styling dialog and preview | For consistent theme-aware styling (dark mode, borders, colors) |
| lucide-react | ^0.511.0 | Icons (expand, eye, etc.) | If visual indicators needed for preview actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Dialog | Native `<dialog>` | Radix provides better accessibility, animations, and focus management out of the box |
| CSS line-clamp | JavaScript truncation | CSS is more performant and simpler; JS only needed if dynamic "show more" toggle required |
| Inline preview mode toggle | Separate components | Single component with mode props is more maintainable and allows state sharing |

**Installation:**
No new dependencies required. All libraries already in package.json.

## Architecture Patterns

### Recommended Component Structure
```
components/send/
├── message-preview.tsx          # Refactored: compact + modal mode
├── email-preview-modal.tsx      # NEW: Full email preview in dialog
├── send-settings-bar.tsx        # Enhanced: add "Create Template" option
└── quick-send-tab.tsx           # Calls MessagePreview with compact mode
```

### Pattern 1: Compact Preview Snippet (Always Visible)
**What:** A persistent preview section below the compose area showing subject line (1 line), body snippet (2-3 lines clamped), and a "View full email" link.
**When to use:** Default state for the send page to give users confidence about what will be sent without requiring interaction.
**Example:**
```tsx
// Source: Codebase current implementation (message-preview.tsx) + MDN line-clamp
<div className="rounded-lg border bg-card p-4">
  <div className="text-xs text-muted-foreground mb-2">Email Preview</div>

  {/* Subject - single line */}
  <div className="font-semibold text-sm mb-2 truncate">
    {resolvedSubject}
  </div>

  {/* Body - 2-3 lines clamped */}
  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
    {resolvedBody}
  </p>

  {/* View full link */}
  <button
    type="button"
    onClick={() => setShowFullPreview(true)}
    className="text-sm text-primary hover:underline"
  >
    View full email
  </button>
</div>
```

**CSS for line-clamp:**
```css
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```

### Pattern 2: Full Email Preview Modal
**What:** A Radix Dialog displaying the complete rendered email with subject, resolved body with variables replaced, CTA button, and footer.
**When to use:** When user clicks "View full email" from the compact preview.
**Example:**
```tsx
// Source: Radix UI docs + codebase bulk-send-confirm-dialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function EmailPreviewModal({
  open,
  onOpenChange,
  contact,
  business,
  template
}) {
  const resolvedSubject = template.subject.replace(/{{CUSTOMER_NAME}}/g, contact.name)
  const resolvedBody = template.body
    .replace(/{{CUSTOMER_NAME}}/g, contact.name)
    .replace(/{{BUSINESS_NAME}}/g, business.name)
    .replace(/{{SENDER_NAME}}/g, business.default_sender_name || business.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        {/* From/To header */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>From: {business.default_sender_name || business.name}</div>
          <div>To: {contact.email}</div>
        </div>

        {/* Subject */}
        <div className="font-semibold text-lg">{resolvedSubject}</div>

        {/* Email body styled like actual email */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <div className="bg-card p-6 rounded shadow-sm max-w-lg mx-auto">
            <h2 className="text-xl font-semibold mb-4">Hi {contact.name},</h2>

            <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
              {resolvedBody}
            </p>

            {/* Rendered CTA button */}
            <div className="text-center mb-6">
              <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
                Leave a Review
              </span>
            </div>

            <hr className="my-6 border-border" />

            <p className="text-sm text-muted-foreground">
              Thanks so much,<br />
              {business.default_sender_name || business.name}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: Template Dropdown with Navigation
**What:** Enhanced template `<select>` dropdown that includes template options plus a "Create Template" option that navigates to settings page.
**When to use:** On send page (both quick-send and bulk-send tabs) to allow in-flow template creation.
**Example:**
```tsx
// Source: Next.js docs + codebase send-settings-bar.tsx
'use client'

import { useRouter } from 'next/navigation'

export function SendSettingsBar({ templates, ... }) {
  const router = useRouter()

  const handleTemplateChange = (value: string) => {
    if (value === 'create-new') {
      // Navigate to settings page template section
      router.push('/dashboard/settings#templates')
      return
    }

    // Normal template selection
    localStorage.setItem('avisloop_lastTemplate', value)
    onTemplateChange(value)
  }

  return (
    <select
      value={selectedTemplateId}
      onChange={(e) => handleTemplateChange(e.target.value)}
      className="..."
    >
      {templates.map(template => (
        <option key={template.id} value={template.id}>
          {template.name} {template.is_default ? '(Default)' : ''}
        </option>
      ))}

      {/* Separator + Create option */}
      <option disabled>──────────</option>
      <option value="create-new">+ Create Template</option>
    </select>
  )
}
```

### Pattern 4: Variable Replacement in Templates
**What:** Replace `{{CUSTOMER_NAME}}`, `{{BUSINESS_NAME}}`, `{{SENDER_NAME}}` placeholders with actual values for preview.
**When to use:** Before rendering any preview (compact or full).
**Example:**
```tsx
// Pattern already exists in codebase (send.ts uses it implicitly via React Email template)
function resolveTemplate(template: string, variables: {
  customerName: string
  businessName: string
  senderName: string
}): string {
  return template
    .replace(/{{CUSTOMER_NAME}}/g, variables.customerName)
    .replace(/{{BUSINESS_NAME}}/g, variables.businessName)
    .replace(/{{SENDER_NAME}}/g, variables.senderName)
}
```

### Anti-Patterns to Avoid
- **Removing compact preview in favor of modal only:** Users should see preview without interaction for confidence
- **Not resolving variables in preview:** Preview must match actual email; showing `{{CUSTOMER_NAME}}` confuses users
- **Opening new tab for template creation:** In-app navigation with router.push maintains context and is faster
- **Using JavaScript for line-clamp:** CSS line-clamp is simpler, more performant, and sufficient for this use case
- **Separate preview components for quick/bulk send:** Reuse same MessagePreview component with different modes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal/dialog management | Custom modal with z-index/portal logic | Radix UI Dialog (already integrated) | Handles focus trap, ESC key, click-outside, ARIA, animations |
| Text truncation | JavaScript-based character counting | CSS `line-clamp` | Native, performant, responsive, no JS needed |
| Email variable replacement | Complex template engine | Simple string `.replace()` | Only 4 variables, regex sufficient |
| Client-side navigation | `window.location.href` or `<a>` tags | Next.js `useRouter().push()` | Preserves client-side routing, faster, better UX |

**Key insight:** The primitives (Dialog, router, CSS utilities) handle the complexity. The implementation is mostly composition and configuration of existing patterns.

## Common Pitfalls

### Pitfall 1: Preview Doesn't Match Sent Email
**What goes wrong:** Preview shows different formatting, spacing, or content than the actual sent email.
**Why it happens:** Preview uses different template or variable resolution logic than the send action.
**How to avoid:** Use the same variable replacement logic in preview and send actions; reference the actual React Email template structure.
**Warning signs:** User reports "email looked different than preview" or test sends don't match what was shown.

### Pitfall 2: Modal State Management Issues
**What goes wrong:** Modal doesn't open, can't close, or causes render errors.
**Why it happens:** Not using controlled `open`/`onOpenChange` props correctly with Radix Dialog.
**How to avoid:** Always use controlled state pattern with `useState` for modal open state.
**Warning signs:** Console warnings about uncontrolled components, modal not responding to clicks.

### Pitfall 3: Dropdown Navigation Breaks State
**What goes wrong:** User selects "Create Template" and loses form state when navigating away.
**Why it happens:** Navigation clears client-side form state without warning.
**How to avoid:** Either (a) accept this behavior as intentional (user is leaving to create template) or (b) use localStorage to persist draft if needed.
**Warning signs:** User complaints about losing work when clicking "Create Template."

### Pitfall 4: Line-Clamp Not Working
**What goes wrong:** Text doesn't truncate or ellipsis doesn't appear.
**Why it happens:** Missing required CSS properties (display, overflow, box-orient) or conflicting styles.
**How to avoid:** Use complete line-clamp CSS pattern: `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: N; overflow: hidden;`
**Warning signs:** Text overflows container or shows all lines instead of clamping.

### Pitfall 5: Missing Contact Data in Preview
**What goes wrong:** Preview shows undefined or "{{CUSTOMER_NAME}}" when no contact selected.
**Why it happens:** Component doesn't handle null/empty contact state.
**How to avoid:** Add placeholder logic when contact is null: show generic preview or "Select a contact to preview" message.
**Warning signs:** Console errors about undefined properties, broken preview UI.

## Code Examples

Verified patterns from codebase and official sources:

### Example 1: Radix Dialog with Controlled State
```tsx
// Source: Radix UI docs + codebase bulk-send-confirm-dialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function EmailPreviewModal({ contact, business, template }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>
        View full email
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {/* Preview content */}
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Example 2: CSS Line-Clamp for Multi-Line Truncation
```tsx
// Source: MDN line-clamp docs
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp

// Tailwind config or CSS:
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

// Usage in component:
<p className="line-clamp-3 text-sm text-muted-foreground">
  {longEmailBody}
</p>
```

### Example 3: Next.js Router Navigation from Select
```tsx
// Source: Next.js docs + Sling Academy guide
// https://www.slingacademy.com/article/how-to-programmatically-navigate-in-next-js/
'use client'

import { useRouter } from 'next/navigation'

export function TemplateDropdown({ templates, selectedId, onChange }) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value

    if (value === 'create-new') {
      router.push('/dashboard/settings#templates')
      return
    }

    onChange(value)
  }

  return (
    <select value={selectedId} onChange={handleChange}>
      {templates.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
      <option disabled>──────────</option>
      <option value="create-new">+ Create Template</option>
    </select>
  )
}
```

### Example 4: Variable Replacement for Email Preview
```tsx
// Pattern from codebase lib/email/templates/review-request.tsx
interface TemplateVariables {
  customerName: string
  businessName: string
  senderName: string
}

function resolveEmailContent(
  template: EmailTemplate,
  contact: Contact,
  business: Business
): { subject: string; body: string } {
  const variables: TemplateVariables = {
    customerName: contact.name,
    businessName: business.name,
    senderName: business.default_sender_name || business.name,
  }

  const subject = template.subject
    .replace(/{{CUSTOMER_NAME}}/g, variables.customerName)
    .replace(/{{BUSINESS_NAME}}/g, variables.businessName)
    .replace(/{{SENDER_NAME}}/g, variables.senderName)

  const body = template.body
    .replace(/{{CUSTOMER_NAME}}/g, variables.customerName)
    .replace(/{{BUSINESS_NAME}}/g, variables.businessName)
    .replace(/{{SENDER_NAME}}/g, variables.senderName)
    // Note: REVIEW_LINK is handled separately as it's not shown in text preview

  return { subject, body }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expand/collapse preview toggle | Compact preview + modal | Phase 21 (2026-02) | Clearer UX: always-visible confidence snippet vs. detailed full view |
| Template selection only | Template selection + create shortcut | Phase 21 (2026-02) | Reduces friction: users can create templates in-flow |
| Basic preview with expand | Styled email preview matching sent format | Phase 21 (2026-02) | Higher confidence: preview looks like actual email |

**Deprecated/outdated:**
- None - all patterns are current best practices as of 2026

## Open Questions

1. **Should compact preview be collapsible?**
   - What we know: Requirements say "visible without scrolling or expanding" (PREV-01)
   - What's unclear: If users want to hide it for more screen space
   - Recommendation: Keep always-visible as specified; can add collapse option in future if users request it

2. **How to handle long template body text in compact preview?**
   - What we know: PREV-01 specifies "2-3 lines clamped"
   - What's unclear: Whether to show full paragraphs or just first lines
   - Recommendation: Use CSS line-clamp-3 on the body text; simple and meets requirement

3. **Should "Create Template" navigation preserve current form state?**
   - What we know: User might lose current email draft if navigating away
   - What's unclear: Whether this is acceptable UX or needs mitigation
   - Recommendation: Accept navigation as-is for MVP; user is explicitly choosing to create template

## Sources

### Primary (HIGH confidence)
- `/radix-ui/website` (Context7) - Dialog component API and controlled state patterns
- Codebase `components/ui/dialog.tsx` - Current Radix Dialog implementation
- Codebase `components/send/message-preview.tsx` - Current preview implementation
- Codebase `lib/email/templates/review-request.tsx` - Email rendering structure
- Codebase `components/send/send-settings-bar.tsx` - Template dropdown implementation
- [MDN line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp) - CSS truncation property
- [Next.js Routing docs](https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating) - Official navigation patterns

### Secondary (MEDIUM confidence)
- [Sling Academy Next.js navigation guide](https://www.slingacademy.com/article/how-to-programmatically-navigate-in-next-js/) - Programmatic routing examples
- [React Email docs](https://react.email/docs/components/preview) - Email component rendering patterns
- [CSS-Tricks line-clamp](https://css-tricks.com/line-clampin/) - Multi-line truncation techniques

### Tertiary (LOW confidence)
- None - all key findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already integrated in codebase
- Architecture: HIGH - Patterns verified in existing code and official docs
- Pitfalls: MEDIUM - Based on common React/Next.js issues and codebase review

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - patterns are stable)
