# AvisLoop V1 → V2 Philosophy Shift

**Created:** 2026-02-05
**Purpose:** Canonical reference for product direction. All features, UI decisions, and code changes should align with V2 philosophy.

---

## The Core Shift

| Aspect | V1 (Legacy) | V2 (Current Direction) |
|--------|-------------|------------------------|
| **Primary Object** | Customer/Contact | Job/Completed Work |
| **Mental Model** | CRM with messaging | Workflow automation |
| **User Action** | "Send review request" | "Complete a job" |
| **Customer Creation** | Manual entry, CSV import | Side effect of job completion |
| **Message Sending** | Manual trigger required | Automatic via campaigns |
| **User Involvement** | High (constant decisions) | Low (set up once, runs forever) |

---

## V1: What We're Moving Away From

### V1 User Mental Model
> "I need to build a customer database, then send review requests to them."

### V1 Workflow
```
1. Sign up
2. Import/add customers manually
3. Select customers to contact
4. Choose template
5. Click "Send"
6. Wait for response
7. Repeat for each customer
```

### V1 UI Characteristics
- Prominent "Add Customer" buttons
- Customer list as primary view
- "Send" as primary action
- Manual selection of who to contact
- One-off sends as default behavior
- CSV import as core onboarding step

### V1 Problems
1. **Forgotten customers** — Businesses forget to send requests
2. **Inconsistent timing** — Requests sent too early, too late, or at random
3. **Manual work** — Owner must remember to act
4. **No follow-up** — Single request, no reminders
5. **Wrong mental model** — Feels like email marketing, not operations
6. **Low adoption** — Tool requires constant attention

---

## V2: What We're Building Toward

### V2 User Mental Model
> "I complete jobs, and AvisLoop automatically turns them into reviews."

### V2 Workflow
```
1. Sign up
2. Set up business basics (one-time)
3. Choose automation preset (one-time)
4. Complete jobs as they happen (~10 seconds each)
5. AvisLoop handles everything else automatically
6. Check dashboard occasionally for insights
```

### V2 Core Principles

#### 1. Jobs Are the Primary Object
- Every review request originates from a completed job
- Jobs link to customers, not the other way around
- A job represents real work done — the natural trigger for review requests

#### 2. Customers Are Side Effects
- Customers are created when jobs are completed
- If a customer already exists, the job links to them
- There is no "Add Customer" in normal workflow
- Customer data is captured as part of job completion

#### 3. Automation by Default
- No manual "Send" button in normal usage
- Campaigns handle all outreach automatically
- Multi-touch sequences ensure follow-up
- User sets preferences once, system executes forever

#### 4. Event-Driven, Not Message-Driven
- System reacts to events: job completed, invoice paid, etc.
- Events trigger campaigns
- Messages are outcomes, not inputs

#### 5. Minimal User Involvement
- The only recurring action is "Complete Job" (~10 seconds)
- Everything else is automated or one-time setup
- User should NOT be making daily decisions about sending

---

## The One Manual Action

V2 has exactly ONE action that triggers automation:

### "Complete a Job"

This can happen in two ways:

**Option A: Complete immediately (owner/solo operator)**
```
Add Job → Fill customer info → Status: Completed → Done
```

**Option B: Schedule then complete later (dispatch-based)**
```
Add Job → Fill customer info → Status: Scheduled → [later] → Mark Complete
```

Both options end the same way: **"Complete" triggers automation.**

### Required fields (at job creation):
- Customer name
- Phone OR email (at least one)
- Service type

### Optional fields:
- Technician
- Notes
- "Customer happy?" toggle

### What happens when a job is marked completed:
1. Customer record created (if new) or linked (if existing)
2. Job status set to `completed`, `completed_at` timestamp set
3. Matching campaign found based on service type
4. Enrollment created with scheduled touches
5. System takes over — user is done

**Time to complete:** ~10 seconds (immediate) or ~2 seconds (mark complete)

---

## Job Lifecycle

Jobs support a full lifecycle from scheduling through completion:

### Job Statuses

| Status | Meaning | Campaign Enrollment |
|--------|---------|---------------------|
| `scheduled` | Job created, work not yet done | No — waiting for completion |
| `completed` | Work finished, customer satisfied | Yes — auto-enroll |
| `do_not_send` | Don't request review (bad experience, etc.) | No — explicitly blocked |

### The Trigger

**"Mark Complete" is the ONLY trigger for campaign enrollment.**

```
scheduled ──────────────────► completed ──────► enrolled
              ↑                    ↑
         User action          THE TRIGGER
        (one tap)           (automation starts)
```

### Real-World Flow

```
OFFICE (morning)                    TECHNICIAN (afternoon)
┌─────────────────────┐             ┌─────────────────────┐
│ Create job          │             │ Finish work         │
│ • Customer info     │             │ • Customer happy    │
│ • Service type      │             │ • Tap "Complete"    │
│ • Status: scheduled │             │                     │
└─────────────────────┘             └─────────────────────┘
         │                                    │
         │                                    ▼
         │                          ┌─────────────────────┐
         │                          │ System auto-enrolls │
         │                          │ in matching campaign│
         └─────────────────────────►└─────────────────────┘
              Customer created
              when job created
```

### Example: HVAC Company

```
Monday 8:00 AM   Office creates job: "Johnson - AC Repair" (scheduled)
                 └── Customer: Patricia Johnson, pjohnson@email.com
                 └── Service: HVAC
                 └── Status: scheduled
                 └── Campaign: NOT enrolled yet

Monday 2:30 PM   Sarah (technician) finishes repair
                 └── Opens AvisLoop on phone
                 └── Finds "Johnson - AC Repair"
                 └── Taps "Mark Complete"

Monday 2:30 PM   System automatically:
                 └── Sets status → completed
                 └── Sets completed_at → now
                 └── Enrolls in HVAC campaign
                 └── Schedules Touch 1 for Tuesday 2:30 PM

Tuesday 2:30 PM  Touch 1 email sent (no human involved)
```

### Why This Matters

1. **Realistic for dispatch-based businesses** — Office schedules, technician completes
2. **Clean separation** — Job creation ≠ campaign trigger
3. **Flexibility** — Jobs can be created hours/days before completion
4. **Still V2 aligned** — "Complete" remains the one manual action that triggers automation

### UI Implications

| Location | Behavior |
|----------|----------|
| Add Job Sheet | Default status = `scheduled` |
| Job Table | Show status badge, "Mark Complete" button for scheduled jobs |
| Mobile | One-tap "Complete" from job list |
| Dashboard | "Ready to Complete" queue for scheduled jobs |

---

## V2 Automation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         V2 AUTOMATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

     USER ACTION (once)              AUTOMATIC (forever)
    ┌─────────────┐
    │ Complete    │
    │ Job         │───────────────────────────────────┐
    │ (~10 sec)   │                                   │
    └─────────────┘                                   ▼
                                           ┌─────────────────┐
                                           │ Create/Link     │
                                           │ Customer        │
                                           └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ Find Matching   │
                                           │ Campaign        │
                                           └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ Enroll in       │
                                           │ Campaign        │
                                           └────────┬────────┘
                                                    │
                         ┌──────────────────────────┼──────────────────────────┐
                         ▼                          ▼                          ▼
                  ┌────────────┐            ┌────────────┐            ┌────────────┐
                  │ Touch 1    │            │ Touch 2    │            │ Touch 3    │
                  │ (4-72 hrs) │───────────▶│ (+24 hrs)  │───────────▶│ (+48 hrs)  │
                  └────────────┘            └────────────┘            └────────────┘
                         │                          │                          │
                         └──────────────────────────┼──────────────────────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ Customer        │
                                           │ Clicks Link     │
                                           └────────┬────────┘
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              ▼                                           ▼
                      ┌─────────────┐                             ┌─────────────┐
                      │ 4-5 Stars   │                             │ 1-3 Stars   │
                      │ → Google    │                             │ → Private   │
                      │   Review    │                             │   Feedback  │
                      └─────────────┘                             └─────────────┘
                              │                                           │
                              └─────────────────────┬─────────────────────┘
                                                    ▼
                                           ┌─────────────────┐
                                           │ Stop Campaign   │
                                           │ (Action taken)  │
                                           └─────────────────┘
```

---

## UI/UX Implications

### Navigation Hierarchy

**V1 Navigation (Wrong):**
```
1. Customers     ← Primary
2. Send          ← Core action
3. History
4. Settings
```

**V2 Navigation (Correct — Implemented 2026-02-21):**
```
1. Dashboard     ← Hub with WelcomeCard (first-run) + Ready-to-Enroll queue
2. Jobs          ← THE core action (orange Add Job button)
3. Campaigns     ← Automation config
4. Analytics     ← Insights
5. Activity      ← Audit trail + bulk retry for failed sends
6. Feedback      ← Customer sentiment
---
[Moved to Settings]
7. Customers     ← Settings > Customers tab (not in main nav)
```

### Primary Action Placement

**V1 Approach (Wrong):**
- "Send Review Request" as main CTA
- "Add Customer" prominent everywhere
- Template selection before sending

**V2 Approach (Correct):**
- "Complete Job" / "Add Job" as main CTA
- Prominent in sidebar, mobile FAB, dashboard
- Customers created as side effect
- No manual send in normal workflow

### Empty States

**V1 Empty State (Wrong):**
> "No customers yet. Add your first customer to start sending review requests."

**V2 Empty State (Correct):**
> "No customers yet. Customers appear here as you complete jobs. Ready to add your first job?"

### Onboarding

**V1 Onboarding (Wrong):**
1. Business basics
2. **Import customers** ← Contradicts V2
3. Create templates
4. Start sending

**V2 Onboarding (Correct):**
1. Business basics
2. Review destination (Google link)
3. Services offered
4. Campaign preset (Gentle/Standard/Aggressive)
5. SMS consent acknowledgement
6. **Done** — Start completing jobs

---

## Feature Evaluation Checklist

When building or evaluating a feature, ask:

### Does it align with V2?

| Question | V2 Answer |
|----------|-----------|
| Does it require recurring manual action? | No (except job completion) |
| Does it treat customers as the primary object? | No — jobs are primary |
| Does it encourage manual sending? | No — automation handles this |
| Does it require the user to make frequent decisions? | No — set once, runs forever |
| Does it start with "Send..."? | No — it starts with "Complete job" |
| Does it require building a customer list first? | No — customers come from jobs |

### V2 Alignment Score

For any feature, count how many apply:

- [ ] Triggered by job completion event
- [ ] Runs automatically after setup
- [ ] Requires no daily user attention
- [ ] Customers are created/linked implicitly
- [ ] Messaging is handled by campaigns
- [ ] User's only action is completing jobs

**Score:**
- 6/6 = Fully V2 aligned
- 4-5/6 = Mostly aligned, minor adjustments needed
- 2-3/6 = Significant V1 patterns, needs rework
- 0-1/6 = V1 feature, should be deprecated or hidden

---

## What To Do With V1 Features

### Keep but De-emphasize

| Feature | Current | V2 Treatment | Status |
|---------|---------|--------------|--------|
| "Add Customer" | Prominent button | Move to overflow menu or remove | Moved to Settings > Customers tab (2026-02-21) |
| "Send" page | Main navigation | Rename "Manual Request", move to bottom, add friction | Removed from main nav (Phase 30) |
| CSV Import | Onboarding step | Remove from onboarding, keep as advanced option | Removed from onboarding (2026-02-21), kept in Settings > Customers |
| Template selection before send | Default flow | Only in campaign setup, not per-send | Done |

### Keep as Escape Hatch

Some V1 features serve edge cases:

- **Manual send**: For one-off customers who will never return
- **Add Customer directly**: For pre-populating before a job (rare)
- **CSV import**: For migration from another system (one-time)

These should exist but with friction:
- Not in main navigation
- Warning messages ("Campaigns handle this automatically")
- Tracking usage to evaluate removal

### Remove Eventually

After V2 adoption is confirmed via metrics:

- ~~Consider hiding Customers page from main nav~~ Done (2026-02-21) — moved to Settings tab
- Consider removing Send page entirely
- ~~Remove CSV import from onboarding~~ Done (2026-02-21) — onboarding collapsed to 3 steps
- ~~Simplify to: Dashboard, Jobs, Campaigns, Analytics, Activity~~ Done — nav is Dashboard, Jobs, Campaigns, Analytics, Activity, Feedback

---

## Terminology Shift

| V1 Term | V2 Term | Reason |
|---------|---------|--------|
| "Contact" | "Customer" | More personal, service-business appropriate |
| "Review request" | "Follow-up" or "Message" | De-emphasizes manual action |
| "Send" | "Complete job" | Shifts focus to the trigger, not the output |
| "Campaign" (as noun) | "Automation" or "Sequence" | Clarifies it runs automatically |
| "Template" | "Message template" | Neutral, used by campaigns |

---

## Success Metrics for V2 Adoption

### Leading Indicators

| Metric | V1 Pattern | V2 Pattern |
|--------|------------|------------|
| Jobs created per week | Low/zero | Matches real job volume |
| Manual sends per week | High | Near-zero |
| Campaign enrollments | Low | Matches jobs created |
| "Add Customer" clicks | High | Near-zero |
| Time in app | High (manual work) | Low (just completing jobs) |

### Lagging Indicators

| Metric | V1 Pattern | V2 Pattern |
|--------|------------|------------|
| Reviews collected | Inconsistent | Steady, predictable |
| Response rate | Low (forgotten follow-ups) | High (automated multi-touch) |
| User retention | Low (too much work) | High (runs automatically) |
| NPS | Neutral | High (it just works) |

---

## Common V1 Patterns to Avoid

### 1. "Let me add some customers first"
**Wrong:** Building a customer database before using the product
**Right:** Complete your first job, customer is created automatically

### 2. "I need to send review requests"
**Wrong:** User thinking about sending as an action they take
**Right:** User completes jobs, reviews happen automatically

### 3. "Which customers should I contact?"
**Wrong:** User selecting who to reach out to
**Right:** Campaign rules determine who and when automatically

### 4. "I forgot to send follow-ups"
**Wrong:** User responsible for remembering
**Right:** System handles multi-touch follow-up automatically

### 5. "I'll import my customer list"
**Wrong:** Treating AvisLoop as a CRM
**Right:** Customers accumulate naturally as jobs are completed

---

## Implementation Priorities

### Phase 1: De-emphasize V1 (Quick Wins) — COMPLETE

1. ~~Change "Add Job" button from `outline` to `default` variant~~ Done (Phase 30)
2. ~~Update Customers empty state copy~~ Done (Phase 30)
3. ~~Rename "Send" → "Manual Request" in navigation~~ Done (Phase 30)
4. ~~Move "Manual Request" to bottom of navigation~~ Done (Phase 30)
5. ~~Add friction message on manual send~~ Done (Phase 30)

### Phase 2: Strengthen V2 Flow (Medium Effort) — PARTIAL

1. ~~Add inline customer creation in "Add Job" sheet~~ Done (Phase 30)
2. ~~Add mobile FAB for "Add Job"~~ Done (Phase 30)
3. Show campaign enrollment preview on job cards
4. Show "Will enroll in [Campaign] in X hours" on jobs

### Phase 3: Full V2 (Larger Changes) — COMPLETE (2026-02-21)

1. ~~Remove "Import Customers" from onboarding~~ Done — onboarding collapsed to 3 steps
2. ~~Consider hiding Customers from main nav~~ Done — moved to Settings > Customers tab
3. Evaluate Send page removal based on usage data
4. ~~Dashboard becomes the "Complete Job" entry point~~ Done — WelcomeCard + reordered dashboard

---

## Reference: V2 Philosophy Quotes

From the product overview:

> "Jobs are the primary object, not customers. Customers are created implicitly when a job is completed."

> "There is no 'Add Customer' button in normal usage. This is intentional."

> "This is no longer a tool for manually sending review requests."

> "AvisLoop V2 does not start with 'send a message.' It starts with events."

> "The only manual input in V2 is completing a job. This takes ~10 seconds."

> "Once the job is completed, the user is done. The system now handles everything."

> "No contacts uploaded. No lists imported. No templates built. That's it."

> "If V1 was about sending, V2 is about systemizing trust."

---

## Decision Framework

When faced with a product decision, ask:

1. **Does this require the user to do more work?**
   - If yes, find a way to automate it or remove it

2. **Does this treat customers as the primary object?**
   - If yes, reframe around jobs

3. **Does this encourage manual sending?**
   - If yes, consider if a campaign could handle it

4. **Would a user need to do this daily?**
   - If yes, it should be automated

5. **Does this align with "complete job → reviews happen"?**
   - If no, reconsider the feature

---

*This document is the canonical reference for V2 philosophy. When in doubt, refer here.*
