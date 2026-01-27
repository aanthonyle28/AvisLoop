# Phase 2: Business Setup - Research

**Researched:** 2026-01-26
**Domain:** Business profile management, database design, form handling
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 requires creating database tables for business profiles and email templates, implementing RLS policies following Phase 1 patterns, and building settings forms using Next.js 15 Server Actions with Zod validation. The standard approach for MVP is a one-to-many relationship (one user can have multiple businesses) with cascade deletes, though starting with one business per user simplifies the initial implementation.

Google Business Profile review links follow the format `https://search.google.com/local/writereview?placeid=PLACE_ID`, where Place IDs are variable-length alphanumeric strings with no defined maximum length. Validation should focus on URL structure rather than Place ID pattern matching, as Google's format may evolve.

Email templates should be stored in the database with variable substitution support using a simple placeholder pattern (e.g., `{{VARIABLE_NAME}}`). Start with predefined templates rather than full WYSIWYG editing for MVP scope control.

**Primary recommendation:** Use Supabase's standard patterns (RLS with SELECT-wrapped auth.uid(), foreign keys with CASCADE, indexed foreign key columns) and organize settings as a multi-section form with toast notifications for success/error feedback.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase | Latest | Database + RLS | Already established in Phase 1, built-in Postgres with RLS |
| Zod | 3.x | Schema validation | Type-safe validation, integrates with Server Actions, Phase 1 pattern |
| Next.js Server Actions | 15.x | Form handling | Native to Next.js 15, eliminates API routes, Phase 1 pattern |
| useActionState | React 19 | Form state management | React 19 hook for Server Action state, Phase 1 pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | Latest | Toast notifications | User feedback for settings updates (optional for MVP) |
| react-hook-form | 7.x | Client-side validation | If adding optimistic validation (optional for MVP) |
| moddatetime | Postgres | Auto-update timestamps | For updated_at automation (Supabase extension) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database templates | File-based templates | Database allows runtime editing, better for SaaS |
| RLS policies | Application-level auth | RLS provides database-level security guarantee |
| Server Actions | API routes | Server Actions reduce boilerplate, better DX in Next.js 15 |

**Installation:**
```bash
# No new packages required - using existing Phase 1 stack
# Optional: Add toast library if implementing notifications
npm install sonner
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── 00001_create_profiles.sql      # Phase 1 (existing)
└── 00002_create_business.sql      # Phase 2 (new)

lib/
├── actions/
│   ├── auth.ts                     # Phase 1 (existing)
│   └── business.ts                 # Phase 2 (new)
├── validations/
│   ├── auth.ts                     # Phase 1 (existing)
│   └── business.ts                 # Phase 2 (new)
└── supabase/
    ├── client.ts                   # Phase 1 (existing)
    └── server.ts                   # Phase 1 (existing)

app/
└── dashboard/
    └── settings/
        └── page.tsx                # Phase 2 (new)
```

### Pattern 1: Database Schema with RLS

**What:** Create businesses and email_templates tables with proper foreign keys, indexes, and RLS policies

**When to use:** All user-owned data in multi-tenant SaaS applications

**Example:**
```sql
-- Source: Supabase official docs + Phase 1 patterns
-- Migration: 00002_create_business.sql

-- Businesses table (one user can have multiple businesses)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_review_link TEXT,
  default_sender_name TEXT,
  default_template_id UUID, -- Foreign key added after templates table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT businesses_name_not_empty CHECK (char_length(name) > 0)
);

-- Email templates table (predefined + custom templates)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false, -- System-provided templates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT templates_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT templates_subject_not_empty CHECK (char_length(subject) > 0),
  CONSTRAINT templates_body_not_empty CHECK (char_length(body) > 0)
);

-- Now add the foreign key to businesses
ALTER TABLE public.businesses
  ADD CONSTRAINT fk_default_template
  FOREIGN KEY (default_template_id)
  REFERENCES public.email_templates(id)
  ON DELETE SET NULL; -- Allow deletion of templates

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Index foreign key columns for RLS performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id
  ON public.businesses USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_business_id
  ON public.email_templates USING btree (business_id);

-- RLS Policies: Businesses (users access only their own businesses)
CREATE POLICY "Users view own businesses"
ON public.businesses FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own businesses"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own businesses"
ON public.businesses FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- RLS Policies: Email Templates (users access templates for their businesses)
-- More complex: need to check user_id through businesses table
CREATE POLICY "Users view own templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users insert own templates"
ON public.email_templates FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users update own templates"
ON public.email_templates FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users delete own templates"
ON public.email_templates FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Auto-update updated_at timestamps
-- Using moddatetime extension (Supabase built-in)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

DROP TRIGGER IF EXISTS templates_updated_at ON public.email_templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);
```

**Key design decisions:**
- **One-to-many** (user → businesses): Allows future expansion, minimal complexity overhead
- **CASCADE DELETE**: When user deleted, all businesses and templates deleted automatically
- **SET NULL on template deletion**: Businesses survive if their default template is deleted
- **Indexed foreign keys**: Critical for RLS policy performance (100x improvement on large tables)
- **SELECT-wrapped auth.uid()**: Caches function result per statement (performance optimization)
- **TO authenticated**: Specifies role to prevent unnecessary policy evaluation
- **moddatetime extension**: Automatic updated_at timestamps, cleaner than custom trigger

### Pattern 2: Zod Validation Schemas

**What:** Define validation schemas for business settings forms

**When to use:** All Server Actions that accept user input

**Example:**
```typescript
// Source: Next.js official docs + Phase 1 patterns
// lib/validations/business.ts

import { z } from 'zod'

// Business profile validation
export const businessSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters')
    .trim(),
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .includes('google.com', { message: 'Must be a Google URL' })
    .optional()
    .or(z.literal('')), // Allow empty string
  defaultSenderName: z
    .string()
    .max(100, 'Sender name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')), // Allow empty string
  defaultTemplateId: z
    .string()
    .uuid('Invalid template ID')
    .optional()
    .or(z.literal('')), // Allow empty string
})

// Email template validation
export const emailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters')
    .trim(),
  subject: z
    .string()
    .min(1, 'Email subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  body: z
    .string()
    .min(1, 'Email body is required')
    .max(5000, 'Body must be less than 5000 characters')
    .trim(),
})

// Type exports for use in forms
export type BusinessInput = z.infer<typeof businessSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
```

**Key validation rules:**
- **URL validation**: Use `z.string().url()` for Google review links
- **Optional fields**: Use `.optional().or(z.literal(''))` to handle both undefined and empty string
- **Length limits**: Match database constraints, prevent truncation errors
- **Trim**: Remove whitespace to prevent empty-looking valid inputs

### Pattern 3: Server Actions with Error Handling

**What:** Create Server Actions following Phase 1 AuthActionState pattern

**When to use:** All settings form submissions

**Example:**
```typescript
// Source: Phase 1 patterns + Next.js 15 official docs
// lib/actions/business.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { businessSchema, emailTemplateSchema } from '@/lib/validations/business'

export type BusinessActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

export async function updateBusiness(
  _prevState: BusinessActionState | null,
  formData: FormData
): Promise<BusinessActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Parse and validate input
  const parsed = businessSchema.safeParse({
    name: formData.get('name'),
    googleReviewLink: formData.get('googleReviewLink') || '',
    defaultSenderName: formData.get('defaultSenderName') || '',
    defaultTemplateId: formData.get('defaultTemplateId') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, googleReviewLink, defaultSenderName, defaultTemplateId } = parsed.data

  // Get existing business (assume one business per user for MVP)
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingBusiness) {
    // Update existing business
    const { error } = await supabase
      .from('businesses')
      .update({
        name,
        google_review_link: googleReviewLink || null,
        default_sender_name: defaultSenderName || null,
        default_template_id: defaultTemplateId || null,
      })
      .eq('id', existingBusiness.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new business
    const { error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name,
        google_review_link: googleReviewLink || null,
        default_sender_name: defaultSenderName || null,
        default_template_id: defaultTemplateId || null,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function createEmailTemplate(
  _prevState: BusinessActionState | null,
  formData: FormData
): Promise<BusinessActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get user's business ID
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Business not found. Please create a business profile first.' }
  }

  // Parse and validate input
  const parsed = emailTemplateSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, subject, body } = parsed.data

  // Insert template
  const { error } = await supabase
    .from('email_templates')
    .insert({
      business_id: business.id,
      name,
      subject,
      body,
      is_default: false, // User templates are not default
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
```

**Key patterns:**
- **Auth check first**: Always validate user before processing
- **RLS automatically filters**: No need to add WHERE user_id clauses (RLS handles it)
- **Upsert logic**: Check if business exists, update or insert accordingly
- **Null vs empty string**: Convert empty strings to null for database
- **revalidatePath**: Clear cache after mutations
- **Error handling**: Separate field errors from general errors

### Pattern 4: Settings Form UI with useActionState

**What:** Client component using useActionState hook for form state management

**When to use:** All forms calling Server Actions

**Example:**
```typescript
// Source: Next.js 15 official docs
// app/dashboard/settings/page.tsx

'use client'

import { useActionState } from 'react'
import { updateBusiness } from '@/lib/actions/business'

export default function SettingsPage() {
  const [state, formAction, isPending] = useActionState(updateBusiness, null)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Business Settings</h1>

      <form action={formAction} className="space-y-6">
        {/* General error */}
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {state.error}
          </div>
        )}

        {/* Success message */}
        {state?.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            Settings saved successfully!
          </div>
        )}

        {/* Business Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Business Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full border rounded px-3 py-2"
          />
          {state?.fieldErrors?.name && (
            <p className="text-red-600 text-sm mt-1">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Google Review Link */}
        <div>
          <label htmlFor="googleReviewLink" className="block text-sm font-medium mb-2">
            Google Review Link
          </label>
          <input
            type="url"
            id="googleReviewLink"
            name="googleReviewLink"
            placeholder="https://search.google.com/local/writereview?placeid=..."
            className="w-full border rounded px-3 py-2"
          />
          {state?.fieldErrors?.googleReviewLink && (
            <p className="text-red-600 text-sm mt-1">
              {state.fieldErrors.googleReviewLink[0]}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Find your Google Business Profile review link and paste it here
          </p>
        </div>

        {/* Default Sender Name */}
        <div>
          <label htmlFor="defaultSenderName" className="block text-sm font-medium mb-2">
            Default Sender Name
          </label>
          <input
            type="text"
            id="defaultSenderName"
            name="defaultSenderName"
            placeholder="Your Business"
            className="w-full border rounded px-3 py-2"
          />
          {state?.fieldErrors?.defaultSenderName && (
            <p className="text-red-600 text-sm mt-1">
              {state.fieldErrors.defaultSenderName[0]}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            This name will appear in review request emails
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
```

**Key UI patterns:**
- **useActionState destructuring**: `[state, formAction, isPending]` for form state
- **Disabled during submission**: Use `isPending` to prevent double-submits
- **Per-field errors**: Display `state.fieldErrors.fieldName[0]` below each input
- **Success feedback**: Show success message from `state.success`
- **Help text**: Provide guidance for complex fields (Google review link)
- **Placeholder examples**: Show expected format in placeholder text

### Anti-Patterns to Avoid

- **Don't use auth.uid() directly in RLS**: Always wrap in `(SELECT auth.uid())` for performance
- **Don't forget indexes on foreign keys**: Critical for RLS policy performance
- **Don't mix application auth with RLS**: Trust RLS to filter data, don't add redundant WHERE clauses
- **Don't validate Place IDs with regex**: Google's format may change, validate URL structure instead
- **Don't hard-delete with soft-delete needs**: GDPR compliance may require actual deletion, not soft-delete
- **Don't create API routes for forms**: Use Server Actions for better DX and performance in Next.js 15
- **Don't forget to specify `TO authenticated`**: Prevents policy evaluation for anonymous users

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-updating timestamps | Custom UPDATE triggers with NOW() | moddatetime Postgres extension | Built into Supabase, tested, handles edge cases |
| URL validation | Complex regex patterns | Zod's `.url()` method | Handles edge cases, validates protocol/domain |
| Form state management | Custom useState hooks | useActionState (React 19) | Native React hook, integrates with Server Actions |
| Google Place ID validation | Regex pattern matching | URL structure validation only | Google's format may evolve, no official regex exists |
| Email template rendering | Custom parser for variables | Simple string replace with Map | MVP scope - full templating later if needed |
| Toast notifications | Custom notification system | sonner library | Lightweight, accessible, maintained |
| Multi-tenant data isolation | Application-level filtering | Supabase RLS policies | Database-level guarantee, performance optimized |

**Key insight:** Supabase RLS + Next.js 15 Server Actions eliminate most custom auth/form boilerplate. The ecosystem has matured to the point where framework features handle these concerns natively.

## Common Pitfalls

### Pitfall 1: RLS Policy Performance Degradation

**What goes wrong:** RLS policies with multiple joins or unindexed foreign keys cause slow queries (10-100x slower) as tables grow.

**Why it happens:** Postgres evaluates RLS policies on every row access. Without proper indexes, the database performs full table scans. Directly calling functions like `auth.uid()` executes the function per row instead of once per statement.

**How to avoid:**
- Always add indexes on foreign key columns used in RLS policies
- Wrap `auth.uid()` in `(SELECT auth.uid())` to cache the result
- Use `IN (SELECT ...)` patterns instead of joining source tables
- Always specify `TO authenticated` to prevent anonymous policy checks
- Test with realistic data volumes (1000+ rows) to catch issues early

**Warning signs:**
- Queries take >100ms with small datasets
- `EXPLAIN ANALYZE` shows sequential scans on foreign key columns
- Database CPU usage spikes with concurrent users

**Source:** [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 2: Circular Foreign Key Dependencies

**What goes wrong:** Creating circular foreign key references (businesses → email_templates → businesses) causes migration failures or constraint violation errors.

**Why it happens:** Postgres requires referenced tables/rows to exist before creating foreign keys. If A references B and B references A, neither can be created first.

**How to avoid:**
- Create tables first without circular foreign keys
- Add circular references with ALTER TABLE after both tables exist
- Use SET NULL or SET DEFAULT for "optional" direction of relationship
- Consider if the circular reference is really necessary (often indicates design issue)

**Example of correct approach:**
```sql
-- Step 1: Create both tables without circular reference
CREATE TABLE businesses (...);
CREATE TABLE email_templates (business_id UUID REFERENCES businesses);

-- Step 2: Add circular reference after both exist
ALTER TABLE businesses
  ADD COLUMN default_template_id UUID REFERENCES email_templates
  ON DELETE SET NULL; -- Allow template deletion
```

**Warning signs:**
- Migration fails with "relation does not exist" error
- Cannot delete records due to constraint violations
- Need to disable constraints temporarily to delete data

### Pitfall 3: Empty String vs NULL Confusion

**What goes wrong:** Form inputs submit empty strings (""), but database expects NULL for optional fields. Causes validation errors or incorrect data storage.

**Why it happens:** HTML forms encode missing values as empty strings. Supabase/Postgres treats "" as a value, not absence of value (NULL). Zod's `.optional()` only handles undefined, not empty strings.

**How to avoid:**
- Use `.optional().or(z.literal(''))` in Zod schemas for optional fields
- Convert empty strings to null before database insert/update
- Use `|| null` or ternary operator: `value || null`
- Be consistent: decide whether to store "" or NULL, prefer NULL for optional fields

**Example:**
```typescript
// Validation: Accept both undefined and empty string
const schema = z.object({
  optional_field: z.string().optional().or(z.literal(''))
})

// Before insert: Convert empty string to null
const { optional_field } = parsed.data
await supabase.insert({
  optional_field: optional_field || null, // "" becomes null
})
```

**Warning signs:**
- Fields show "" in database instead of NULL
- Optional fields fail "required" constraint with ""
- Queries need to check both `IS NULL` and `= ''`

### Pitfall 4: Google Review Link Format Changes

**What goes wrong:** Hardcoding validation for Google review link format breaks when Google updates their URL structure.

**Why it happens:** Google's URL formats evolve over time. Place ID formats are not officially documented with regex patterns. There is no maximum length for Place IDs.

**How to avoid:**
- Validate URL structure (https, domain) rather than Place ID format
- Use loose validation: `z.string().url().includes('google.com')`
- Accept any valid Google URL, don't enforce specific path structure
- Store the full URL as-is, don't parse or transform Place IDs
- Test that the link opens to Google review page (manual testing)

**Example:**
```typescript
// Good: Flexible validation
googleReviewLink: z
  .string()
  .url('Please enter a valid URL')
  .includes('google.com', { message: 'Must be a Google URL' })
  .optional()
  .or(z.literal(''))

// Bad: Rigid validation that will break
googleReviewLink: z
  .string()
  .regex(/^https:\/\/search\.google\.com\/local\/writereview\?placeid=ChIJ[A-Za-z0-9_-]+$/)
```

**Warning signs:**
- Validation rejects valid Google review links
- Users report "invalid URL" errors for working links
- Place IDs with different prefixes (not ChIJ) fail validation

**Sources:**
- [Google Place IDs Documentation](https://developers.google.com/maps/documentation/places/web-service/place-id)
- [Google Review Link Generator Best Practices](https://wpsocialninja.com/google-review-link-generator/)

### Pitfall 5: Missing CASCADE Deletes

**What goes wrong:** Deleting a user leaves orphaned businesses and email templates in the database. Attempting to delete a user fails with foreign key constraint violations.

**Why it happens:** Foreign keys without CASCADE behavior prevent deletion of referenced rows. Default behavior is RESTRICT, which blocks parent deletion if children exist.

**How to avoid:**
- Use `ON DELETE CASCADE` for "owned" relationships (user owns business)
- Use `ON DELETE SET NULL` for "reference" relationships (business references template)
- Document deletion behavior in migration comments
- Test deletion flows in development before production

**Example:**
```sql
-- Business owned by user: CASCADE delete
CREATE TABLE businesses (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Template owned by business: CASCADE delete
CREATE TABLE email_templates (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE
);

-- Business references template: SET NULL (optional reference)
ALTER TABLE businesses
  ADD COLUMN default_template_id UUID REFERENCES email_templates(id)
  ON DELETE SET NULL;
```

**Warning signs:**
- "Update or delete violates foreign key constraint" errors
- Need to manually delete related records before deleting parent
- Orphaned records accumulate in related tables
- Admin delete user operation fails

**Source:** [Supabase Cascade Deletes Documentation](https://supabase.com/docs/guides/database/postgres/cascade-deletes)

### Pitfall 6: Not Loading Initial Form Values

**What goes wrong:** Settings form is always blank even when business data exists. User must re-enter all settings each time.

**Why it happens:** Form doesn't fetch existing data on load. useActionState manages form submission state, not initial data fetching.

**How to avoid:**
- Fetch existing business data in Server Component
- Pass data as props to Client Component form
- Use defaultValue (not value) for uncontrolled inputs
- Handle loading state while data fetches

**Example:**
```typescript
// app/dashboard/settings/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch existing business data
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <SettingsForm initialData={business} />
}

// app/dashboard/settings/settings-form.tsx (Client Component)
'use client'

export function SettingsForm({ initialData }) {
  const [state, formAction, isPending] = useActionState(updateBusiness, null)

  return (
    <form action={formAction}>
      <input
        name="name"
        defaultValue={initialData?.name || ''} // defaultValue, not value
      />
      {/* ... */}
    </form>
  )
}
```

**Warning signs:**
- Form always shows empty inputs on load
- Users complain about re-entering information
- Update action works but UI doesn't reflect current data

## Code Examples

Verified patterns from official sources:

### Creating Migration with Seed Data

```sql
-- Source: Common pattern for seeding default email templates
-- Add to end of 00002_create_business.sql migration

-- Insert default email templates (will be copied to businesses later)
-- These are system-provided templates, is_default = true
INSERT INTO public.email_templates (id, business_id, name, subject, body, is_default)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', -- Placeholder business_id
    'Simple Review Request',
    'We would love your feedback',
    'Hi {{CUSTOMER_NAME}},

Thank you for choosing {{BUSINESS_NAME}}! We hope you had a great experience.

We would really appreciate if you could take a moment to leave us a review:
{{REVIEW_LINK}}

Best regards,
{{SENDER_NAME}}',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', -- Placeholder business_id
    'Friendly Follow-up',
    'How was your experience with {{BUSINESS_NAME}}?',
    'Hello {{CUSTOMER_NAME}},

We wanted to follow up and see how everything went. Your feedback means a lot to us!

If you have a moment, please share your thoughts here:
{{REVIEW_LINK}}

Thank you for your business!
{{SENDER_NAME}}',
    true
  );

-- Note: When user creates a business, copy these default templates
-- with the user's business_id (implement in application code or trigger)
```

### Template Variable Substitution

```typescript
// Source: Simple pattern sufficient for MVP
// lib/utils/email-templates.ts

export interface TemplateVariables {
  CUSTOMER_NAME: string
  BUSINESS_NAME: string
  REVIEW_LINK: string
  SENDER_NAME: string
}

export function substituteVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template

  // Replace each variable with its value
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replaceAll(placeholder, value || '')
  }

  return result
}

// Usage example:
// const emailBody = substituteVariables(template.body, {
//   CUSTOMER_NAME: 'John Doe',
//   BUSINESS_NAME: business.name,
//   REVIEW_LINK: business.google_review_link,
//   SENDER_NAME: business.default_sender_name || business.name,
// })
```

**Note:** For MVP, simple string replacement is sufficient. Future enhancements could use libraries like Handlebars or Mustache for conditional logic, loops, etc.

### Fetching Business with Templates

```typescript
// Source: Supabase query patterns
// Example query to fetch business with related templates

const { data: business, error } = await supabase
  .from('businesses')
  .select(`
    *,
    email_templates (
      id,
      name,
      subject,
      body,
      is_default
    )
  `)
  .eq('user_id', user.id)
  .single()

// Result structure:
// {
//   id: 'uuid',
//   name: 'My Business',
//   google_review_link: 'https://...',
//   default_sender_name: 'John',
//   default_template_id: 'uuid',
//   email_templates: [
//     { id: 'uuid', name: 'Template 1', ... },
//     { id: 'uuid', name: 'Template 2', ... },
//   ]
// }
```

### Settings Page with Sections

```typescript
// Source: Settings UI best practices
// Multi-section layout for better organization

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Section 1: Business Profile */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
        <BusinessProfileForm />
      </section>

      {/* Section 2: Review Settings */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Review Settings</h2>
        <ReviewSettingsForm />
      </section>

      {/* Section 3: Email Templates */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
        <EmailTemplatesManager />
      </section>
    </div>
  )
}
```

**Guidance:** Start with single-page layout, split into tabs/pages if complexity grows. For MVP with 4 fields, single page is sufficient.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for forms | Server Actions | Next.js 13+ (2023) | Eliminates API boilerplate, better DX |
| Custom timestamp triggers | moddatetime extension | Supabase launch (2020) | Simpler migrations, tested solution |
| Client-side RLS filtering | Database RLS policies | Supabase core (2020) | Security guarantee, performance |
| Custom form state hooks | useActionState | React 19 (2024) | Native integration with Server Actions |
| Soft delete flags | Hard delete + CASCADE | Varies by app | GDPR compliance, simpler queries |
| Complex regex validation | Zod composable schemas | Zod v3 (2022) | Type safety, better error messages |

**Deprecated/outdated:**
- **getSession() for auth**: Replaced by getUser() in Supabase (security improvement, validates JWT)
- **Custom auth middleware**: Next.js middleware with Supabase SSR handles automatically
- **Separate API routes per action**: Server Actions colocate with components
- **Client-side only validation**: Always validate on server, client validation is UX enhancement only

## Open Questions

Things that couldn't be fully resolved:

1. **How many businesses per user for MVP?**
   - What we know: Database supports one-to-many (scalable)
   - What's unclear: Whether MVP should allow multiple businesses or lock to one
   - Recommendation: Start with one business per user, simplify UI. Database schema supports multiple for future. Add check constraint if enforcing single: `CREATE UNIQUE INDEX idx_one_business_per_user ON businesses(user_id)`

2. **Should default templates be copied or referenced?**
   - What we know: Two approaches - (1) copy default templates to each business, or (2) share system templates via is_default flag
   - What's unclear: Which provides better UX for customization
   - Recommendation: Copy defaults on business creation. Allows customization without affecting other users. Slightly more storage but better isolation.

3. **Template variable format: {{VAR}} vs {VAR} vs #VAR#?**
   - What we know: Many formats work, most common are {{VAR}} (Handlebars/Mustache) and #VAR# (BMC)
   - What's unclear: User preference and future library compatibility
   - Recommendation: Use {{VAR}} format - most recognizable, matches popular templating libraries, allows future upgrade to Handlebars/Mustache if needed

4. **Should email template body use textarea or rich text editor?**
   - What we know: Textarea is simpler (MVP), rich text editor provides better UX
   - What's unclear: Whether MVP needs rich formatting (bold, links, etc.)
   - Recommendation: Start with textarea for MVP. Email clients support plain text well. Add rich text editor (e.g., Tiptap, Lexical) in future phase if users request formatting.

5. **Toast notifications vs inline success messages?**
   - What we know: Both patterns valid - toast (sonner), inline (conditional render)
   - What's unclear: User preference and consistency with rest of app
   - Recommendation: Use inline success message for MVP (zero dependencies). Add toast library later if used elsewhere in app for consistency.

## Sources

### Primary (HIGH confidence)
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS patterns and performance
- [Supabase Tables and Data Documentation](https://supabase.com/docs/guides/database/tables) - Foreign keys and structure
- [Supabase Cascade Deletes Documentation](https://supabase.com/docs/guides/database/postgres/cascade-deletes) - CASCADE behavior
- [Next.js Forms Guide (Official)](https://nextjs.org/docs/app/guides/forms) - Server Actions pattern
- [Google Place IDs Documentation](https://developers.google.com/maps/documentation/places/web-service/place-id) - Place ID format

### Secondary (MEDIUM confidence)
- [Next.js 15 Server Actions Guide (Medium, Jan 2026)](https://medium.com/@saad.minhas.codes/next-js-15-server-actions-complete-guide-with-real-examples-2026-6320fbfa01c3) - Modern patterns
- [Supabase Best Practices (Leanware, 2025)](https://www.leanware.co/insights/supabase-best-practices) - Security and performance
- [Updating Timestamps in Supabase (DEV Community)](https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o) - moddatetime extension
- [Settings Page UI Best Practices (SetProduct, 2024)](https://www.setproduct.com/blog/settings-ui-design) - Layout patterns
- [Server Actions with Toast (Robin Wieruch, 2024)](https://www.robinwieruch.de/react-server-actions-useactionstate-toast/) - Feedback patterns

### Tertiary (LOW confidence - requires validation)
- [Google Review Link Generator (WP Social Ninja)](https://wpsocialninja.com/google-review-link-generator/) - Review link format (not official Google)
- [Email Template Schema Examples (Medium)](https://flippingflop.medium.com/email-service-1-schema-design-and-configurations-bd5a308cf3d6) - Database patterns (not Supabase-specific)
- WebSearch results on multi-tenant architecture - General patterns, not project-specific

## Metadata

**Confidence breakdown:**
- Database schema & RLS: HIGH - Verified with official Supabase docs, consistent with Phase 1 patterns
- Server Actions & Forms: HIGH - Official Next.js docs, Phase 1 establishes pattern
- Google review links: MEDIUM - Official docs confirm Place ID format, but no regex pattern provided
- Email templates: MEDIUM - Common patterns, but no official "best practice" for variable format
- UI organization: MEDIUM - Industry best practices, but subjective/context-dependent

**Research date:** 2026-01-26
**Valid until:** ~30 days (2026-02-26) - Stack is stable, but Next.js and Supabase update frequently. Revalidate if major version releases occur.

**Key assumptions:**
- One business per user for MVP (can scale to multiple later with minimal changes)
- Email templates use plain text (no HTML/rich formatting for MVP)
- Settings page is single-page form (no tabs/navigation needed for 4 fields)
- No email sending implementation in this phase (just configuration storage)

**Out of scope for this phase:**
- Actually sending review request emails
- Email delivery service integration (SendGrid, Resend, etc.)
- Rich text email editor
- Email template preview
- Multi-business management UI
- Team/collaboration features
