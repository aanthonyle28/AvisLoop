# Pitfalls Research: ReviewLoop

**Researched:** 2026-01-25

## Critical Pitfalls to Avoid

### 1. Google Policy Violations

**The Pitfall:** Building features that violate Google's review policies, resulting in customer businesses getting flagged or banned.

| Violation | Consequence | Prevention |
|-----------|-------------|------------|
| **Review gating** | Profile suspension, warning badges | Never filter who can leave reviews based on sentiment |
| **Incentivized reviews** | FTC fines up to $51,744/violation | No discounts, gifts, or rewards for reviews |
| **Selective solicitation** | Profile flagged as suspicious | Send to all customers, not just happy ones |
| **Bulk solicitation spikes** | AI flags as suspicious activity | Space out requests, avoid sudden volume spikes |

**Warning Signs:**
- Feature request for "filter unhappy customers"
- "Send only to 5-star experiences"
- Incentive/reward system for reviews

**Phase to Address:** Phase 1 (Core design - bake compliance into architecture)

---

### 2. Email Deliverability Failures

**The Pitfall:** Review request emails landing in spam, making the product useless.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **No SPF/DKIM/DMARC** | Emails rejected or spam-filtered | Set up authentication from day 1 |
| **Spam trigger words** | Lower inbox placement | Avoid "FREE", "PROMOTION", "EXCLUSIVE" |
| **No domain warmup** | Bulk sends flagged | Start slow, gradually increase volume |
| **Erratic send patterns** | Looks suspicious to providers | Consistent daily volumes |
| **High bounce rates** | Sender reputation damaged | Validate emails, clean lists |

**Warning Signs:**
- Low open rates (< 15%)
- High bounce rates (> 5%)
- Spam complaints increasing

**Phase to Address:** Phase 3 (Email integration - implement best practices)

---

### 3. Onboarding Drop-off

**The Pitfall:** Users sign up but never send their first review request.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **Too many steps** | Users abandon before value | Minimize required fields |
| **No clear next action** | Users get lost | Always show "next best action" |
| **Asking for payment too early** | Users leave before trying | 25 free sends first |
| **Complex terminology** | Users confused | No jargon (campaigns, funnels, sequences) |

**Warning Signs:**
- High signup-to-active drop-off
- Users stuck on onboarding step
- Support tickets asking "what do I do next"

**Phase to Address:** Phase 5 (Onboarding wizard)

---

### 4. Billing/Subscription Bugs

**The Pitfall:** Users can send without paying, or paying users get blocked.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **Race conditions** | Send while webhook processing | Pessimistic locking on send limits |
| **Webhook failures** | Subscriptions not activated | Idempotent handlers, retry logic |
| **No subscription sync** | Stale subscription status | Check Stripe on protected actions |
| **Trial abuse** | Users create multiple accounts | Rate limit by email domain |

**Warning Signs:**
- Users report "paid but can't send"
- Revenue doesn't match active users
- Unusual trial-to-paid conversion rates

**Phase to Address:** Phase 4 (Billing integration)

---

### 5. Multi-tenant Data Leakage

**The Pitfall:** User A sees User B's contacts or messages.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **Missing RLS policies** | Data exposed to wrong users | Enable RLS on ALL tables |
| **Client-side filtering** | Bypassable security | Always filter server-side |
| **Shared API keys** | Cross-tenant access | Per-user API scoping |
| **Complex RLS policies** | Performance issues | Index tenant_id columns |

**Warning Signs:**
- Security audit failures
- User reports seeing wrong data
- Slow queries on large tables

**Phase to Address:** Phase 1 (Database setup - RLS from the start)

---

### 6. Over-Engineering

**The Pitfall:** Building for scale before validating product-market fit.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **Microservices for MVP** | Slow development, complexity | Monolith first |
| **Custom auth system** | Security vulnerabilities | Use Supabase Auth |
| **Complex caching** | Premature optimization | Simple queries first |
| **Feature creep** | Never ships | Stick to MVP scope |

**Warning Signs:**
- "We might need this later"
- Discussions about scale before launch
- Multiple abstraction layers

**Phase to Address:** All phases (constant vigilance)

---

### 7. Poor Error Handling

**The Pitfall:** Users see cryptic errors or silent failures.

| Mistake | Impact | Prevention |
|---------|--------|------------|
| **Silent email failures** | Users think message sent | Always show send status |
| **Generic error messages** | Users can't self-resolve | Specific, actionable errors |
| **No retry mechanism** | Transient failures permanent | Implement retry for Resend API |
| **Missing webhook verification** | Security vulnerability | Verify Stripe signatures |

**Warning Signs:**
- Support tickets about "nothing happened"
- Users report messages not received
- Inconsistent message history status

**Phase to Address:** Phase 3 (Email sending), Phase 4 (Billing)

---

## Domain-Specific Gotchas

### Review Request Timing
- **Best:** 24-48 hours after service
- **Bad:** Immediately after checkout (haven't experienced product)
- **Worse:** Weeks later (forgotten experience)

### Template Design
- **Good:** Short, personal, single CTA
- **Bad:** Multiple asks, walls of text, aggressive tone
- **Legal requirement:** Must include unsubscribe option (CAN-SPAM)

### Rate Limiting
- **Google's unofficial limit:** ~5 reviews/day from same IP looks suspicious
- **Email provider limits:** Resend free tier = 3k/month
- **Application limits:** Enforce Basic (200/mo) and Pro (500/mo) tiers

## Sources
- [Google Review Policy](https://support.google.com/contributionpolicy/answer/7400114)
- [FTC Fake Reviews Rule](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)
- [Email Deliverability Guide 2026](https://mailtrap.io/blog/email-deliverability-issues/)
- [Supabase RLS Best Practices](https://www.leanware.co/insights/supabase-best-practices)
