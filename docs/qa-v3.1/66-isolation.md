# QA Audit: Phase 66-03 — Multi-Business Data Isolation

**Tested:** 2026-03-02
**Tester:** Claude Code (Playwright MCP + Supabase MCP)
**Account:** audit-test@avisloop.com
**Business A:** Audit Test HVAC (id: `6ed94b54-6f35-4ede-8dcb-28f562052042`)
**Business B:** AUDIT_ Test Plumbing (id: `ba41879d-7458-4d47-909f-1dce6ddd0e69`)
**App URL:** http://localhost:3000

---

## Pre-Test DB State

| Entity | Business A | Business B |
|--------|-----------|-----------|
| Jobs | 8 | 0 |
| Customers | 7 | 0 |
| Campaigns | 2 (HVAC Follow-up, Standard Follow-Up) | 1 (Standard (Email + SMS)) |
| Send Logs | 10 | 0 |

## Test Data Created in Business B

Created via SQL to minimize browser contention with concurrent plan 66-02:

```sql
-- Customer
INSERT INTO customers (business_id, name, email, phone, status, phone_status, sms_consent_status)
VALUES ('ba41879d-...', 'AUDIT_IsolationTest Customer', 'isolation-test@example.com', '+15559876543', 'active', 'valid', 'unknown');
-- Result: id = 5f34a9a7-4aa9-42c9-905c-bdb60f55614a

-- Job
INSERT INTO jobs (business_id, customer_id, service_type, status, completed_at, notes)
VALUES ('ba41879d-...', '5f34a9a7-...', 'plumbing', 'completed', NOW(), 'AUDIT_IsolationTest job for data isolation QA');
-- Result: id = 94ffc483-3efd-40bb-b344-f9aef63b09db

-- Send Log
INSERT INTO send_logs (business_id, customer_id, channel, status, subject)
VALUES ('ba41879d-...', '5f34a9a7-...', 'email', 'sent', 'AUDIT_IsolationTest Review Request');
-- Result: id = 928d9af2-7280-43f9-9912-962e692d36a2
```

### Post-Insert Counts

| Entity | Business A | Business B |
|--------|-----------|-----------|
| Jobs | 8 | 1 |
| Customers | 7 | 1 |
| Campaigns | 2 | 1 |
| Send Logs | 10 | 1 |

---

## MULTI-04: Jobs Isolation

**Requirement:** Business B's jobs must NOT be visible when Business A is the active business.

**Steps:**
1. Switched to Business A ("Audit Test HVAC") via sidebar business switcher
2. Navigated to /jobs
3. Verified jobs table shows "8 total" -- all Business A jobs
4. Searched for "IsolationTest" -- no results
5. SQL verification: `SELECT COUNT(*) FROM jobs WHERE business_id = '6ed94b54-...' AND notes LIKE '%IsolationTest%'` = 0

**Observations:**
- Jobs page heading shows "Track your service jobs - 8 total"
- All 8 jobs belong to Business A customers (AUDIT_Patricia Johnson, AUDIT_Sarah Chen, AUDIT_Marcus Rodriguez, Test Technician, Bob Wilson, Jane Doe, John Smith)
- "AUDIT_IsolationTest Customer" (Business B's plumbing job) is NOT visible
- SQL confirms zero IsolationTest jobs in Business A scope

**Screenshot:** `qa-66-jobs-isolation-business-a.png`

**Result: PASS**

---

## MULTI-05: Customers Isolation

**Requirement:** Business B's customers must NOT appear in Settings > Customers tab when Business A is active.

**Steps:**
1. Active business: Audit Test HVAC
2. Navigated to /settings
3. Clicked "Customers" tab
4. Verified customer list shows "7 total"
5. SQL verification: `SELECT COUNT(*) FROM customers WHERE business_id = '6ed94b54-...' AND name LIKE '%IsolationTest%'` = 0

**Observations:**
- Customers tab shows 7 customers, all Business A's:
  - AUDIT_Sarah Chen, AUDIT_Marcus Rodriguez, AUDIT_Patricia Johnson, Test Technician, Bob Wilson, John Smith, Jane Doe
- "AUDIT_IsolationTest Customer" (Business B) is NOT visible
- SQL confirms zero IsolationTest customers in Business A scope

**Screenshot:** `qa-66-customers-isolation-business-a.png`

**Result: PASS**

---

## MULTI-06: Campaigns Isolation

**Requirement:** Business B's campaigns must NOT appear on the Campaigns page when Business A is active.

**Steps:**
1. Active business: Audit Test HVAC
2. Navigated to /campaigns (via sidebar switch from Business B context)
3. Verified campaign list shows only Business A's campaigns
4. SQL verification: `SELECT name FROM campaigns WHERE business_id = '6ed94b54-...'` = "HVAC Follow-up", "Standard Follow-Up"

**Observations:**
- Campaigns page shows exactly 2 campaigns:
  - "Standard Follow-Up" (All Services, 3 touches, Active)
  - "HVAC Follow-up" (HVAC, 2 touches, Active)
- Business B's "Standard (Email + SMS)" campaign is NOT visible
- Campaign names are distinct: Business A has "Standard Follow-Up", Business B has "Standard (Email + SMS)"

**Screenshot:** `qa-66-campaigns-isolation-business-a.png`

**Result: PASS**

---

## MULTI-07: Send Logs Isolation

**Requirement:** Business B's send logs must NOT appear on the History page when Business A is active.

**Steps:**
1. Active business: Audit Test HVAC
2. Navigated to /history
3. Verified "10 total" send logs shown
4. SQL verification: `SELECT COUNT(*) FROM send_logs WHERE business_id = '6ed94b54-...' AND subject LIKE '%IsolationTest%'` = 0

**Observations:**
- History page shows "Showing 1-10 of 10 messages"
- All 10 messages belong to Business A customers (AUDIT_Marcus Rodriguez, AUDIT_Patricia Johnson, AUDIT_Sarah Chen)
- Business B's "AUDIT_IsolationTest Review Request" send_log is NOT visible
- SQL confirms zero IsolationTest send_logs in Business A scope

**Screenshot:** `qa-66-history-isolation-business-a.png`

**Result: PASS**

---

## Summary (MULTI-04 through MULTI-07)

| ID | Requirement | SQL Verified | UI Verified | Result |
|----|------------|-------------|-------------|--------|
| MULTI-04 | Jobs isolation | 0 cross-business jobs | 8/8 Business A only | **PASS** |
| MULTI-05 | Customers isolation | 0 cross-business customers | 7/7 Business A only | **PASS** |
| MULTI-06 | Campaigns isolation | 2/2 Business A only | 2 campaigns, correct names | **PASS** |
| MULTI-07 | Send logs isolation | 0 cross-business send_logs | 10/10 Business A only | **PASS** |

**Overall: 4/4 PASS -- All entity types properly isolated between businesses.**

## Screenshots Index

| File | Description |
|------|-------------|
| `qa-66-jobs-isolation-business-a.png` | Jobs page with Business A active, showing 8 jobs (no Business B data) |
| `qa-66-customers-isolation-business-a.png` | Settings > Customers tab, 7 customers (no Business B data) |
| `qa-66-campaigns-isolation-business-a.png` | Campaigns page, 2 campaigns (no Business B campaign) |
| `qa-66-history-isolation-business-a.png` | History page, 10 send logs (no Business B send log) |

---

*Data isolation audit continues in MULTI-08 (rapid switching) and MULTI-09 (cross-user RLS).*
