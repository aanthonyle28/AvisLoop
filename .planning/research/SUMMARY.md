# Research Summary: AvisLoop

**Synthesized:** 2026-01-25

## Key Findings

### Stack Recommendations

**Validated Stack:**
- **Next.js 16** (Turbopack, React Compiler, App Router)
- **Supabase** (Postgres, Auth, RLS, real-time)
- **Resend** (transactional email, React Email support)
- **Stripe** (subscription billing, webhooks)
- **shadcn/ui + Tailwind** (UI components)

**Stack Confidence:** High - all technologies are production-ready and well-documented for SaaS use cases.

---

### Feature Prioritization

**Table Stakes (Must Ship):**
1. Review request sending via email
2. Contact management
3. Message history/tracking
4. Business profile setup
5. User authentication
6. Mobile-friendly interface

**Key Differentiator:**
- **Radical simplicity** - "2 minutes to first send"
- Competitors are feature-heavy; we're deliberately minimal

**Anti-Features (Never Build):**
- Review gating (violates Google policy)
- Incentivized reviews (FTC fines)
- Complex campaign builders

---

### Architecture Decisions

**Pattern:** Server-first Next.js with Supabase backend

**Key Patterns:**
- Server Components by default, client only for interactivity
- RLS policies for multi-tenant data isolation
- Server Actions for all mutations
- Stripe webhooks for subscription state

**Build Order:**
1. Auth + Database foundation
2. Business + Contact CRUD
3. Email sending + message logging
4. Billing + trial limits
5. Onboarding wizard
6. Multi-location (Pro tier)

---

### Critical Pitfalls

| Pitfall | Severity | Mitigation |
|---------|----------|------------|
| Google policy violations | Critical | No review gating, no incentives |
| Email deliverability | High | SPF/DKIM/DMARC, domain warmup |
| Data leakage | High | RLS on all tables from day 1 |
| Billing bugs | High | Idempotent webhooks, pessimistic locking |
| Onboarding drop-off | Medium | Minimal steps, clear next actions |
| Over-engineering | Medium | Stick to MVP scope ruthlessly |

---

### Market Context

**Competitive Landscape:**
- Birdeye, Podium, SocialPilot dominate with feature-heavy platforms
- Entry pricing: $23-124/month
- Most tools are "too complex" for small business owners

**AvisLoop Positioning:**
- Simpler than any competitor
- Transparent pricing ($49/$99)
- "2-minute" promise vs "powerful platform"

**2026 Trends:**
- AI features are table stakes (everyone claims AI)
- Vertical SaaS preferred over horizontal
- Outcome-focused messaging beats feature lists
- Compliance/trust as competitive advantage

---

## Implications for Roadmap

### Phase Structure Should:
1. **Start with foundation** - Auth, DB, RLS (prevents data leakage)
2. **Validate core loop early** - Send email, see history
3. **Add billing before launch** - Enforce limits, prevent abuse
4. **Polish onboarding last** - Can iterate based on real usage

### Technical Decisions Locked:
- Next.js 16 App Router (not Pages Router)
- Supabase (not Firebase or custom backend)
- RLS for multi-tenancy (not application-level filtering)
- Server Actions (not REST API for most operations)

### Scope Protection:
- No SMS until email validated
- No integrations for MVP
- No analytics dashboards
- No campaign automation

---

## Open Questions

1. **Email template customization** - How much control do users need?
   - Recommendation: Minimal - editable subject + body text only

2. **Trial limit enforcement** - When to show paywall?
   - Recommendation: Soft limit at 20 sends, hard block at 25

3. **Multi-location UX** - How do Pro users switch contexts?
   - Recommendation: Business selector in nav, all businesses visible

---

## Files

- `STACK.md` - Technology recommendations
- `FEATURES.md` - Feature categorization
- `ARCHITECTURE.md` - System design
- `PITFALLS.md` - Risks and mitigations
