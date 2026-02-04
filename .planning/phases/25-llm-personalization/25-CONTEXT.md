# Phase 25: LLM Personalization - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Optionally personalize campaign messages via LLM with guardrails, graceful fallback to templates, and cost tracking. Personalization enhances existing campaign sends (Phase 24) without blocking delivery on failure.

</domain>

<decisions>
## Implementation Decisions

### Personalization Behavior

**Rewrite Level:**
- Moderate rewrite as default: restructure sentences, vary phrasing, add warmth while preserving all factual content
- Full personalization deferred as potential future tier differentiator

**Context Fields (Tiered):**
- Tier 1 (Core): Customer first name, business name, service type, technician first name, job completion date
- Tier 2 (Conversion boosters): Time-of-day greeting, customer status (new/repeat), job outcome notes, service address (city only)
- Tier 3 (Advanced/agencies): Customer tags, technician photo URL, before/after flag, previous review history, job value tier
- UI: Show basic tokens by default, "More fields" expansion for advanced
- Missing fields: Graceful omission (rewrite around naturally, never show raw `{{token}}`)

**Activation:**
- Always on by default for all campaign sends
- Per-campaign toggle in "Advanced settings" for power users who need control (compliance, A/B testing)
- No per-touch granularity

**Guardrails (Preserve exactly):**
- Review link URL (must match approved domain)
- Opt-out/STOP language (TCPA compliance)
- Business name (must match account)
- Phone numbers
- Specific offers/discounts
- Technician name (if included)
- Auto-detect via regex + account settings lookup
- Optional `[PRESERVE]` blocks for "Compliance mode" power users

**Content Rules (Baked into system prompt):**
- Prohibited: Invented claims/awards, incentive language, fake urgency, guilt/pressure, suggestions review should be positive, competitor mentions, promises about future service
- Allowed: Genuine gratitude, "reviews help neighbors," social proof, acknowledging busy, specific service performed, friendly sign-offs
- Users can opt into identity statements ("family-owned business")

**Touch Variation:**
- Vary content/angle across touches, maintain consistent brand voice
- Pass touch metadata to LLM: touch number, channel, days since service, opened status
- Touch-specific prompt variants: Touch 1 (fresh ask), Touch 2 (gentle reminder), Touch 3 (final nudge)

**Channel-Aware Prompts:**
- SMS: Punchy, casual, max 160 chars, no fluff, text-message tone
- Email: Warmer, more detail, can reference photos/attachments
- Two prompt templates with shared preserved content, different system instructions

**Missing Data Handling:**
- Critical (customer name, review link): Block send, surface to user
- Important (business name, service type): Graceful omission + soft warning
- Nice-to-have (technician, job notes): Silent graceful omission
- Dashboard coaching: "12 jobs missing tech names — adding increases conversion by ~8%" (non-blocking)

**Voice Control:**
- Preset tones: Friendly (default), Professional, Casual, Straightforward
- Custom voice prompt unlocked for agencies/premium ("Describe your brand voice")
- Tone selection in Settings/Campaign Advanced, not main flow

**History Awareness:**
- Acknowledge repeat customers by default ("Thanks for trusting us again")
- Add `customer_type` (new/repeat) and `tenure_months` tokens
- Specific service history: Opt-in for businesses with strong data hygiene, off by default

### Preview & Approval Flow

**Preview Triggers (Phased):**
- MVP: Campaign creation preview (3-5 samples with real customer data)
- V1.1: On-demand preview + sent message log ("What did we send Mary?")
- V1.2: Send queue preview ("Messages sending in next hour" with pause option)

**Sample Count:**
- Default 3 curated samples, expandable to 5-10
- Curate for trust: (1) Best case with full data/repeat customer, (2) Graceful degradation with missing field, (3) Edge case (new customer or different channel)
- Label samples with context ("Sample 1 – Complete data (repeat customer)")

**Preview Actions:**
- Regenerate all samples
- Regenerate single sample
- Link back to edit template
- "Approve & Launch" button
- No inline editing at preview stage (reserved for send queue in V1.2)

**Diff View:**
- Optional diff toggle with smart defaults
- First-time users: diff visible by default (collapsed "See what was personalized")
- Returning users: clean view, remember preference
- Friendly highlights, not developer-style red/green

**Approval Granularity:**
- First 10 messages require approval (trust-building)
- Then graduates to campaign-level approval ("set and forget")
- Optional per-message approval toggle in Settings for agencies/anxious users
- Onboarding UX: "4 of 10 remaining before auto-send unlocks"

**Multi-Touch Preview:**
- Full sequence view: Show all touches for one sample customer in order
- Navigation: Previous/Next Customer, Regenerate Sequence
- Editing mode: Focus on one touch with collapsed context of before/after

### Fallback & Error Handling

**Severity-Based Fallback:**
- Transient (timeout, rate limit): Retry 2-3x with backoff, then fallback to raw template
- Quality (invalid output, too long, prohibited content): Immediate fallback to raw template
- Critical (missing template, missing review link, opted-out customer): Block send, surface in dashboard

**Model Strategy:**
- Multi-model routing via OpenRouter / Vercel AI SDK
- Gemini Flash (70%): Bulk SMS, standard email, simple personalization
- GPT-4o-mini (25%): Touch 2/3 variation, missing data handling, higher-stakes tasks
- DeepSeek V3 (5%): Complex edge cases, experimentation
- Automatic failover chain: Primary → Secondary → Raw template

**Fallback Visibility:**
- Aggregated stats by default: "97% personalized, 3% standard template"
- Click to drill down into specific fallback messages with timestamps/reasons
- No notifications about individual fallbacks — dashboard-only discovery

**Output Validation (<50ms budget):**
- Critical (<1ms): Review link present, opt-out present, SMS length, no unresolved tokens
- Security (<5ms): No HTML/scripts, no URLs except approved review link
- Compliance (<10ms): No incentive language, no profanity, business name matches
- Prohibited phrases in config, not hardcoded

**Retry Strategy (Failure-Aware):**
- Timeout: Immediate → 1s → fallback
- Network error: 500ms → 2s → fallback
- Rate limit: 2s → 4s → 8s with jitter (respect Retry-After header)
- Server error (5xx): 2s → 4s → fallback
- Hard time cap: 15 seconds max, then fallback
- Add ±25% jitter to prevent thundering herd

**Threshold Alerts:**
- <5%: Dashboard stats only (normal)
- 5-15%: Subtle dashboard indicator
- >20% in 1 hour: In-app alert with context, possible causes, actions
- >35% sustained: Email notification
- Auto-resolve when rate normalizes

**Failure Logging:**
- Structured logs: Failure type, timestamp, customer ID, template ID, model used, retry attempts, outcome
- No full LLM input/output stored (privacy/storage)
- 30-day retention

### Cost Visibility & Limits

**Cost Visibility:**
- Hidden — costs absorbed into subscription tiers
- Users see message limits and value metrics, not LLM costs
- Personalization is magic, not metered utility
- Internal tracking for margin optimization

**Rate Limits:**
- Message limit = personalization limit (one number)
- No separate "AI credits" or quota
- Hit tier limit → sends stop with clear upgrade CTA, no overage charges
- Abuse prevention: Preview regeneration soft limit (50/hour), daily preview cap (200/day)
- Progress indicators at 70%, 90%, 100%

**Disable Option:**
- Campaign-level toggle in advanced settings for legitimate needs
- Not framed as "save credits" — disabling doesn't conserve quota
- Label: "Use exact template text for all recipients" with note about 2x response rates
- No account-level kill switch
- Upgrade path, not downgrade path

**Usage Analytics:**
- Default dashboard: Reviews collected, requests sent, response rate, average rating
- Detailed view (one click deeper): Per-campaign breakdown, channel comparison, touch performance
- Agency tier: Client comparison + export
- No LLM costs, token usage, or fallback % on main dashboard

### Claude's Discretion

- Exact prompt engineering and system instructions
- Model routing rules and thresholds
- Validation regex patterns and prohibited phrase list
- Log schema and retention details
- Preview UI component structure
- Alert message copy and timing
- Database schema for tracking (personalization_logs table, etc.)

</decisions>

<specifics>
## Specific Ideas

- "I like how Twitter shows new posts indicator without disrupting scroll" — apply similar pattern to preview regeneration (non-disruptive updates)
- Preview should feel like Linear's issue cards — clean, not cluttered
- First 10 message approval is like a trust ladder — earn permission to automate
- Full sequence view shows "John's journey" through all touches
- Diff should feel friendly ("What we personalized" summary with checkmarks), not technical
- Alert tone: "Worth a look" not "URGENT: SYSTEM FAILURE"
- Dashboard answers "Is this worth paying for?" in 3 seconds

</specifics>

<deferred>
## Deferred Ideas

- Full personalization tier as premium differentiator — potential v3.0 feature
- Per-message cost tracking — only if API/white-label tier added
- Inline message editing in send queue — V1.2 scope
- A/B testing framework for personalization levels — future optimization
- Quality scoring and model performance comparison — internal tooling, not user-facing
- Review response draft generation — separate feature (Phase 26 or later)

</deferred>

---

*Phase: 25-llm-personalization*
*Context gathered: 2026-02-04*
