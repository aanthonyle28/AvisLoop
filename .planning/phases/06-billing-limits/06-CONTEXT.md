# Phase 6: Billing & Limits - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe to Basic ($49/mo: 200 sends, 200 contacts) or Pro ($99/mo: 500 sends, unlimited contacts) via Stripe. Trial users get 25 free sends. System enforces tier limits on sends and contacts. Users can view current plan and manage subscription via billing page.

</domain>

<decisions>
## Implementation Decisions

### Limit Enforcement UX
- Show persistent banner warning when 80%+ of send limit used ("20 sends remaining this month")
- Behavior-based nudge: "At current pace you'll run out in ~6 days" when usage trajectory predicts limit hit
- Soft block at limit: disable Send button, show inline message "Trial/Plan limit reached. Start a plan to keep sending."
- Primary CTA: "Start plan" / Secondary: "View pricing"
- Usage visibility: quick summary on dashboard + detailed breakdown on billing page
- Usage meter is clickable — links to billing page

### Contact Limits
- Softer enforcement than send limits
- Warning when approaching limit, but no hard block on adding contacts
- Can add contacts over limit, but can't send until resolved

### Upgrade Prompts
- Inline blocking at trial exhaustion (not modal) — message appears where Send button is
- Upgrade access: dedicated Billing nav item + quick link in user dropdown
- Checkout flow: Stripe hosted checkout (same tab, not popup)
- Return URL: `/billing?success=1` with confirmation page showing new plan status
- Preserve draft send state if user was mid-flow when hitting limit

### Billing Page Design
- Simple card layout: plan name, price, renewal date, usage summary
- Trial users see: "Free Trial: X/25 sends used" with plan options below
- "View invoices" and "Manage subscription" buttons open Stripe Customer Portal
- All subscription management (cancel, change plan, update payment) via Stripe Customer Portal

### Subscription Lifecycle
- Failed payment: 7-day grace period with full access, then soft lock on sends (can view data, can't send)
- Cancellation: access continues until end of billing period, then reverts to trial limits
- Downgrade (Pro → Basic): grandfather existing contacts, only enforce new send limit going forward

### Claude's Discretion
- Exact banner/warning UI styling
- Usage meter visualization (bar, circle, text)
- Dashboard usage summary placement
- Success page design after upgrade
- Email notifications for payment failures (if any)

</decisions>

<specifics>
## Specific Ideas

- Usage meter should be clickable and lead to billing
- After Stripe checkout success, land on clear confirmation: "You're on Pro" + updated limits + "Continue" CTA back to previous location
- Behavior-based nudge should calculate pace from recent usage, not just current total

</specifics>

<deferred>
## Deferred Ideas

- Promo codes / discount campaigns — future phase
- Overage billing (charge per extra send) — not for MVP, hard limits only
- Predictive upgrade suggestions ("upgrade before busy season") — v2 enhancement

</deferred>

---

*Phase: 06-billing-limits*
*Context gathered: 2026-01-27*
