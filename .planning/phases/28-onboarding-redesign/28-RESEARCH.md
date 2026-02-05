# Phase 28: Onboarding Redesign - Research

**Researched:** 2026-02-04
**Domain:** Multi-step form UX, URL shortening, email authentication
**Confidence:** HIGH

## Summary

Phase 28 redesigns the onboarding wizard from 2 steps to 7 steps, collecting business essentials, review destination setup, services offered, software used, campaign preset selection, customer import, and SMS consent capture. The current onboarding (Phase 7/16) uses a simple 2-step wizard with localStorage draft persistence and URL-based step navigation. This redesign builds on existing infrastructure from Phase 20 (CSV import), Phase 22 (service types), and Phase 24 (campaign presets).

The standard approach for multi-step forms in Next.js App Router 2026 is React Hook Form + Zod with URL state management (via useSearchParams) and context-based step orchestration. URL shortening for branded review links should use Bitly API or Rebrandly (both offer free tiers with custom domains). Email authentication (SPF/DKIM/DMARC) is already handled by Resend automatically, requiring only DNS record verification UI in settings.

Key architectural insight: This phase is primarily **composition and integration** rather than new feature development. Most functionality already exists (CSV import dialog, service type selectors, campaign preset picker, SMS consent fields). The wizard shell orchestrates existing components with step validation and progress tracking.

**Primary recommendation:** Reuse existing onboarding wizard shell (onboarding-wizard.tsx), replace step components with new 7-step flow, compose existing components (CSVImportDialog, PresetPicker, ServiceTypesSection) into onboarding steps, and add new Email Setup Checklist and Branded Links components as settings-only features (not blocking onboarding completion).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Hook Form | 7.71.1+ | Form state management | Already in package.json, uncontrolled component pattern with excellent performance |
| Zod | 4.3.6+ | Schema validation | Already in package.json, type-safe validation with RHF resolver |
| useSearchParams | Next.js built-in | URL state management | Native Next.js App Router hook for query param state persistence |
| localStorage | Browser native | Draft persistence | Simple, synchronous, no dependencies, current implementation working well |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nuqs | 2.x (optional) | Typed URL state | Only if useSearchParams becomes too cumbersome (not needed for simple step navigation) |
| PapaParse | 5.5.3+ | CSV parsing | Already used in Phase 20 CSV import component |
| react-dropzone | 14.3.8+ | File upload UI | Already used in Phase 20 CSV import dialog |
| libphonenumber-js | 1.12.36+ | Phone validation | Already used in Phase 20 for E.164 formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bitly API | Rebrandly API | Rebrandly focuses on branded domains (39% higher click rates), slightly more expensive ($13/mo vs $10/mo), better for brand trust |
| Bitly API | Self-hosted YOURLS | Free but requires server setup, maintenance burden, not worth it for Phase 28 scope |
| Bitly API | TinyURL API | Simpler but weaker analytics, acceptable alternative if Bitly rate limits are concern |

**Installation:**
```bash
# No new dependencies needed for core wizard functionality
# All required libraries already in package.json

# Only add if implementing URL shortening (deferred to post-onboarding):
npm install @bitly/bitly-api-client  # If using Bitly
# OR
npm install rebrandly-sdk  # If using Rebrandly
```

## Architecture Patterns

### Recommended Project Structure
```
components/
├── onboarding/
│   ├── onboarding-wizard.tsx      # Shell (existing, modify step config)
│   ├── onboarding-steps.tsx       # Step router (existing, expand cases)
│   ├── onboarding-progress.tsx    # Progress bar (existing, works as-is)
│   └── steps/                     # New directory for step components
│       ├── business-basics-step.tsx     # Step 1: Name, phone, Google link
│       ├── review-destination-step.tsx  # Step 2: Verify Google link
│       ├── services-offered-step.tsx    # Step 3: Service type multiselect
│       ├── software-used-step.tsx       # Step 4: Integration capture
│       ├── campaign-preset-step.tsx     # Step 5: Preset selection
│       ├── customer-import-step.tsx     # Step 6: CSV upload or manual
│       └── sms-consent-step.tsx         # Step 7: Consent explanation
├── settings/
│   ├── email-auth-checklist.tsx   # SPF/DKIM/DMARC guidance (new)
│   └── branded-links-section.tsx  # Short link config (new, deferred)
lib/
├── actions/
│   ├── onboarding.ts              # Existing (add step completion actions)
│   └── url-shortener.ts           # New (deferred to post-launch)
└── validations/
    └── onboarding.ts              # New (step-specific Zod schemas)
```

### Pattern 1: Multi-Step Wizard with URL State
**What:** Step navigation controlled by URL query param (?step=N), form state persisted to localStorage, each step validates independently before navigation.

**When to use:** Multi-step onboarding flows where users may navigate away and return, shareable step URLs, browser back/forward support.

**Example:**
```typescript
// Source: Current implementation (onboarding-wizard.tsx) + React Hook Form docs
// https://react-hook-form.com/advanced-usage

const STEPS = [
  { id: 1, title: 'Business Basics', skippable: false },
  { id: 2, title: 'Review Destination', skippable: true },
  { id: 3, title: 'Services Offered', skippable: false },
  { id: 4, title: 'Software Used', skippable: true },
  { id: 5, title: 'Campaign Preset', skippable: false },
  { id: 6, title: 'Import Customers', skippable: true },
  { id: 7, title: 'SMS Consent', skippable: false },
]

function OnboardingWizard({ initialStep }: { initialStep: number }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [draftData, setDraftData] = useState<Record<string, unknown>>({})

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-draft')
    if (saved) {
      const result = draftDataSchema.safeParse(JSON.parse(saved))
      if (result.success) setDraftData(result.data)
    }
  }, [])

  // Save draft on change
  useEffect(() => {
    if (Object.keys(draftData).length > 0) {
      localStorage.setItem('onboarding-draft', JSON.stringify(draftData))
    }
  }, [draftData])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
    router.push(`/onboarding?step=${step}`, { scroll: false })
  }, [router])

  return (
    <OnboardingSteps
      currentStep={currentStep}
      onGoToNext={() => goToStep(currentStep + 1)}
      onGoBack={() => goToStep(currentStep - 1)}
      onComplete={handleComplete}
    />
  )
}
```

### Pattern 2: Step Component Composition
**What:** Each step is a Client Component with its own form, validation, and submission logic. Steps use existing components where possible (CSVImportDialog, PresetPicker, ServiceTypesSection).

**When to use:** When step functionality already exists as standalone components (Phase 20 CSV import, Phase 24 preset picker), or when step logic is complex enough to warrant isolation.

**Example:**
```typescript
// Source: LogRocket multi-step form guide + current onboarding-steps.tsx
// https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/

function OnboardingSteps({ currentStep, onGoToNext, onComplete }: Props) {
  switch (currentStep) {
    case 1:
      return <BusinessBasicsStep onComplete={onGoToNext} />
    case 2:
      return <ReviewDestinationStep onComplete={onGoToNext} />
    case 3:
      return <ServicesOfferedStep onComplete={onGoToNext} />
    case 4:
      return <SoftwareUsedStep onComplete={onGoToNext} />
    case 5:
      return <CampaignPresetStep onComplete={onGoToNext} />
    case 6:
      return <CustomerImportStep onComplete={onGoToNext} />
    case 7:
      return <SMSConsentStep onComplete={onComplete} />
    default:
      return null
  }
}

// Step 6 example: Compose existing CSV import dialog
function CustomerImportStep({ onComplete }: { onComplete: () => void }) {
  const [imported, setImported] = useState(false)

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Import your customers</h1>
        <p className="text-muted-foreground text-lg">
          Upload a CSV file or add customers manually. You can skip this step and add them later.
        </p>
      </div>

      {/* Reuse existing CSV import dialog component */}
      <CSVImportDialog onSuccess={() => setImported(true)} />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onComplete}>
          Skip for now
        </Button>
        <Button onClick={onComplete} disabled={!imported}>
          {imported ? 'Continue' : 'Import first'}
        </Button>
      </div>
    </div>
  )
}
```

### Pattern 3: Conditional Step Validation
**What:** Required steps block navigation until valid data submitted. Skippable steps allow navigation without submission. Validation uses Zod schemas per step.

**When to use:** Multi-step forms with mix of required and optional steps, where some steps gate critical data (business name, services) and others are convenience features (software integration capture).

**Example:**
```typescript
// Source: React Hook Form advanced usage + LogRocket guide
// https://react-hook-form.com/advanced-usage
// https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/

const step3Schema = z.object({
  serviceTypes: z.array(z.enum([
    'hvac', 'plumbing', 'electrical', 'cleaning',
    'roofing', 'painting', 'handyman', 'other'
  ])).min(1, 'Select at least one service type'),
})

function ServicesOfferedStep({ onComplete }: { onComplete: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate with Zod
    const result = step3Schema.safeParse({ serviceTypes: selected })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    // Save to database
    const formData = new FormData()
    formData.append('serviceTypes', JSON.stringify(selected))

    const response = await updateServiceTypes(null, formData)
    if (response.success) {
      onComplete()
    } else {
      setError(response.error || 'Failed to save')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Multi-select checkbox group */}
      <ServiceTypeCheckboxGroup
        selected={selected}
        onChange={setSelected}
      />
      {error && <p className="text-red-600">{error}</p>}
      <Button type="submit">Continue</Button>
    </form>
  )
}
```

### Pattern 4: Email Authentication Checklist (Settings Only)
**What:** Non-blocking guidance panel showing DNS record verification status. Display-only UI, no actual DNS verification API (Resend handles this in their dashboard).

**When to use:** Features that improve deliverability but are not blockers to core functionality. Users should be able to use the app immediately while DNS propagates (24-48 hours).

**Example:**
```typescript
// Source: Resend DMARC setup guide
// https://resend.com/docs/dashboard/domains/dmarc
// https://resend.com/blog/email-authentication-a-developers-guide

function EmailAuthChecklist() {
  // Static guidance, no verification API
  const steps = [
    {
      id: 'spf',
      label: 'SPF Record',
      description: 'Add Resend SPF record to DNS',
      status: 'pending' as const,
      instructions: 'Add TXT record to resend.mail.yourdomain.com with value from Resend dashboard',
      docsUrl: 'https://resend.com/docs/dashboard/domains/spf',
    },
    {
      id: 'dkim',
      label: 'DKIM Signature',
      description: 'Enable email signing',
      status: 'pending' as const,
      instructions: 'Add DKIM TXT record to resend.mail.yourdomain.com from Resend dashboard',
      docsUrl: 'https://resend.com/docs/dashboard/domains/dkim',
    },
    {
      id: 'dmarc',
      label: 'DMARC Policy',
      description: 'Set email authentication policy',
      status: 'pending' as const,
      instructions: 'Add TXT record to _dmarc.yourdomain.com starting with p=none',
      docsUrl: 'https://resend.com/docs/dashboard/domains/dmarc',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Email authentication is handled by Resend. Add DNS records to improve deliverability.
          Verification happens in your Resend dashboard (records can take 24-48 hours to propagate).
        </p>
      </div>

      <div className="space-y-3">
        {steps.map(step => (
          <div key={step.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{step.label}</h4>
              <Badge variant="secondary">{step.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
            <p className="text-xs text-muted-foreground mb-2">{step.instructions}</p>
            <a
              href={step.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View setup guide →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **FormProvider for simple wizard:** Current implementation doesn't use FormProvider context (adds complexity without benefit for independent step forms). Don't introduce it unless steps need to share validation state.
- **Blocking onboarding on DNS verification:** SPF/DKIM/DMARC can take 24-48 hours to propagate. These must be settings-only features, not onboarding blockers.
- **Custom URL shortening in Phase 28:** Branded links are DLVR-03 requirement but not critical for launch. Defer to post-onboarding settings feature, don't block wizard on API integration.
- **Rebuilding existing components:** CSV import dialog (Phase 20), campaign preset picker (Phase 24), service type selector (Phase 22) all exist and work well. Compose them into steps, don't rewrite.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing with encoding detection | Custom file reader with regex | PapaParse (5.5.3+) | Already in use (Phase 20), handles encoding, malformed rows, header mapping, 10K+ stars |
| Phone number validation | Regex patterns for formats | libphonenumber-js (1.12.36+) | Already in use (Phase 20), handles E.164 formatting, country codes, 200+ countries |
| URL shortening API integration | Direct fetch() to Bitly endpoints | @bitly/bitly-api-client npm package | Official SDK handles auth, rate limits, retries, TypeScript types |
| Multi-step form state management | Custom context + reducers | React Hook Form + localStorage | Current implementation works well, proven pattern from Phase 7/16 |
| Google review link validation | Regex for Google domains | URL constructor + .includes() check | Current implementation (onboarding-steps.tsx) is sufficient, Google link formats vary too much for strict regex |
| DNS record verification | API calls to DNS lookup services | Display-only checklist with Resend dashboard link | Resend already verifies DNS in their dashboard, no need to duplicate |

**Key insight:** Phase 28 is 80% composition of existing components, 20% new step shell logic. The heavy lifting (CSV import, phone validation, campaign creation, service type persistence) was done in Phases 20-24. The wizard shell just orchestrates existing functionality with new presentation.

## Common Pitfalls

### Pitfall 1: Blocking Onboarding on Slow External APIs
**What goes wrong:** Making campaign preset selection or URL shortening API calls synchronous steps that block wizard completion.

**Why it happens:** Requirements mention "auto-creates campaign" and "branded short links" which sound like wizard actions, but both can involve external API calls (database writes, Bitly API) that may fail or timeout.

**How to avoid:** Campaign creation happens in background after preset selection (async server action with loading state). Branded links are post-onboarding settings feature, not wizard blocker. Current wizard pattern (onboarding-wizard.tsx) uses `useTransition` for async actions correctly.

**Warning signs:** User stuck on "Creating campaign..." for >5 seconds, wizard completion fails due to Bitly rate limit, timeout errors in onboarding flow.

### Pitfall 2: SMS Consent Capture Without TCPA Compliance Audit Trail
**What goes wrong:** Adding checkbox "I consent to SMS" without capturing required TCPA fields (consent_at, consent_source, consent_method, consent_ip, consent_captured_by).

**Why it happens:** Consent seems like simple boolean, but TCPA Jan 2026 rules require full audit trail. Phase 20 added these fields to customers table but onboarding flow needs to populate them.

**How to avoid:** Step 7 SMS consent explanation must save all TCPA fields when user checks consent box. Use existing Phase 20 schema: `sms_consent_status='opted_in'`, `consent_method='form'`, `consent_source='onboarding'`, capture user IP and authenticated user ID.

**Warning signs:** Customers created with `sms_consent_status='unknown'` from onboarding, missing audit trail for TCPA compliance, SMS features skip onboarded customers.

### Pitfall 3: Google Review Link Format Assumptions
**What goes wrong:** Strict regex validation that rejects valid Google review links because format changed or business uses short link.

**Why it happens:** Google review links come in multiple formats: `https://g.page/r/...`, `https://search.google.com/local/writereview?placeid=...`, `maps.google.com`, custom g.page short domains. Writing regex to match all is fragile.

**How to avoid:** Use current validation pattern: `new URL(link)` to verify valid URL, `.includes('google.com')` to verify domain. Don't over-validate. Store as-is, display preview in Step 2 if possible (iframe may block, fall back to "link opens in new tab" message).

**Warning signs:** User complaints "my Google link doesn't work", validation rejecting `g.page` short links, hardcoded regex fails when Google changes URL structure.

### Pitfall 4: Service Type Timing Defaults Not Applied
**What goes wrong:** User selects service types in Step 3 but timing defaults (hvac: 24h, cleaning: 4h, etc.) aren't saved to `service_type_timing` JSONB column.

**Why it happens:** Phase 22 migration adds default timing in database, but if business record already exists (created in Step 1), defaults may not apply. Service type selection UI might only update `service_types_enabled` array without touching `service_type_timing`.

**How to avoid:** Step 3 server action must update BOTH `service_types_enabled` AND ensure `service_type_timing` JSONB has entries for each selected type. Use `COALESCE(service_type_timing, '{}'::jsonb)` in query, merge with defaults.

**Warning signs:** Campaign creation fails "no timing for service type", job completion doesn't trigger campaign enrollment, timing shows null instead of 24/48/72 hours.

### Pitfall 5: CSV Import Step Creates Duplicate Customers
**What goes wrong:** User imports CSV in Step 6, navigates back, imports again, creates duplicates.

**Why it happens:** CSV import dialog (CSVImportDialog component) works standalone but doesn't track "already imported in this session" state across step navigation.

**How to avoid:** Step 6 wrapper tracks import completion in localStorage draft data. If `draftData.customersImported === true`, show success state instead of upload dialog. Clear flag only on wizard reset.

**Warning signs:** Users report duplicate customers after completing onboarding, CSV import shows "X imported" but database has 2X records, email deduplication catches them.

## Code Examples

Verified patterns from official sources and current codebase:

### Reusing CSV Import in Onboarding Step
```typescript
// Source: Phase 20 CSV import component (csv-import-dialog.tsx)
// Pattern: Compose existing dialog into step wrapper

function CustomerImportStep({ onComplete, onGoBack }: StepProps) {
  const [importCount, setImportCount] = useState(0)

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Import your customers</h1>
        <p className="text-muted-foreground text-lg">
          Upload a CSV file with customer contact information. You can add more customers later.
        </p>
      </div>

      {/* Reuse existing CSV import dialog */}
      <div className="flex justify-center">
        <CSVImportDialog
          onImportComplete={(count) => setImportCount(count)}
        />
      </div>

      {importCount > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-300 font-medium">
            Successfully imported {importCount} customers
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onGoBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1"
        >
          {importCount > 0 ? 'Continue' : 'Skip for now'}
        </Button>
      </div>
    </div>
  )
}
```

### Campaign Preset Selection with Auto-Creation
```typescript
// Source: Phase 24 preset picker (preset-picker.tsx) + campaign actions
// Pattern: Select preset, duplicate to user's campaigns, navigate to edit

function CampaignPresetStep({ onComplete }: StepProps) {
  const router = useRouter()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPreset = async (presetId: string) => {
    setSelectedPreset(presetId)
    setError(null)
    setIsCreating(true)

    try {
      // Duplicate preset to user's campaigns (server action)
      const result = await duplicateCampaign(presetId)

      if (result.error) {
        setError(result.error)
        setIsCreating(false)
        return
      }

      if (result.data?.campaignId) {
        // Success - campaign created, continue onboarding
        toast.success('Default campaign created!')
        onComplete()
      }
    } catch (err) {
      setError('Failed to create campaign')
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose your campaign style</h1>
        <p className="text-muted-foreground text-lg">
          Select a follow-up approach that matches your business. You can customize later.
        </p>
      </div>

      {/* Reuse existing preset picker component */}
      <PresetPicker
        presets={CAMPAIGN_PRESETS}
        onSelect={handleSelectPreset}
        selectedId={selectedPreset}
        disabled={isCreating}
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isCreating && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
```

### Service Types Multi-Select with Timing Defaults
```typescript
// Source: Phase 22 service types migration + settings page
// Pattern: Multi-select checkboxes, auto-apply timing defaults on save

const SERVICE_TYPE_OPTIONS = [
  { value: 'hvac', label: 'HVAC', defaultHours: 24 },
  { value: 'plumbing', label: 'Plumbing', defaultHours: 48 },
  { value: 'electrical', label: 'Electrical', defaultHours: 24 },
  { value: 'cleaning', label: 'Cleaning', defaultHours: 4 },
  { value: 'roofing', label: 'Roofing', defaultHours: 72 },
  { value: 'painting', label: 'Painting', defaultHours: 48 },
  { value: 'handyman', label: 'Handyman', defaultHours: 24 },
  { value: 'other', label: 'Other', defaultHours: 24 },
] as const

function ServicesOfferedStep({ onComplete }: StepProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError('Select at least one service type')
      return
    }

    // Build timing map from defaults
    const timing: Record<string, number> = {}
    selected.forEach(type => {
      const option = SERVICE_TYPE_OPTIONS.find(opt => opt.value === type)
      if (option) timing[type] = option.defaultHours
    })

    startTransition(async () => {
      const result = await updateServiceTypes({
        serviceTypesEnabled: selected,
        serviceTypeTiming: timing,
      })

      if (result.success) {
        onComplete()
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What services do you offer?</h1>
        <p className="text-muted-foreground text-lg">
          Select all that apply. This helps set timing for review requests.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SERVICE_TYPE_OPTIONS.map(option => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary"
          >
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelected([...selected, option.value])
                } else {
                  setSelected(selected.filter(s => s !== option.value))
                }
              }}
            />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">
                Review request: {option.defaultHours}h after job
              </div>
            </div>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  )
}
```

### SMS Consent Step with TCPA Audit Trail
```typescript
// Source: Phase 20 SMS consent schema (DATA_MODEL.md)
// Pattern: Checkbox with explanation, capture all TCPA fields on submission

function SMSConsentStep({ onComplete }: StepProps) {
  const [consented, setConsented] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!consented) {
      toast.error('Please acknowledge SMS consent to continue')
      return
    }

    startTransition(async () => {
      // Save consent status to business settings (affects future customer imports)
      const result = await updateSMSConsentAcknowledged({
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
      })

      if (result.success) {
        onComplete()
      } else {
        toast.error('Failed to save consent acknowledgment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SMS consent requirements</h1>
        <p className="text-muted-foreground text-lg">
          Important information about sending text messages to customers
        </p>
      </div>

      <div className="p-6 border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">What you need to know:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>You must have written consent from customers before sending SMS messages</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Customers can opt out at any time by replying STOP</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>You must keep records of when and how consent was obtained (TCPA compliance)</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Messages will only be sent during business hours (8 AM - 9 PM local time)</span>
          </li>
        </ul>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Checkbox
            id="sms-consent"
            checked={consented}
            onCheckedChange={(checked) => setConsented(!!checked)}
          />
          <label htmlFor="sms-consent" className="text-sm cursor-pointer">
            I understand that I must obtain written consent from customers before sending them SMS messages,
            and I will maintain records of consent as required by TCPA regulations.
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !consented}>
        {isPending ? 'Completing setup...' : 'Complete setup'}
      </Button>
    </form>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FormProvider context for multi-step forms | Independent step forms with local state | 2024-2025 | Simpler, better performance, no unnecessary re-renders |
| Custom useQueryState hooks | Native useSearchParams + useRouter | Next.js 13+ (2023) | Built-in, no dependencies, works with App Router |
| Generic URL shorteners (bit.ly, TinyURL) | Branded short domains (Rebrandly, custom) | 2024-2026 | 39% higher click rates, brand trust, professional appearance |
| Manual SPF/DKIM verification APIs | Email service provider handles verification | 2024-2026 (Resend, SendGrid) | No need to build DNS lookup logic, provider dashboards verify |
| DMARC policy p=reject from start | Start with p=none, monitor, then quarantine/reject | 2024 Gmail/Yahoo requirements | Prevents legitimate email blocking during setup |
| Phone number regex validation | libphonenumber-js E.164 parsing | Ongoing best practice | Handles 200+ countries, international formats, mobile/landline detection |

**Deprecated/outdated:**
- **next-usequerystate package:** Renamed to `nuqs` in 2024, but native useSearchParams is sufficient for simple step navigation
- **Custom CSV parsers:** PapaParse is de-facto standard (10K+ stars), no reason to hand-roll
- **Bitly's legacy API (v3):** Deprecated, use v4 REST API or official SDK
- **Strict Google review link regex:** Google changes URL formats frequently, use permissive validation (URL + domain check only)

## Open Questions

Things that couldn't be fully resolved:

1. **Bitly vs Rebrandly for branded short links (DLVR-03)**
   - What we know: Both offer free tiers with custom domains, Bitly has better developer ecosystem, Rebrandly focuses on branding (39% higher CTR)
   - What's unclear: Which service's free tier limits (links/month) fit the SaaS pricing model? Should branded links be Starter tier feature or Pro/Business only?
   - Recommendation: Defer branded links to post-onboarding settings feature (not MVP blocker). Start with Bitly free tier (1,500 links/month), evaluate Rebrandly if branding becomes primary value prop.

2. **Google review link preview/validation in Step 2**
   - What we know: Google review links open in new tab/window, iframe embedding often blocked by X-Frame-Options
   - What's unclear: Can we reliably show preview of review page without opening new tab? Is URL validation + "click to test" sufficient?
   - Recommendation: Use simple validation (URL + google.com check) + "Open preview in new tab" button. Don't attempt iframe embedding (will fail). Consider adding "verified" badge after user confirms link works.

3. **Software Used step (Step 4) - future integration timeline**
   - What we know: ServiceTitan, Jobber, Housecall Pro all have APIs. Step 4 captures which software business uses for "future integrations"
   - What's unclear: When will these integrations actually be built? Is collecting this data in onboarding premature? Will it create false expectations?
   - Recommendation: Keep step simple: "Which software do you use to manage jobs? (Optional)". Make it very clear this is for future roadmap planning, not immediate integration. Store as text field, not foreign key (no integration table yet).

4. **Email authentication checklist verification status**
   - What we know: Resend verifies DNS records in their dashboard, propagation takes 24-48 hours
   - What's unclear: Should settings page show "Pending" forever, or link to Resend dashboard for verification? Is there a webhook/API to sync verification status?
   - Recommendation: Show static checklist with instructions + "Verify in Resend dashboard" link. Don't attempt to build verification API (Resend doesn't expose this). Add note "Verification happens in Resend dashboard, can take 24-48 hours for DNS propagation."

5. **Onboarding completion threshold - which steps are truly required?**
   - What we know: Requirements mark Steps 2, 4, 6 as skippable. Step 1, 3, 5, 7 are required.
   - What's unclear: Is Step 7 (SMS consent) truly required if business only uses email campaigns? Should it be conditional?
   - Recommendation: Make Step 7 required (TCPA compliance matters even if not using SMS yet). If skipped, default to email-only campaigns. Add conditional "Skip SMS setup" button that shows warning "You won't be able to send SMS until consent process completed."

## Sources

### Primary (HIGH confidence)
- React Hook Form official documentation (advanced usage): https://react-hook-form.com/advanced-usage
- Next.js useSearchParams documentation: https://nextjs.org/docs/app/api-reference/functions/use-search-params
- Resend SPF/DKIM/DMARC setup: https://resend.com/docs/dashboard/domains/dmarc, https://resend.com/blog/email-authentication-a-developers-guide
- Bitly API v4 reference: https://dev.bitly.com/api-reference
- Current codebase: onboarding-wizard.tsx, csv-import-dialog.tsx, preset-picker.tsx, customers table schema (DATA_MODEL.md)

### Secondary (MEDIUM confidence)
- LogRocket multi-step form guide (Feb 2025): https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/
- ClarityDev multi-step wizard tutorial (Apr 2025): https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form
- Zapier URL shortener comparison (2026): https://zapier.com/blog/best-url-shorteners/
- Rebrandly alternatives review: https://www.rebrandly.com/blog/tinyurl-alternatives
- Resend SPF/DKIM setup guide: https://dmarcdkim.com/setup/how-to-setup-resend-spf-dkim-and-dmarc-records

### Tertiary (LOW confidence)
- nuqs library (useSearchParams alternative): https://nuqs.dev - Mentioned as option but not needed for simple step navigation
- ServiceTitan API capabilities: https://contractorplus.app/blog/housecall-pro-vs-jobber-vs-servicetitan - General comparison, no specific API documentation reviewed
- Google review link generators: https://whitespark.ca/google-review-link-generator/ - Community tools showing URL format variations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, current implementation working well in production
- Architecture: HIGH - Reusing proven patterns from Phase 7/16 onboarding + Phase 20/22/24 components
- Pitfalls: HIGH - Based on existing codebase analysis + TCPA compliance requirements + DNS propagation realities
- URL shortening: MEDIUM - Bitly/Rebrandly documentation reviewed but feature deferred to post-onboarding (not critical path tested)
- Email authentication: MEDIUM - Resend documentation clear but verification status sync unclear (may need to ask users to check Resend dashboard)

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, libraries mature)
