# PRD: Dashboard — Consolidated Metrics, Formulas & Schema Mapping

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-14

---

## Overview

This document consolidates **all dashboard-related metrics, formulas, data sources, and schema mappings** across the HSE Dashboard system. It combines information from:

- `BSJ -IFR-SR.xlsx` — BSJ historical KPI data (IFR, SFR, LTI Case Rate, Man Hours)
- `docs/prd-kpi-ifr-formula.md` — IFR/TRIFR formula specification
- `docs/dashboard-hazard-analytic.md` — Hazard & Non-Conformance Analytics
- `docs/dashboard-incident-profile-analytic.md` — Incident Profile Analytics
- `docs/dashboard-security-team.md` — Security Team Dashboard
- `docs/prd-dashboard-admin-overview.md` — Admin Overview Dashboard

Each section covers: what the metric is, the formula, which schema tables/fields it maps to, and the current implementation status.

---

## Table of Contents

1. [KPI Frequency Rate Metrics (from BSJ XLSX)](#1-kpi-frequency-rate-metrics)
   - 1.1 TRIFR (IFR)
   - 1.2 TRSR (SFR)
   - 1.3 LTICR (LTI Case Rate)
   - 1.4 Man Hours Data
2. [Hazard & Non-Conformance Analytics](#2-hazard--non-conformance-analytics)
3. [Incident Profile Analytics](#3-incident-profile-analytics)
4. [Security Team Dashboard](#4-security-team-dashboard)
5. [Admin Overview Dashboard](#5-admin-overview-dashboard)
6. [Shared Concepts](#6-shared-concepts)
7. [Implementation Status Summary](#7-implementation-status-summary)

---

## 1. KPI Frequency Rate Metrics

**Source:** `BSJ -IFR-SR.xlsx` (sheet: IFR-SR), `prd-kpi-ifr-formula.md`  
**Route:** `/kpi-frequency-rate`  
**Fiscal Year:** Aug YYYY to Jul YYYY+1 (e.g., 2024-2025 = Aug 2024 – Jul 2025)

All KPI frequency rate metrics share the same structure:
- Split by **study related** (STUDENT) vs **work related** (NON_STUDENT) activities
- Calculated per **fiscal year**
- Use **1,000,000 multiplier** (per million man-hours)
- Only count **GENERAL** scope incidents (`type = 'GENERAL'`); security incidents excluded

### Data Shape (all three KPIs)

```typescript
interface KpiDataPoint {
  year: string;          // Fiscal year e.g. "2024-2025"
  studyRelated: number;  // Rate for study-related activities
  workRelated: number;   // Rate for work-related activities
  total: number;         // Combined rate
}
```

---

### 1.1 TRIFR — Total Recordable Incident Frequency Rate (IFR in XLSX)

**What:** Number of recordable incidents per million man-hours worked.

**Formula:**

```
TRIFR = (Recordable Incidents × 1,000,000) ÷ Man Hours
```

| Sub-metric | Numerator | Denominator |
|---|---|---|
| IFR study related | COUNT incidents WHERE `type='GENERAL'` AND `activities='STUDY'` AND recordable | SUM `t_man_hours.total` WHERE `group='STUDENT'` |
| IFR work related | COUNT incidents WHERE `type='GENERAL'` AND `activities='WORK'` AND recordable | SUM `t_man_hours.total` WHERE `group='NON_STUDENT'` |
| Total IFR | COUNT all recordable GENERAL incidents | SUM all `t_man_hours.total` |

**Recordable criteria:**
- `incidentType` IN (`ACCIDENT`, `DANGEROUS_OR_HAZARDOUS_OCCURRENCE`)
- `incidentClassification` IN (`MAJOR`, `MINOR`, `FATALITY`)

**Historical data from XLSX (validation reference):**

| Year | IFR Study | IFR Work | Total IFR |
|------|-----------|----------|-----------|
| 2019-2020 | 6.46 | 2.96 | 5.40 |
| 2020-2021 | 3.23 | 1.47 | 1.80 |
| 2021-2022 | 2.33 | 3.06 | 1.27 |
| 2022-2023 | 2.28 | 4.93 | 1.27 |
| 2023-2024 | 3.93 | 5.27 | 1.50 |
| 2024-2025 | 5.55 | 6.84 | 1.66 |

**Schema Mapping:**

| Component | Table | Fields | Filter |
|---|---|---|---|
| Recordable incidents | `t_incidents` | `incidentDate`, `activities`, `type`, `incidentType`, `incidentClassification` | `type='GENERAL'`, `incidentType` IN (ACCIDENT, DANGEROUS_OR_HAZARDOUS_OCCURRENCE), `incidentClassification` IN (MAJOR, MINOR, FATALITY), `isActive=true` |
| Study man hours | `t_man_hours` | `month`, `year`, `total`, `group` | `group='STUDENT'`, `isActive=true` |
| Work man hours | `t_man_hours` | `month`, `year`, `total`, `group` | `group='NON_STUDENT'`, `isActive=true` |

**API:** `GET /kpi/trifr?periodFrom=YYYY-MM&periodTo=YYYY-MM`  
**Status:** ✅ Implemented (backend + frontend)

---

### 1.2 TRSR — Total Recordable Severity Rate (SFR in XLSX)

**What:** Severity-weighted score of recordable incidents per million man-hours.

**Formula:**

```
TRSR = (Severity Weighted Score × 1,000,000) ÷ Man Hours
```

**Severity Weights:**

| Classification | Weight |
|---|---|
| FATALITY | 200 |
| MAJOR | 10 |
| MINOR | 1 |

| Sub-metric | Numerator | Denominator |
|---|---|---|
| SFR study related | SUM severity_weight WHERE `type='GENERAL'` AND `activities='STUDY'` AND recordable | SUM `t_man_hours.total` WHERE `group='STUDENT'` |
| SFR work related | SUM severity_weight WHERE `type='GENERAL'` AND `activities='WORK'` AND recordable | SUM `t_man_hours.total` WHERE `group='NON_STUDENT'` |
| Total SFR | SUM all severity weights for GENERAL recordable | SUM all `t_man_hours.total` |

**Historical data from XLSX (validation reference):**

| Year | SFR Study | SFR Work | Total SFR |
|------|-----------|----------|-----------|
| 2019-2020 | 0 | 0 | 0 |
| 2020-2021 | 0 | 0 | 0 |
| 2021-2022 | 0 | 0 | 0 |
| 2022-2023 | 0.25 | 0.00 | 0.08 |
| 2023-2024 | 0.20 | 0.00 | 0.05 |
| 2024-2025 | 0.25 | 0.82 | 0.11 |

**Schema Mapping:** Same as TRIFR, plus uses `incidentClassification` to apply severity weights.

**API:** `GET /kpi/trsr?periodFrom=YYYY-MM&periodTo=YYYY-MM`  
**Status:** ✅ Implemented (backend + frontend)

---

### 1.3 LTICR — Lost Time Injury Case Rate (LTI Case Rate in XLSX)

**What:** Number of lost-time injury cases per million man-hours. An LTI is a recordable incident where the injured person was absent for more than 3 days.

**Formula:**

```
LTICR = (LTI Cases × 1,000,000) ÷ Man Hours
```

**LTI Case definition:** A recordable GENERAL incident where `absence = 'MORE_THAN_THREE_DAYS'`.

| Sub-metric | Numerator | Denominator |
|---|---|---|
| LTI CR study related | COUNT incidents WHERE `type='GENERAL'` AND `activities='STUDY'` AND recordable AND `absence='MORE_THAN_THREE_DAYS'` | SUM `t_man_hours.total` WHERE `group='STUDENT'` |
| LTI CR work related | COUNT incidents WHERE `type='GENERAL'` AND `activities='WORK'` AND recordable AND `absence='MORE_THAN_THREE_DAYS'` | SUM `t_man_hours.total` WHERE `group='NON_STUDENT'` |
| Total LTI Case Rate | COUNT all LTI GENERAL recordable incidents | SUM all `t_man_hours.total` |

**Historical data from XLSX (validation reference):**

| Year | LTI CR Study | LTI CR Work | Total LTI CR |
|------|-------------|-------------|--------------|
| 2019-2020 | 0.00 | 0.00 | 0.00 |
| 2020-2021 | 0.00 | 0.00 | 0.00 |
| 2021-2022 | 0.00 | 0.00 | 0.00 |
| 2022-2023 | 0.13 | 0.00 | 0.13 |
| 2023-2024 | 0.10 | 0.00 | 0.10 |
| 2024-2025 | 0.08 | 0.82 | 0.33 |

**Schema Mapping:**

| Component | Table | Fields | Filter |
|---|---|---|---|
| LTI incidents | `t_incidents` | `incidentDate`, `activities`, `type`, `incidentType`, `incidentClassification`, `absence` | Same as TRIFR + `absence='MORE_THAN_THREE_DAYS'` |
| Man hours | `t_man_hours` | Same as TRIFR | Same as TRIFR |

**Relevant Enums:**

```
enum AbsenceEnum {
  NOT_YET_KNOWN
  RETURNED_AFTER_TREATMENT
  MORE_THAN_THREE_DAYS      // ← defines an LTI case
  NOT_SPECIFIED
}
```

**API:** `GET /kpi/lticr?periodFrom=YYYY-MM&periodTo=YYYY-MM` (proposed)  
**Status:** ❌ Not implemented — frontend uses hardcoded mock data in `kpiFrequencyRateService.ts`

**Implementation note:** Follow the same pattern as `getTrifr`/`getTrsr` in `backend/src/modules/kpi/services/kpi.service.ts`, adding an `absence = 'MORE_THAN_THREE_DAYS'` filter to the incident query.

---

### 1.4 Man Hours Data (Supporting Data)

**What:** Monthly workforce exposure hours, split by student and non-student groups. Feeds the denominator for all KPI frequency rate calculations.

**Man hour calculation:**

```
total = qty × manHourPerDay × 22   (22 working days per month)
```

**Schema:** `t_man_hours`

| Field | Type | Description |
|---|---|---|
| `name` | String | Entry name (e.g., "Year 7-13", "Teaching Staff") |
| `group` | ManHourGroupEnum | `STUDENT` or `NON_STUDENT` |
| `qty` | Int | Number of people |
| `manHourPerDay` | Decimal | Hours per person per day |
| `month` | MonthEnum | JAN–DEC |
| `year` | Int | Calendar year |
| `total` | Decimal | Calculated total man hours |

**Fiscal year aggregation logic:**

```
Month >= AUG → fiscal year = {year}-{year+1}
Month < AUG  → fiscal year = {year-1}-{year}
```

**XLSX additional data (Student Hour Detail):**

The XLSX breaks down student hours by class level:

| Class | Study Hours/Day |
|-------|----------------|
| Kukang - KG2 | 5.5 |
| Year 1-2 | 6.5 |
| Year 3-6 | 7.5 |
| Year 7-13 | 8.5 |

Each class has monthly student counts and total hours. This granularity is supported by `t_man_hours` where each class can be a separate row with `name` = class name, `group = STUDENT`, `qty` = student count, `manHourPerDay` = study hours/day.

**XLSX accumulation columns:** The XLSX also tracks running totals across fiscal years (Total Accumulation). These are derived calculations (cumulative SUM of previous years) and do not need separate storage.

**API:** `GET /man-hours/report?startYear=YYYY&endYear=YYYY&group=STUDENT|NON_STUDENT`  
**Status:** ✅ Implemented

---

## 2. Hazard & Non-Conformance Analytics

**Source:** `docs/dashboard-hazard-analytic.md`  
**Route:** `/dashboard/hazard-analytics`

### Metrics

| # | Metric | Formula | Data Source |
|---|--------|---------|-------------|
| 2.1 | **Incident Summary** | COUNT by `incidentType` × `incidentClassification` (Fatality, Major, Minor, Near Miss, Hazard) per period | `t_incidents` |
| 2.2 | **Monthly Hazards** | COUNT by category × month | `t_incidents` grouped by `incidentDate` month |
| 2.3 | **Hazard Case Status** | COUNT open vs closed by `GeneralStatusEnum` mapping | `t_incidents` and/or `t_inspection_items` |
| 2.4 | **Type of Hazard** | COUNT by `riskCategoryId` → `m_risk_categories.name` | `t_incidents` JOIN `m_risk_categories` |
| 2.5 | **Non-Conformance Criteria** | COUNT non-compliant audit items by `auditCriteriaId` | `t_audit_items` JOIN `m_audit_criteria` WHERE `compliantStatus` IN (NOT_COMPLY_MAJOR, NOT_COMPLY_MINOR) |
| 2.6 | **Responsible Action** | COUNT by `assignedDepartmentId` → `m_departments.name` | `t_incidents` and/or `t_inspection_items` JOIN `m_departments` |
| 2.7 | **Top 10 Unsafe Conditions** | COUNT by `riskId` → `m_risk.name`, ORDER DESC LIMIT 10 | `t_inspection_items` JOIN `m_risk` |

**Status mapping (Open/Closed):**

| Dashboard Status | `GeneralStatusEnum` values |
|---|---|
| Open | OPEN, WAITING_APPROVAL, SCHEDULED, DRAFT |
| Closed | DONE, CLOSE |

**Incident category mapping:**

| Dashboard Category | Schema Filter |
|---|---|
| Fatality | `incidentClassification = 'FATALITY'` |
| Major Accident | `incidentType = 'ACCIDENT'` AND `incidentClassification = 'MAJOR'` |
| Minor Accident | `incidentType = 'ACCIDENT'` AND `incidentClassification = 'MINOR'` |
| Near Miss | `incidentType = 'NEAR_MISS'` |
| Hazard | `incidentType = 'DANGEROUS_OR_HAZARDOUS_OCCURRENCE'` |

**API:** `GET /dashboard/incident-summary?periodFrom=YYYY-MM&periodTo=YYYY-MM`  
**Status:** Incident Summary + Incident Chart ✅ Implemented; all others use mock data

---

## 3. Incident Profile Analytics

**Source:** `docs/dashboard-incident-profile-analytic.md`  
**Route:** `/dashboard/incident-profile-analytic`

### Metrics

| # | Metric | Formula | Data Source |
|---|--------|---------|-------------|
| 3.1 | **Incident Count by Category** | COUNT minor incidents grouped by `mechanismOfInjury` × fiscal year | `t_incidents` JOIN `t_incident_injured_persons` WHERE `incidentType='ACCIDENT'` AND `incidentClassification='MINOR'` |
| 3.2 | **Incident Percentage by Category** | `(yearCount / totalForCategory) × 100` | Derived from 3.1 counts |

**Scope:** Minor incidents only (`incidentType = 'ACCIDENT'` AND `incidentClassification = 'MINOR'`).

**Category derivation:** `mechanismOfInjury` from `t_incident_injured_persons` with label mapping:

| Enum | Label |
|------|-------|
| STRUCK_BY | Struck by or caught between objects |
| FAILING_OBJECT | Got hit by falling object |
| TRIP, SLIP, FALL | Fall (tripped or slipped) |
| CHEMICAL | Chemical exposure |
| VEHICLES | Vehicle accident |
| MECHINARY | Injury caused by machinery |
| ELECTRICITY | Injury caused by electricity |
| HAND_TOOLS | Got cut due to sharp edge material |
| FALL_FROM_HEIGHT | Fall from height |
| FLYING_OBJECT | Eye injury caused by flying particles |
| OTHER | Other |

**API:** `GET /dashboard/incident-profile?fiscalYears=year2022_2023&fiscalYears=year2023_2024`  
**Status:** ✅ Implemented (backend + frontend)

---

## 4. Security Team Dashboard

**Source:** `docs/dashboard-security-team.md`  
**Route:** `/dashboard/security-team`

### Metrics

| # | Metric | Formula | Data Source |
|---|--------|---------|-------------|
| 4.1 | **Incident Summary (YoY)** | COUNT by severity (Major/Moderate/Minor) with previous year comparison | `t_incidents`, `t_incident_injured_persons` |
| 4.2 | **Type of Non-Conformance** | COUNT by security risk type (Sabotage, Assault, Theft, etc.) | `t_incidents` JOIN `m_risk_categories` JOIN `m_risk` WHERE security category |
| 4.3 | **Parties Involved** | COUNT by party type (Staff, Students, Visitors, etc.) from injured persons/witnesses | `t_incident_injured_persons`, `t_incident_witnesses` JOIN `m_departments` |
| 4.4 | **Case Status** | COUNT open vs closed | `t_incidents` |
| 4.5 | **SIFR Comparison** | `SIFR = (Security Incidents × 1,000,000) ÷ Total Man-Hours` by severity × year | `t_incidents`, `t_man_hours` |
| 4.6 | **Monthly Incidents** | COUNT by severity × month | `t_incidents`, `t_incident_injured_persons` |

**Security severity split:**

| Category | Schema Mapping |
|---|---|
| Major | `incidentClassification = 'MAJOR'` |
| Moderate | `incidentClassification = 'MINOR'` AND `levelOfInjury = 'MODERATE'` |
| Minor | `incidentClassification = 'MINOR'` AND `levelOfInjury` IN (MINOR, NOT_SPECIFIED) |

**SIFR formula:**

```
SIFR = (Number of Security Incidents ÷ Total Man-Hours) × 1,000,000
Major Rate = (Major Incidents ÷ Total Man-Hours) × 1,000,000
Moderate Rate = (Moderate Incidents ÷ Total Man-Hours) × 1,000,000
Minor Rate = (Minor Incidents ÷ Total Man-Hours) × 1,000,000
```

**API:** `GET /dashboard/security-team?periodFrom=YYYY-MM&periodTo=YYYY-MM` (proposed)  
**Status:** ❌ All widgets use mock data

---

## 5. Admin Overview Dashboard

**Source:** `docs/prd-dashboard-admin-overview.md`  
**Route:** `/dashboard/admin-overview`

### Metrics (7 module sections)

| # | Module | Metrics | Data Source |
|---|--------|---------|-------------|
| 5.1 | **Learning Management** | Overdue enrollments, Course completion rate %, Quiz pass rate % | `t_enrollments`, `t_progress`, `t_quiz_attempts` |
| 5.2 | **Certificates** | Expiring in 30 days, Renewal backlog, Categories count | `t_certificates`, `t_certificate_renewals`, `m_certificate_categories` |
| 5.3 | **PPE & Equipment** | Low stock/expiring items, Withdrawals pending, Top equipment | `t_ppe_stock_items`, `t_ppe_withdrawals`, `t_ppe_withdrawal_items` |
| 5.4 | **Work Permits** | Pending approval, Active permits, Rejection rate % | `t_work_permits` |
| 5.5 | **Environmental** | Rooms not measured, Coverage %, Readings recorded | `t_environmental_measurements`, `m_rooms` |
| 5.6 | **Waste Management** | Reports pending review, Missing reports, Total waste weight | `t_monthly_flow_reports`, `t_water_quality_lab_reports`, `t_weight_reports`, `t_weight_report_items` |
| 5.7 | **Man Hours** | Total man-hours, Student vs non-student split, YoY change % | `t_man_hours` |

**API:** `GET /dashboard/admin-overview?periodFrom=YYYY-MM&periodTo=YYYY-MM` (proposed)  
**Status:** ❌ All metrics use mock data

---

## 6. Shared Concepts

### 6.1 Fiscal Year

All dashboards use the same fiscal year convention:
- **Start:** August of YYYY
- **End:** July of YYYY+1
- **Format:** `YYYY-ZZZZ` (e.g., `2024-2025`)

**Month-to-fiscal-year logic:**

```
if month >= 8 (Aug):  fiscal_year = "{year}-{year+1}"
if month < 8  (Jan-Jul): fiscal_year = "{year-1}-{year}"
```

### 6.2 Period Filtering

Standard query params across all dashboard endpoints:

| Parameter | Type | Format | Description |
|---|---|---|---|
| `periodFrom` | string | YYYY-MM | Start month (inclusive) |
| `periodTo` | string | YYYY-MM | End month (inclusive) |

When omitted, defaults vary by endpoint (typically last 6 fiscal years for KPI, current fiscal year for others).

### 6.3 Incident Scope

| `IncidentScopeEnum` | Usage |
|---|---|
| `GENERAL` | HSE/safety incidents — used by TRIFR, TRSR, LTICR, Hazard Analytics |
| `SECURITY` | Security incidents — used by Security Team Dashboard, SIFR |

### 6.4 Recordable Incident Criteria

Shared across TRIFR, TRSR, LTICR:

| Field | Recordable Values |
|---|---|
| `incidentType` | ACCIDENT, DANGEROUS_OR_HAZARDOUS_OCCURRENCE |
| `incidentClassification` | MAJOR, MINOR, FATALITY |
| `type` (scope) | GENERAL (for HSE KPIs) |
| `isActive` | true |

### 6.5 Man Hour Groups

| `ManHourGroupEnum` | Maps to | Used for |
|---|---|---|
| `STUDENT` | Study-related activities | IFR/SFR/LTICR study related denominator |
| `NON_STUDENT` | Work-related activities | IFR/SFR/LTICR work related denominator |

### 6.6 Core Schema Tables for Dashboards

| Table | Role in Dashboards |
|---|---|
| `t_incidents` | Numerator for all incident-based KPIs |
| `t_incident_injured_persons` | Injury detail for profile analytics, party classification, LTI determination |
| `t_incident_witnesses` | Party classification (Security Team) |
| `t_man_hours` | Denominator for all frequency rate KPIs |
| `t_inspection_items` | Hazard status, unsafe conditions, type of hazard |
| `t_inspections` | Inspection date for period filtering |
| `t_audit_items` | Non-conformance criteria |
| `t_audits` | Audit date for period filtering |
| `m_risk_categories` | Hazard type classification |
| `m_risk` | Specific risk/unsafe condition names |
| `m_departments` | Responsible action, party classification |
| `m_audit_criteria` | Non-conformance criteria names |

---

## 7. Implementation Status Summary

### KPI Frequency Rate

| Metric | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| TRIFR (IFR) | ✅ `GET /kpi/trifr` | ✅ TRIFRChart + DataTable | Fully implemented |
| TRSR (SFR) | ✅ `GET /kpi/trsr` | ✅ TRSRChart + DataTable | Fully implemented |
| LTICR (LTI Case Rate) | ❌ No endpoint | ⚠️ LTICRChart uses mock data | **Needs backend `GET /kpi/lticr`** — schema supports it via `absence = 'MORE_THAN_THREE_DAYS'` |

### Hazard & Non-Conformance Analytics

| Component | Status |
|---|---|
| Incident Summary Card | ✅ Implemented (`GET /dashboard/incident-summary`) |
| Incident Chart | ✅ Implemented |
| Incident Pyramid | N/A (static visual) |
| Hazard Case Status | ❌ Mock |
| Hazards By Month Table | ❌ Mock |
| Hazard Type Chart | ❌ Mock |
| Non-Conformance Criteria | ❌ Mock |
| Top Unsafe Conditions | ❌ Mock |
| Hazard Summary Table | ❌ Mock |

### Incident Profile Analytics

| Component | Status |
|---|---|
| Incident Count Chart | ✅ Implemented (`GET /dashboard/incident-profile`) |
| Incident Percentage Chart | ✅ Implemented |
| Fiscal Year Filters | ✅ Implemented |

### Security Team Dashboard

| Component | Status |
|---|---|
| All widgets | ❌ Mock data |

### Admin Overview Dashboard

| Component | Status |
|---|---|
| All 7 module sections | ❌ Mock data |

---

## Related Documents

- `backend/erd.md` — Entity relationship documentation
- `backend/prisma/schema.prisma` — Database schema
- `docs/prd-kpi-ifr-formula.md` — KPI IFR formula detail
- `docs/dashboard-hazard-analytic.md` — Hazard Analytics detail
- `docs/dashboard-incident-profile-analytic.md` — Incident Profile detail
- `docs/dashboard-security-team.md` — Security Team detail
- `docs/prd-dashboard-admin-overview.md` — Admin Overview detail
- `docs/prd-man-hours.md` — Man Hours module
- `docs/prd-incidents.md` — Incident Management module
- `refs/BSJ -IFR-SR.xlsx` — BSJ historical KPI reference data
- `frontend/src/modules/kpi-frequency-rate/` — KPI Frequency Rate frontend module
- `backend/src/modules/kpi/` — KPI backend module
