---
status: investigating
trigger: "Activity page date preset chips (Today, Past Week, etc.) do nothing on click - no URL params, no highlighting, no filtering"
created: 2026-02-24T00:00:00Z
updated: 2026-02-24T00:00:00Z
---

## Current Focus

hypothesis: Date preset chip onClick handlers are not properly wired to updateDateRange or updateDateRange is not updating URL params
test: Read history-filters.tsx and history-client.tsx to trace click handler wiring
expecting: Find disconnect between chip click and URL param update
next_action: Read history-filters.tsx to examine chip implementation

## Symptoms

expected: Clicking a preset chip should calculate date range, set from/to URL params, highlight active chip, filter table data
actual: Clicking any date preset chip does nothing - no URL params, no chip highlighting, no data filtering
errors: None reported
reproduction: Go to /history, click any date preset chip (Today, Past Week, Past Month, Past 3 Months)
started: Unknown - possibly since implementation

## Eliminated

## Evidence

## Resolution

root_cause:
fix:
verification:
files_changed: []
