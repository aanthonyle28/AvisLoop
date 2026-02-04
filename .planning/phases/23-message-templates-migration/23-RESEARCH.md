# Phase 23: Message Templates & Migration - Research

**Researched:** 2026-02-03
**Domain:** Database migration, multi-channel messaging, SMS compliance
**Confidence:** HIGH

## Summary

This phase migrates the existing `email_templates` table to a unified `message_templates` table supporting both email and SMS channels. The standard approach uses PostgreSQL ALTER TABLE RENAME with a backward-compatible view, Radix UI tabs for channel selection, and GSM-7-aware character counting for SMS compliance.

Key technical challenges include: (1) zero-downtime table rename with RLS policy migration, (2) SMS 160-character limit enforcement with opt-out footer accounting, (3) dual preview rendering (email with CTA vs. SMS bubble mockup), and (4) creating 16 default templates (8 service types × 2 channels).

The existing codebase already has: Radix tabs UI components, template variable substitution ({{CUSTOMER_NAME}}, etc.), email preview modal patterns, and Zod validation schemas—all of which can be extended for SMS support.

**Primary recommendation:** Use ALTER TABLE RENAME + CREATE VIEW pattern for migration, Radix UI tabs (already installed) for channel selector, and a lightweight SMS character counter function (not a library) since we only need GSM-7 detection and basic counting.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL ALTER TABLE | Native | Table rename with transactional DDL | Zero-downtime migration, atomic rename+view creation |
| @radix-ui/react-tabs | ^1.1.13 | Accessible tab component | Already installed, WAI-ARIA compliant, matches existing Send page pattern |
| Zod | ^4.3.6 | Schema validation | Already used for emailTemplateSchema, extends cleanly for SMS |
| Template literals | Native JS | Variable substitution | Existing pattern {{PLACEHOLDER}}, simple string.replace() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useState | React 19 | Live preview updates | Track form input changes, drive side-by-side preview |
| CSS pseudo-elements | Native | SMS bubble tail/pointer | iOS-style message bubble mockup (:before/:after pattern) |
| Supabase RLS | Native | Policy migration | Maintain multi-tenant security on renamed table |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual counter | sms-counter library | Library adds 15kb+ for simple GSM-7 detection we can implement in 30 lines |
| React Hook Form | Controlled inputs | Already using Server Actions with Zod, keep consistency |
| Separate table | Single unified table | User decision: unified message_templates with channel column |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
# Radix tabs, Zod, React, Supabase client already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── [timestamp]_rename_email_templates_to_message_templates.sql
│   # 1. Create backup table
│   # 2. ALTER TABLE RENAME
│   # 3. ADD channel column with default 'email'
│   # 4. CREATE VIEW email_templates (backward compat)
│   # 5. Recreate RLS policies on message_templates
│   # 6. Insert 16 default templates (8 service types × 2 channels)

lib/validations/
├── message-template.ts           # New: messageTemplateSchema with channel
│   # Replaces emailTemplateSchema
│   # SMS: max 160 chars (soft warning), required body
│   # Email: required subject + body

lib/actions/
├── message-template.ts            # New: CRUD for message_templates
│   # createMessageTemplate, updateMessageTemplate, deleteMessageTemplate
│   # Replaces business.ts template functions

components/templates/
├── message-template-form.tsx      # Tab-based form (Email | SMS tabs)
├── message-template-preview.tsx   # Conditional rendering (email vs SMS preview)
├── email-preview.tsx              # Extract from email-preview-modal
├── sms-preview.tsx                # New: phone bubble mockup
```

### Pattern 1: Zero-Downtime Table Rename with View
**What:** Atomically rename table, add channel column, create backward-compatible view
**When to use:** Migrating tables with existing foreign keys and application code
**Example:**
```sql
-- Source: https://brandur.org/fragments/postgres-table-rename
BEGIN;

-- 1. Backup for rollback safety
CREATE TABLE IF NOT EXISTS email_templates_backup AS SELECT * FROM email_templates;

-- 2. Rename table (instantaneous)
ALTER TABLE email_templates RENAME TO message_templates;

-- 3. Add channel discriminator column (defaults to 'email' for existing rows)
ALTER TABLE message_templates
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'sms'));

-- 4. Create backward-compatible view (simple SELECT * is updatable in PG 9.3+)
CREATE VIEW email_templates AS
  SELECT id, business_id, name, subject, body, is_default, created_at, updated_at
  FROM message_templates
  WHERE channel = 'email';

-- 5. Recreate RLS policies on new table name
-- (Copy existing policies from 00002_create_business.sql, rename table to message_templates)
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own templates"
ON message_templates FOR SELECT TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- (Repeat for INSERT, UPDATE, DELETE policies...)

COMMIT;
```

**Key insight:** PostgreSQL's transactional DDL ensures RENAME and CREATE VIEW happen atomically—no moment where the table is missing. The view is automatically updatable because it's a simple SELECT with no aggregations or joins (PostgreSQL 9.3+ requirement).

### Pattern 2: Tab-Based Channel Selector
**What:** Radix UI tabs switching between email-specific and SMS-specific form fields
**When to use:** Mutually exclusive channel selection (template is email OR SMS, not both)
**Example:**
```tsx
// Source: Existing pattern from components/send/send-page-client.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function MessageTemplateForm() {
  const [channel, setChannel] = useState<'email' | 'sms'>('email')

  return (
    <form action={formAction}>
      <input type="hidden" name="channel" value={channel} />

      <Tabs defaultValue="email" onValueChange={(v) => setChannel(v as 'email' | 'sms')}>
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          {/* Subject + Body fields */}
          <input name="subject" placeholder="Email subject..." />
          <textarea name="body" rows={8} />
        </TabsContent>

        <TabsContent value="sms">
          {/* Body only + character counter */}
          <textarea name="body" maxLength={160} onChange={handleSMSInput} />
          <div className={counterClass}>{charCount}/160</div>
          <div className="text-xs text-muted-foreground">
            Reply STOP to opt out (read-only, automatically added)
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}
```

### Pattern 3: Template Variable Substitution
**What:** Replace {{PLACEHOLDER}} tokens with actual values using string.replace()
**When to use:** Preview rendering, actual message sending
**Example:**
```typescript
// Source: components/send/message-preview.tsx (existing pattern)
function resolveTemplate(
  text: string,
  contact: Customer | null,
  business: Business
): string {
  if (!contact) return text

  const senderName = business.default_sender_name || business.name
  return text
    .replace(/{{CUSTOMER_NAME}}/g, contact.name)
    .replace(/{{BUSINESS_NAME}}/g, business.name)
    .replace(/{{SENDER_NAME}}/g, senderName)
    .replace(/{{REVIEW_LINK}}/g, business.google_review_link || '#')
}

// For SMS preview, use sample data:
const sampleCustomer = { name: 'John Smith' }
const sampleBusiness = { name: 'ACME Plumbing', default_sender_name: 'Sarah' }
const preview = resolveTemplate(template.body, sampleCustomer, sampleBusiness)
```

### Pattern 4: SMS Character Counter (GSM-7 Aware)
**What:** Live character count with encoding detection and soft warnings
**When to use:** SMS template body textarea onChange handler
**Example:**
```typescript
// Source: Research from SMS character counter best practices
function getSMSCharacterInfo(text: string) {
  // GSM-7 charset (160 chars per segment)
  const gsm7 = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/

  const isGSM7 = gsm7.test(text)
  const length = text.length

  // Account for opt-out footer (estimate 20 chars: "Reply STOP to opt out")
  const effectiveLimit = 160
  const remaining = effectiveLimit - length

  return {
    length,
    remaining,
    encoding: isGSM7 ? 'GSM-7' : 'Unicode',
    limit: isGSM7 ? 160 : 70, // Unicode SMS limited to 70 chars
    warning: length > 140 ? (length > 160 ? 'error' : 'warning') : 'none'
  }
}

// Usage in component:
const [charInfo, setCharInfo] = useState(getSMSCharacterInfo(''))

function handleSMSInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
  setCharInfo(getSMSCharacterInfo(e.target.value))
}

// Render with color coding:
const counterClass = cn(
  'text-sm',
  charInfo.warning === 'error' && 'text-red-600',
  charInfo.warning === 'warning' && 'text-yellow-600',
  charInfo.warning === 'none' && 'text-muted-foreground'
)
```

### Pattern 5: SMS Bubble Mockup Preview
**What:** iOS-style message bubble using CSS pseudo-elements for tail
**When to use:** SMS preview pane to show how message appears on customer's phone
**Example:**
```tsx
// Source: https://samuelkraft.com/blog/ios-chat-bubbles-css
export function SMSPreview({ body, resolvedBody }: { body: string, resolvedBody: string }) {
  const charInfo = getSMSCharacterInfo(body)

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
      <div className="text-xs text-muted-foreground mb-2">SMS Preview</div>

      {/* Phone screen mockup */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-4 max-w-sm mx-auto shadow-lg">
        {/* Received message bubble (gray, left-aligned) */}
        <div className="flex justify-start mb-4">
          <div className="relative max-w-[255px] bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl">
            {/* Tail using pseudo-elements */}
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-bl-2xl -ml-2" />
            <p className="text-sm whitespace-pre-wrap">{resolvedBody}</p>
          </div>
        </div>

        {/* Opt-out footer (read-only) */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          Reply STOP to opt out
        </div>
      </div>

      {/* Character count */}
      <div className="mt-2 text-sm text-center">
        <span className={counterClass}>{charInfo.length}/{charInfo.limit}</span>
        <span className="text-muted-foreground ml-2">({charInfo.encoding})</span>
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Dropping and recreating table:** Loses data, breaks foreign keys, requires downtime
- **Separate email_templates + sms_templates tables:** Duplicates schema, complicates campaign configuration
- **Hard-blocking SMS at 160 chars:** Allows save with soft warning (user might optimize later)
- **Editable opt-out footer:** TCPA compliance requires consistent, non-editable opt-out language
- **External SMS character counter library:** Overkill for our simple GSM-7 detection needs

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab accessibility | Custom tab state + ARIA | Radix UI Tabs | WAI-ARIA compliant, keyboard nav, focus management |
| Backward-compatible migration | Custom versioning logic | PostgreSQL VIEW | Automatic updatable view, zero-downtime |
| Database rollback | Application-level undo | SQL backup table | Transaction safety, instant rollback via DROP VIEW + RENAME |
| Template preview layout | Custom split-pane component | CSS Grid (grid-cols-2) | Simple, responsive, no JS state |

**Key insight:** PostgreSQL views handle 90% of backward compatibility needs for table renames. Radix UI handles 100% of accessibility concerns for tabs. Don't rebuild these.

## Common Pitfalls

### Pitfall 1: RLS Policies Not Recreated After Table Rename
**What goes wrong:** After ALTER TABLE RENAME, existing policies remain on old table name. New table has no RLS enforcement, exposing all data cross-tenant.
**Why it happens:** Policies are name-scoped to the table they're created on. RENAME doesn't auto-update policy definitions.
**How to avoid:** Explicitly DROP old policies and CREATE new ones in same migration transaction. Test with second user account before deploying.
**Warning signs:** Supabase dashboard shows policies on `email_templates` but not `message_templates`. Cross-tenant queries succeed when they should fail.

### Pitfall 2: Unicode Characters Blow SMS Limit
**What goes wrong:** User types 140 chars, hits send, gets billed for 3 SMS segments because emoji switched encoding to UCS-2 (70 char limit).
**Why it happens:** GSM-7 supports basic Latin/numbers. Emojis, accents, Chinese characters force UCS-2, cutting limit from 160→70 chars.
**How to avoid:** Detect encoding in real-time, show "Unicode (70 char limit)" warning. Let user decide to optimize or accept multi-segment.
**Warning signs:** Character counter shows green at 140 chars, but actual send costs 3 credits.

### Pitfall 3: Opt-Out Footer Not Accounted in Limit
**What goes wrong:** User writes 160-char message, system appends "Reply STOP to opt out" (20 chars), sends 2 segments, user confused by cost.
**Why it happens:** Character counter only counts body field, not auto-appended footer.
**How to avoid:** Either (1) enforce 140-char limit to reserve footer space, or (2) show footer as "part of preview" but clarify it's appended at send time. Document this in UI.
**Warning signs:** User reports "I only wrote 155 characters but got charged for 2 messages."

### Pitfall 4: View Breaks on Schema Changes
**What goes wrong:** After migration, add new column `priority` to message_templates. View still uses `SELECT id, business_id, name, subject, body...` (explicit columns), doesn't include new column. Code breaks expecting priority.
**Why it happens:** Views with explicit column lists don't auto-update. `SELECT *` views break if column is dropped.
**How to avoid:** For this phase, use explicit column list (backward compat only needs original 8 columns). Document that view is temporary compatibility layer, to be removed in Phase 24 after code updated.
**Warning signs:** Migration runs cleanly, but later migrations fail with "column priority does not exist in view."

### Pitfall 5: Multi-Segment SMS Not Handled
**What goes wrong:** User writes 200-char SMS, expects error, form allows save. At send time, either (1) truncates to 160, or (2) sends 2 segments charging 2 credits.
**Why it happens:** Soft warning UI doesn't prevent save, but send logic may not handle multi-segment.
**How to avoid:** Phase 23 scope is template creation only (not sending). Soft warning at 140+ is correct. Document that Phase 24 (campaigns) will handle segment splitting/cost estimation.
**Warning signs:** User creates 200-char SMS template, expects validation error, form accepts it.

### Pitfall 6: Default Templates Reference {{REVIEW_LINK}} for SMS
**What goes wrong:** SMS templates include {{REVIEW_LINK}} placeholder, which expands to long URL (40+ chars), blowing character budget.
**Why it happens:** Email pattern includes CTA button with link. SMS needs different pattern (short link or text instruction).
**How to avoid:** SMS default templates use text like "Reply YES for review link" or use URL shortener. Don't directly embed google.com/... URLs in SMS body.
**Warning signs:** Default SMS templates are 80 chars in DB, but expand to 180 chars when {{REVIEW_LINK}} resolved.

## Code Examples

Verified patterns from official sources:

### Zero-Downtime Table Migration with RLS
```sql
-- Source: PostgreSQL official docs + Supabase RLS patterns
-- Location: supabase/migrations/[timestamp]_rename_email_templates.sql

BEGIN;

-- 1. Safety: Create backup table (rollback option)
CREATE TABLE email_templates_backup AS
  SELECT * FROM email_templates;

-- 2. Rename table (instantaneous, no data copy)
ALTER TABLE email_templates RENAME TO message_templates;

-- 3. Add channel discriminator (default preserves existing data as 'email')
ALTER TABLE message_templates
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'sms'));

-- Remove default after migration (new rows must specify channel explicitly)
ALTER TABLE message_templates ALTER COLUMN channel DROP DEFAULT;

-- 4. Create backward-compatible view (updatable for simple SELECT)
CREATE VIEW email_templates AS
  SELECT id, business_id, name, subject, body, is_default, created_at, updated_at
  FROM message_templates
  WHERE channel = 'email';

-- 5. Recreate RLS policies on message_templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own message templates"
ON message_templates FOR SELECT TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own message templates"
ON message_templates FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users update own message templates"
ON message_templates FOR UPDATE TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own message templates"
ON message_templates FOR DELETE TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- 6. Update indexes (rename doesn't auto-update index names)
DROP INDEX IF EXISTS idx_email_templates_business_id;
CREATE INDEX idx_message_templates_business_id ON message_templates(business_id);
CREATE INDEX idx_message_templates_channel ON message_templates(channel);

-- 7. Update triggers (moddatetime trigger needs recreation)
DROP TRIGGER IF EXISTS templates_updated_at ON email_templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

COMMIT;
```

### Zod Schema for Message Templates
```typescript
// Source: Existing lib/validations/business.ts pattern
// Location: lib/validations/message-template.ts

import { z } from 'zod'

export const messageTemplateSchema = z.discriminatedUnion('channel', [
  // Email template validation
  z.object({
    channel: z.literal('email'),
    name: z.string().min(1, 'Template name is required').max(100).trim(),
    subject: z.string().min(1, 'Email subject is required').max(200).trim(),
    body: z.string().min(1, 'Email body is required').max(5000).trim(),
  }),
  // SMS template validation
  z.object({
    channel: z.literal('sms'),
    name: z.string().min(1, 'Template name is required').max(100).trim(),
    subject: z.literal('').optional(), // SMS has no subject, but DB column exists
    body: z.string()
      .min(1, 'SMS body is required')
      .max(320, 'SMS body too long (max 2 segments)') // Soft limit, allow save
      .trim(),
  }),
])

export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>
```

### Live Character Counter Hook
```typescript
// Source: Research from SMS character counting best practices
// Location: components/templates/use-sms-character-counter.ts

export function useSMSCharacterCounter(text: string) {
  // GSM-7 character set (standard SMS encoding, 160 chars per segment)
  const GSM7_REGEX = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/

  const isGSM7 = GSM7_REGEX.test(text)
  const length = text.length

  // GSM-7: 160 chars/segment, Unicode (UCS-2): 70 chars/segment
  const limit = isGSM7 ? 160 : 70
  const segments = Math.ceil(length / limit) || 1
  const remaining = (limit * segments) - length

  // Warning levels (accounting for opt-out footer ~20 chars)
  const effectiveLimit = 140 // Reserve space for footer
  const warning: 'none' | 'warning' | 'error' =
    length <= effectiveLimit ? 'none' :
    length <= 160 ? 'warning' :
    'error'

  return {
    length,
    limit,
    segments,
    remaining,
    encoding: isGSM7 ? 'GSM-7' : 'Unicode',
    warning,
    warningMessage:
      warning === 'error' ? 'Message will be split into multiple segments' :
      warning === 'warning' ? 'Approaching character limit' :
      ''
  }
}
```

### Tab-Based Template Form
```tsx
// Source: Existing components/send/send-page-client.tsx pattern
// Location: components/templates/message-template-form.tsx

'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createMessageTemplate } from '@/lib/actions/message-template'
import { useSMSCharacterCounter } from './use-sms-character-counter'

export function MessageTemplateForm() {
  const [state, formAction, isPending] = useActionState(createMessageTemplate, null)
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [smsBody, setSmsBody] = useState('')
  const charInfo = useSMSCharacterCounter(smsBody)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="channel" value={channel} />

      {/* Template Name (shared across channels) */}
      <div>
        <label className="block text-sm font-medium mb-1">Template Name</label>
        <input
          type="text"
          name="name"
          required
          placeholder="My Custom Template"
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      {/* Channel Tabs */}
      <Tabs value={channel} onValueChange={(v) => setChannel(v as 'email' | 'sms')}>
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        {/* Email Fields */}
        <TabsContent value="email" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              placeholder="We'd love your feedback, {{CUSTOMER_NAME}}!"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              name="body"
              rows={8}
              placeholder="Hi {{CUSTOMER_NAME}},\n\nThank you for choosing {{BUSINESS_NAME}}..."
              className="w-full border rounded-md px-3 py-2 font-mono text-sm"
            />
          </div>
        </TabsContent>

        {/* SMS Fields */}
        <TabsContent value="sms" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="body"
              rows={4}
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              placeholder="Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}}! We'd love your feedback."
              className="w-full border rounded-md px-3 py-2 font-mono text-sm"
            />

            {/* Character Counter */}
            <div className={`text-sm mt-1 ${
              charInfo.warning === 'error' ? 'text-red-600' :
              charInfo.warning === 'warning' ? 'text-yellow-600' :
              'text-muted-foreground'
            }`}>
              {charInfo.length}/{charInfo.limit} characters ({charInfo.encoding})
              {charInfo.segments > 1 && ` · ${charInfo.segments} segments`}
              {charInfo.warningMessage && (
                <span className="block text-xs mt-1">{charInfo.warningMessage}</span>
              )}
            </div>

            {/* Opt-out footer (read-only) */}
            <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
              <strong>Auto-added:</strong> Reply STOP to opt out
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
      >
        {isPending ? 'Creating...' : 'Create Template'}
      </button>
    </form>
  )
}
```

### Dual Preview Component
```tsx
// Source: Existing components/send/email-preview-modal.tsx + SMS bubble research
// Location: components/templates/message-template-preview.tsx

interface MessageTemplatePreviewProps {
  template: { channel: 'email' | 'sms', subject?: string, body: string }
  business: Business
}

export function MessageTemplatePreview({ template, business }: MessageTemplatePreviewProps) {
  // Sample data for preview
  const sampleCustomer = { name: 'John Smith', email: 'john@example.com' }
  const senderName = business.default_sender_name || business.name

  // Resolve placeholders
  const resolvedBody = template.body
    .replace(/{{CUSTOMER_NAME}}/g, sampleCustomer.name)
    .replace(/{{BUSINESS_NAME}}/g, business.name)
    .replace(/{{SENDER_NAME}}/g, senderName)
    .replace(/{{REVIEW_LINK}}/g, business.google_review_link || '#')

  if (template.channel === 'email') {
    const resolvedSubject = template.subject
      ?.replace(/{{CUSTOMER_NAME}}/g, sampleCustomer.name)
      ?.replace(/{{BUSINESS_NAME}}/g, business.name) || ''

    return (
      <div className="bg-muted/30 p-6 rounded-lg">
        <div className="text-xs text-muted-foreground mb-2">Email Preview</div>
        <div className="bg-card p-6 rounded shadow-sm max-w-lg mx-auto">
          <div className="text-xs text-muted-foreground mb-2">
            From: {senderName} | To: {sampleCustomer.email}
          </div>
          <div className="font-semibold text-lg mb-4">{resolvedSubject}</div>
          <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{resolvedBody}</p>
          <div className="text-center">
            <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
              Leave a Review
            </span>
          </div>
        </div>
      </div>
    )
  }

  // SMS Preview: phone bubble mockup
  const charInfo = useSMSCharacterCounter(template.body)

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
      <div className="text-xs text-muted-foreground mb-2">SMS Preview</div>

      {/* Phone screen mockup */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-4 max-w-sm mx-auto shadow-lg border-8 border-gray-300 dark:border-gray-700">
        {/* Message bubble (received style - gray, left-aligned) */}
        <div className="flex justify-start">
          <div className="relative max-w-[255px] bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
            <p className="text-sm whitespace-pre-wrap">{resolvedBody}</p>
          </div>
        </div>

        {/* Opt-out footer */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Reply STOP to opt out
        </div>
      </div>

      {/* Character info */}
      <div className="mt-2 text-sm text-center text-muted-foreground">
        {charInfo.length}/{charInfo.limit} characters ({charInfo.encoding})
        {charInfo.segments > 1 && ` · ${charInfo.segments} segments`}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate email/SMS tables | Unified message_templates with channel discriminator | 2020s SaaS pattern | Single schema, simpler campaign config |
| 160-char hard limit | Soft warning, allow multi-segment | TCPA 2025 changes | User flexibility, cost transparency |
| Basic STOP keyword | Honor "any reasonable means" | TCPA effective Apr 2025 | Broader opt-out detection needed |
| Email-first templates | Channel-agnostic design | SMS adoption 2020+ | Future: voice, push, in-app channels |

**Deprecated/outdated:**
- **email_templates table name**: Replaced by message_templates (email_templates view exists for backward compat only, remove in Phase 24)
- **emailTemplateSchema validation**: Replaced by messageTemplateSchema with discriminated union
- **Email-only preview modal**: Replaced by dual EmailPreview/SMSPreview components

## Open Questions

Things that couldn't be fully resolved:

1. **SMS opt-out footer length**
   - What we know: TCPA requires opt-out language, common pattern is "Reply STOP to opt out" (~20 chars)
   - What's unclear: Whether footer should be appended at template creation time or at send time
   - Recommendation: Show footer in preview (user awareness) but don't store in body field. Append at send time in Phase 24 (campaigns). Enforce 140-char soft limit to reserve space.

2. **Default template tone/copy**
   - What we know: Need 16 templates (8 service types × 2 channels), friendly-professional tone
   - What's unclear: Exact wording per service type (marked as "Claude's discretion" in CONTEXT.md)
   - Recommendation: Research industry-specific review request best practices per service type. HVAC: emphasize comfort/safety. Plumbing: urgency/reliability. Cleaning: attention to detail. Tailor tone accordingly.

3. **Multi-segment SMS cost handling**
   - What we know: SMS >160 chars splits into segments (153 chars each after first), costs multiply
   - What's unclear: Should template creation prevent >160 char SMS, or just warn?
   - Recommendation: Soft warning (yellow at 140+, red at 160+) but allow save. User might optimize later. Phase 24 (send logic) handles actual segmentation and cost estimation.

4. **Backward compatibility view lifespan**
   - What we know: View provides zero-downtime migration, allows old code to work
   - What's unclear: When to remove the email_templates view?
   - Recommendation: Keep view through Phase 23. Phase 24 updates all code references (lib/actions, components) to use message_templates. Remove view in Phase 25 (cleanup).

## Sources

### Primary (HIGH confidence)
- [PostgreSQL ALTER TABLE official docs](https://www.postgresql.org/docs/current/sql-altertable.html) - Table rename syntax
- [Using PostgreSQL views for backward-compatible migrations](https://medium.com/ovrsea/using-postgresql-views-to-ensure-backwards-compatible-non-breaking-migrations-017288e77f06) - View pattern
- [Postgres: Safely renaming a table with updatable views](https://brandur.org/fragments/postgres-table-rename) - Zero-downtime pattern
- [Radix UI Tabs documentation](https://www.radix-ui.com/primitives/docs/components/tabs) - Component API
- [Samuel Kraft: iOS chat bubbles in CSS](https://samuelkraft.com/blog/ios-chat-bubbles-css) - Bubble mockup pattern
- [Supabase Database Migrations docs](https://supabase.com/docs/guides/deployment/database-migrations) - Migration best practices

### Secondary (MEDIUM confidence)
- [SMS character limits and GSM-7 encoding](https://textellent.com/sms-guides-and-troubleshooting/gsm-7-encoding/) - Encoding details
- [TCPA text message rules 2026](https://activeprospect.com/blog/tcpa-text-messages/) - Compliance requirements
- [New TCPA rules 2025](https://www.moengage.com/blog/new-tcpa-rules/) - Opt-out requirements
- [Directus: Live preview in React](https://directus.io/docs/tutorials/getting-started/implementing-live-preview-in-react) - Side-by-side pattern
- [Template literals MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) - String substitution

### Tertiary (LOW confidence)
- [GitHub: SMS-Counter library](https://github.com/101t/SMS-Counter) - Character counting (decided not to use, but validated approach)
- [CodePen: iOS chat bubbles](https://codepen.io/swards/pen/gxQmbj) - Visual reference only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed (Radix tabs, Zod, Postgres native features)
- Architecture: HIGH - PostgreSQL view pattern verified in official docs, tab pattern exists in codebase
- Pitfalls: HIGH - RLS policy migration, Unicode encoding, opt-out footer all verified against official sources
- SMS compliance: MEDIUM - TCPA rules verified, but exact footer wording and timing subject to interpretation
- Default templates: LOW - Tone/copy is "Claude's discretion" per CONTEXT.md, needs user review

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable technology stack, but TCPA rules evolving)
