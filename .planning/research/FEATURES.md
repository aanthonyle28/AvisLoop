# Features Research: AvisLoop

**Researched:** 2026-01-25

## Feature Categories

### Table Stakes (Must Have)
Users expect these. Missing any = users leave for competitors.

| Feature | Complexity | Notes |
|---------|------------|-------|
| **Review request sending** | Medium | Core feature. Email/SMS to customers with review link. |
| **Contact management** | Low | Add, edit, delete contacts. Basic CRUD. |
| **Message history/tracking** | Low | Log of sent messages with status (sent/failed/opened). |
| **Business profile setup** | Low | Store business name + Google review link. |
| **User authentication** | Low | Sign up, login, logout. Standard auth flow. |
| **Mobile-friendly interface** | Medium | Business owners use phones. Must work well on mobile. |
| **Simple onboarding wizard** | Medium | Guide users through setup. Reduce time-to-first-send. |

### Differentiators (Competitive Advantage)
Features that set you apart from competitors.

| Feature | Complexity | Notes |
|---------|------------|-------|
| **"2-minute" simplicity** | Medium | Deliberately minimal UI. Competitors are complex. |
| **No learning curve** | Low | No jargon, no "campaigns", no "funnels". Just send. |
| **Transparent pricing** | Low | Clear pricing page. No "contact sales" for basic tier. |
| **Message preview before send** | Low | Reduces anxiety about sending. Builds trust. |
| **Real-time send confirmation** | Low | Immediate "Sent ✅" feedback. Satisfying. |

### Competitor Features (Common in Market)
Features competitors have that may be v2 candidates.

| Feature | Complexity | In Scope? |
|---------|------------|-----------|
| **Multi-platform monitoring** | High | No - Google only for MVP |
| **AI-powered response suggestions** | High | No - out of scope |
| **Automated follow-up sequences** | Medium | No - explicitly out of scope |
| **Review widgets for website** | Medium | No - out of scope |
| **SMS channel** | Medium | No - email first, SMS later |
| **Analytics dashboards** | Medium | No - message history is enough |
| **CRM integrations** | High | No - no integrations for MVP |
| **Multi-location support** | Medium | Yes - for Pro tier |
| **Real-time notifications** | Low | No - not needed for MVP |

### Anti-Features (Do NOT Build)
Things to deliberately avoid.

| Anti-Feature | Reason |
|--------------|--------|
| **Review gating** | Violates Google policy. Can get business flagged. |
| **Incentivized reviews** | Against Google ToS and FTC rules ($51k+ fines). |
| **Bulk/mass sending** | Triggers spam filters, looks suspicious to Google. |
| **AI review generation** | Fake reviews = legal liability, platform bans. |
| **Complex campaign builders** | Goes against core value of simplicity. |
| **Feature-heavy dashboards** | Target users want simple, not powerful. |

## Market Insights

### Pricing Benchmarks
- Entry-level review management: $23-124/month
- Mid-market: $50-150/month
- AvisLoop positioning: $49 Basic / $99 Pro is competitive

### Key Success Factors
- **Automation saves time**: Users save ~3.5 hours/week with automated tools
- **Volume increase**: Automated tools increase review volume by 40%+
- **Timing matters**: Send requests within 24-48 hours of service
- **Personalization**: Include customer name, service details

### 2026 Trends
- AI messaging has converged - everyone claims "AI-powered"
- Vertical SaaS solutions preferred over generic tools
- Outcome-focused messaging beats feature lists
- Trust and compliance are competitive advantages

## Dependencies Between Features

```
Authentication
    └── Business Profile
        └── Contacts
            └── Send Review Request
                └── Message History

Billing (parallel track)
    └── Trial limits
    └── Subscription gating
```

## Sources
- [Birdeye Review Management](https://birdeye.com/blog/review-management/)
- [SocialPilot Review Software Comparison](https://www.socialpilot.co/reviews/blogs/review-management-software)
- [Google Review Automation](https://orderry.com/blog/how-to-automate-google-reviews/)
- [Local Consumer Review Survey 2026](https://www.jasminedirectory.com/blog/local-consumer-review-survey-2026/)
