# Phase 20: Database Migration & Customer Enhancement - Research

**Researched:** 2026-02-02
**Domain:** PostgreSQL table migration, phone number validation (E.164), SMS compliance, tag systems
**Confidence:** HIGH

## Summary

This phase involves renaming the `contacts` table to `customers` across the entire codebase (database, UI, routes, actions), adding phone number support with E.164 storage and US display formatting, implementing a preset + custom tag system, adding SMS consent tracking fields for TCPA compliance, and completing Twilio A2P 10DLC registration.

**Current State Analysis:**
- Contacts table exists with schema: id, business_id, name, email, phone (nullable TEXT), status, opted_out, notes, last_sent_at, send_count, created_at, updated_at
- CSV import already implemented with PapaParse and best-effort phone parsing
- 12+ revalidatePath calls to `/dashboard/contacts` will need updating
- ~70+ files reference "contact" or "contacts" in TypeScript/TSX
- No existing tag system or SMS consent fields
- Phone field exists but has no E.164 validation or formatting

**Primary recommendation:** Use libphonenumber-js for E.164 validation and formatting, rename table using ALTER TABLE RENAME with compatibility view, store tags as JSONB array for simplicity, implement TCPA-compliant consent tracking fields, and complete Twilio A2P 10DLC registration before building SMS features.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| libphonenumber-js | latest | E.164 phone validation and formatting | Industry standard, 145KB bundle (vs 550KB google-libphonenumber), TypeScript support, maintained port of Google's library |
| PostgreSQL ALTER TABLE | built-in | Table rename with automatic dependency updates | PostgreSQL automatically updates foreign keys, indexes, constraints when renaming tables |
| PostgreSQL JSONB | built-in | Tag storage | Simpler than junction table for 5-tag limit, GIN indexable, no joins needed |
| Twilio A2P 10DLC | required | SMS compliance for US | Mandatory for US A2P messaging to 10DLC numbers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PapaParse | 5.5.3 (existing) | CSV parsing | Already integrated for contact import |
| Intl API | browser built-in | Timezone detection | Standard browser API for timezone info |
| Next.js middleware | 15 (existing) | Route redirects | Handle /contacts → /customers 301 redirect |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| libphonenumber-js | google-libphonenumber | 550KB vs 145KB - too heavy for client-side use |
| libphonenumber-js | phone npm package | Only validates mobile numbers, not landlines |
| JSONB array | junction table (customers_tags) | Junction table adds complexity, joins, and 2 extra tables (tags, junction) for simple 5-tag limit |
| ALTER TABLE RENAME | CREATE TABLE + migrate data | Renames are instant and atomic, data migration adds complexity and downtime |

**Installation:**
```bash
npm install libphonenumber-js
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── XXXXX_rename_contacts_to_customers.sql    # Main migration
├── XXXXX_add_phone_validation_fields.sql     # phone_status tracking
├── XXXXX_add_tags_field.sql                  # JSONB tags array
├── XXXXX_add_sms_consent_fields.sql          # TCPA compliance fields
└── XXXXX_drop_contacts_compatibility_view.sql # Cleanup after deploy

lib/
├── utils/
│   └── phone.ts                              # Phone parsing, validation, formatting
├── validations/
│   └── customer.ts                           # Rename from contact.ts
└── actions/
    └── customer.ts                           # Rename from contact.ts

app/(dashboard)/
├── customers/                                # Rename from contacts/
└── contacts/ → middleware 301 redirect
```

### Pattern 1: Phone Number Storage and Validation
**What:** Store phone in E.164 format (+15551234567), validate on input, display in friendly format
**When to use:** All phone number input/output

**Example:**
```typescript
// lib/utils/phone.ts
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js'

export function parseAndValidatePhone(
  input: string,
  defaultCountry: CountryCode = 'US'
): { valid: boolean; e164?: string; error?: string } {
  if (!input || input.trim() === '') {
    return { valid: true } // Optional field
  }

  try {
    const phoneNumber = parsePhoneNumber(input, defaultCountry)

    if (!phoneNumber) {
      return { valid: false, error: 'Could not parse phone number' }
    }

    if (!phoneNumber.isValid()) {
      return { valid: false, error: 'Invalid phone number' }
    }

    return { valid: true, e164: phoneNumber.format('E.164') }
  } catch (error) {
    return { valid: false, error: 'Invalid phone format' }
  }
}

export function formatPhoneDisplay(e164: string | null): string {
  if (!e164) return ''

  try {
    const phoneNumber = parsePhoneNumber(e164)
    if (phoneNumber && phoneNumber.country === 'US') {
      return phoneNumber.formatNational() // (555) 123-4567
    }
    return phoneNumber?.formatInternational() || e164 // +1 555 123 4567
  } catch {
    return e164
  }
}
```

### Pattern 2: Table Rename with Compatibility View
**What:** Atomic table rename with temporary view for backward compatibility
**When to use:** Renaming core tables in production

**Example:**
```sql
-- Migration: rename_contacts_to_customers.sql

-- 1. Rename table (instant, atomic)
ALTER TABLE contacts RENAME TO customers;

-- 2. Rename sequence
ALTER SEQUENCE contacts_id_seq RENAME TO customers_id_seq;

-- 3. Rename constraints for clarity (optional but recommended)
ALTER TABLE customers
  RENAME CONSTRAINT contacts_name_not_empty TO customers_name_not_empty;
ALTER TABLE customers
  RENAME CONSTRAINT contacts_email_not_empty TO customers_email_not_empty;
ALTER TABLE customers
  RENAME CONSTRAINT contacts_status_valid TO customers_status_valid;
ALTER TABLE customers
  RENAME CONSTRAINT contacts_unique_email_per_business TO customers_unique_email_per_business;

-- 4. Rename indexes
ALTER INDEX idx_contacts_business_id RENAME TO idx_customers_business_id;
ALTER INDEX idx_contacts_business_status RENAME TO idx_customers_business_status;

-- 5. Rename RLS policies
DROP POLICY "Users view own contacts" ON customers;
DROP POLICY "Users insert own contacts" ON customers;
DROP POLICY "Users update own contacts" ON customers;
DROP POLICY "Users delete own contacts" ON customers;

CREATE POLICY "Users view own customers"
ON customers FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users update own customers"
ON customers FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own customers"
ON customers FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- 6. Create compatibility view (temporary, drop after deploy)
CREATE VIEW contacts AS SELECT * FROM customers;

-- 7. Grant permissions to view
GRANT ALL ON contacts TO authenticated;
```

### Pattern 3: Tag Storage with JSONB Array
**What:** Store tags as JSONB array with GIN index for filtering
**When to use:** Limited tags per record (5 max), OR filtering needed

**Example:**
```sql
-- Migration: add_tags_field.sql

-- Add tags column
ALTER TABLE customers ADD COLUMN tags JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add GIN index for tag queries (enables @> operator)
CREATE INDEX idx_customers_tags ON customers USING GIN (tags);

-- Add constraint: max 5 tags
ALTER TABLE customers ADD CONSTRAINT customers_max_5_tags
  CHECK (jsonb_array_length(tags) <= 5);

-- Query examples:
-- Find customers with 'VIP' tag:
-- SELECT * FROM customers WHERE tags @> '["VIP"]'::jsonb;

-- Find customers with 'VIP' OR 'repeat' tag:
-- SELECT * FROM customers
-- WHERE tags ?| array['VIP', 'repeat'];
```

**TypeScript usage:**
```typescript
// lib/types/database.ts
export interface Customer {
  id: string
  business_id: string
  name: string
  email: string
  phone: string | null
  tags: string[]  // ['VIP', 'repeat', 'commercial']
  // ... other fields
}

// lib/actions/customer.ts
export async function updateCustomerTags(
  customerId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  if (tags.length > 5) {
    return { success: false, error: 'Maximum 5 tags allowed' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ tags })
    .eq('id', customerId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### Pattern 4: SMS Consent Tracking Fields (TCPA Compliance)
**What:** Track consent status, date, method, and IP for audit trail
**When to use:** Any SMS messaging feature requiring consent

**Example:**
```sql
-- Migration: add_sms_consent_fields.sql

ALTER TABLE customers ADD COLUMN sms_consent_status TEXT
  DEFAULT 'unknown'
  NOT NULL
  CHECK (sms_consent_status IN ('opted_in', 'opted_out', 'unknown'));

ALTER TABLE customers ADD COLUMN sms_consent_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN sms_consent_source TEXT;
ALTER TABLE customers ADD COLUMN sms_consent_method TEXT
  CHECK (sms_consent_method IN ('verbal_in_person', 'phone_call', 'service_agreement', 'website_form', 'other', NULL));
ALTER TABLE customers ADD COLUMN sms_consent_notes TEXT;
ALTER TABLE customers ADD COLUMN sms_consent_ip INET;
ALTER TABLE customers ADD COLUMN sms_consent_captured_by UUID REFERENCES auth.users(id);

-- Set existing records to 'unknown' with migration source
UPDATE customers SET sms_consent_source = 'migration' WHERE sms_consent_status = 'unknown';

-- Create index for filtering consent status
CREATE INDEX idx_customers_sms_consent_status ON customers(sms_consent_status);
```

### Pattern 5: Next.js Middleware 301 Redirect
**What:** Permanent redirect from old /contacts route to /customers
**When to use:** Route migrations to preserve SEO and bookmarks

**Example:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect /contacts to /customers (301 permanent)
  if (pathname === '/contacts' || pathname.startsWith('/contacts/')) {
    const newPathname = pathname.replace('/contacts', '/customers')
    const url = request.nextUrl.clone()
    url.pathname = newPathname
    return NextResponse.redirect(url, { status: 301 })
  }

  // ... existing middleware logic
}

export const config = {
  matcher: [
    '/contacts/:path*',
    // ... existing matchers
  ],
}
```

### Pattern 6: Timezone Detection with Intl API
**What:** Detect user timezone on client, store on customer creation
**When to use:** Customer creation, fallback to business timezone

**Example:**
```typescript
// Client-side detection
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
// Returns: 'America/Los_Angeles', 'America/New_York', etc.

// lib/actions/customer.ts
export async function createCustomer(formData: FormData) {
  const timezone = formData.get('timezone') as string || 'America/New_York' // fallback

  const { data, error } = await supabase
    .from('customers')
    .insert({
      // ... other fields
      timezone: timezone,
    })
}
```

### Anti-Patterns to Avoid
- **Don't store phone as free text without validation:** Phone format inconsistency makes SMS integration impossible
- **Don't use CREATE TABLE + migrate data for renames:** ALTER TABLE RENAME is instant and atomic, data migration adds downtime
- **Don't implement phone parsing from scratch:** Country codes, area codes, and numbering plans change frequently - use libphonenumber-js
- **Don't use junction tables for simple tag limits:** 5-tag limit with OR filtering is perfect for JSONB array with GIN index
- **Don't capture bulk SMS consent:** TCPA compliance requires individual consent capture with audit trail
- **Don't use 302/307 for route migrations:** Use 301 permanent redirect for SEO preservation
- **Don't rely on just keywords for opt-out:** TCPA 2026 rules require handling informal messages like "Leave me alone"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone number validation | Regex patterns per country | libphonenumber-js | 200+ country codes, carrier-specific rules, frequent numbering plan updates, edge cases (extensions, short codes) |
| E.164 formatting | String concatenation | libphonenumber-js format('E.164') | Handles country codes, removes non-digit chars, validates length constraints |
| Timezone detection | Manual offset calculation | Intl.DateTimeFormat().resolvedOptions().timeZone | Handles DST, returns IANA timezone names, works across all modern browsers |
| CSV phone parsing | Split on delimiters | libphonenumber-js parsePhoneNumber with extract: true | Extracts phone from messy input like "Call me at (555) 123-4567 ext 89" |
| SMS consent tracking | Boolean opted_in field | Full audit trail (status, date, method, IP, notes) | TCPA requires 4-year retention of consent proof including method and date |
| Tag filtering in SQL | Multiple OR conditions | PostgreSQL JSONB operators (@>, ?|) | GIN indexes make JSONB queries fast, no need for junction table complexity |

**Key insight:** Phone number validation has country-specific rules, edge cases, and frequent updates that make custom solutions fragile. TCPA compliance requires detailed audit trails that go far beyond simple boolean flags. PostgreSQL's JSONB operators handle tag filtering efficiently without junction table overhead.

## Common Pitfalls

### Pitfall 1: Phone Validation Accepts Invalid E.164
**What goes wrong:** Validating "10 digits" instead of valid E.164 leads to storing (555) 555-5555 instead of +15555555555, breaking SMS APIs
**Why it happens:** Assuming US-only users, not understanding E.164 requires country code
**How to avoid:** Always use libphonenumber-js validation, store only E.164 format, validate with isValid() before storage
**Warning signs:** Phone queries to Twilio fail with "invalid phone number" errors, phones stored with parentheses or dashes

### Pitfall 2: Renaming Foreign Key Columns Manually
**What goes wrong:** send_logs.contact_id references old table name, causing FK constraint errors
**Why it happens:** Not understanding that ALTER TABLE RENAME only renames the table, not FK column names
**How to avoid:** After renaming table, rename FK columns separately: `ALTER TABLE send_logs RENAME COLUMN contact_id TO customer_id`
**Warning signs:** FK constraints still reference "contact_id" after migration, queries use mixed terminology

### Pitfall 3: Missing RLS Policies After Table Rename
**What goes wrong:** After renaming table, old RLS policies still exist on new table name but reference old constraint names
**Why it happens:** RLS policies are table-bound, not name-bound - they persist after rename
**How to avoid:** Drop old policies and create new ones with updated names in same migration
**Warning signs:** RLS policy names like "Users view own contacts" exist on "customers" table

### Pitfall 4: CSV Import Fails Entire Batch on Single Bad Phone
**What goes wrong:** One invalid phone number causes entire CSV import to fail, losing all valid rows
**Why it happens:** Throwing errors instead of tracking parse status per-row
**How to avoid:** Best-effort parsing with phone_status field (valid/invalid/missing), show review queue after import
**Warning signs:** Users complain entire 100-row CSV rejected due to 1 typo, no partial import option

### Pitfall 5: JSONB Tag Filter Returns Wrong Results
**What goes wrong:** Query `WHERE tags @> '["VIP"]'` returns no results even though VIP tags exist
**Why it happens:** Missing GIN index on JSONB column makes queries slow, wrong operator (@ vs @>)
**How to avoid:** Create GIN index on tags column, use @> for contains, ?| for any-of-array
**Warning signs:** Tag filter queries timeout or return empty results, EXPLAIN shows sequential scan

### Pitfall 6: Consent Status 'unknown' Blocks All SMS
**What goes wrong:** Migrated customers have sms_consent_status='unknown', SMS features completely unavailable
**Why it happens:** Treating 'unknown' as 'opted_out' instead of separate state
**How to avoid:** Handle 'unknown' as "needs consent capture", show consent UI, create "Needs Attention" queue
**Warning signs:** 100% of customers show "SMS unavailable" after migration, no path to capture consent

### Pitfall 7: Twilio A2P 10DLC Registration Delays Launch
**What goes wrong:** Attempting SMS features before A2P 10DLC approval leads to blocked messages
**Why it happens:** Not understanding TCR approval takes 3-7 days, must complete before development
**How to avoid:** Register brand and campaign FIRST, wait for approval, then build SMS features
**Warning signs:** Test SMS messages blocked by carrier, Twilio error "10DLC registration required"

### Pitfall 8: Missing Timezone on Import
**What goes wrong:** CSV imported customers have null timezone, breaking scheduled SMS sends
**Why it happens:** Timezone detection only works client-side, not available during server-side import
**How to avoid:** Fallback to business.timezone during CSV import, add timezone column to import review UI
**Warning signs:** Imported customers missing timezone field, scheduled sends fail for imported contacts

### Pitfall 9: Route Redirect Uses 307 Instead of 301
**What goes wrong:** /contacts → /customers redirect uses temporary 307, search engines don't update links
**Why it happens:** Next.js redirect() defaults to 307 temporary
**How to avoid:** Explicitly use { status: 301 } in NextResponse.redirect() for permanent migrations
**Warning signs:** Google still indexes /contacts URLs months after migration, SEO penalty for duplicate content

### Pitfall 10: Phone Display Shows E.164 Instead of Friendly Format
**What goes wrong:** UI shows "+15125551234" instead of "(512) 555-1234"
**Why it happens:** Forgetting to format for display, showing stored E.164 directly
**How to avoid:** Create formatPhoneDisplay() utility, use phoneNumber.formatNational() for US numbers
**Warning signs:** Users complain about ugly phone numbers, copy-paste includes + symbol

## Code Examples

Verified patterns from official sources:

### E.164 Validation and Formatting
```typescript
// Source: https://github.com/catamphetamine/libphonenumber-js
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// Validation
function validatePhone(input: string): boolean {
  return isValidPhoneNumber(input, 'US')
}

// Parse and format
function normalizePhone(input: string): string | null {
  try {
    const phone = parsePhoneNumber(input, 'US')
    return phone?.format('E.164') || null  // +15125551234
  } catch {
    return null
  }
}

// Display formatting
function displayPhone(e164: string): string {
  try {
    const phone = parsePhoneNumber(e164)
    return phone?.formatNational() || e164  // (512) 555-1234
  } catch {
    return e164
  }
}
```

### CSV Phone Parsing with Review Queue
```typescript
// Extend existing CSV import (components/contacts/csv-import-dialog.tsx)
interface ParsedRow {
  name: string
  email: string
  phone?: string
  phoneStatus: 'valid' | 'invalid' | 'missing'  // NEW
  phoneE164?: string  // NEW
  isValid: boolean
  isDuplicate: boolean
  errors: string[]
}

function parseCSVRow(row: Record<string, string>): ParsedRow {
  const phone = row.phone || ''

  // Best-effort phone parsing
  let phoneStatus: 'valid' | 'invalid' | 'missing' = 'missing'
  let phoneE164: string | undefined

  if (phone && phone.trim()) {
    try {
      const parsed = parsePhoneNumber(phone, 'US')
      if (parsed?.isValid()) {
        phoneStatus = 'valid'
        phoneE164 = parsed.format('E.164')
      } else {
        phoneStatus = 'invalid'
      }
    } catch {
      phoneStatus = 'invalid'
    }
  }

  return {
    name: row.name,
    email: row.email,
    phone: phoneE164,
    phoneStatus,
    phoneE164,
    isValid: /* email/name validation */,
    isDuplicate: /* duplicate check */,
    errors: /* validation errors */,
  }
}
```

### Tag Filtering with JSONB
```typescript
// Source: PostgreSQL JSONB operators documentation
// lib/actions/customer.ts

export async function filterCustomersByTags(
  businessId: string,
  tags: string[]  // ['VIP', 'repeat']
): Promise<Customer[]> {
  const supabase = await createClient()

  // OR filter: customers with ANY of the selected tags
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .or(tags.map(tag => `tags.cs.{"${tag}"}`).join(','))
    // Alternative using PostgreSQL function:
    // .rpc('customers_with_any_tag', { tag_array: tags })

  return data || []
}

// PostgreSQL function for tag filtering (optional, for complex queries)
/*
CREATE OR REPLACE FUNCTION customers_with_any_tag(tag_array text[])
RETURNS SETOF customers AS $$
  SELECT * FROM customers WHERE tags ?| tag_array;
$$ LANGUAGE sql STABLE;
*/
```

### Timezone Detection and Storage
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions

// Client component: components/customers/add-customer-sheet.tsx
'use client'

function AddCustomerForm() {
  const [timezone, setTimezone] = useState('')

  useEffect(() => {
    // Detect browser timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(tz)  // 'America/Los_Angeles'
  }, [])

  // Include in form submission
  return (
    <form>
      <input type="hidden" name="timezone" value={timezone} />
      {/* other fields */}
    </form>
  )
}

// Server action: lib/actions/customer.ts
export async function createCustomer(formData: FormData) {
  const timezone = formData.get('timezone') as string

  // Fallback to business timezone if client detection failed
  if (!timezone || !timezone.includes('/')) {
    const business = await getBusiness()
    timezone = business.timezone || 'America/New_York'
  }

  const { data } = await supabase.from('customers').insert({
    // ... other fields
    timezone,
  })
}
```

### SMS Consent Capture Form
```typescript
// components/customers/sms-consent-form.tsx
'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export function SmsConsentForm({ customerId }: { customerId: string }) {
  const [consented, setConsented] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [method, setMethod] = useState<string>('')
  const [notes, setNotes] = useState('')

  async function handleSubmit() {
    const clientIp = await fetch('/api/client-ip').then(r => r.json())

    await updateSmsConsent(customerId, {
      status: consented ? 'opted_in' : 'opted_out',
      method,
      notes,
      ip: clientIp.ip,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="sms-consent"
          checked={consented}
          onCheckedChange={setConsented}
        />
        <div className="space-y-1">
          <label htmlFor="sms-consent" className="font-medium">
            Customer consented to receive texts (SMS)
          </label>
          <p className="text-sm text-muted-foreground">
            Required for SMS follow-ups
          </p>
        </div>
      </div>

      {consented && (
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Add'} details
        </Button>
      )}

      {showDetails && (
        <div className="space-y-3 pl-6 border-l-2">
          <div>
            <label>Consent method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">Select method...</option>
              <option value="verbal_in_person">Verbal (in-person)</option>
              <option value="phone_call">Phone call</option>
              <option value="service_agreement">Service agreement</option>
              <option value="website_form">Website form</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context about consent..."
            />
          </div>

          <div className="p-3 bg-muted text-sm rounded">
            <strong>TCPA Compliance:</strong> This information creates a legal
            audit trail. Ensure consent was explicitly given. Never capture
            consent in bulk.
          </div>
        </div>
      )}

      <Button onClick={handleSubmit}>Save consent status</Button>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String phone validation (10 digits) | E.164 with libphonenumber-js | 2020+ | SMS APIs require E.164, international support needed |
| Boolean opted_in field | Full consent audit trail (status, date, method, IP) | Jan 2025 (TCPA updates) | TCPA Jan 2026 one-to-one consent rule, 4-year retention required |
| Junction tables for tags | JSONB arrays with GIN indexes | 2019+ (PostgreSQL 9.4+) | Simpler schema, fewer joins, comparable performance for limited tags |
| CREATE TABLE + migrate for renames | ALTER TABLE RENAME | Always PostgreSQL standard | Instant vs minutes, no downtime, automatic FK updates |
| google-libphonenumber (550KB) | libphonenumber-js (145KB) | 2023+ front-end | Bundle size critical for web apps, same validation quality |
| moment-timezone for detection | Intl API (built-in) | 2020+ (modern browsers) | No dependencies, native support, automatic DST handling |
| Opt-out keywords only | Informal message handling | Jan 2026 TCPA update | Must handle "Leave me alone", "Don't text me", not just STOP |

**Deprecated/outdated:**
- **google-libphonenumber for client-side:** 550KB bundle size unacceptable for modern web apps - use libphonenumber-js (145KB)
- **Boolean SMS opt-in field:** TCPA 2026 requires consent_status (opted_in/opted_out/unknown), consent_at, consent_method, consent_ip for audit trail
- **A2P messaging without 10DLC registration:** Carriers block unregistered traffic, mandatory since 2023
- **Keyword-only opt-out:** TCPA Jan 2026 update requires handling informal opt-out messages beyond "STOP"
- **Data migration for table renames:** ALTER TABLE RENAME is instant and atomic, no reason to migrate data

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Twilio A2P 10DLC approval timeline**
   - What we know: TCR approves brands in "a few minutes", campaigns take "under one week"
   - What's unclear: Exact SLA, what causes delays, rejection criteria
   - Recommendation: Start registration immediately, plan for 7-day approval buffer, verify in Twilio Console before Phase 21 starts

2. **RLS policy refresh after table rename**
   - What we know: Policies persist on renamed table, need DROP + CREATE with new names
   - What's unclear: Do old policy names cause performance issues, or just naming confusion?
   - Recommendation: Drop and recreate all policies in same migration for consistency

3. **Phone review queue UX patterns**
   - What we know: Need table showing raw CSV value, suggested parse, edit field, "Mark email-only" button
   - What's unclear: Best table layout, inline editing vs modal, validation feedback timing
   - Recommendation: Use TanStack Table with inline editable cells, validate on blur, batch update button

4. **International phone display beyond US**
   - What we know: phoneNumber.formatNational() works for US, formatInternational() for others
   - What's unclear: User preference for displaying international numbers in their market
   - Recommendation: Phase 20 ships US-only formatting (95%+ of users), defer international display to future phase

5. **Tag autocomplete source**
   - What we know: Preset tags (VIP, repeat, commercial, residential) + custom tags
   - What's unclear: Should autocomplete suggest all tags ever used across business, or just presets?
   - Recommendation: Suggest presets + 10 most-used custom tags from business, query: `SELECT DISTINCT jsonb_array_elements_text(tags) FROM customers WHERE business_id = $1 LIMIT 10`

## Sources

### Primary (HIGH confidence)
- [libphonenumber-js npm](https://www.npmjs.com/package/libphonenumber-js) - Phone validation library documentation
- [libphonenumber-js GitHub](https://github.com/catamphetamine/libphonenumber-js) - API reference, usage patterns
- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html) - Official PostgreSQL docs
- [Intl.DateTimeFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions) - Timezone detection
- [Twilio A2P 10DLC Registration](https://help.twilio.com/articles/1260801864489-How-do-I-register-to-use-A2P-10DLC-messaging) - Official Twilio docs
- [Twilio A2P 10DLC Requirements](https://help.twilio.com/articles/13718729624091-Required-information-for-United-States-A2P-10DLC-registration) - Registration fields
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - Migration best practices

### Secondary (MEDIUM confidence)
- [TCPA text messages 2026 guide - ActiveProspect](https://activeprospect.com/blog/tcpa-text-messages/) - TCPA compliance requirements
- [New TCPA Rules 2025 - MoEngage](https://www.moengage.com/blog/new-tcpa-rules/) - Jan 2026 one-to-one consent rule
- [PostgreSQL JSONB vs Junction Tables - Medium](https://medium.com/@sruthiganesh/comparing-query-performance-in-postgresql-jsonb-vs-join-queries-e4832342d750) - Performance comparison
- [Next.js Middleware Redirect Guide - DHiWise](https://www.dhiwise.com/post/how-to-implement-nextjs-middleware-redirect) - 301 redirect patterns
- [PostgreSQL Table Rename and Views - Database Rookies](https://databaserookies.wordpress.com/2026/01/05/postgresql-table-rename-and-views-an-oid-story/) - OID considerations (Jan 2026 article)

### Tertiary (LOW confidence)
- [Phone numbers in JavaScript - Ronald James](https://www.ronaldjamesgroup.com/blog/phone-numbers-in-javascript-using-e164-libphonenumber-and-microdata) - General guidance, not date-stamped
- [JSONB Performance Analysis - Geek Culture](https://medium.com/geekculture/postgres-jsonb-usage-and-performance-analysis-cdbd1242a018) - Performance insights, needs official verification
- [Browser timezone detection - Castle.io](https://blog.castle.io/how-to-detect-browser-time-zone-using-javascript/) - Implementation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - libphonenumber-js is industry standard (145KB vs 550KB alternatives), verified in npm/GitHub; PostgreSQL ALTER TABLE RENAME is built-in and documented
- Architecture: HIGH - Patterns verified from official PostgreSQL docs, libphonenumber-js README, Twilio official guides
- Pitfalls: MEDIUM - Based on common PostgreSQL migration issues, TCPA compliance articles, and logical inference from requirements
- TCPA compliance: MEDIUM - Based on recent articles (Jan 2025-2026) but not verified with legal counsel
- Twilio A2P 10DLC: HIGH - Official Twilio documentation with exact registration steps and requirements

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable domain, TCPA rules change in Jan 2026 already factored in)

**Codebase-specific findings:**
- Current contacts table has 12 columns: id, business_id, name, email, phone (nullable TEXT), status, opted_out, notes, last_sent_at, send_count, created_at, updated_at
- 12+ revalidatePath calls to `/dashboard/contacts` need updating to `/customers`
- ~70+ TypeScript/TSX files reference "contact" or "contacts" (full codebase search needed for complete rename)
- CSV import already uses PapaParse with header mapping (HEADER_MAPPINGS object in csv-import-dialog.tsx)
- Phone validation currently uses simple zod schema: `z.string().max(20).optional()` - no E.164 validation
- Contact type interface in lib/types/database.ts includes opted_out boolean (separate from SMS consent)
- send_logs table has contact_id FK that will need renaming to customer_id
- No existing tag system, timezone field, or SMS consent fields in current schema
