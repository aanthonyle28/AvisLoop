# Architecture Research: ReviewLoop

**Researched:** 2026-01-25

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Public Pages │  │  App Pages   │  │  Components  │       │
│  │ (SSG/SSR)    │  │ (Protected)  │  │  (shadcn/ui) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐        │
│  │              Server Actions / API Routes         │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Supabase   │     │    Resend    │     │    Stripe    │
│  (Database   │     │   (Email)    │     │  (Billing)   │
│   + Auth)    │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Next.js App Router Structure

```
app/
├── (public)/              # Public routes (no auth)
│   ├── page.tsx           # Landing page
│   ├── pricing/
│   ├── login/
│   └── signup/
├── (app)/                 # Protected routes (auth required)
│   ├── layout.tsx         # Auth check middleware
│   ├── dashboard/
│   ├── onboarding/
│   ├── business/
│   ├── contacts/
│   ├── send/
│   ├── history/
│   └── billing/
├── api/                   # API routes
│   ├── webhooks/
│   │   └── stripe/        # Stripe webhook handler
│   └── send-email/        # Email sending endpoint
└── layout.tsx             # Root layout
```

### Data Flow

```
USER ACTION                    FLOW
─────────────────────────────────────────────────────────────
Sign Up        →  Supabase Auth  →  Create user  →  Dashboard
Add Business   →  Server Action  →  Insert to DB →  Confirm
Add Contact    →  Server Action  →  Insert to DB →  Confirm
Send Request   →  Server Action  →  Check limits →  Resend API
                                 →  Log message  →  Confirm
Subscribe      →  Stripe Checkout →  Webhook     →  Update DB
```

### Database Schema (Supabase/Postgres)

```sql
-- Users handled by Supabase Auth (auth.users)

-- Profiles (extends auth.users)
profiles
├── id (uuid, FK to auth.users)
├── email
├── trial_sends_remaining (default: 25)
├── subscription_status (trial | active | canceled)
├── subscription_tier (basic | pro | null)
├── stripe_customer_id
├── created_at

-- Businesses
businesses
├── id (uuid)
├── user_id (FK to profiles)
├── name
├── review_link
├── created_at

-- Contacts
contacts
├── id (uuid)
├── business_id (FK to businesses)
├── name
├── email
├── created_at

-- Messages
messages
├── id (uuid)
├── business_id (FK to businesses)
├── contact_id (FK to contacts)
├── channel (email | sms)
├── template_content
├── status (pending | sent | failed)
├── provider_message_id
├── sent_at
├── created_at
```

### Row Level Security (RLS) Policies

```sql
-- Users can only see their own data
CREATE POLICY "Users see own profiles"
ON profiles FOR ALL
USING (auth.uid() = id);

-- Users see businesses they own
CREATE POLICY "Users see own businesses"
ON businesses FOR ALL
USING (user_id = auth.uid());

-- Users see contacts for their businesses
CREATE POLICY "Users see own contacts"
ON contacts FOR ALL
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Similar for messages
```

### Multi-Tenant Pattern (Pro Users)

For Pro users with multiple locations:

```sql
-- User can have multiple businesses (Pro tier)
-- Basic tier: enforce 1 business limit in application logic
-- Pro tier: unlimited businesses

-- Check in Server Action before creating business:
-- if tier == 'basic' && business_count >= 1 → reject
```

### Authentication Flow

```
1. User visits /signup
2. Supabase Auth creates user
3. Database trigger creates profile with trial_sends_remaining = 25
4. Middleware checks auth on protected routes
5. Server Actions verify auth.uid() before mutations
```

### Email Sending Flow

```
1. User clicks "Send Review Request"
2. Server Action triggered
3. Check: subscription active OR trial_sends_remaining > 0
4. If blocked → redirect to billing
5. If allowed:
   a. Call Resend API with template + contact email
   b. Create message record with status = 'pending'
   c. Update status based on Resend response
   d. Decrement trial_sends_remaining (if on trial)
6. Return success/failure to UI
```

### Stripe Integration

```
Subscription Flow:
1. User hits send limit
2. Redirect to /billing
3. Create Stripe Checkout session
4. User completes payment
5. Stripe webhook fires
6. Update profile: subscription_status = 'active'

Webhook Events to Handle:
- checkout.session.completed → activate subscription
- customer.subscription.updated → sync status
- customer.subscription.deleted → cancel access
- invoice.payment_failed → handle failed payment
```

## Build Order (Suggested Phases)

1. **Foundation**: Next.js setup, Supabase connection, Auth
2. **Core Data**: Business + Contact CRUD
3. **Email Sending**: Resend integration, message logging
4. **Billing**: Stripe subscription, trial limits
5. **Polish**: Onboarding wizard, UX improvements
6. **Multi-location**: Pro tier features

## Sources
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SaaS Architecture Patterns](https://medium.com/appfoster/architecture-patterns-for-saas-platforms-billing-rbac-and-onboarding-964ea071f571)
- [Next.js + Supabase SaaS Guide](https://utsavdesai26.medium.com/build-a-saas-app-with-next-js-and-supabase-complete-project-guide-b29f45d5c292)
