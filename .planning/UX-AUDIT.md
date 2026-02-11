# UX Audit: AvisLoop

**Audited:** 2026-02-05 (Updated: Comprehensive Component & Page Deep-Dive)
**Methods:** Manual flow testing, UI/UX Pro Max design system analysis, Playwright E2E testing, Codebase IA review, Component-level inspection
**Status:** Complete — Deep-Dive Analysis Added

---

## Executive Summary

AvisLoop is a review request management SaaS for local service businesses. This audit evaluates the complete user journey from signup through getting reviews, identifying UX friction points and conversion optimization opportunities.

**Overall Assessment:** Core product is solid with strong automation and compliance features. Primary gaps are in **accessibility**, **loading states**, **trust signals**, **feature visibility**, and **workflow clarity** (Send page vs Campaigns overlap).

### V2 Philosophy Reality Check

**The stated V2 philosophy:**
> "Jobs are the primary object, not customers. Customers are created implicitly when a job is completed. There is no 'Add Customer' button in normal usage."

**What the current UI actually shows:**
- Prominent "Add Customer" button on Customers page (top-right header + large empty state CTA)
- "Add Customer" flows completely independent of Jobs
- CSV Import for bulk customer upload (reinforces customer-first thinking)
- Customers page is position #5 in navigation (above Send, Activity)
- No indication that customers should come from jobs

**V2 Alignment Score: 40%** — The UI still reflects V1 CRM-like customer management thinking, not the V2 "jobs create customers" automation model.

---

## Product Category Match (UI/UX Pro Max Analysis)

Based on UI/UX Pro Max design database analysis:

| Category | Match Score | Recommended Style | Color Focus |
|----------|-------------|-------------------|-------------|
| **Home Services (Plumber/Electrician)** | 95% | Flat Design + Trust & Authority | Trust Blue + Safety Orange + Professional grey |
| **Hyperlocal Services** | 90% | Minimalism + Vibrant & Block-based | Location markers + Trust colors |
| **SaaS (General)** | 85% | Glassmorphism + Flat Design | Trust blue + accent contrast |
| **Service Landing Page** | 80% | Hero-Centric + Conversion-Optimized | Brand primary + trust colors |

**Recommended Design Direction:** Flat Design + Trust & Authority with Conversion-Optimized landing pattern.

**Key Considerations from Products.csv #58 (Home Services):**
- Service list prominent
- Emergency contact visible
- Booking system
- Price transparency
- Certifications displayed
- Local trust signals

---

## Design System Analysis

### Current Color Palette (globals.css)

```css
/* Light Mode */
--background: 0 0% 97.6%      /* #F8F8F8 - Off-white */
--foreground: 0 0% 9%          /* #171717 - Near-black */
--card: 0 0% 100%              /* #FFFFFF - Pure white */
--primary: 224 75% 43%         /* #2563EB - Blue */
--secondary: 0 0% 92%          /* #EBEBEB - Light gray */
--muted: 0 0% 97%              /* #F7F7F7 - Muted gray */
--muted-foreground: 0 0% 45%   /* #737373 - Mid-gray */
--accent: 224 75% 43%          /* Same as primary - Blue */
--accent-lime: 75 85% 55%      /* #A3E635 - Lime green */
--accent-coral: 0 85% 65%      /* #F87171 - Coral red */
--destructive: 0 84% 60%       /* #EF4444 - Red */
--border: 0 0% 89%             /* #E2E2E2 - Border gray */
--radius: 0.5rem               /* 8px border radius */

/* Dark Mode - Well implemented with inverted values */
```

### Color Gap Analysis

| Issue | Current | Recommended (Home Services) | Priority |
|-------|---------|----------------------------|----------|
| CTA Color | Same as primary (#2563EB) | Distinct orange (#F97316) | High |
| Trust Color | Blue is good | Add navy accents (#1E3A5F) | Medium |
| Accent Usage | Lime/Coral playful | May feel unprofessional | Low |
| Status Colors | Well-defined | Good - no changes needed | N/A |

### Typography System

**Font:** Kumbh Sans (Google Fonts) - Good choice for SaaS, modern and readable

**Font Weights Used:**
- 400 (regular) - Body text
- 500 (medium) - Labels, form labels
- 600 (semibold) - Headings, bold text
- 700 (bold) - Major headings

**Font Sizes (from components):**
| Element | Size | Usage |
|---------|------|-------|
| KPI Values | `text-4xl` (2.25rem) | Dashboard metrics |
| Page Titles | `text-3xl` (1.875rem) | H1 headings |
| Section Headers | `text-2xl` (1.5rem) | Modal titles |
| Subsection | `text-lg` (1.125rem) | Card titles |
| Body | `text-sm` (0.875rem) | Default UI text |
| Small | `text-xs` (0.75rem) | Labels, badges |

**Typography Issues:**
- Line height not explicitly set on body (defaults to normal)
- Consider `leading-relaxed` (1.625) for better readability
- Max-width for paragraphs not consistently applied

---

## Component Library Deep-Dive

### Button Component (button.tsx)

**Variants Implemented:**
1. `default` - bg-primary, hover:bg-primary/90
2. `destructive` - bg-red, hover:bg-red/90
3. `outline` - border, transparent bg, hover:bg-accent
4. `secondary` - bg-secondary, hover:bg-secondary/80
5. `ghost` - transparent, hover:bg-accent
6. `link` - text-primary, underline on hover

**Sizes:**
| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `default` | h-9 (36px) | px-4 | Standard buttons |
| `xs` | h-6 (24px) | px-2 | Tiny inline actions |
| `sm` | h-8 (32px) | px-3 | Compact buttons |
| `lg` | h-10 (40px) | px-6 | Primary CTAs |
| `icon` | 36x36px | - | Icon-only buttons |
| `icon-xs/sm/lg` | 24/32/40px | - | Sized icon buttons |

**Accessibility Features (Good):**
- `focus-visible:ring-[3px]` - Visible focus states
- `disabled:opacity-50` - Clear disabled state
- `motion-safe:hover:-translate-y-0.5` - Respects reduced motion
- `aria-invalid` styling for form errors

**Issues:**
- Some icon-only buttons in codebase missing `aria-label` (see customers-client.tsx line 152-154)
- Touch targets on `xs` size (24px) below 44px minimum

### Card Component (card.tsx)

**Variants:**
1. `Card` - Static display card
2. `InteractiveCard` - Clickable with hover effect

**InteractiveCard Features:**
- `cursor-pointer` - Correct
- `motion-safe:hover:-translate-y-1` - Subtle lift on hover
- `transition-all duration-200` - Smooth 200ms transition

**Usage Pattern (from kpi-widgets.tsx):**
- KPI cards use `InteractiveCard` wrapped in `Link` for navigation
- Properly clickable with visual feedback

### Form Components

**Input (input.tsx):**
- Focus ring: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Border: `border-input` (gray)
- Height: `h-9` (36px) - **Below 44px touch target**
- Text size changes on `md:` breakpoint for desktop

**Select (select.tsx):**
- Radix-based with proper keyboard navigation
- Scroll buttons for long lists
- Check icon on selected item

**Checkbox (checkbox.tsx):**
- Radix-based with Check icon indicator
- Size: `h-4 w-4` (16px) - **Well below 44px minimum**
- Has visible focus ring

**Issues Found:**
1. Input height 36px < 44px minimum touch target
2. Checkbox 16px significantly undersized for mobile
3. Some inputs use placeholder-only labels (violates accessibility)

### Table Components

**TanStack React Table Implementation:**
- Sorting via header click
- Row selection with checkboxes
- Client-side pagination
- Hover states: `hover:bg-muted/50`
- Selection state: `data-[state=selected]:bg-muted`

**Customer Table Specifics (customer-table.tsx):**
- Default sort: `last_sent_at DESC`
- Debounced search (300ms)
- Tag filter with GIN indexing
- Bulk action bar on selection
- Row click opens detail drawer

**Issues:**
- No skeleton loader during data fetch
- Bulk actions don't show loading state
- Row click area could be larger

### Modal & Drawer Components

**Dialog (dialog.tsx):**
- Overlay: `bg-black/80` with fade animation
- Centered with zoom + fade animation
- Close button (X) top-right
- Focus trap enabled

**Sheet (sheet.tsx):**
- Side options: top, right, bottom, left
- Width: `w-3/4` mobile, `sm:max-w-sm` (384px) desktop
- Slide animation per direction
- Scrollable content area

**Measured Widths:**
| Component | Mobile | Desktop | Use Case |
|-----------|--------|---------|----------|
| Add Customer Sheet | 75% | 400-540px | Form entry |
| Detail Drawer | 75% | max-w-lg (512px) | Customer detail |
| Email Preview | - | max-w-xl (576px) | Preview modal |
| Confirmation Dialog | - | max-w-md (448px) | Destructive actions |

---

## Page-by-Page Detailed Analysis

### 1. Landing Page (app/(marketing)/page.tsx)

**Current Structure:**
```
1. Hero (hero.tsx)
   - Badge with pulse animation
   - H1: "Get More Reviews. Automatically."
   - Subheading + 2 CTAs
   - Product mockup with floating cards

2. [Other sections follow...]
```

**Hero Issues (hero.tsx):**
| Issue | Current | Recommendation | Priority |
|-------|---------|----------------|----------|
| CTA Color | `bg-foreground` (black/white) | Use distinct orange `bg-orange-500` | High |
| Trust Badge | "Trusted by 500+ local businesses" | Add logos or more specific proof | Medium |
| Mockup | Placeholder image | Real screenshot or demo | High |
| Floating Cards | Hardcoded "+47%" | Use real data or testimonial | Medium |

**Landing Page Pattern Match (UI/UX Pro Max):**
- Should follow: **Hero-Centric Design + Conversion-Optimized**
- Missing: Sticky header CTA, demo video, trust section with badges

**Recommended Section Order:**
1. Hero (with sticky nav CTA)
2. Trust Logos Strip (move up from current position)
3. Problem Statement
4. Solution Overview
5. How It Works (add demo video)
6. Social Proof (testimonials with photos)
7. Pricing Anchor
8. FAQ
9. Final CTA

### 2. Dashboard (app/(dashboard)/dashboard/page.tsx)

**Layout Structure:**
- 6 KPI widgets (3 large + 3 small in grid)
- Ready to Send queue
- Action summary banner
- Attention alerts

**KPI Widgets (kpi-widgets.tsx):**

**Top Row (Outcome Metrics):**
| Metric | Display | Link | Visual |
|--------|---------|------|--------|
| Reviews This Month | 4xl bold + trend | /history?status=reviewed | Star icon |
| Average Rating | 4xl bold + trend | /feedback | ChartBar icon |
| Conversion Rate | 4xl bold + "%" | /history | Target icon |

**Bottom Row (Pipeline Metrics):**
| Metric | Display | Visual |
|--------|---------|--------|
| Requests Sent This Week | 2xl bold + trend | None |
| Active Sequences | 2xl bold + trend | None |
| Pending / Queued | 2xl bold + trend | None |

**Trend Indicator Pattern:**
- Positive: Green + TrendUp icon
- Negative: Red + TrendDown icon
- Zero: Muted dash "—"

**Issues:**
1. **Loading State:** `KPIWidgetsSkeleton` exists and is used - Good
2. **Empty State:** No handling for new users with zero data - Shows "0" everywhere
3. **Trend Period:** "vs last month" may confuse if business is new

### 3. Customers Page (app/(dashboard)/customers/page.tsx)

**Component Structure (customers-client.tsx):**
```
CustomersClient
├── Loading overlay (isPending)
├── Header
│   ├── Title + description
│   └── [Add Customer] + [CSV Import] (if hasCustomers)
├── CustomerTable (if hasCustomers)
│   └── Filters, Table, Pagination, Bulk Actions
├── Empty State (if !hasCustomers)
│   ├── Icon in circle
│   ├── "No customers yet" heading
│   ├── Description
│   └── [Add Customer] + [CSV Import] CTAs
├── AddCustomerSheet
├── EditCustomerSheet
├── CustomerDetailDrawer
└── DeleteCustomerDialog
```

**V2 Philosophy Violations:**

1. **Empty State Copy (line 183-184):**
   > "Add your first customer to start sending review requests and building your reputation"

   **Should be:** "Customers appear here as you complete jobs. Ready to add your first job?"

2. **Primary CTAs (lines 188-192):**
   - "Add Customer" button (primary)
   - CSV Import dialog (secondary)

   **Should be:** De-emphasize or remove. Guide to Jobs page.

3. **Header CTAs (lines 151-157):**
   - "Add Customer" button prominent

   **Should be:** Move to overflow menu or remove

**Empty State Icon:**
- Uses `Users` from lucide-react (line 12, 176, 189)
- Should be Phosphor for consistency

**Detail Drawer Features (customer-detail-drawer.tsx):**
- Avatar with initials
- Email + phone with copy buttons
- Auto-saved notes (500ms debounce)
- SMS consent status with color coding
- Activity summary
- Action buttons: Send, Edit, Archive, View History

**SMS Consent Color Coding:**
| Status | Color | Meaning |
|--------|-------|---------|
| opted_in | Green | SMS available |
| opted_out | Red | SMS blocked |
| unknown | Yellow | Needs collection |

### 4. Jobs Page (app/(dashboard)/jobs/page.tsx)

**Layout:**
- Header with "Add Job" button
- Filters (status, service type)
- Job table with actions

**Add Job Flow Issues:**
1. "Add Job" requires selecting existing customer
2. No inline customer creation
3. Breaks V2 model of "customers are side effect of jobs"

**V2 Ideal Flow:**
```
Add Job →
  ├── Enter customer info (or select existing)
  ├── Select service type
  ├── Mark as completed
  └── Customer record auto-created if new
      └── Campaign auto-enrolled
```

**Service Type Selector:**
- 8 types: hvac, plumbing, electrical, cleaning, roofing, painting, handyman, other
- Each has default timing for campaign enrollment

### 5. Send Page (app/(dashboard)/send/page.tsx)

**Tab Structure:**
1. **Quick Send Tab** - Single customer send
2. **Bulk Send Tab** - Multi-customer batch

**Quick Send Features (quick-send-tab.tsx):**
- Email/name search with autocomplete (6 max suggestions)
- Keyboard navigation (arrows, Enter, Escape)
- Channel selector (email/SMS)
- Template selector
- Schedule presets: immediately, 1hour, morning, custom
- SMS character counter with notice
- Recent customers chips
- Message preview with "View Full" button

**Autocomplete UX (lines 74-84):**
- Triggers at 2+ characters
- Searches email AND name
- Max 6 results
- Click outside to close
- Keyboard navigation implemented

**SMS Validation (lines 61-72):**
- Checks phone_status === 'valid'
- Checks sms_consent_status === 'opted_in'
- Disabled with reason if unavailable

**V2 Philosophy Issue:**
This entire page contradicts V2. V2 states:
> "This is no longer a tool for manually sending review requests"

**Recommendation:** Rename to "Manual Request", move to nav bottom, add friction warning

### 6. Campaigns Page (app/(dashboard)/campaigns/page.tsx)

**Structure:**
- Preset picker for new users
- Campaign list with cards
- Each campaign shows touch sequence

**Campaign Card Features:**
- Name + service type
- Status (active/paused)
- Touch count (1-4)
- Edit/pause/delete actions

**Touch Sequence Editor:**
- Up to 4 touches
- Each touch: channel (email/SMS), delay hours, template
- Visual timeline

**This page aligns well with V2 philosophy.**

### 7. Sidebar Navigation (sidebar.tsx)

**Desktop Sidebar Features:**
- Logo + collapse toggle
- 8 main nav items
- Active state: `bg-[#F2F2F2] dark:bg-muted`
- Badge support (Dashboard has pending count)
- "Add Job" button in footer (outline variant)
- Account menu at bottom
- Collapsible with localStorage persistence
- Auto-collapse on 768-1024px

**Navigation Order (lines 33-42):**
```
1. Dashboard     ← Hub
2. Jobs          ← Core action
3. Campaigns     ← Automation
4. Analytics     ← Insights
5. Customers     ← V2: Should be hidden
6. Send          ← V2: Should be hidden/renamed
7. Activity      ← Audit trail
8. Feedback      ← Customer sentiment
```

**V2 Alignment Issues:**

1. **"Add Job" Button (lines 157-167):**
   ```tsx
   <Button variant="outline" ...>
   ```
   Uses `variant="outline"` (tertiary styling)

   **Should be:** `variant="default"` (primary styling) - THE core action

2. **Customers Position:** #5 too prominent
3. **Send Position:** #6 should not be in main nav

### 8. Mobile Navigation (bottom-nav.tsx)

**Items (5):**
1. Dashboard (House)
2. Send (PaperPlaneTilt)
3. Jobs (Briefcase)
4. Campaigns (Megaphone)
5. Activity (ClockCounterClockwise)

**Issues:**
1. **No "Add Job" FAB** - Missing primary action on mobile
2. **Send at #2** - V2 says this should be de-emphasized
3. **Customers missing** - Intentional? Or oversight?

**Recommended Mobile Nav:**
```
1. Dashboard
2. Jobs (or "Add Job" FAB overlay)
3. Campaigns
4. Activity
5. Account (replaces Send, links to Customers/Feedback)
```

### 9. Onboarding Wizard (onboarding-wizard.tsx)

**7 Steps:**
| Step | Title | Skippable | Purpose |
|------|-------|-----------|---------|
| 1 | Business Basics | No | Name, phone, Google link |
| 2 | Review Destination | Yes | Google review link |
| 3 | Services Offered | No | Multi-select 8 types |
| 4 | Software Used | Yes | CRM info |
| 5 | Campaign Preset | No | Fast/Standard/Slow |
| 6 | Import Customers | Yes | CSV upload |
| 7 | SMS Consent | No | TCPA acknowledgement |

**V2 Philosophy Violation:**

**Step 6 "Import Customers" contradicts V2:**
> "No contacts uploaded. No lists imported. No templates built."

**Recommendation:**
- Remove step 6 entirely OR
- Rename to "Import Past Customers (Optional)" with de-emphasized CTA
- Add copy: "Most businesses skip this — customers are added automatically when you complete jobs"

**Draft Persistence:**
- localStorage with Zod validation (SEC-04)
- Survives page refresh
- Cleared on completion

**Progress Indicator:**
- Bottom fixed progress bar
- Current step / total steps

---

## Accessibility Audit

### Passing (WCAG AA)

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Color Contrast | Text #171717 on #F8F8F8 = 12.6:1 | Pass |
| Focus Visible | `focus-visible:ring-[3px]` on all interactive | Pass |
| Reduced Motion | `@media (prefers-reduced-motion: reduce)` | Pass |
| Smooth Scroll | `scroll-behavior: smooth` with fallback | Pass |
| Form Labels | Proper `<label htmlFor>` usage | Pass |
| Keyboard Navigation | Tab order matches visual order | Pass |
| Semantic HTML | Uses `<nav>`, `<main>`, `<button>` | Pass |

### Failing (Needs Fix)

| Issue | Location | Fix Required | Severity |
|-------|----------|--------------|----------|
| Icon-only buttons missing aria-label | customers-client.tsx, various | Add `aria-label="Delete"` etc | High |
| Checkbox 16px | checkbox.tsx | Increase to 20px or add touch wrapper | High |
| Input height 36px | input.tsx | Consider h-10 (40px) or touch wrapper | Medium |
| Loading buttons | Various forms | Add `disabled={loading}` + spinner | High |
| Skip link missing | layout.tsx | Add "Skip to main content" | Medium |

### Touch Target Violations

| Element | Current Size | Minimum | Gap |
|---------|--------------|---------|-----|
| Checkbox | 16x16px | 44x44px | -28px |
| Icon button `xs` | 24x24px | 44x44px | -20px |
| Icon button `sm` | 32x32px | 44x44px | -12px |
| Input height | 36px | 44px | -8px |

**Recommendation:** Add padding/margin wrapper for mobile touch or increase base sizes

---

## Loading States Audit

### Implemented (Good)

| Component | Loading Pattern | Evidence |
|-----------|-----------------|----------|
| KPI Widgets | Skeleton loader | `KPIWidgetsSkeleton()` |
| Customers | Full-page overlay | `isPending && <Loader2>` |
| Form Submit | Button disabled + spinner | Various forms |
| Page Navigation | Progress bar | `NavigationProgressBar` |

### Missing (Needs Implementation)

| Component | Current | Recommended |
|-----------|---------|-------------|
| Customer Table | No skeleton | Add table skeleton rows |
| Job Table | No skeleton | Add table skeleton rows |
| History Table | No skeleton | Add table skeleton rows |
| Campaign Cards | No skeleton | Add card skeleton |
| Detail Drawer | No skeleton | Add content skeleton |

**Skeleton Component Exists:** `components/ui/skeleton.tsx`
- Uses `animate-pulse-soft` (custom 2s animation)
- Background: `bg-muted/60`

---

## Empty States Audit

### Pattern Used

```tsx
<div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
  <div className='rounded-full bg-muted p-6 mb-6'>
    <Icon className='h-12 w-12 text-muted-foreground' />
  </div>
  <h2 className='text-2xl font-semibold tracking-tight mb-2'>
    {title}
  </h2>
  <p className='text-muted-foreground mb-8 max-w-md'>
    {description}
  </p>
  <div className='flex gap-3'>
    <Button>{primaryAction}</Button>
    <Button variant="outline">{secondaryAction}</Button>
  </div>
</div>
```

### Page-by-Page Empty States

| Page | Title | Description | CTAs | V2 Aligned? |
|------|-------|-------------|------|-------------|
| Customers | "No customers yet" | "Add your first customer to start sending..." | Add Customer, CSV Import | No |
| Jobs | "No jobs yet" | Varies | Add Job | Yes |
| Campaigns | "No campaigns" | Setup guidance | Use Preset | Yes |
| History | "No messages found" | Generic | None | Needs CTA |
| Feedback | "No feedback yet" | Generic | None | Needs guidance |

---

## Spacing & Layout Patterns

### Consistent Spacing Scale (Tailwind)

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 0.25rem (4px) | Tight groupings |
| `gap-2` | 0.5rem (8px) | Related items |
| `gap-3` | 0.75rem (12px) | Moderate spacing |
| `gap-4` | 1rem (16px) | Standard gap |
| `gap-6` | 1.5rem (24px) | Section spacing |
| `gap-8` | 2rem (32px) | Major sections |

### Page Layout Pattern

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
    <div className="flex gap-2">
      {/* Actions */}
    </div>
  </div>

  {/* Content */}
  <Card>{/* ... */}</Card>
</div>
```

### Card Internal Spacing

| Area | Padding | Usage |
|------|---------|-------|
| Card | `p-6` (24px) | Standard cards |
| Compact Card | `p-4` (16px) | Dense layouts |
| Card Header | `p-6` (24px) | Title area |
| Card Content | `p-6 pt-0` | Body area |
| Sheet Header | `p-4` | Drawer headers |

---

## Icon System Analysis

### Primary Library: Phosphor Icons

**Usage Locations:**
- Sidebar navigation (sidebar.tsx)
- Bottom navigation (bottom-nav.tsx)
- Dashboard KPIs (kpi-widgets.tsx)
- Send page (quick-send-tab.tsx)
- Various components

**Standard Attributes:**
```tsx
<Icon size={20} weight="regular" className="shrink-0" />
```

### Secondary Library: Lucide Icons

**Still Used In (27 files):**
- UI primitives: dialog.tsx, sheet.tsx, select.tsx, dropdown-menu.tsx, checkbox.tsx
- Customer components: customers-client.tsx, add-customer-sheet.tsx
- Marketing: hero.tsx, faq-section.tsx, pricing-table.tsx
- Other: theme-switcher.tsx, jobs components

**Migration Needed:** Complete migration to Phosphor for consistency

### Icon Size Standards

| Context | Size | Example |
|---------|------|---------|
| Navigation | 20px | Sidebar, bottom nav |
| In-button | 16px (4w) | Button icons |
| Header | 24px | Logo, major icons |
| Small indicators | 12-14px | Trend arrows, status |

---

## Interaction Patterns

### Hover States

| Element | Effect | Duration |
|---------|--------|----------|
| Button | -translate-y-0.5 + bg change | 200ms |
| InteractiveCard | -translate-y-1 | 200ms |
| Nav Link | bg-muted/50 | 200ms |
| Table Row | bg-muted/50 | instant (no transition) |

### Focus States

| Element | Style |
|---------|-------|
| Button | ring-[3px] ring-ring/50 |
| Input | ring-[3px] ring-ring/50 + border-primary |
| Link | browser default or custom ring |

### Active/Pressed States

| Element | Effect |
|---------|--------|
| Button | scale-[0.98] |
| Checkbox | Checked indicator |
| Tab | bg-background + underline |

---

## Mobile Responsiveness

### Breakpoints Used

| Breakpoint | Size | Key Changes |
|------------|------|-------------|
| Default | <640px | Mobile-first base styles |
| `sm:` | 640px | Horizontal layouts, larger text |
| `md:` | 768px | Sidebar visible, bottom nav hidden |
| `lg:` | 1024px | Full sidebar, multi-column grids |
| `xl:` | 1280px | Max container widths |

### Mobile-Specific Patterns

1. **Bottom Navigation:**
   - Fixed 72px height
   - 5 items in grid
   - Glass morphism: `bg-card/95 backdrop-blur`
   - Icons + labels

2. **Content Padding:**
   - `pb-[72px] md:pb-0` to account for bottom nav

3. **Sheet Width:**
   - Mobile: `w-3/4` (75%)
   - Desktop: `sm:max-w-sm` (384px) or larger

4. **Responsive Grids:**
   - `grid-cols-1 md:grid-cols-3` for KPIs
   - `flex-col sm:flex-row` for button groups

---

## Performance Considerations

### Good Practices Found

1. **Server Components:** Used by default, client components explicitly marked
2. **Lazy Loading:** Sheets/modals rendered conditionally
3. **Debounced Search:** 300-500ms debounce on search inputs
4. **Image Optimization:** Next.js Image component used
5. **CSS Variables:** Theme colors as CSS custom properties

### Potential Issues

1. **Bundle Size:** Icon libraries (Phosphor + Lucide) both imported
2. **No Virtual Scrolling:** Large lists could cause performance issues
3. **No Code Splitting:** Tables load full TanStack React Table

---

## V2 Philosophy Alignment Summary

### Critical Violations

| Issue | Location | Severity | Fix Effort |
|-------|----------|----------|------------|
| "Add Customer" CTAs prominent | customers-client.tsx | Critical | Low |
| Send page in main nav | sidebar.tsx, bottom-nav.tsx | High | Low |
| Onboarding step 6 imports customers | onboarding-wizard.tsx | Medium | Low |
| "Add Job" uses outline variant | sidebar.tsx line 158 | Medium | Low |
| Jobs require pre-existing customer | add-job-sheet.tsx | High | Medium |
| Mobile has no "Add Job" FAB | bottom-nav.tsx | Medium | Medium |

### V2-Aligned Features (Good)

1. **Dashboard "Ready to Send" queue** - Shows jobs waiting for enrollment
2. **Campaign automation** - Multi-touch sequences work correctly
3. **Jobs page exists** - Core concept is present
4. **Service type timing** - Different delays per service

### Implementation Roadmap

#### Phase A: De-emphasize V1 (1-2 days)
- [ ] Change "Add Job" button to `variant="default"`
- [ ] Move Send to bottom of navigation
- [ ] Rename Send → "Manual Request"
- [ ] Update Customers empty state copy

#### Phase B: V2 Flow (3-5 days)
- [ ] Add inline customer creation in Add Job sheet
- [ ] Add mobile FAB for "Add Job"
- [ ] Show campaign enrollment preview on job cards
- [ ] Add warning when customer in active campaign

#### Phase C: Full V2 (1-2 weeks)
- [ ] Consider hiding Customers from main nav
- [ ] Evaluate Send page removal (track usage first)
- [ ] Update onboarding to remove step 6

---

## Priority Recommendations

> **Status Update (2026-02-06):** Phase 30 (V2 Alignment) addressed items 1-2, 4-7, 9, 14. Phase 30.1 (Audit Gap Remediation) will cover items 3, 8, and remaining medium/low items (excluding landing page). See `.planning/phases/30.1-audit-gaps/CONTEXT.md` for full scope.

### Critical (This Week)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Add aria-labels to icon buttons | Throughout app | Accessibility |
| 2 | Increase touch targets to 44px | checkbox, buttons | Mobile usability |
| 3 | Add table skeleton loaders | All data tables | Perceived performance |
| 4 | Change "Add Job" to primary variant | sidebar.tsx | V2 adoption |
| 5 | Update Customers empty state copy | customers-client.tsx | V2 alignment |

### High (Next Week)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | Add inline customer creation in Jobs | add-job-sheet.tsx | V2 core flow |
| 7 | Add mobile FAB for "Add Job" | app-shell.tsx | Mobile V2 |
| 8 | Rename Send → "Manual Request" | sidebar.tsx, bottom-nav.tsx | V2 clarity |
| 9 | Complete Phosphor icon migration | 27 files | Consistency |
| 10 | Add sticky header CTA | Landing page | Conversions |

### Medium (This Month)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 11 | Differentiate CTA color (orange) | globals.css, buttons | Conversion |
| 12 | Add demo video to landing | hero section | Engagement |
| 13 | Add trust section (badges, logos) | Landing page | Trust |
| 14 | Add skip link | Root layout | Accessibility |
| 15 | Remove/hide onboarding step 6 | onboarding-wizard.tsx | V2 alignment |

### Low (Backlog)

| # | Issue | Priority |
|---|-------|----------|
| 16 | Z-index scale system | Low |
| 17 | Virtual scrolling for large lists | Low |
| 18 | Consider hiding Customers page | After metrics |
| 19 | Consider removing Send page | After metrics |
| 20 | Testimonial photos | Low |

---

## Technical Debt from Audit

### V2 Philosophy Debt

| Item | Location | Severity |
|------|----------|----------|
| Add Customer CTAs too prominent | customers-client.tsx:150-194 | Critical |
| Send page in main navigation | sidebar.tsx:39, bottom-nav.tsx:13 | High |
| Add Job button uses outline variant | sidebar.tsx:158 | Medium |
| Onboarding step 6 imports customers | onboarding-wizard.tsx:28 | Medium |
| Jobs require pre-existing customer | add-job-sheet.tsx | High |
| No inline customer creation in Jobs | Missing feature | High |
| No campaign enrollment preview | Missing feature | Medium |
| Mobile has no Add Job FAB | Missing feature | Medium |

### Accessibility Debt

| Item | Location | Severity |
|------|----------|----------|
| Icon buttons without aria-label | Throughout app | High |
| Checkbox 16px < 44px touch | checkbox.tsx | High |
| Input height 36px < 44px | input.tsx | Medium |
| Missing skip link | Root layout | Medium |

### Consistency Debt

| Item | Files Affected | Effort |
|------|----------------|--------|
| Lucide icons remaining | 27 files | Medium |
| Mixed button variants | Various | Low |
| Inconsistent empty states | Multiple pages | Low |

---

## Testing Performed

### Playwright E2E Tests (2026-02-05)

| Page | Status | Notes |
|------|--------|-------|
| Landing `/` | Pass | Full marketing page renders |
| Dashboard `/dashboard` | Pass | KPIs, Ready to Send, Alerts |
| Campaigns `/campaigns` | Pass | 3 presets display correctly |
| Analytics `/analytics` | Pass | Metrics + service type table |
| Activity `/history` | Pass | Search, filters, 6 entries |
| Jobs `/jobs` | Pass | Filters, Edit/Delete actions |
| Customers `/customers` | Pass | Search, tags, 3 customers |
| Feedback `/feedback` | Pass | Empty state (after icon fix) |
| Billing `/billing` | Pass | Plan info, usage, cards |
| Send `/send` | Pass | Quick/Bulk tabs work |

### Build Verification

```
pnpm typecheck: PASS
pnpm lint: PASS
```

---

*Audit completed: 2026-02-05*
*Deep-dive analysis added: 2026-02-05*
*Methods: Playwright MCP, UI/UX Pro Max skill, manual code review, component-level inspection*
