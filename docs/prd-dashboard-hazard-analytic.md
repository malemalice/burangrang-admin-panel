# PRD: Dashboard Hazard Analytics

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-07

---

## Overview

This document describes the **Hazard and Non-Conformance Analytics** dashboard: its metrics, dimensions, data sources, and the formulas/functions required to derive them from the HSE database.

**Current State:** Incident Summary and Incident Chart use **real data** from `GET /dashboard/incident-summary`. Other widgets (monthly hazards, hazard types, non-conformance, etc.) still use mock data. Incident seeds have been enriched to span 24 months (Aug 2023 - Jul 2025) with FATALITY, Major, Minor, Near Miss, and Hazard categories.

---

## Dashboard Components and Data Shapes

| Component | Data Shape | Description |
|-----------|------------|-------------|
| IncidentSummaryCard | `IncidentSummary[]` | Category, actual count, target/difference |
| IncidentPyramid | Static | Heinrich's Triangle (1:30:300:3000:30000) – visual reference only |
| IncidentChart | `IncidentSummary[]` | Bar chart of actual vs target by category |
| HazardCaseStatusChart | `HazardStatus` | Open vs closed case counts (pie chart) |
| HazardsByMonthTable | `MonthlyHazardData[]` | Category × month counts with totals |
| HazardTypeChart | `HazardTypeData[]` | Hazard type distribution (bar chart) |
| NonConformanceCriteriaChart | `NonConformanceCriteria[]` | Criteria × count (bar chart) |
| TopUnsafeConditionsTable | `TopUnsafeCondition[]` | Top 10 conditions by report count |
| HazardSummaryTable | Aggregated | Summary of hazard types, non-conformance, responsible actions, status |

---

## Metrics and Dimensions

### 1. Incident Summary

**Dimensions:** Category  
**Metrics:** Actual count, Target / Difference

| Dashboard Category | Schema Mapping | Formula |
|--------------------|----------------|---------|
| Fatality | `incidentClassification = 'FATALITY'` | `COUNT(*)` WHERE `incidentClassification = 'FATALITY'` AND `incidentDate` in period |
| Major Accident | `incidentType = 'ACCIDENT'` AND `incidentClassification = 'MAJOR'` | `COUNT(*)` WHERE above AND `incidentDate` in period |
| Minor Accident / Recordable Injuries | `incidentType = 'ACCIDENT'` AND `incidentClassification = 'MINOR'` | `COUNT(*)` WHERE above AND `incidentDate` in period |
| Near Miss | `incidentType = 'NEAR_MISS'` | `COUNT(*)` WHERE above AND `incidentDate` in period |
| Hazard | `incidentType = 'DANGEROUS_OR_HAZARDOUS_OCCURRENCE'` | `COUNT(*)` WHERE above AND `incidentDate` in period |

**Target:** Typically zero or negative (representing “below target”). May come from `t_hse_targets` if a target is defined per category, or derived as `-actual` when no target exists.

**Data Source:** `t_incidents`

**Enums (schema):**
- `IncidentTypeEnum`: NEAR_MISS, ACCIDENT, DANGEROUS_OR_HAZARDOUS_OCCURRENCE
- `IncidentClassificationEnum`: MAJOR, MINOR, FATALITY

---

### 2. Monthly Hazards (Numbers of Hazard Per Month)

**Dimensions:** Category, Month  
**Metrics:** Count per month, Total

Same category mapping as Incident Summary. For each category:

```
GROUP BY incidentType, incidentClassification
         EXTRACT(YEAR FROM incidentDate), EXTRACT(MONTH FROM incidentDate)
```

**Data Source:** `t_incidents`  
**Period Filter:** `periodFrom`, `periodTo` (YYYY-MM) applied to `incidentDate`.

---

### 3. Hazard Case Status (Open / Closed)

**Dimensions:** Status (Open, Closed)  
**Metrics:** Count

| Status | Schema Mapping |
|--------|----------------|
| Open | `status IN ('OPEN', 'WAITING_APPROVAL', 'SCHEDULED', 'DRAFT')` |
| Closed | `status IN ('DONE', 'CLOSE')` |

**Note:** Incidents and inspection items both use `GeneralStatusEnum`. Hazard status may aggregate:
- Incidents only, or
- Inspection items only, or
- Both (e.g., inspection items for hazard findings).

**Data Source:** `t_incidents` and/or `t_inspection_items`  
**Formula:** `COUNT(*) GROUP BY status` (with Open/Closed grouping as above).

---

### 4. Type of Hazard

**Dimensions:** Hazard type (e.g., Biological, Chemical, Physical, Mechanical, Ergonomic, Psychosocial)  
**Metrics:** Count

**Data Source:** `m_risk_categories` via `t_incidents.riskCategoryId` and/or `t_inspection_items.riskCategoryId`

**Formula:**
```
SELECT rc.name AS type, COUNT(*) AS count
FROM t_incidents i
JOIN m_risk_categories rc ON i.riskCategoryId = rc.id
WHERE i.incidentDate IN period AND i.isActive = true
GROUP BY rc.id, rc.name
```

If combining incidents and inspection items:

```
SELECT rc.name AS type, COUNT(*) AS count
FROM (
  SELECT riskCategoryId FROM t_incidents WHERE ...
  UNION ALL
  SELECT riskCategoryId FROM t_inspection_items WHERE ...
) combined
JOIN m_risk_categories rc ON combined.riskCategoryId = rc.id
GROUP BY rc.id, rc.name
```

**Note:** Exact type names (Biological, Chemical, etc.) depend on master data in `m_risk_categories`. A mapping or alias may be needed if names differ.

---

### 5. Non-Conformance Criteria

**Dimensions:** Criteria name  
**Metrics:** Count (non-compliant findings)

**Data Source:** `t_audit_items` joined to `m_audit_criteria`

**Formula:**
```
SELECT ac.name AS criteria, COUNT(*) AS count
FROM t_audit_items ai
JOIN m_audit_criteria ac ON ai.auditCriteriaId = ac.id
JOIN t_audits a ON ai.auditId = a.id
WHERE ai.compliantStatus IN ('NOT_COMPLY_MAJOR', 'NOT_COMPLY_MINOR')
  AND a.auditDate IN period
  AND ai.status NOT IN ('REJECTED')  -- optional: exclude rejected
GROUP BY ac.id, ac.name
```

**Note:** `CompliantStatusEnum`: COMPLY, NOT_COMPLY_MAJOR, NOT_COMPLY_MINOR. Only non-compliant items are counted.

---

### 6. Responsible Action

**Dimensions:** Department / action name  
**Metrics:** Count

**Data Source:** `m_departments` via `t_incidents.assignedDepartmentId` and/or `t_inspection_items.assignedDepartmentId`

**Formula:**
```
SELECT d.name AS action, COUNT(*) AS count
FROM t_incidents i
JOIN m_departments d ON i.assignedDepartmentId = d.id
WHERE i.incidentDate IN period AND i.isActive = true
GROUP BY d.id, d.name
```

If including inspection items:

```
SELECT d.name AS action, COUNT(*) AS count
FROM (
  SELECT assignedDepartmentId FROM t_incidents WHERE ...
  UNION ALL
  SELECT assignedDepartmentId FROM t_inspection_items WHERE ...
) combined
JOIN m_departments d ON combined.assignedDepartmentId = d.id
GROUP BY d.id, d.name
```

---

### 7. Top 10 Unsafe Conditions

**Dimensions:** Condition (risk/hazard description)  
**Metrics:** Report count

**Data Source:** `m_risk` via `t_inspection_items.riskId`

**Formula:**
```
SELECT r.name AS condition, COUNT(*) AS reportCount
FROM t_inspection_items ii
JOIN m_risk r ON ii.riskId = r.id
WHERE ii.createdAt IN period  -- or inspection.inspectionDate
GROUP BY r.id, r.name
ORDER BY reportCount DESC
LIMIT 10
```

**Note:** `t_incidents` uses `riskCategoryId`, not `riskId`. Top unsafe conditions are typically specific risks from inspections. If incidents should contribute, a separate source (e.g., `description` or a new risk linkage) would be needed.

---

## Entity Relationship Context

### Incident Report System
- `t_incidents`: incidentType, incidentClassification, riskCategoryId, assignedDepartmentId, status, incidentDate
- Related: `t_incident_injured_persons`, `t_incident_witnesses`, `t_incident_assets`, `t_incident_images`, `t_incident_attachments`

### Inspection System
- `t_inspection_items`: riskId, riskCategoryId, assignedDepartmentId, status, inspection relation
- `t_inspections`: inspectionDate
- Related: `m_risk`, `m_risk_categories`, `m_departments`

### Audit System
- `t_audit_items`: auditCriteriaId, compliantStatus
- `t_audits`: auditDate
- `m_audit_criteria`: name
- Related: `m_audit_clause`, `m_audit_element`

---

## Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| periodFrom | string | Start of period (YYYY-MM) |
| periodTo | string | End of period (YYYY-MM) |

Period is applied to:
- Incidents: `incidentDate`
- Inspections: `inspection.inspectionDate` or `inspection_item.createdAt`
- Audits: `audit.auditDate`

---

## Implementation Notes

### Backend API

**Incident Summary (implemented):**

- **Endpoint:** `GET /dashboard/incident-summary`
- **Query params:** `periodFrom`, `periodTo` (YYYY-MM, optional)
- **Permission:** `incident:list`
- **Response:** `IncidentSummaryDto[]` – `{ category, actual, target }` for each of Fatality, Major Accident, Minor Accident/Recordable Injuries, Near Miss, Hazard

### Data Aggregation Strategy

- **Option A:** Single endpoint that runs all aggregations in one service
- **Option B:** Multiple endpoints (incident summary, monthly hazards, hazard types, etc.) – frontend would combine
- **Recommendation:** Option A for fewer round-trips and consistent period handling

### Target Values (Incident Summary)

- `t_hse_targets` stores monthly/yearly targets by code/name.
- If no target exists, frontend shows `target = -actual` (below target).
- Backend may return `target: number | null`; frontend applies fallback.

### Implementation Status

| Component | Data Source | Status |
|-----------|-------------|--------|
| Incident Summary Card | `GET /dashboard/incident-summary` | Implemented |
| Incident Chart | `GET /dashboard/incident-summary` | Implemented |
| Incident Pyramid | Static (no API) | N/A |
| Hazard Case Status | Mock | Pending |
| Hazards By Month Table | Mock | Pending |
| Hazard Type Chart | Mock | Pending |
| Non-Conformance Criteria Chart | Mock | Pending |
| Top Unsafe Conditions Table | Mock | Pending |
| Hazard Summary Table | Mock | Pending |

### Heinrich's Triangle (Incident Pyramid)

- Purely visual; ratios (1:30:300:3000:30000) are static.
- No calculation required from backend.

---

## Schema Summary

| Metric / Dimension | Table(s) | Key Fields |
|--------------------|----------|------------|
| Incident Summary | t_incidents | incidentType, incidentClassification, incidentDate |
| Monthly Hazards | t_incidents | incidentType, incidentClassification, incidentDate |
| Hazard Status | t_incidents, t_inspection_items | status |
| Type of Hazard | t_incidents, t_inspection_items, m_risk_categories | riskCategoryId |
| Non-Conformance Criteria | t_audit_items, m_audit_criteria, t_audits | auditCriteriaId, compliantStatus, auditDate |
| Responsible Action | t_incidents, t_inspection_items, m_departments | assignedDepartmentId |
| Top Unsafe Conditions | t_inspection_items, m_risk | riskId |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/hazard-analytics/` – Hazard Analytics module
- `docs/prd-kpi-ifr-formula.md` – KPI IFR formula (incident-related)
