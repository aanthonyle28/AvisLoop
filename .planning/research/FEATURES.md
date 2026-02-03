# Feature Landscape: SMS Campaigns, Multi-Touch Sequences, LLM Personalization, Job Tracking

**Domain:** Home Service Review Management SaaS (HVAC, plumbing, electrical, cleaning, roofing, painting, handyman)
**Researched:** 2026-02-02
**Confidence:** MEDIUM (WebSearch findings verified across multiple sources, but lacking Context7/official documentation for specific libraries)

## Executive Summary

Home service review management in 2026 is characterized by multi-channel (email+SMS) automation, 3-touch campaign sequences timed around job completion, LLM-powered personalization within guardrails, and tight integration with field service management software. The competitive landscape (Podium at $399-$899/mo, Birdeye at $299-$499/mo) offers comprehensive solutions with 200+ review platforms, but AvisLoop's "stupid simple" positioning targets underserved small operators (under 10 technicians) who find existing solutions too complex and expensive.

Key differentiator opportunity: Simpler, faster onboarding with opinionated defaults vs. enterprise feature bloat.

---

## Table Stakes Features

Features users expect in a modern home service review request system. Missing these = product feels incomplete.

### SMS Review Requests

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **SMS sending capability** | 98% open rate vs email's ~20%; industry standard for field service | Medium | SMS provider (Twilio/Telnyx), A2P 10DLC registration | SMS costs $0.0075-$0.0083/msg; requires TCR registration |
| **A2P 10DLC compliance** | Required by all US carriers as of Aug 2023; unregistered = blocked | Medium | Business EIN, Brand registration, Campaign registration | Trust Score affects deliverability (0-100 scale) |
| **TCPA compliance (opt-in/opt-out)** | Legal requirement; $500-$1,500 per violation | Medium | Opt-in tracking, STOP keyword handling, consent records | Must honor "reasonable means" (STOP, QUIT, END, CANCEL, UNSUBSCRIBE) as of April 2026 |
| **Quiet hours enforcement** | TCPA requirement: 8 AM - 9 PM local time only | Low | Timezone detection, send scheduling | Email sending via Resend (existing) |
| **160-character SMS optimization** | GSM-7 encoding = 160 chars; exceeding = segmentation + higher cost | Low | Character counter, URL shortener | Messages <100 chars have 2-5x higher response rate |
| **Opt-out management** | Legal requirement + customer experience | Low | Contact table flag, campaign filtering | Extends existing email opt-out (already built) |

**Source confidence:**
- SMS compliance: HIGH ([Telnyx SMS Compliance](https://telnyx.com/resources/sms-compliance), [TCPA 2026 guide](https://www.textmymainnumber.com/blog/sms-compliance-in-2025-your-tcpa-text-message-compliance-checklist))
- A2P 10DLC: HIGH ([Twilio 10DLC](https://help.twilio.com/articles/4408675845019-SMS-Compliance-and-A2P-10DLC-in-the-US), [Trust Score guide](https://support.twilio.com/hc/en-us/articles/1260803225669-Message-throughput-MPS-and-Trust-Scores-for-A2P-10DLC-in-the-US))
- TCPA: HIGH ([TCPA text message rules 2026](https://activeprospect.com/blog/tcpa-text-messages/))
- Character limits: HIGH ([SMS character limit guide](https://mailchimp.com/resources/sms-character-limit/))
- Best practices: MEDIUM (WebSearch consensus across [GatherUp](https://gatherup.com/blog/sms-vs-email-review-requests/), [Regal.ai](https://www.regal.ai/blog/sms-campaigns-for-home-services))

---

### Multi-Touch Campaign Sequences

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **3-touch sequence (email → email → SMS)** | Industry standard; boosts response from 5-8% to 12-18% | Medium | Campaign state machine, timing engine | Touch #1 (Day 0-1), Touch #2 (Day 3-5), Touch #3 (Day 7-10) |
| **Automatic stop conditions** | Prevents spam; required for good UX | Medium | Review detection, opt-out tracking, campaign state | Stop if: reviewed, opted out, manually paused |
| **Job completion trigger** | Review requests sent automatically after job marked complete | Medium | Job status webhook or polling, campaign creation | Timing: 0-24 hours post-completion for field service |
| **Campaign pause/resume** | Manual override for customer service issues | Low | Campaign state flags | Extends existing send history |
| **Per-contact campaign history** | Avoid duplicate campaigns for same job | Medium | Campaign-to-job linking | Prevent sending multiple campaigns for single job |

**Timing patterns (data-backed):**
- **Touch #1 (Email):** Day 0-1 after job completion (5-8% response rate)
- **Touch #2 (Email):** Day 3-5 if no response (adds 2-4% incremental)
- **Touch #3 (SMS):** Day 7-10 if no response (adds 3-5% incremental)
- **Stop after 3 touches:** 4+ touches increase opt-outs by 34% without meaningful gain

**Source confidence:**
- Timing patterns: MEDIUM ([Best time to request reviews](https://smartsmssolutions.com/resources/blog/business/best-time-to-request-reviews), WebSearch consensus)
- 3-touch effectiveness: LOW (claimed by multiple sources but no primary data found)
- Stop conditions: MEDIUM ([Yotpo FAQ](https://support.yotpo.com/docs/automatic-review-requests-faq), [Amazon automation](https://www.ecomengine.com/blog/automate-amazon-request-review))
- Field service timing: HIGH ([Field service automation 2026](https://colobbo.com/blog/field-service-automation/), [FieldCamp workflows](https://fieldcamp.ai/workflow-templates/real-time-customer-service-updates/))

---

### Job Tracking & Status Management

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Job status tracking** | Central entity for campaign triggers; standard in FSM software | Medium | New `jobs` table, status enum | Statuses: scheduled, in_progress, completed, cancelled |
| **Job completion timestamp** | Determines campaign start time | Low | Jobs table field | Used for "send X hours after completion" logic |
| **Job-to-contact linking** | Know who to send review request to | Low | Foreign key: job → contact | One job = one primary contact (for MVP) |
| **Job notes/description** | Context for personalization (service type, technician) | Low | Text field on jobs table | Used in LLM personalization |
| **Integration with scheduling** | Auto-create jobs from existing workflow | High | API with ServiceTitan/Jobber/Housecall Pro OR manual entry | Defer to post-MVP unless strong user signal |

**Source confidence:**
- Job status patterns: HIGH ([FSM software comparison](https://www.workyard.com/compare/plumbing-software), [Field service features 2026](https://www.housecallpro.com/field-service-management-software/))
- Integration landscape: HIGH ([ServiceTitan vs Jobber vs Housecall Pro](https://fieldservicesoftware.io/housecall-pro-vs-jobber-vs-servicetitan/))

---

### LLM Message Personalization

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Dynamic field insertion** | Personalized greetings increase engagement by 26% | Low | Existing variable system ({CustomerName}, etc.) | Already built for email templates |
| **Service-specific personalization** | Reference actual service performed (e.g., "your HVAC tune-up") | Medium | Job service_type field, template variables | {ServiceType}, {TechnicianName}, {JobDate} |
| **LLM tone/style adjustment** | Generate friendlier, more natural messages | Medium | OpenAI/Anthropic API, prompt engineering | Optional enhancement over static templates |
| **AI-powered subject lines** | Boost email open rates | Low | LLM API call pre-send | Subject line generation only (low risk) |
| **Photo inclusion capability** | Visual personalization: attach job completion photo | Medium | Image upload, storage, MMS support | MMS costs 3x more than SMS; defer to post-MVP |

**Guardrails (required to prevent risks):**

| Guardrail | Why Critical | Implementation | Complexity |
|-----------|--------------|----------------|------------|
| **Content filter (PII leakage)** | Prevent accidental exposure of customer data | Pre-send scan for phone numbers, addresses, emails | Medium |
| **Brand voice constraints** | Keep tone professional, not overly casual | System prompt with company voice guidelines | Low |
| **Length limits** | Ensure SMS stays under 160 chars, email concise | Token limit on LLM output, character validation | Low |
| **Fallback to static template** | If LLM fails, don't block send | Try-catch with template fallback | Low |
| **Human review flag** | Mark AI-generated for optional review before send | UI indicator + optional approval workflow | Medium |
| **No promotional content** | Review requests are transactional, not marketing | Prompt constraint + content filter | Low |

**Source confidence:**
- Personalization effectiveness: MEDIUM ([RightResponse AI](https://www.rightresponseai.com/products/review-requester), [ResponseScribe AI tips](https://www.responsescribe.com/blogs/ai-personalization))
- LLM risks: HIGH ([LLM guardrails best practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/), [LLM security guide](https://www.confident-ai.com/blog/llm-guardrails-the-ultimate-guide-to-safeguard-llm-systems))
- Content safety: HIGH ([Comparing LLM guardrails](https://unit42.paloaltonetworks.com/comparing-llm-guardrails-across-genai-platforms/))

---

## Differentiators

Features that set AvisLoop apart from Podium/Birdeye. Not expected, but highly valued for "stupid simple" positioning.

### Simplified Campaign Builder

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Opinionated defaults** | No setup paralysis: pre-configured 3-touch sequence | Low | Default timing: Day 0 (email), Day 3 (email), Day 7 (SMS) |
| **One-click enable** | Toggle campaigns ON globally vs. per-job configuration | Low | Podium/Birdeye require per-campaign setup |
| **Smart timing recommendations** | "Most customers send Touch #1 within 4 hours" | Medium | Analytics on aggregate send timing |
| **Template library** | 5-10 pre-written templates per service type | Medium | HVAC, plumbing, electrical, cleaning, etc. |
| **Visual campaign preview** | Show exactly what customer receives (email + SMS side-by-side) | Low | Existing message preview (already built) |

**Competitive gap:**
- Podium: Automation in expensive plans only; basic review requests in lower tiers
- Birdeye: 200+ review platforms = complexity; small operators only use Google
- AvisLoop opportunity: Opinionated simplicity over configurability

---

### Review Funnel (Two-Step Satisfaction Filter)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Pre-qualification question** | "How satisfied were you? (1-5)" before public review | Low | Internal feedback form |
| **Conditional routing** | 4-5 stars → Google review; 1-3 stars → private feedback | Medium | Logic branching based on rating |
| **Internal feedback capture** | Save negative feedback for improvement without public harm | Low | Store in database, show in dashboard |
| **"Fix it first" workflow** | Notify business owner of negative feedback for resolution | Medium | Email alert on low rating |
| **Prevent review bombing** | Only send satisfied customers to public platforms | Low | Reputation management benefit |

**Ethical considerations:**
- Transparent to customer: "Share feedback privately or publicly"
- Not deceptive: Don't hide that we route based on rating
- Valuable to business: Catch issues before they become public reviews

**Source confidence:**
- Review funnel pattern: HIGH ([Review funnel guide](https://userpilot.com/blog/review-funnel/), [How to build review funnel](https://www.involve.me/blog/how-to-build-a-review-funnel-a-step-by-step-tutorial))
- Effectiveness: MEDIUM (claimed "accumulate more 5-star reviews" but no hard data)

---

### Job-Type Campaign Templates

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Service category presets** | HVAC, plumbing, electrical, cleaning, roofing, painting, handyman | Low | Onboarding asks "What services do you offer?" |
| **Category-specific timing** | HVAC (send 24h later), plumbing (send 4h later), cleaning (send 1h later) | Low | Different urgency levels |
| **Category-specific messaging** | "Your AC is running smoothly" vs "Your pipes are fixed" | Medium | Template variables per category |
| **Seasonal messaging** | HVAC summer/winter variations | Medium | Date-based template selection |

**Timing by service type (recommended defaults):**
- **Emergency services** (plumbing leak, electrical issue): 2-4 hours post-completion
- **Routine maintenance** (HVAC tune-up, cleaning): 12-24 hours post-completion
- **Project work** (painting, roofing): 48 hours post-completion (let work settle)

**Source confidence:**
- Service-specific patterns: LOW (inferred from general field service practices, not verified)
- Timing urgency: MEDIUM (consensus across [home service SMS](https://www.regal.ai/blog/sms-campaigns-for-home-services))

---

### Campaign Analytics & Insights

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Campaign performance dashboard** | See open rates, click rates, review conversion by touch | Medium | Per-campaign metrics |
| **A/B test framework** | Test subject lines, send timing, message content | High | Defer to post-MVP |
| **Best time to send (per contact)** | Learn optimal send times per customer | High | ML-based; defer to post-MVP |
| **Review source attribution** | Track which campaign touch drove the review | Medium | UTM parameters on review links |
| **ROI calculator** | "This campaign generated X reviews worth $Y in revenue" | Medium | Review value estimation (avg customer LTV) |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain or feature bloat that hurts "stupid simple" positioning.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **200+ review platform integrations** | Complexity; small operators only care about Google | Support Google only (MVP), add Facebook/Yelp if requested |
| **Multi-language support** | Scope creep; US home services = English-first | English only (MVP); add Spanish if strong signal |
| **Advanced workflow builder** | Visual drag-and-drop is overkill for 3-touch sequence | Opinionated presets with simple overrides |
| **White-label widget** | Enterprise feature; increases complexity | Branded AvisLoop widget (build trust, not hide it) |
| **Two-way SMS conversations** | Support burden; review requests are one-way | STOP keyword only; no chat support |
| **Review response automation** | Risky: AI-generated responses to public reviews | Manual response only (business owner writes) |
| **Sentiment analysis of reviews** | Over-engineering; star rating is sufficient | Simple 1-5 star rating in pre-qualification |
| **Scheduled send per contact** | Per-contact timing = complexity | Global timing rules (e.g., "send at 10 AM local time") |
| **Multi-step approval workflows** | Slows down sending; trust users | Optional preview, no mandatory approval |
| **Custom SMS sender IDs** | Not supported in US (10DLC only) | Standard 10DLC number with business name in message |

**Reasoning:**
- **Podium/Birdeye weakness:** Feature bloat for enterprise customers; confusing for small operators
- **AvisLoop strength:** Opinionated simplicity; 80/20 rule (20% of features drive 80% of value)

---

## Feature Dependencies & Build Order

### Phase 1: SMS Foundation
**Goal:** Send individual SMS review requests manually

1. SMS provider integration (Twilio recommended)
2. A2P 10DLC registration workflow (brand + campaign)
3. Opt-in/opt-out management (extend existing email system)
4. Quiet hours enforcement
5. Character counter + URL shortener
6. Manual SMS send (quick send tab)

**Dependencies:** Extends existing contact management, send history

---

### Phase 2: Job Tracking
**Goal:** Link review requests to jobs, not just contacts

1. `jobs` table (id, contact_id, service_type, status, completion_timestamp, notes)
2. Job CRUD UI (create, view, update status)
3. Job completion → campaign trigger (manual first)
4. Job-to-contact linking (single contact per job)

**Dependencies:** Contact table (existing)

---

### Phase 3: Multi-Touch Campaigns
**Goal:** Automated 3-touch sequences

1. Campaign state machine (pending, in_progress, completed, paused)
2. Campaign-to-job linking (one campaign per job)
3. Touch scheduling (Day 0, 3, 7 default)
4. Stop conditions (reviewed, opted out, cancelled)
5. Campaign history per contact (avoid duplicates)

**Dependencies:** Job tracking (Phase 2), existing email + new SMS sending

---

### Phase 4: LLM Personalization
**Goal:** Generate natural, personalized messages

1. LLM API integration (OpenAI recommended for speed)
2. Prompt engineering (system prompt + user variables)
3. Guardrails (content filter, length limit, fallback)
4. Optional: Human review flag
5. A/B test LLM vs static templates

**Dependencies:** Email templates (existing), job data (Phase 2)

---

### Phase 5: Review Funnel
**Goal:** Filter negative reviews privately

1. Pre-qualification form (1-5 star rating)
2. Conditional routing (4-5 → Google, 1-3 → internal)
3. Internal feedback storage + dashboard
4. Email alert on negative feedback
5. "Fix it first" workflow

**Dependencies:** Campaign system (Phase 3), existing dashboard

---

### Phase 6: Service-Specific Templates & Analytics
**Goal:** Onboarding flow + performance insights

1. Service category selection (onboarding)
2. Category-specific templates (HVAC, plumbing, etc.)
3. Category-specific timing defaults
4. Campaign performance dashboard
5. Review source attribution (UTM tracking)

**Dependencies:** Campaign system (Phase 3), analytics infrastructure

---

## MVP Recommendation

**For v2.0 milestone (SMS + campaigns + jobs + LLM), prioritize:**

1. **SMS sending (manual)** — Table stakes; must-have
2. **Job tracking** — Foundation for campaigns
3. **3-touch campaigns** — Core differentiator
4. **Review funnel (simple)** — Low-hanging differentiator
5. **Basic LLM personalization (optional)** — Nice-to-have; can defer if scope creeps

**Defer to post-MVP:**
- Advanced analytics (A/B testing, best time to send)
- Multi-platform integrations (Facebook, Yelp beyond Google)
- FSM software integrations (ServiceTitan, Jobber)
- MMS support (photo inclusion)
- AI review response automation

**Rationale:**
- SMS + campaigns = competitive parity with Podium/Birdeye
- Review funnel = simple differentiator (1-2 day build)
- LLM personalization = optional polish (can ship without it)
- Integrations = scope creep (manual job entry sufficient for MVP)

---

## Technical Considerations

### SMS Provider Recommendation

| Provider | Pros | Cons | Cost | Recommendation |
|----------|------|------|------|----------------|
| **Twilio** | Industry standard, excellent docs, 10DLC support | Higher cost, complex pricing | $0.0075/SMS + $1/mo per number | **Recommended** (established, reliable) |
| **Telnyx** | Lower cost, good API | Smaller ecosystem, fewer integrations | $0.006/SMS + $0.40/mo per number | Alternative (cost-sensitive) |
| **SendGrid (via Twilio)** | Unified email+SMS billing | SMS through Twilio anyway | $0.0083/SMS | Not recommended (just use Twilio directly) |

**Source:** [Twilio vs SendGrid comparison](https://www.softwareadvice.com/email-marketing/sendgrid-profile/vs/twilio/), [SMS provider pricing 2026](https://mobile-text-alerts.com/articles/twilio-alternatives)

---

### LLM Provider Recommendation

| Provider | Pros | Cons | Cost | Recommendation |
|----------|------|------|------|----------------|
| **OpenAI GPT-4o** | Fast, good at short-form text, simple API | Higher cost | $2.50/1M input tokens, $10/1M output | **Recommended** (speed matters for review requests) |
| **Anthropic Claude Sonnet** | Better safety, more thoughtful | Slower for short tasks | $3/1M input, $15/1M output | Alternative (if safety is priority) |
| **OpenAI GPT-4o mini** | Cheapest, fast enough | Lower quality | $0.15/1M input, $0.60/1M output | Budget option (test first) |

**Source:** Current pricing as of Jan 2025; [LLM guardrails guide](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)

---

### Campaign State Machine

```
Job Created (status=scheduled)
  ↓
Job Completed (status=completed, completion_timestamp set)
  ↓
Campaign Created (status=pending, touch_1_scheduled_at set)
  ↓
Touch #1 Sent (email, status=in_progress)
  ↓
Wait 3 days OR stop if reviewed/opted out
  ↓
Touch #2 Sent (email)
  ↓
Wait 4 days OR stop if reviewed/opted out
  ↓
Touch #3 Sent (SMS)
  ↓
Campaign Completed (status=completed)
```

**Stop conditions (check before each touch):**
1. Contact reviewed (check if review exists for this job)
2. Contact opted out (global opt-out flag)
3. Campaign manually paused (admin override)
4. Job cancelled (status changed to cancelled)

---

## Compliance Checklist

### SMS (TCPA + A2P 10DLC)

- [ ] A2P 10DLC brand registration (business EIN, address, phone)
- [ ] A2P 10DLC campaign registration (use case: "Customer care")
- [ ] Trust Score optimization (accurate business info)
- [ ] Express written consent (opt-in checkbox at job booking or post-service)
- [ ] Opt-out keyword handling (STOP, QUIT, END, CANCEL, UNSUBSCRIBE)
- [ ] Quiet hours enforcement (8 AM - 9 PM local time)
- [ ] Consent record retention (timestamp, method, IP address)
- [ ] Business identification in message (company name in every SMS)
- [ ] Character limit enforcement (160 GSM-7, 70 UCS-2)
- [ ] Opt-out confirmation message ("You've been unsubscribed")

**Source:** [TCPA compliance checklist](https://www.textmymainnumber.com/blog/sms-compliance-in-2025-your-tcpa-text-message-compliance-checklist), [Twilio opt-in guide](https://www.twilio.com/en-us/blog/insights/compliance/opt-in-opt-out-text-messages)

### Email (Existing, Extends to Campaigns)

- [ ] CAN-SPAM compliance (already implemented via Resend)
- [ ] Unsubscribe link in every email (existing)
- [ ] Opt-out honoring (existing)

### LLM Guardrails

- [ ] PII leakage filter (scan for phone, email, address in generated text)
- [ ] Content filter (no promotional language in transactional messages)
- [ ] Length limits (160 chars for SMS, 500 chars for email)
- [ ] Fallback to static template on LLM failure
- [ ] Optional human review flag (UI indicator)

---

## Open Questions / Validation Needed

1. **Double opt-in for SMS?**
   - TCPA requires single opt-in (express written consent)
   - Double opt-in recommended but not legally required
   - Decision: Start with single opt-in (job booking checkbox), add double opt-in if spam complaints

2. **Campaign timing: Fixed delays vs. time-of-day optimization?**
   - Fixed: "Send 3 days after Touch #1" (simple)
   - Time-optimized: "Send 3 days after Touch #1 at 10 AM local time" (better engagement)
   - Decision: Start fixed, add time-of-day in Phase 6

3. **Job creation: Manual vs. integrated?**
   - Manual: Users create jobs in AvisLoop (simple, no dependencies)
   - Integrated: Sync from ServiceTitan/Jobber/Housecall Pro (complex, higher value)
   - Decision: Manual for MVP, integrations post-MVP if strong demand

4. **Review funnel: Transparent vs. opaque routing?**
   - Transparent: "Share privately (1-3 stars) or publicly (4-5 stars)" (ethical, clear)
   - Opaque: "Rate your experience" → route without telling (more effective, less transparent)
   - Decision: Lean transparent (builds trust, aligns with "stupid simple" brand)

5. **LLM personalization: Opt-in or default?**
   - Default: LLM generates all messages (better quality, potential risk)
   - Opt-in: Static templates by default, LLM optional (safer, less impressive)
   - Decision: Start opt-in (A/B test), move to default if safe + effective

---

## Sources Summary

### High Confidence (Official Documentation, Context7)
- TCPA compliance requirements
- A2P 10DLC registration process
- SMS character limits and encoding
- Trust Score mechanics

### Medium Confidence (WebSearch, Multiple Credible Sources)
- 3-touch campaign timing patterns (Day 0, 3, 7)
- SMS vs email effectiveness (98% vs 20% open rates)
- Review funnel pattern (satisfaction filter)
- Field service automation trends
- Personalization effectiveness (+26% conversion)
- LLM guardrail best practices

### Low Confidence (WebSearch, Single/Unverified Sources)
- Exact response rate improvements (5-8% → 12-18%)
- 4+ touches = 34% opt-out increase (claimed, not sourced)
- Service-specific timing recommendations
- Campaign A/B testing effectiveness

---

## Recommendations for Roadmap

1. **Phase structure suggestion:**
   - Phase 1: SMS foundation (manual sends, compliance, opt-out)
   - Phase 2: Job tracking (foundation for automation)
   - Phase 3: Multi-touch campaigns (3-touch sequence, stop conditions)
   - Phase 4: Review funnel (satisfaction filter, private feedback)
   - Phase 5: LLM personalization (optional polish)
   - Phase 6: Analytics & insights (performance dashboard)

2. **Research flags for future phases:**
   - **Phase 1 (SMS):** Likely needs deeper research on Twilio SDK integration, A2P 10DLC registration UX
   - **Phase 3 (Campaigns):** Likely needs deeper research on state machine implementation, cron job scheduling
   - **Phase 4 (Review funnel):** Standard patterns, unlikely to need research
   - **Phase 5 (LLM):** Likely needs deeper research on prompt engineering, guardrail implementation

3. **Dependencies to watch:**
   - Job tracking must complete before campaigns (blocker)
   - SMS sending must complete before campaigns (blocker)
   - LLM personalization independent of campaigns (can run in parallel)

4. **Complexity hotspots:**
   - A2P 10DLC registration UX (guide users through TCR process)
   - Campaign state machine (timing engine, stop conditions)
   - LLM guardrails (PII detection, content filtering)
   - Timezone handling (local quiet hours, send time optimization)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| SMS compliance | HIGH | Official TCPA/10DLC documentation verified |
| Campaign timing | MEDIUM | WebSearch consensus, but no primary research data |
| LLM guardrails | HIGH | Multiple authoritative sources on LLM safety |
| Review funnel | HIGH | Well-documented pattern with case studies |
| Job tracking | HIGH | Standard FSM patterns verified |
| Integration landscape | HIGH | Verified comparisons of ServiceTitan/Jobber/Housecall Pro |
| Service-specific patterns | LOW | Inferred from general practices, not verified |

**Overall confidence: MEDIUM**

Most technical requirements (SMS compliance, LLM guardrails, job tracking) are HIGH confidence based on official documentation and authoritative sources. Campaign timing patterns and effectiveness claims are MEDIUM confidence based on WebSearch consensus across multiple credible sources. Service-specific timing recommendations are LOW confidence (inferred, not verified).

**Gaps to address in phase-specific research:**
- Twilio SDK integration best practices (Phase 1)
- Campaign state machine implementation patterns (Phase 3)
- LLM prompt engineering for review requests (Phase 5)
