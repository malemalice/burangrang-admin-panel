# PRD: Dashboard Incident Profile Analytic

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-08

---

## Overview

This document describes the **Incident Profile Analytic** dashboard: its metrics, dimensions, data sources, and the formulas/functions required to derive them from the HSE database. The dashboard focuses on **minor incident analysis by category and fiscal year** — answering: "What types of minor incidents are happening, and how do they trend across fiscal years?"

**Current State:** Page layout, filter component, and two chart components (Incident Count and Incident Percentage) use **real data** from `GET /dashboard/incident-profile`. Category is derived from `mechanismOfInjury` (Option B) with human-readable label mapping.

---

## Dashboard Components and Data Shapes

| Component | Data Shape | Description |
|-----------|------------|-------------|
| IncidentProfileFilters | `fiscalYears` | Fiscal year multi-select (2022-2023, 2023-2024, 2024-2025) with Apply/Reset |
| IncidentCountChart | `IncidentCategoryData[]` | Horizontal stacked bar chart – count by category × fiscal year |
| IncidentPercentageChart | `IncidentCategoryData[]` | Horizontal stacked bar chart – percentage by category × fiscal year |

---

## Metrics and Dimensions

### 1. Incident Count by Category

**Dimensions:** Category (Y-axis), Fiscal Year (stacked bars)  
**Metrics:** Count

**Dashboard Category:** Descriptive incident profile label (e.g., "Got cut due to sharp edge material", "Fall (tripped or slipped)", "Struck by or caught between objects").

**Scope:** Minor incidents only — `incidentType = 'ACCIDENT'` AND `incidentClassification = 'MINOR'`.

**Fiscal Year:** Aug YYYY to Jul YYYY+1 (e.g., 2022-2023 covers Aug 2022 – Jul 2023).

**Category Derivation Options:**

The mock data uses human-readable categories. Three possible mappings to the database:

| Option | Source | Description |
|--------|--------|-------------|
| A | `t_incidents.subject` | Free text; group by exact match or normalized value |
| B | `t_incident_injured_persons.mechanismOfInjury` | Enum mapped to readable labels (STRUCK_BY, FALL, CUT, CHEMICAL, VEHICLES, FALLING_OBJECT, FLYING_OBJECT, etc.) |
| C | `mechanismOfInjury` + `injuredBodyPart` + `typeOfInjury` | Combination for granular categories (e.g., "Eye injury caused by flying particles" = EYE + FLYING_OBJECT) |

**Implemented:** Option B (`mechanismOfInjury` from `t_incident_injured_persons`). See MechanismOfInjury label mapping table below.

**Formula (Option B – mechanismOfInjury as category):**
```
SELECT mechanismOfInjury AS category_dimension,
       CASE
         WHEN incidentDate >= 'YYYY-08-01' AND incidentDate < 'YYYY+1-08-01' THEN 'yearYYYY_YYYY+1'
         ...
       END AS fiscal_year,
       COUNT(*) AS count
FROM t_incidents i
JOIN t_incident_injured_persons ip ON ip.incidentId = i.id
WHERE i.incidentType = 'ACCIDENT'
  AND i.incidentClassification = 'MINOR'
  AND i.isActive = true
  AND i.incidentDate BETWEEN periodFrom AND periodTo
GROUP BY category_dimension, fiscal_year
```

**Formula (Option A – subject as category):**
```
SELECT i.subject AS category,
       EXTRACT(YEAR FROM i.incidentDate) AS year,
       COUNT(*) AS count
FROM t_incidents i
WHERE i.incidentType = 'ACCIDENT'
  AND i.incidentClassification = 'MINOR'
  AND i.isActive = true
  AND i.incidentDate BETWEEN periodFrom AND periodTo
GROUP BY i.subject, EXTRACT(YEAR FROM i.incidentDate)
```

**Data Source:** `t_incidents`, `t_incident_injured_persons` (if using injury-related fields for category)

---

### 2. Incident Percentage by Category

**Dimensions:** Same as Incident Count  
**Metrics:** Percentage (each category’s count per fiscal year as % of that category’s total across all fiscal years)

**Formula:**
```
percentage = ROUND((yearCount / totalAcrossAllYearsForCategory) * 100, 1)
```

Where `totalAcrossAllYearsForCategory = SUM(count) GROUP BY category`.

**Implementation:** Computed in backend (`DashboardService.getIncidentProfile`).

---

## Entity Relationship Context

### Incident Report System
- `t_incidents`: subject, incidentType, incidentClassification, incidentDate, riskCategoryId, assignedDepartmentId, status
- `t_incident_injured_persons`: incidentId, typeOfInjury, mechanismOfInjury, injuredBodyPart, levelOfInjury
- Related: `t_incident_witnesses`, `t_incident_assets`, `t_incident_images`, `t_incident_attachments`

### Relevant Enums (schema)
- `IncidentTypeEnum`: NEAR_MISS, ACCIDENT, DANGEROUS_OR_HAZARDOUS_OCCURRENCE
- `IncidentClassificationEnum`: MAJOR, MINOR, FATALITY
- `TypeOfInjuryEnum`: NOT_SPECIFIED, CUT, BRUISE, FRACTURE, BURN, SPRAIN, STRAIN, LACERATION, CONCUSSION, OTHER
- `MechanismOfInjuryEnum`: NOT_SPECIFIED, STRUCK_BY, FAILING_OBJECT, TRIP, SLIP, FALL, CHEMICAL, VEHICLES, MECHINARY, ELECTRICITY, HAND_TOOLS, FALL_FROM_HEIGHT, FLYING_OBJECT, OTHER (schema uses FAILING_OBJECT and MECHINARY)

**MechanismOfInjury label mapping (implemented):**

| Enum | Human-readable label |
|------|----------------------|
| NOT_SPECIFIED | Not specified |
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
- `InjuredBodyPartEnum`: NOT_SPECIFIED, HEAD, NECK, ABDOMEN, ARM, FEET, SHOULDER, HAND, LEG, BACK, SKIN, CHEST, EYE, INTERNAL_ORGAN, OTHER

---

## Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| fiscalYears | string or string[] | Fiscal years to compare (e.g. `year2022_2023`, `year2023_2024`, `year2024_2025`). Omit or pass all for full comparison. |

**Filter Behavior:** User selects which fiscal years to compare via checkboxes. The API only includes incidents whose `incidentDate` falls within the selected fiscal year date ranges (Aug YYYY – Jul ZZZZ). If no fiscal years are specified, all three (2022-2023, 2023-2024, 2024-2025) are included.

---

## Implementation Notes

### Backend API (Implemented)

**Endpoint:** `GET /dashboard/incident-profile`

- **Query params:** `fiscalYears` (optional, repeatable: `year2022_2023`, `year2023_2024`, `year2024_2025`)
- **Permission:** `incident:list` (consistent with other dashboard analytics)
- **Response:** `IncidentProfileDto` — `{ countData: IncidentCategoryData[], percentageData: IncidentCategoryData[], yearsToShow: string[] }`

**IncidentCategoryData structure:**
```
{
  category: string;
  year2022_2023: number;
  year2023_2024: number;
  year2024_2025: number;
}
```

Backend may return dynamic year keys based on `periodFrom`/`periodTo`, or a fixed set. Frontend currently expects `year2022_2023`, `year2023_2024`, `year2024_2025`.

### Data Aggregation Strategy

Single endpoint returns both count and percentage data for consistent rounding.

### Implementation Status

| Component | Data Source | Status |
|-----------|-------------|--------|
| IncidentProfileFilters | Local state | Implemented |
| IncidentCountChart | `GET /dashboard/incident-profile` | Implemented |
| IncidentPercentageChart | `GET /dashboard/incident-profile` | Implemented |
| Backend API endpoint | DashboardService.getIncidentProfile | Implemented |
| Real data integration | incidentProfileService | Implemented |

---

## Schema Summary

| Metric / Dimension | Table(s) | Key Fields |
|--------------------|----------|------------|
| Incident Profile (category) | t_incidents, t_incident_injured_persons | subject, mechanismOfInjury, typeOfInjury, injuredBodyPart |
| Incident Profile (scope) | t_incidents | incidentType, incidentClassification, incidentDate |
| Fiscal year grouping | t_incidents | incidentDate (Aug–Jul cycle) |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/incident-profile-analytic/` – Incident Profile Analytic module
- `docs/prd/dashboard-hazard-analytic.md` – Hazard Analytics dashboard (reference pattern)
- `docs/prd/kpi-ifr-formula.md` – KPI IFR formula (incident-related)
