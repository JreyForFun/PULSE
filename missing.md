# Phase 1 MVP (per PRD) vs Current Project: What’s Missing / Incomplete

Below is a gap analysis for **Phase 1 (Hackathon MVP)** only (ignoring Phase 2/3). I compared the PRD’s required pages/features to what exists in `pulse-web/`.

## 1. Biggest Theme: App is Mostly UI + Mock Data (not “real system” yet)
Across nearly all pages, the data comes from `src/services/mockData.ts` (`MOCK_RESIDENTS`) and local arrays (e.g., visits list in `Visits.tsx`). There is **no real persistence**, **no Supabase queries**, and **no auth enforcement**.

### Evidence
* **Residents:** `ResidentList.tsx`, `ResidentProfile.tsx`, `AddResident.tsx` all read from `MOCK_RESIDENTS`.
* **Visits:** `Visits.tsx`, `VisitHistory.tsx` use hardcoded arrays.
* **Auth:** `Login.tsx` is a “fake login” that always navigates to `/dashboard`.
* **Supabase:** Client exists (`src/lib/supabase.ts`) but is **not used anywhere** (`grep` found no `supabase.auth` usage).

---

## 2. Authentication & Access (PRD 6.1) — Incomplete

### What PRD expects (Phase 1 MVP)
* Login with: Email input.
* Password or magic link.
* Validation errors.
* Secure access for authorized users.

### Current status
* `src/pages/Login.tsx`: Has email+password UI.
* **No real authentication.**
* No Supabase auth / role system.
* **No route protection:** you can go directly to `/dashboard/...` regardless of login state.
* **No logout logic:** `Layout.tsx` “Sign Out” just runs `Maps('/')` (does not clear session).

### Missing items
* Supabase Auth integration (`signInWithPassword` and/or `signInWithOtp`).
* Auth guard / protected routes.
* Session persistence (on refresh keep logged in).
* Role-based auth (BHW vs official/admin) is not implemented.

---

## 3. App Shell / Navigation Layout (PRD 6.2) — Partially implemented

### Implemented
* `src/components/Layout.tsx` includes Sidebar nav items (Dashboard / Residents / Visits / Risk Prioritization / Reports / Settings).
* Shows barangay name (hardcoded “Brgy. Santa Rosa”).
* “Sign Out” button (but only navigates).

### Missing / incomplete
* **User profile dropdown:** PRD says profile dropdown with Logout.
* **Dynamic barangay name:** Should come from logged-in user / settings.
* **Top navigation bar:** As described (you have a mobile header; desktop top bar isn’t really present as a “top nav” with profile dropdown).

---

## 4. Dashboard (PRD 6.3) — Partially implemented but data is fake

### PRD expects
* **Summary cards:** Total residents, High-risk residents, Residents needing follow-up, Visits this month.
* **Risk distribution chart:** (Low/Medium/High).
* **High-risk list preview.**
* **Recent activity feed.**

### Current status (`src/pages/Dashboard.tsx`)
* Has summary cards (but “Visits this month” is not present; “Follow-up required” is present).
* Risk distribution is implemented as progress bars (OK).
* Priority follow-ups list exists but **View button doesn’t navigate**.
* Recent activity feed is a **dummy loop** `[1,2,3,4]` and not based on real events.

### Missing items
* **Visits this month metric** (PRD explicitly lists this).
* Priority follow-up “View” should navigate to resident profile.
* Recent activity should be sourced from visits/resident changes (real data).
* All dashboard metrics should be computed from DB (not `MOCK_RESIDENTS`).

---

## 5. Resident Management (PRD 6.4) — UI exists; CRUD is missing

### PRD expects
* **Residents List:** Search, Filters (Risk level, Category: Senior, Pregnant, PWD, Child), Table with Name/Age/Category tags/Risk badge/Last visit, Add resident button.
* **Add/Edit Resident:** Full name, age, sex, address/zone, Category checkboxes, Chronic conditions checklist, Save/Cancel.

### Current status
* `src/pages/ResidentList.tsx`: Search exists.
* **Filter button exists but does nothing.**
* Uses `ResidentCard` cards, not a table (not necessarily wrong, but deviates from PRD “table”).
* No category filter, no risk filter UI/logic.
* `src/pages/AddResident.tsx`: Form exists. Edit mode loads resident from mock data.
* **Submit only console.logs + redirect; no persistence.**

### Missing items
* Real create/update (Supabase insert/update).
* Real delete (PRD doesn’t explicitly say delete, but “manage” often implies it; at minimum create/edit should work).
* Risk & category filters implemented.
* Last visit date should be derived from visits table (not hardcoded).

---

## 6. Visit & Symptom Logging (PRD 6.5) — Mostly missing (only UI)

### PRD expects
* **Visits page:** Resident selector, Visit date, Symptom multi-select, Notes, Follow-up required toggle, Submit visit button.
* Automatically links to resident profile.

### Current status
* You have `src/pages/LogVisit.tsx` which matches most UI elements.
* **But:** It uses `MOCK_RESIDENTS`.
* Submit is `console.log` and navigates away.
* No visit stored, no symptoms table, no linking in DB.
* `src/pages/Visits.tsx` is a global visit log but uses a hardcoded array.

### Missing items
* **Visits table persistence** (Supabase insert into `visits`).
* **Symptoms persistence** (Supabase insert into `visit_symptoms`).
* Update resident `last_visit` and possibly `follow_up_required`.
* Visit history per resident should query real visits, not mock.

---

## 7. AI Risk Prioritization (PRD 6.6 + PRD 7) — Partially implemented; not wired to real data

### PRD expects
* Risk summary (counts).
* **Prioritized resident list with:** Risk level, Risk score.
* **Risk explanation panel:** Factors contributing, Weight breakdown.
* **Phase 1:** Rule-based weighted scoring, transparent & configurable.

### Current status
* `src/lib/riskEngine.ts` exists and returns `{score, level, factors}`.
* **But:** `src/pages/RiskPrioritization.tsx` uses `MOCK_RESIDENTS`’s `risk_score` directly for sorting.
* Shows an “estimated breakdown” but not actually tied to `riskEngine.ts`.
* `ResidentProfile.tsx` uses `calculateRisk(resident)` to show factor list, but it still displays `resident.risk_level` from mock data (could drift from calculated level).

### Missing / incomplete items
* **Single source of truth:** Risk score/level should be computed consistently (either compute on the fly from DB+visit history, or store computed values and update on changes).
* **Configurable weights:** Settings UI has sliders but they are not used by `riskEngine.ts`.
* **Visit-history factor:** Currently “mock logic” in `riskEngine.ts` (and depends on `resident.last_visit` which itself is not maintained by real visits).
* Risk explanation panel should show actual factors returned from engine.

---

## 8. Reports & Analytics (PRD 6.7) — Mostly placeholder

### PRD expects
* Date range selector.
* Report type selector.
* Generated summary table.
* Export button (PDF/CSV future).

### Current status
* `src/pages/Reports.tsx` is mostly static UI.
* No date range selector.
* No report type selector.
* No generated table based on real data.
* Buttons don’t generate/preview real content.

### Missing items
* Report filters (date range + type).
* Query/aggregation logic (from residents/visits).
* Render summary table.
* Export can remain “future”, but at least “generate” should work in Phase 1 as per PRD page definition.

---

## 9. Settings & Administration (PRD 6.8) — UI exists; functionality missing

### PRD expects
* User profile section.
* Barangay info editor.
* Risk scoring weight configuration (admin-only).
* Privacy & disclaimer.

### Current status
* `src/pages/Settings.tsx` has UI sections for all of these.
* **But:** No saving to DB.
* No admin-only enforcement.
* Sliders don’t affect risk scoring.

### Missing items
* Persist barangay profile (Supabase table needed; none exists in `database_schema.sql`).
* Persist risk weights (table needed; none exists).
* Enforce role-based access (admin-only configuration).

---

## 10. Backend / Database / Security (PRD “Technical Stack”, “RLS”) — Not implemented

### Current status
* There is a `database_schema.sql` with tables: `residents`, `resident_conditions`, `visits`, `visit_symptoms`.
* **But there is no evidence in this repo of:**
    * Supabase migrations applied.
    * RLS policies.
    * Any query layer (`src/services/` only has `mockData.ts`).
    * Any environment setup instructions for Supabase (README is generic Vite template).

### Missing items
* **Implement actual data access services in `src/services/`:**
    * `residents` CRUD.
    * `visits` CRUD.
    * Risk computation update logic.
* **Supabase:**
    * RLS policies (PRD explicitly calls out RLS).
    * Auth roles/claims strategy.
* **Environment docs:**
    * `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    * Setup steps in README.

---

## Quick “Phase 1 Missing Checklist” (Most Important)

- [ ] **[Auth is mock]** Real Supabase login + route protection + logout + role checks.
- [ ] **[No real data]** Residents/Visits are not saved anywhere; everything is mock arrays.
- [ ] **[Residents CRUD incomplete]** Add/Edit doesn’t persist; filters not implemented.
- [ ] **[Visits logging incomplete]** No DB insert, no symptom table writes, no real resident history.
- [ ] **[Risk engine not integrated]** Inconsistent use of `riskEngine` vs `resident.risk_score`. No configurable weights connected to Settings.
- [ ] **[Reports are placeholders]** Missing selectors, aggregation, summary table generation.
- [ ] **[Settings are placeholders]** No persistence; no admin-only enforcement; weights not applied.
- [ ] **[Supabase stack not completed]** Schema exists but no RLS/policies and no data access code uses Supabase client.