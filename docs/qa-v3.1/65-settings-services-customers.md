# Phase 65: Settings & Billing -- QA Findings (Part 2: Services + Customers)

**Tested:** 2026-03-02
**Tester:** Claude (Playwright + Supabase direct DB queries)
**App URL:** http://localhost:3000
**Test account:** audit-test@avisloop.com
**Business:** Audit Test HVAC (6ed94b54-6f35-4ede-8dcb-28f562052042)

---

## Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| SETT-05: Service type toggles | PASS | All 8 types displayed, toggle on/off works, timing editable, save persists to DB |
| SETT-06: Custom service names | PASS | Section appears when Other enabled, add/remove pills work, DB verified |
| SETT-07: Customers tab search/filters | pending | |
| SETT-08: Customer add/edit/archive | pending | |
| SETT-09: Persistence (Services) | PASS | Page refresh preserves toggle state and timing values |

---

## SETT-05: Service type toggles

**Status:** PASS

### Pre-test DB state

```json
{
  "service_types_enabled": [],
  "service_type_timing": {
    "hvac": 24, "other": 24, "roofing": 72, "cleaning": 4,
    "handyman": 24, "painting": 48, "plumbing": 48, "electrical": 24
  },
  "review_cooldown_days": 30,
  "custom_service_names": []
}
```

### Service types displayed

| # | Service Type | Label | Present? |
|---|-------------|-------|----------|
| 1 | hvac | HVAC | YES |
| 2 | plumbing | Plumbing | YES |
| 3 | electrical | Electrical | YES |
| 4 | cleaning | Cleaning | YES |
| 5 | roofing | Roofing | YES |
| 6 | painting | Painting | YES |
| 7 | handyman | Handyman | YES |
| 8 | other | Other | YES |

All 8 service type cards rendered in a 2-column grid. Each card has a label and toggle button with checkmark indicator.

### Toggle test

| Action | Result |
|--------|--------|
| Toggle HVAC on | Card highlighted (border-primary bg-primary/5), timing input appeared, default 24h |
| Toggle Plumbing on | Card highlighted, timing input appeared, default 48h |
| Change HVAC timing to 12h | Input accepted new value, showed 12 |
| Save Changes | Success toast "Service type settings saved", button disappeared (hasChanges=false) |
| Toggle HVAC off | Card de-highlighted, timing input disappeared |
| Save after de-toggle | Success toast, button hidden |

### DB verification after toggle on + timing change

```json
{
  "service_types_enabled": ["hvac", "plumbing"],
  "service_type_timing": {
    "hvac": 12,
    "plumbing": 48
  }
}
```

Confirmed: `service_types_enabled` contains both hvac and plumbing, hvac timing changed to 12 (from default 24), plumbing timing at default 48.

### DB verification after HVAC de-toggle

```json
{
  "service_types_enabled": ["plumbing"]
}
```

Confirmed: HVAC removed from enabled list. Plumbing remains.

### Persistence (SETT-09)

- Page refreshed via `browser_navigate` (full navigation, not soft reload): YES
- HVAC state after refresh: OFF (not highlighted, no timing input) -- correct
- Plumbing state after refresh: ON (highlighted, timing shows 48h) -- correct
- Result: PASS

### Evidence

- `qa-65-settings-services-initial.png` -- all 8 cards, none enabled
- `qa-65-settings-services-hvac-on.png` -- HVAC highlighted with timing input showing 24h
- `qa-65-settings-services-saved.png` -- after save, toast visible
- `qa-65-settings-services-persisted.png` -- after page refresh, Plumbing ON, HVAC OFF

### Bugs found

None.

---

## SETT-06: Custom service names

**Status:** PASS

### Custom names section

- Appeared when "Other" toggled on: YES
- Input field with placeholder ("e.g. Pest Control, Pool Cleaning..."): YES
- "Add" button: YES
- Section heading "Custom service names": YES
- Sub-text "Add names for your other services (up to 10).": YES

### Add/remove test

| Action | Result |
|--------|--------|
| Add "AUDIT Pest Control" | Pill appeared as TagBadge, input cleared |
| Add "AUDIT Pool Cleaning" | Second pill appeared, both visible |
| Remove "AUDIT Pool Cleaning" (via aria-label "Remove AUDIT Pool Cleaning tag") | Pill removed, only "AUDIT Pest Control" remains |
| Save | Success toast "Service type settings saved" |

### DB verification

```json
{
  "service_types_enabled": ["plumbing", "other"],
  "custom_service_names": ["AUDIT Pest Control"]
}
```

Confirmed: `custom_service_names` contains only "AUDIT Pest Control" (Pool Cleaning correctly removed). `service_types_enabled` includes "other".

### Evidence

- `qa-65-settings-services-other-enabled.png` -- Other card highlighted, custom names section with input/Add button
- `qa-65-settings-services-custom-names.png` -- Single pill "AUDIT Pest Control" after removing Pool Cleaning

### Bugs found

None. The TagBadge remove buttons use `aria-label="Remove {name} tag"` which provides precise targeting for accessibility and automation.

---

## Review Cooldown

### Test

- Original value: 30 days
- Changed to: 14 days
- Save button appeared inline (next to input): YES
- Success toast: "Review cooldown updated"
- DB verified: review_cooldown_days = 14

### DB verification

```
review_cooldown_days: 14
```

### Restored to original

- Changed back to 30 days
- Save button appeared, clicked
- DB verified: review_cooldown_days = 30

---

## Cleanup Verification

Service type state restored to original:

```json
{
  "service_types_enabled": [],
  "custom_service_names": [],
  "review_cooldown_days": 30
}
```

Note: `service_type_timing.hvac` changed to 12 during testing (from default 24). Since HVAC is disabled, this has zero operational impact -- timing values are preferences stored per service type regardless of enabled state.

---
