# PULSE – Public Unified Local Health Engine

## Product Requirements Document (PRD)

---

## 1. Product Overview

**Product Name:** PULSE (Public Unified Local Health Engine)

**Tagline:** *From raw data to timely care.*

**Category:** Health / Public Health Decision Support

**Product Type:** Web-based Decision-Support System

**Target Deployment:** Barangay → City → National (LGU-ready)

**Core Idea:**
PULSE is a **health decision-support web application** designed to help Barangay Health Workers (BHWs) prioritize residents who need immediate follow-up using structured data and an explainable AI-assisted risk scoring system.

⚠️ PULSE does **not** diagnose, prescribe, or replace medical professionals.

---

## 2. Problem Statement

Barangay Health Workers manage hundreds of residents using **paper-based records and manual reporting systems**. This leads to:

- Delayed identification of high-risk individuals
- Missed follow-ups for seniors, pregnant women, and PWDs
- Reactive instead of proactive health interventions
- Inefficient health reporting to city or municipal health offices

There is currently no lightweight, deployable system that helps BHWs **decide who needs attention first**.

---

## 3. Goals & Objectives

### Primary Goal
Enable Barangay Health Workers to **prioritize health follow-ups** efficiently and safely using data-driven insights.

### Objectives
- Digitize barangay-level health records
- Provide clear risk prioritization (Low / Medium / High)
- Reduce missed health visits
- Support early intervention and better planning
- Ensure explainability, safety, and trust

---

## 4. Target Users

### Primary Users
- Barangay Health Workers (BHWs)

### Secondary Users
- Barangay Officials
- City / Municipal Health Offices

### Non-Users
- Patients (no direct access)
- Doctors (not a clinical system)

---

## 5. User Personas

### Persona 1: Barangay Health Worker
- Manages 200–500 residents
- Conducts home visits
- Submits monthly health reports
- Needs a fast, simple, mobile-friendly system

### Persona 2: City Health Officer
- Needs summarized, reliable data
- Monitors barangay health trends
- Plans interventions and programs

---

## 6. Application Pages & Component Breakdown (MVP Scope)

This section defines **all pages, sub-pages, and UI components** included in the PULSE MVP.

---

### 6.1 Authentication & Access

**Page:** Login

**Purpose:** Secure access for authorized health workers and officials

**Components:**
- Email input
- Password / Magic link input
- Login button
- Error / validation message
- App logo + tagline

---

### 6.2 Main Navigation Layout

**Component:** App Shell

**Purpose:** Consistent layout across all pages

**Components:**
- Top navigation bar
  - App logo (PULSE)
  - Current barangay name
  - User profile dropdown (Logout)
- Side navigation menu
  - Dashboard
  - Residents
  - Visits
  - Risk Prioritization
  - Reports
  - Settings

---

### 6.3 Dashboard (Health Pulse Overview)

**Page:** Dashboard

**Purpose:** High-level view of barangay health status

**Components:**
- Summary cards
  - Total residents
  - High-risk residents
  - Residents needing follow-up
  - Visits this month
- Risk distribution chart (Low / Medium / High)
- High-risk resident list (preview)
- Recent activity feed

---

### 6.4 Resident Management

**Page:** Residents List

**Purpose:** View and manage registered residents

**Components:**
- Search bar
- Filters
  - Risk level
  - Category (Senior, Pregnant, PWD, Child)
- Resident table
  - Name
  - Age
  - Category tags
  - Risk level badge
  - Last visit date
- Add resident button

---

**Page:** Add / Edit Resident

**Components:**
- Full name input
- Age input
- Sex selector
- Address / Zone input
- Category checkboxes
- Chronic conditions checklist
- Save / Cancel buttons

---

### 6.5 Visit & Symptom Logging

**Page:** Visits

**Purpose:** Record health visits and observations

**Components:**
- Resident selector
- Visit date picker
- Symptom multi-select
- Notes text area
- Follow-up required toggle
- Submit visit button

---

### 6.6 AI Risk Prioritization

**Page:** Risk Prioritization

**Purpose:** Explainable AI-driven resident prioritization

**Components:**
- Risk summary cards (Low / Medium / High counts)
- Prioritized resident list
  - Name
  - Risk level
  - Risk score
- Risk explanation panel
  - Factors contributing to score
  - Weight breakdown

---

### 6.7 Reports & Analytics

**Page:** Reports

**Purpose:** Generate summary reports for LGU use

**Components:**
- Date range selector
- Report type selector
- Generated summary table
- Export button (PDF / CSV – future)

---

### 6.8 Settings & Administration

**Page:** Settings

**Purpose:** Manage user and system preferences

**Components:**
- User profile section
- Barangay information editor
- Risk scoring weight configuration (admin-only)
- Privacy & disclaimer section

---



### 6.2 Visit & Symptom Logging
- Date of visit
- Symptoms (preset list + notes)
- Follow-up required (Yes / No)
- Automatically links to resident profile

---

### 6.3 AI-Assisted Risk Prioritization

**Function:**
Assigns a **risk score and level** to each resident based on defined factors.

**Risk Levels:**
- 🟢 Low Risk
- 🟡 Medium Risk
- 🔴 High Risk

**Risk Factors (Initial):**
- Age bracket
- Missed or delayed visits
- Repeated symptom reports
- Chronic conditions

**Explainability:**
Each risk score includes a reason breakdown (e.g., “High risk due to age >60 and missed 2 visits”).

---

### 6.4 Health Pulse Dashboard

- Total registered residents
- High-risk resident count
- Residents needing follow-up
- Risk distribution chart
- Recent activity log

---

## 7. AI & Algorithm Design

### Current Phase (Hackathon)
- Rule-based, weighted scoring system
- Fully transparent and configurable

### Future Phase
- Machine learning model trained on anonymized LGU data
- Adaptive risk thresholds per region

⚠️ AI is used for **prioritization only**, not diagnosis.

---

## 8. Technical Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Responsive design (mobile-first)

### Backend
- Supabase
- PostgreSQL database
- Row-level security

### Hosting
- Vercel / GitHub Pages

---

## 9. System Architecture & Data Flow

```
Barangay Health Worker
        ↓
Web Application (React)
        ↓
Supabase Database
        ↓
Risk Scoring Engine
        ↓
Dashboard & Insights
```

---

## 10. Non-Functional Requirements

- Fast load time (<3 seconds)
- Simple UI (low digital literacy friendly)
- Works on low-end devices
- Offline-ready (future phase)

---

## 11. Privacy, Ethics & Compliance

- No public access to personal data
- Role-based authentication
- Minimal data collection
- Consent-based data usage (future)
- Aligned with Philippine Data Privacy Act

---

## 12. Success Metrics

- % of residents logged digitally
- Reduction in missed follow-ups
- Time saved per BHW
- Adoption at barangay level

---

## 13. Project Timeline

### Phase 1 – Hackathon MVP
- Resident registry
- Visit logging
- Risk prioritization
- Dashboard

### Phase 2 – Pilot Deployment
- SMS reminders
- City-level analytics
- Offline support

### Phase 3 – National Scale
- ML-enhanced scoring
- LGU integrations
- Policy-level reporting

---

## 14. Risks & Mitigation

| Risk | Mitigation |
|-----|-----------|
| Misinterpretation as diagnosis | Clear disclaimers |
| Data privacy concerns | Role-based access |
| Low adoption | Simple UX & training |

---

## 15. Open Questions

- LGU data integration standards
- SMS provider selection
- Offline sync strategy

---

## 16. Final Note

PULSE is designed to be a **responsible, explainable, and scalable health decision-support system** that strengthens public health operations without replacing human judgment.

> Empowering health workers with clarity, not complexity.

