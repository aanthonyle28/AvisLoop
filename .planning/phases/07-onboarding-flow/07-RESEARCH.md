# Phase 7: Onboarding Flow - Research

**Researched:** 2026-01-27
**Domain:** Multi-step onboarding wizard with progress tracking and dashboard checklists
**Confidence:** HIGH

## Summary

Phase 7 builds a guided first-time setup experience for new users, ensuring they complete critical setup steps (business profile, review link, contacts, first send) before experiencing the core product value. The technical domain involves multi-step wizards, progress indicators, state persistence, dashboard checklists, and validation-based blocking logic.

The standard approach for 2026 uses URL-based step navigation for bookmarkability, React Hook Form with Zod for per-step validation, localStorage for draft state persistence, and a database-backed completion tracking system. Modern UX patterns emphasize skippable flows where possible, persistent progress indicators, and "next best action" recommendations on the dashboard rather than blocking full-screen takeovers.

Key architectural decisions: Database tracks onboarding completion steps (not just localStorage) for cross-device consistency and analytics. Wizard state uses URL params for current step, localStorage for draft data, and server validation before advancing. Dashboard checklist remains visible until all steps complete, with smart recommendations based on completion state.

**Primary recommendation:** Build a lightweight 4-step wizard (business → review link → contact → send) accessible from dashboard, not forced on first login. Use database column `onboarding_completed_at` on businesses table to track completion. Show persistent dashboard checklist until done. Block send action server-side if prerequisites missing (existing pattern already implemented).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Hook Form | ^7.71.1 | Form state management per step | Already installed, proven pattern in codebase |
| Zod | ^4.3.6 | Schema validation per step | Already installed, existing business/contact schemas |
| Next.js App Router | latest | URL-based step routing | Project standard, searchParams for current step |
| shadcn/ui Dialog | - | Modal wizard container | Existing pattern, focused blocking interaction |
| localStorage | native | Draft state persistence across steps | Built-in, survives page refresh |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.511.0 | Progress indicators, step icons | Already installed, consistent iconset |
| Supabase | latest | Track completion in businesses table | Existing pattern, cross-device persistence |
| clsx / tailwind-merge | installed | Conditional step styling | Active/completed/pending states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL params for steps | Client state (useState) | Client state loses bookmarkability, breaks back button |
| Database tracking | localStorage only | localStorage doesn't sync across devices, no analytics |
| Dialog component | Full-page wizard | Full-page is disruptive, Dialog allows escape hatch |
| Per-step validation | Single form validation | Per-step validation provides immediate feedback, reduces cognitive load |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/onboarding/
├── page.tsx                      # Server Component - fetches business, redirects if complete
components/onboarding/
├── onboarding-wizard.tsx         # Client Component - wizard shell with step navigation
├── onboarding-progress.tsx       # Progress indicator (step X of Y)
├── steps/
│   ├── business-step.tsx         # Step 1: Business name + review link
│   ├── contact-step.tsx          # Step 2: Add first contact
│   └── send-step.tsx             # Step 3: Send first request
components/dashboard/
├── onboarding-checklist.tsx      # Persistent checklist widget
└── next-action-card.tsx          # "What to do next" recommendation
lib/data/
└── onboarding.ts                 # Track completion logic
migrations/
└── 00008_add_onboarding.sql      # Add tracking column to businesses
```

### Pattern 1: URL-Based Step Navigation with Draft Persistence

**What:** Wizard steps stored in URL for navigation, draft data in localStorage for recovery, completion status in database.

**When to use:** Multi-step onboarding that must survive page refresh, back button navigation, or user abandonment.

**Example:**
```typescript
// app/(dashboard)/onboarding/page.tsx (Server Component)
// Source: Next.js App Router pattern (https://nextjs.org/docs/app/api-reference/file-conventions/page)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if onboarding already completed
  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_completed_at, google_review_link')
    .eq('user_id', user.id)
    .single()

  // If already onboarded, redirect to dashboard
  if (business?.onboarding_completed_at) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const currentStep = parseInt(params.step || '1')

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <OnboardingWizard
        initialStep={currentStep}
        businessId={business?.id}
        hasReviewLink={!!business?.google_review_link}
      />
    </div>
  )
}
```

```typescript
// components/onboarding/onboarding-wizard.tsx (Client Component)
// Source: Community pattern for multi-step forms with localStorage persistence

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { OnboardingProgress } from './onboarding-progress'
import { BusinessStep } from './steps/business-step'
import { ContactStep } from './steps/contact-step'
import { SendStep } from './steps/send-step'

const STEPS = [
  { id: 1, title: 'Business Info', component: BusinessStep },
  { id: 2, title: 'Add Contact', component: ContactStep },
  { id: 3, title: 'Send Request', component: SendStep },
]

export function OnboardingWizard({
  initialStep,
  businessId,
  hasReviewLink
}: {
  initialStep: number
  businessId?: string
  hasReviewLink: boolean
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [draftData, setDraftData] = useState<Record<string, any>>({})

  // Load draft data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-draft')
    if (saved) {
      try {
        setDraftData(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse onboarding draft', e)
      }
    }
  }, [])

  // Save draft data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(draftData).length > 0) {
      localStorage.setItem('onboarding-draft', JSON.stringify(draftData))
    }
  }, [draftData])

  const goToStep = (step: number) => {
    setCurrentStep(step)
    router.push(`/onboarding?step=${step}`, { scroll: false })
  }

  const handleStepComplete = (stepData: any) => {
    setDraftData({ ...draftData, ...stepData })

    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1)
    } else {
      // Mark onboarding as complete
      completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    // Clear draft
    localStorage.removeItem('onboarding-draft')

    // Redirect to dashboard
    router.push('/dashboard?onboarding=complete')
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="space-y-6">
      <OnboardingProgress currentStep={currentStep} totalSteps={STEPS.length} />

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <CurrentStepComponent
          onComplete={handleStepComplete}
          onSkip={() => goToStep(currentStep + 1)}
          draftData={draftData}
          businessId={businessId}
        />
      </div>

      {/* Skip button for optional steps */}
      <div className="text-center">
        <button
          onClick={() => goToStep(currentStep + 1)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip this step
        </button>
      </div>
    </div>
  )
}
```

### Pattern 2: Per-Step Validation with React Hook Form

**What:** Each wizard step is a separate form with its own validation schema, preventing invalid data from advancing.

**When to use:** Multi-step forms where each step must be valid before proceeding.

**Example:**
```typescript
// components/onboarding/steps/business-step.tsx
// Source: React Hook Form multi-step pattern (https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form)

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const businessStepSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  reviewLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type BusinessStepData = z.infer<typeof businessStepSchema>

export function BusinessStep({
  onComplete,
  draftData
}: {
  onComplete: (data: BusinessStepData) => void
  draftData: any
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<BusinessStepData>({
    resolver: zodResolver(businessStepSchema),
    defaultValues: {
      businessName: draftData.businessName || '',
      reviewLink: draftData.reviewLink || '',
    }
  })

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Set up your business</h2>
        <p className="text-muted-foreground mb-6">
          Let's start with the basics about your business.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Business Name <span className="text-red-500">*</span>
        </label>
        <Input
          {...register('businessName')}
          placeholder="Acme Coffee Shop"
        />
        {errors.businessName && (
          <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Google Review Link
        </label>
        <Input
          {...register('reviewLink')}
          placeholder="https://search.google.com/local/writereview?placeid=..."
        />
        {errors.reviewLink && (
          <p className="text-sm text-red-600 mt-1">{errors.reviewLink.message}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          You can add this later in settings
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  )
}
```

### Pattern 3: Dashboard Checklist with Completion Tracking

**What:** Persistent checklist widget on dashboard showing incomplete onboarding steps with links to complete them.

**When to use:** Non-blocking onboarding where users can explore the product while being reminded of setup tasks.

**Example:**
```typescript
// components/dashboard/onboarding-checklist.tsx
// Source: SaaS onboarding checklist pattern (https://userguiding.com/blog/onboarding-checklists)

'use client'

import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ChecklistItem = {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
}

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length
  const progress = (completedCount / totalCount) * 100

  // Don't show if all complete
  if (completedCount === totalCount) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Get Started</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-6">
        <div
          className="h-2 bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                item.completed && "text-muted-foreground line-through"
              )}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 4: Database-Backed Completion Tracking

**What:** Store onboarding completion state in database for cross-device consistency and analytics.

**When to use:** Always. localStorage alone doesn't sync across devices or survive account migrations.

**Example:**
```sql
-- migrations/00008_add_onboarding.sql
-- Track onboarding completion at business level

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '[]'::jsonb;

-- Index for querying incomplete onboardings
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_incomplete
  ON public.businesses(user_id)
  WHERE onboarding_completed_at IS NULL;

COMMENT ON COLUMN public.businesses.onboarding_completed_at IS
  'Timestamp when user completed initial onboarding wizard';
COMMENT ON COLUMN public.businesses.onboarding_steps_completed IS
  'Array of completed step IDs for granular tracking';
```

```typescript
// lib/data/onboarding.ts
// Source: Pattern from existing lib/data/*.ts files

import { createClient } from '@/lib/supabase/server'

export type OnboardingStatus = {
  completed: boolean
  completedAt: string | null
  steps: {
    hasBusinessProfile: boolean
    hasReviewLink: boolean
    hasContacts: boolean
    hasSentMessage: boolean
  }
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_completed_at, google_review_link')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return {
      completed: false,
      completedAt: null,
      steps: {
        hasBusinessProfile: false,
        hasReviewLink: false,
        hasContacts: false,
        hasSentMessage: false,
      }
    }
  }

  // Check contacts exist
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'active')

  // Check if any messages sent
  const { count: sendCount } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  return {
    completed: !!business.onboarding_completed_at,
    completedAt: business.onboarding_completed_at,
    steps: {
      hasBusinessProfile: !!business.id,
      hasReviewLink: !!business.google_review_link,
      hasContacts: (contactCount || 0) > 0,
      hasSentMessage: (sendCount || 0) > 0,
    }
  }
}

export async function markOnboardingComplete(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('businesses')
    .update({
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
}
```

### Pattern 5: Next Best Action Recommendation

**What:** Show smart recommendation based on current onboarding state, not just checklist.

**When to use:** Dashboard landing page after user dismisses or completes onboarding checklist.

**Example:**
```typescript
// components/dashboard/next-action-card.tsx
// Source: AI-driven UX pattern (https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026)

'use client'

import { ArrowRight, Users, Send, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type NextAction = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  variant: 'default' | 'secondary'
}

export function NextActionCard({ status }: { status: any }) {
  const action = determineNextAction(status)

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          {action.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{action.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {action.description}
          </p>
          <Button asChild variant={action.variant}>
            <Link href={action.href}>
              {action.title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function determineNextAction(status: any): NextAction {
  if (!status.steps.hasReviewLink) {
    return {
      title: 'Add your review link',
      description: 'Connect your Google Business Profile to start collecting reviews.',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  if (!status.steps.hasContacts) {
    return {
      title: 'Add your first contact',
      description: 'Import or manually add customers to send review requests.',
      href: '/contacts',
      icon: <Users className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  if (!status.steps.hasSentMessage) {
    return {
      title: 'Send your first request',
      description: 'Choose a contact and send your first review request.',
      href: '/send',
      icon: <Send className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  return {
    title: 'View your sent messages',
    description: 'Check the status of your review requests and follow up.',
    href: '/history',
    icon: <Send className="h-5 w-5 text-primary" />,
    variant: 'secondary',
  }
}
```

### Anti-Patterns to Avoid

- **Full-screen blocking onboarding:** Don't force users through onboarding before exploring product. Use persistent checklist instead. Reason: Modern users dismiss full-screen takeovers instinctively, high abandonment rate.
- **Single massive form:** Don't put all onboarding steps in one form. Break into digestible steps. Reason: Cognitive overload, lower completion rates.
- **localStorage-only tracking:** Don't rely solely on localStorage for completion state. Use database. Reason: Doesn't sync across devices, lost on cache clear.
- **Blocking UI for optional steps:** Don't prevent product access for non-critical setup. Only block actions that truly require setup (e.g., send without review link). Reason: Frustrating UX, artificially extends time-to-value.
- **Ignoring existing validation:** Don't duplicate validation logic. Reuse existing server-side validation from settings/send actions. Reason: Maintenance burden, inconsistency.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step form state | Custom step manager | URL params + localStorage + React Hook Form | URL provides bookmarkability, localStorage survives refresh, RHF handles validation |
| Progress indicator UI | Custom SVG progress bar | shadcn Progress component + percentage calculation | Accessible, responsive, customizable |
| Step validation | Custom validation logic | Zod schemas per step + zodResolver | Type-safe, reusable schemas, consistent error format |
| Completion tracking | Complex state machine | Database column + JSONB steps array | Queryable, auditable, cross-device consistent |
| Draft persistence | Manual localStorage sync | useEffect + JSON.stringify pattern | Handles serialization edge cases, cleanup on completion |

**Key insight:** Onboarding wizards have well-established patterns in 2026. The contacts import, business settings, and send pages already demonstrate the required validation patterns. Don't reinvent - compose existing forms into wizard steps with navigation wrapper.

## Common Pitfalls

### Pitfall 1: Forced Linear Flow When Steps Are Independent

**What goes wrong:** Wizard requires Step 1 → 2 → 3 even when steps don't depend on each other, preventing users from completing tasks in preferred order.

**Why it happens:** Assuming wizard = strict sequence without analyzing actual dependencies.

**How to avoid:** Allow navigation to any step that doesn't have unmet prerequisites. Example: Business profile and first contact are independent - user can add contact first if they want.

```typescript
// Allow jumping to steps if prerequisites met
const canAccessStep = (step: number) => {
  if (step === 1) return true // Business profile always accessible
  if (step === 2) return true // Contact independent of business
  if (step === 3) return hasReviewLink && hasContacts // Send requires both
  return false
}
```

**Warning signs:** User feedback about "forced order", high abandonment on early steps.

### Pitfall 2: Not Handling Partial Completion

**What goes wrong:** User completes 2 of 3 steps, leaves, returns, wizard starts from beginning losing progress.

**Why it happens:** No persistence strategy or forgetting to restore from localStorage/database on mount.

**How to avoid:** Always check database for completion state first, then localStorage for draft data, then default to step 1:

```typescript
useEffect(() => {
  // 1. Check database completion (from server props)
  if (onboardingStatus.completed) {
    redirect('/dashboard')
    return
  }

  // 2. Determine furthest incomplete step
  const nextStep = determineCurrentStep(onboardingStatus)

  // 3. Load draft data from localStorage
  const draft = localStorage.getItem('onboarding-draft')
  if (draft) {
    setDraftData(JSON.parse(draft))
  }

  // 4. Navigate to appropriate step
  if (currentStep === 1 && nextStep > 1) {
    goToStep(nextStep)
  }
}, [])
```

**Warning signs:** Users report "losing progress", analytics show repeated step 1 starts.

### Pitfall 3: Skippable Steps Without Smart Defaults

**What goes wrong:** User skips "add review link" step, later tries to send and is blocked with no context.

**Why it happens:** Allowing skip without explaining consequences or providing easy path to complete later.

**How to avoid:** When allowing skip:
1. Show inline message: "You can add this later in Settings, but you'll need it before sending."
2. Add to dashboard checklist as incomplete
3. Provide clear CTA from blocking state back to missing field

Existing pattern in codebase already handles this for send page:
```typescript
if (!business.google_review_link) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
      <h2 className="font-semibold text-yellow-800 mb-2">Setup Required</h2>
      <p className="text-yellow-700 mb-4">
        Please add your Google review link in settings before sending.
      </p>
      <a href="/dashboard/settings">Go to Settings</a>
    </div>
  )
}
```

**Warning signs:** Support tickets about "can't send", user confusion about missing setup.

### Pitfall 4: Progress Indicator Not Matching Reality

**What goes wrong:** Progress shows "Step 2 of 3" but step 2 is optional and skippable, causing confusion.

**Why it happens:** Hardcoding step count without considering optional steps.

**How to avoid:** Calculate progress based on required steps only, or show completion percentage instead:

```typescript
// Option 1: Required steps only
const requiredSteps = steps.filter(s => !s.optional)
const progress = `${currentRequiredStep} of ${requiredSteps.length}`

// Option 2: Percentage based on completion
const completedSteps = steps.filter(s => s.completed).length
const progress = `${Math.round((completedSteps / steps.length) * 100)}% complete`
```

**Warning signs:** Users ask "why is this step 3 of 3 if there are 4 steps?"

### Pitfall 5: Onboarding Completion Never Marked

**What goes wrong:** User completes all steps, dashboard still shows checklist, "next action" never progresses.

**Why it happens:** Forgot to update database `onboarding_completed_at` timestamp when final step completes.

**How to avoid:** Add explicit completion marker when all required steps done:

```typescript
const completeOnboarding = async () => {
  // 1. Clear draft
  localStorage.removeItem('onboarding-draft')

  // 2. Mark complete in database
  await fetch('/api/onboarding/complete', { method: 'POST' })

  // 3. Redirect with success flag
  router.push('/dashboard?onboarding=complete')
}

// Server action
export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('businesses')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
}
```

**Warning signs:** Dashboard checklist never disappears, analytics show 0% completion despite user activity.

### Pitfall 6: Race Condition on Parallel Saves

**What goes wrong:** User rapidly clicks through steps, multiple requests to save business/contacts fire simultaneously, last-write-wins causes data loss.

**Why it happens:** Not disabling form while save is in progress, allowing rapid step advancement.

**How to avoid:** Use React Hook Form's `isSubmitting` state and disable navigation during save:

```typescript
const { handleSubmit, formState: { isSubmitting } } = useForm()

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Continue'}
</Button>

// Don't allow manual step change while saving
const goToStep = (step: number) => {
  if (isSubmitting) return
  setCurrentStep(step)
  router.push(`/onboarding?step=${step}`)
}
```

**Warning signs:** Intermittent data loss, users report "my info didn't save."

## Code Examples

Verified patterns from official sources:

### Progress Indicator Component

```typescript
// components/onboarding/onboarding-progress.tsx
// Source: Common pattern from PatternFly, Carbon Design System

import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OnboardingProgress({
  currentStep,
  totalSteps
}: {
  currentStep: number
  totalSteps: number
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          {/* Step circle */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2",
            step < currentStep && "bg-primary border-primary text-primary-foreground",
            step === currentStep && "border-primary text-primary",
            step > currentStep && "border-muted text-muted-foreground"
          )}>
            {step < currentStep ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>

          {/* Connecting line */}
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-2",
              step < currentStep ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
```

### Skip Step Pattern

```typescript
// Skippable step with warning
// Source: UX pattern from Wizard UI guidelines (https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)

export function SkippableStep({ onSkip, onComplete }) {
  return (
    <div className="space-y-4">
      {/* Step content */}
      <form onSubmit={handleSubmit(onComplete)}>
        {/* fields */}
        <Button type="submit">Complete Step</Button>
      </form>

      {/* Skip option */}
      <div className="pt-4 border-t">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
        <p className="text-xs text-muted-foreground mt-1">
          You can complete this later in Settings
        </p>
      </div>
    </div>
  )
}
```

### Checklist Item Calculation

```typescript
// lib/data/onboarding.ts - Calculate checklist items
// Source: Pattern from onboarding status query

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const status = await getOnboardingStatus()
  if (!status) return []

  return [
    {
      id: 'business',
      title: 'Set up business profile',
      description: 'Add your business name and details',
      href: '/dashboard/settings',
      completed: status.steps.hasBusinessProfile,
    },
    {
      id: 'review-link',
      title: 'Add Google review link',
      description: 'Connect your Google Business Profile',
      href: '/dashboard/settings',
      completed: status.steps.hasReviewLink,
    },
    {
      id: 'contact',
      title: 'Add your first contact',
      description: 'Import or create a customer contact',
      href: '/contacts',
      completed: status.steps.hasContacts,
    },
    {
      id: 'send',
      title: 'Send your first review request',
      description: 'Start collecting reviews',
      href: '/send',
      completed: status.steps.hasSentMessage,
    },
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-screen blocking wizard | Persistent dashboard checklist | 2023-2024 | Lower abandonment, users explore product first |
| Client-only state (useState) | URL + localStorage + database | App Router era | Survives refresh, cross-device, analytics |
| Single validation schema | Per-step validation | React Hook Form v7+ | Immediate feedback, lower cognitive load |
| Linear forced flow | Skippable + conditional steps | Modern UX patterns | Respects user agency, faster time-to-value |
| Generic "setup wizard" | Contextual "next best action" | AI-driven UX 2025+ | Personalized guidance, proactive suggestions |

**Deprecated/outdated:**
- Multi-page wizard with server-side session state (PHP era): Use client-side SPA patterns with Next.js
- jQuery-based step animations: Use Framer Motion or CSS transitions
- localStorage without encryption for sensitive data: Use server-side storage, localStorage only for non-sensitive drafts

## Open Questions

Things that couldn't be fully resolved:

1. **When to trigger onboarding wizard**
   - What we know: Forcing it on first login is discouraged (high abandonment), persistent checklist is preferred
   - What's unclear: Exact trigger point - on first dashboard visit? After email verification? On explicit "Get Started" button?
   - Recommendation: Show dashboard checklist immediately after signup. Add prominent "Quick Setup" button on empty dashboard. Don't auto-launch wizard unless user clicks. This balances discoverability with user control.

2. **Onboarding completion criteria**
   - What we know: All 4 steps (business, review link, contact, send) are ideal, but some can be skipped
   - What's unclear: Should completion require all 4 steps, or just "first value moment" (business + review link)?
   - Recommendation: Mark complete when first message sent (true "aha moment"). Checklist remains visible until all 4 done, but onboarding_completed_at is set on first send. This tracks user reaching value vs. full setup.

3. **Multi-wizard approach vs. single wizard**
   - What we know: Business settings and contact creation already have dedicated pages/forms
   - What's unclear: Build dedicated onboarding wizard, or use existing pages with "onboarding mode" UI?
   - Recommendation: Build dedicated wizard that reuses existing form components (BusinessStep wraps BusinessSettingsForm logic). Keeps onboarding experience cohesive while avoiding duplication. Wizard is simpler, focused, uses inline forms rather than navigating to settings page.

4. **Persistent wizard vs. dismissible**
   - What we know: Users should be able to skip onboarding and explore
   - What's unclear: Should wizard be dismissible (with option to resume), or only accessible via explicit "Continue Setup" button?
   - Recommendation: Make wizard accessible from dashboard "Get Started" card, not auto-launching modal. Checklist always visible until complete (can't dismiss). This provides non-intrusive guidance without blocking exploration.

## Sources

### Primary (HIGH confidence)

- [Next.js App Router Documentation](https://nextjs.org/docs/app) - searchParams pattern, Server Components
- [React Hook Form v7 Documentation](https://react-hook-form.com/) - Multi-step form handling (via Context7: /react-hook-form/react-hook-form)
- [Zod Documentation](https://zod.dev/) - Schema validation per step
- Existing codebase patterns:
  - `app/dashboard/settings/page.tsx` - Business form pattern
  - `components/contacts/add-contact-sheet.tsx` - Contact form pattern
  - `app/(dashboard)/send/page.tsx` - Blocking validation pattern (lines 17-35)
  - `lib/actions/business.ts` - Server-side validation with Zod

### Secondary (MEDIUM confidence)

- [Build with Matija: React Hook Form Multi-Step Tutorial](https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-react-form-in-6-simple-steps) - Zustand + Zod pattern (February 2025)
- [LogRocket: Building Reusable Multi-Step Form](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) - Context-based approach
- [User Onboarding Checklists Best Practices](https://userguiding.com/blog/onboarding-checklists) - UX patterns for completion tracking
- [SaaS Onboarding Best Practices 2025](https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding) - Progress indicators, non-blocking patterns
- [10 AI-Driven UX Patterns Transforming SaaS in 2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026) - Next best action recommendations
- [Wizard UI Pattern Explained](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) - Skippable steps pattern
- [PatternFly Wizard Guidelines](https://www.patternfly.org/components/wizard/design-guidelines/) - Progress indicator UI patterns
- [Best Practices for Persisting State in Frontend Applications](https://blog.pixelfreestudio.com/best-practices-for-persisting-state-in-frontend-applications/) - localStorage strategies
- [Mastering State Persistence with Local Storage in React](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c) - Implementation patterns

### Community Patterns (MEDIUM confidence)

- [NextStepjs Library](https://nextstepjs.com/) - Lightweight Next.js onboarding library
- [Onborda Library](https://github.com/uixmat/onborda) - Next.js + Framer Motion wizard
- [GitHub Discussion: Multi-step Form with React Hook Form](https://github.com/orgs/react-hook-form/discussions/4028) - Validation strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed (React Hook Form, Zod, Next.js App Router), existing patterns in codebase
- Architecture: HIGH - URL params pattern documented in Next.js, localStorage persistence is well-established, database tracking follows existing schema patterns
- Pitfalls: HIGH - Common onboarding pitfalls well-documented in UX research, technical pitfalls verified from React Hook Form docs and community discussions
- UX patterns: MEDIUM - Checklist and next action patterns from multiple sources but no single authoritative source, implementation details are discretionary

**Research date:** 2026-01-27
**Valid until:** ~2026-02-27 (30 days, stable domain)

**Notes:**
- No new dependencies required except potentially Framer Motion for animations (optional)
- Existing blocking logic in send page (lines 17-35) demonstrates pattern for validation enforcement
- Business settings form and contact creation already exist - wizard will compose these patterns
- Database schema extension is minimal (2 columns on businesses table)
- React Hook Form + Zod pattern already proven in contacts and business forms
