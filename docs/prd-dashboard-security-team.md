# PRD: Dashboard Security Team

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-08

---

## Overview

This document describes the **Security Team Dashboard**: its metrics, dimensions, data sources, and the formulas/functions required to derive them from the HSE database.

**Current State:** All widgets use **mock data**. The dashboard is designed to track security-related incidents, violations, and safety metrics across the organization.

---

## Dashboard Components and Data Shapes

| Component | Data Shape | Description |
|-----------|------------|-------------|
| IncidentSummaryCard | `IncidentSummaryItem[]` | Summary cards for Major, Moderate, Minor incidents with YoY comparison |
| IncidentTriangleChart | `IncidentSummaryItem[]` | Pyramid visualization of incident hierarchy (Major:Moderate:Minor) |
| IncidentCaseStatusChart | `CaseStatus` | Pie chart of open vs closed cases |
| TypeNonConformanceChart | `TypeNonConformanceItem[]` | Bar chart showing types of security violations/incidents |
| PartiesInvolvedChart | `PartiesInvolvedItem[]` | Bar chart showing distribution by party type (Staff, Students, etc.) |
| SifrComparisonTable | `SifrComparisonRow[]` | Table comparing SIFR (Security Incident Frequency Rate) year-over-year |
| YearComparisonChart | `SifrComparisonRow[]` | Bar chart visualizing SIFR rates by severity level |
| IncidentsByMonthTable | `MonthlyIncidentData[]` | Monthly breakdown by severity category |
| SecuritySummaryTable | Aggregated | Overall summary of types, parties, and case status |

---

## Metrics and Dimensions

### 1. Incident Summary (with Year-over-Year Comparison)

**Dimensions:** Category (Major, Moderate, Minor, Total)  
**Metrics:** Current period count, Previous period count, Difference (YoY)

| Dashboard Category | Schema Mapping | Formula |
|--------------------|----------------|---------|
| Major Incident | `incidentClassification = 'MAJOR'` | `COUNT(*)` WHERE `incidentClassification = 'MAJOR'` AND `incidentDate` in current period |
| Moderate Incident | `incidentClassification = 'MINOR'` AND `levelOfInjury = 'MODERATE'` | `COUNT(*)` WHERE above AND `incidentDate` in current period |
| Minor Incident | `incidentClassification = 'MINOR'` AND `levelOfInjury IN ('MINOR', 'NOT_SPECIFIED')` | `COUNT(*)` WHERE above AND `incidentDate` in current period |
| Total Incident | All incidents | `COUNT(*)` WHERE `incidentDate` in current period |

**Year-over-Year Difference:**
```sql
Current Period Count - Previous Period Count
```

Where:
- **Current Period:** `periodFrom` to `periodTo` (e.g., Aug 2024 - Jul 2025)
- **Previous Period:** Same duration, one year earlier (e.g., Aug 2023 - Jul 2024)

**Data Source:** `t_incidents`, `t_incident_injured_persons`

**Enums:**
- `IncidentClassificationEnum`: MAJOR, MINOR, FATALITY
- `LevelOfInjuryEnum`: NOT_SPECIFIED, MINOR, MODERATE, SEVERE, FATAL

**Note:** Moderate incidents are classified as Minor with Moderate injury level. This distinction is important for security tracking.

---

### 2. Type of Non-Conformance (Security Violation Types)

**Dimensions:** Violation/Incident Type  
**Metrics:** Count per type

**Categories:**
- Inappropriate behavior (CP)
- Sabotage (Major)
- Confrontation / Assault (Major)
- External Dispute (Major)
- Trespasser / Intruder (Moderate)
- Internal Dispute
- Access Without RFID / Access Violence
- Traffic Violation
- Vandalism
- Theft
- Smoking / Vaping
- Lost and Found
- Others

**Data Source:** `t_incidents` with security-specific risk categories from `m_risk_categories` and `m_risk`

**Formula:**
```sql
SELECT 
  CASE 
    WHEN r.name ILIKE '%inappropriate behavior%' OR r.code = 'SEC-IBH' THEN 'Inappropriate behavior (CP)'
    WHEN r.name ILIKE '%sabotage%' OR r.code = 'SEC-SAB' THEN 'Sabotage (Major)'
    WHEN r.name ILIKE '%confrontation%' OR r.name ILIKE '%assault%' OR r.code = 'SEC-ASL' THEN 'Confrontation / Assault (Major)'
    WHEN r.name ILIKE '%external dispute%' OR r.code = 'SEC-EXD' THEN 'External Dispute (Major)'
    WHEN r.name ILIKE '%trespasser%' OR r.name ILIKE '%intruder%' OR r.code = 'SEC-TRS' THEN 'Trespasser / Intruder (Moderate)'
    WHEN r.name ILIKE '%internal dispute%' OR r.code = 'SEC-IND' THEN 'Internal Dispute'
    WHEN r.name ILIKE '%access%' OR r.name ILIKE '%rfid%' OR r.code = 'SEC-ACC' THEN 'Access Without RFID / Access Violence'
    WHEN r.name ILIKE '%traffic%' OR r.code = 'SEC-TRF' THEN 'Traffic Violation'
    WHEN r.name ILIKE '%vandal%' OR r.code = 'SEC-VND' THEN 'Vandalism'
    WHEN r.name ILIKE '%theft%' OR r.code = 'SEC-THF' THEN 'Theft'
    WHEN r.name ILIKE '%smok%' OR r.name ILIKE '%vap%' OR r.code = 'SEC-SMK' THEN 'Smoking / Vaping'
    WHEN r.name ILIKE '%lost%' OR r.name ILIKE '%found%' OR r.code = 'SEC-LST' THEN 'Lost and Found'
    ELSE 'Others'
  END AS type,
  COUNT(*) AS count
FROM t_incidents i
LEFT JOIN m_risk_categories rc ON i.riskCategoryId = rc.id
LEFT JOIN m_risk r ON r.riskCategoryId = rc.id
WHERE i.incidentDate BETWEEN :periodFrom AND :periodTo
  AND i.isActive = true
  AND rc.name = 'Security' -- Filter only security-related incidents
GROUP BY type
ORDER BY count DESC
```

**Implementation Note:** Security incident types should be mapped through risk categories tagged as security-related, or use a specific risk category code/name pattern.

---

### 3. Parties Involved

**Dimensions:** Party Type  
**Metrics:** Count per party type

**Categories:**
- Staff
- Students
- Parents / Family
- Household staff
- Visitors
- Vendors
- Contractors
- External
- Others

**Data Source:** `t_incidents`, `t_incident_injured_persons`, `t_incident_witnesses`, `m_departments`

**Formula:**
```sql
-- From injured persons
SELECT 
  CASE 
    WHEN d.name ILIKE '%staff%' OR d.code LIKE 'STF%' THEN 'Staff'
    WHEN d.name ILIKE '%student%' OR d.code LIKE 'STD%' THEN 'Students'
    WHEN d.name ILIKE '%parent%' OR d.name ILIKE '%family%' THEN 'Parents / Family'
    WHEN d.name ILIKE '%household%' THEN 'Household staff'
    WHEN d.name ILIKE '%visitor%' THEN 'Visitors'
    WHEN d.name ILIKE '%vendor%' THEN 'Vendors'
    WHEN d.name ILIKE '%contractor%' THEN 'Contractors'
    WHEN d.name ILIKE '%external%' THEN 'External'
    WHEN iip.departmentId IS NULL THEN 'External'
    ELSE 'Others'
  END AS party,
  COUNT(*) AS count
FROM t_incidents i
LEFT JOIN t_incident_injured_persons iip ON i.id = iip.incidentId
LEFT JOIN m_departments d ON iip.departmentId = d.id
WHERE i.incidentDate BETWEEN :periodFrom AND :periodTo
  AND i.isActive = true
GROUP BY party

UNION ALL

-- From witnesses
SELECT 
  CASE 
    WHEN d.name ILIKE '%staff%' OR d.code LIKE 'STF%' THEN 'Staff'
    WHEN d.name ILIKE '%student%' OR d.code LIKE 'STD%' THEN 'Students'
    WHEN d.name ILIKE '%parent%' OR d.name ILIKE '%family%' THEN 'Parents / Family'
    WHEN d.name ILIKE '%household%' THEN 'Household staff'
    WHEN d.name ILIKE '%visitor%' THEN 'Visitors'
    WHEN d.name ILIKE '%vendor%' THEN 'Vendors'
    WHEN d.name ILIKE '%contractor%' THEN 'Contractors'
    WHEN d.name ILIKE '%external%' THEN 'External'
    WHEN iw.departmentId IS NULL THEN 'External'
    ELSE 'Others'
  END AS party,
  COUNT(*) AS count
FROM t_incidents i
LEFT JOIN t_incident_witnesses iw ON i.id = iw.incidentId
LEFT JOIN m_departments d ON iw.departmentId = d.id
WHERE i.incidentDate BETWEEN :periodFrom AND :periodTo
  AND i.isActive = true
GROUP BY party

ORDER BY count DESC
```

**Implementation Note:** Parties can be derived from:
1. Injured persons (via `t_incident_injured_persons.departmentId`)
2. Witnesses (via `t_incident_witnesses.departmentId`)
3. Department categorization patterns (Staff, Student departments, etc.)

---

### 4. Incident Case Status

**Dimensions:** Status (Open, Closed)  
**Metrics:** Count, Total

| Status | Schema Mapping |
|--------|----------------|
| Open | `status IN ('OPEN', 'WAITING_APPROVAL', 'SCHEDULED', 'DRAFT')` |
| Closed | `status IN ('DONE', 'CLOSE')` |

**Formula:**
```sql
SELECT 
  CASE 
    WHEN status IN ('OPEN', 'WAITING_APPROVAL', 'SCHEDULED', 'DRAFT') THEN 'open'
    WHEN status IN ('DONE', 'CLOSE') THEN 'closed'
  END AS status_category,
  COUNT(*) AS count
FROM t_incidents
WHERE incidentDate BETWEEN :periodFrom AND :periodTo
  AND isActive = true
  AND status NOT IN ('REJECTED')
GROUP BY status_category
```

**Data Source:** `t_incidents`

**Response Shape:**
```typescript
{
  open: number,
  closed: number,
  total: number  // open + closed
}
```

---

### 5. SIFR Comparison (Security Incident Frequency Rate)

**Dimensions:** Year, Severity Level  
**Metrics:** Total SIFR, Major Rate, Moderate Rate, Minor Rate

**SIFR Formula:**
```
SIFR = (Number of Security Incidents / Total Man-Hours) × 1,000,000
```

**Rate by Severity:**
```
Major Rate = (Number of Major Incidents / Total Man-Hours) × 1,000,000
Moderate Rate = (Number of Moderate Incidents / Total Man-Hours) × 1,000,000
Minor Rate = (Number of Minor Incidents / Total Man-Hours) × 1,000,000
```

**Data Source:** `t_incidents`, `t_man_hours`

**Formula:**
```sql
-- For each academic year (e.g., 2023-2024 = Aug 2023 - Jul 2024)
WITH man_hours AS (
  SELECT 
    CASE 
      WHEN month IN ('AUG', 'SEP', 'OCT', 'NOV', 'DEC') THEN year || '-' || (year + 1)
      ELSE (year - 1) || '-' || year
    END AS academic_year,
    SUM(total) AS total_man_hours
  FROM t_man_hours
  WHERE isActive = true
  GROUP BY academic_year
),
incidents_by_year AS (
  SELECT 
    CASE 
      WHEN EXTRACT(MONTH FROM incidentDate) >= 8 THEN 
        EXTRACT(YEAR FROM incidentDate) || '-' || (EXTRACT(YEAR FROM incidentDate) + 1)
      ELSE 
        (EXTRACT(YEAR FROM incidentDate) - 1) || '-' || EXTRACT(YEAR FROM incidentDate)
    END AS academic_year,
    COUNT(*) AS total_incidents,
    COUNT(*) FILTER (WHERE incidentClassification = 'MAJOR') AS major_incidents,
    COUNT(*) FILTER (
      WHERE incidentClassification = 'MINOR' 
      AND EXISTS (
        SELECT 1 FROM t_incident_injured_persons iip
        WHERE iip.incidentId = i.id AND iip.levelOfInjury = 'MODERATE'
      )
    ) AS moderate_incidents,
    COUNT(*) FILTER (
      WHERE incidentClassification = 'MINOR'
      AND NOT EXISTS (
        SELECT 1 FROM t_incident_injured_persons iip
        WHERE iip.incidentId = i.id AND iip.levelOfInjury = 'MODERATE'
      )
    ) AS minor_incidents
  FROM t_incidents i
  WHERE isActive = true
  GROUP BY academic_year
)
SELECT 
  i.academic_year AS year,
  (i.total_incidents / mh.total_man_hours * 1000000) AS totalSifr,
  (i.major_incidents / mh.total_man_hours * 1000000) AS majorRate,
  (i.moderate_incidents / mh.total_man_hours * 1000000) AS moderateRate,
  (i.minor_incidents / mh.total_man_hours * 1000000) AS minorRate
FROM incidents_by_year i
JOIN man_hours mh ON i.academic_year = mh.academic_year
ORDER BY i.academic_year
```

**Response Shape:**
```typescript
{
  year: string,           // e.g., "2023-2024"
  totalSifr: number,     // Total SIFR (all incidents)
  majorRate: number,     // SIFR for major incidents
  moderateRate: number,  // SIFR for moderate incidents
  minorRate: number      // SIFR for minor incidents
}
```

**Implementation Note:** Academic year runs from August to July (e.g., Aug 2023 - Jul 2024 = "2023-2024").

---

### 6. Monthly Incidents Breakdown

**Dimensions:** Category, Month  
**Metrics:** Count per month, Total

**Categories:**
- Minor
- Moderate
- Major
- Total Incident

**Formula:**
```sql
SELECT 
  CASE 
    WHEN incidentClassification = 'MAJOR' THEN 'Major'
    WHEN incidentClassification = 'MINOR' AND EXISTS (
      SELECT 1 FROM t_incident_injured_persons iip
      WHERE iip.incidentId = i.id AND iip.levelOfInjury = 'MODERATE'
    ) THEN 'Moderate'
    WHEN incidentClassification = 'MINOR' THEN 'Minor'
  END AS category,
  TO_CHAR(incidentDate, 'Mon YYYY') AS month,
  COUNT(*) AS count
FROM t_incidents i
WHERE incidentDate BETWEEN :periodFrom AND :periodTo
  AND isActive = true
GROUP BY category, month
ORDER BY incidentDate, category

-- Plus a rollup for Total Incident
UNION ALL

SELECT 
  'Total Incident' AS category,
  TO_CHAR(incidentDate, 'Mon YYYY') AS month,
  COUNT(*) AS count
FROM t_incidents
WHERE incidentDate BETWEEN :periodFrom AND :periodTo
  AND isActive = true
GROUP BY month
ORDER BY month
```

**Data Source:** `t_incidents`, `t_incident_injured_persons`

**Response Shape:**
```typescript
{
  category: string,  // "Minor", "Moderate", "Major", "Total Incident"
  months: [
    { month: string, count: number }  // e.g., { month: "Aug 2024", count: 3 }
  ],
  total: number  // Sum of all months for this category
}
```

---

## Entity Relationship Context

### Incident Report System
- `t_incidents`: incidentDate, incidentClassification, incidentType, riskCategoryId, assignedDepartmentId, status, source
- `t_incident_injured_persons`: incidentId, injuredPersonName, departmentId, levelOfInjury, injuredBodyPart, typeOfInjury, mechanismOfInjury
- `t_incident_witnesses`: incidentId, witnessName, departmentId
- `t_incident_assets`: incidentId, assetName, assetCode, quantity
- `t_incident_images`: incidentId, imageUrl, caption
- `t_incident_attachments`: incidentId, attachmentUrl

**Related Master Data:**
- `m_risk_categories`: id, name, code (e.g., "Security")
- `m_risk`: id, name, code, riskCategoryId (specific security risks)
- `m_departments`: id, name, code (for categorizing parties)
- `m_areas`: id, name, code (incident location)

### Man Hour System
- `t_man_hours`: id, name, group, qty, manHourPerDay, month, year, total, createdBy

---

## Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| periodFrom | string | Start of period (YYYY-MM), e.g., "2024-08" |
| periodTo | string | End of period (YYYY-MM), e.g., "2025-07" |

**Default Period:** Aug 2024 - Jul 2025 (one academic year)

Period is applied to:
- Incidents: `incidentDate`
- Man Hours: `month` and `year` (for SIFR calculation)

**Period Format:** YYYY-MM (e.g., "2024-08" for August 2024)

---

## Implementation Notes

### Backend API

**Proposed Endpoint:** `GET /dashboard/security-team`

**Query Parameters:**
- `periodFrom` (optional): YYYY-MM
- `periodTo` (optional): YYYY-MM

**Permissions:** `incident:list` or `dashboard:security-team:view`

**Response Structure:**
```typescript
{
  incidentSummary: IncidentSummaryItem[],      // Major, Moderate, Minor, Total with YoY
  monthlyIncidents: MonthlyIncidentData[],     // Monthly breakdown by category
  typeNonConformance: TypeNonConformanceItem[], // Security violation types
  partiesInvolved: PartiesInvolvedItem[],      // Party distribution
  caseStatus: CaseStatus,                      // Open vs Closed
  sifrComparison: SifrComparisonRow[]          // Year-over-year SIFR
}
```

### Data Aggregation Strategy

**Recommended Approach:** Single comprehensive endpoint that:
1. Aggregates all metrics in one service method
2. Uses efficient joins and CTEs (Common Table Expressions)
3. Handles period filtering consistently
4. Returns all dashboard data in one response

**Benefits:**
- Fewer HTTP round-trips
- Consistent period handling across all metrics
- Easier caching and performance optimization
- Single permission check

### Year-over-Year Comparison Logic

For each metric:
1. Calculate current period count (using `periodFrom` and `periodTo`)
2. Calculate previous period count (same duration, shifted one year back)
3. Difference = Current - Previous
4. Positive difference = increase, Negative difference = decrease

**Example:**
```
Current Period: Aug 2024 - Jul 2025
Previous Period: Aug 2023 - Jul 2024
```

### Security Risk Categories

Security incidents should be identifiable by:
1. Risk Category with code/name pattern (e.g., `m_risk_categories.name = 'Security'` or `code = 'SEC'`)
2. Specific risks under security category (e.g., `m_risk.code` starts with 'SEC-')
3. Pattern matching on risk names for classification

**Recommended Master Data Setup:**
```sql
-- Risk Category
INSERT INTO m_risk_categories (name, code, description) 
VALUES ('Security', 'SEC', 'Security-related incidents and violations');

-- Specific Risks
INSERT INTO m_risk (name, code, riskCategoryId) VALUES
  ('Inappropriate Behavior', 'SEC-IBH', :securityCategoryId),
  ('Sabotage', 'SEC-SAB', :securityCategoryId),
  ('Confrontation/Assault', 'SEC-ASL', :securityCategoryId),
  ('External Dispute', 'SEC-EXD', :securityCategoryId),
  -- ... etc
```

### SIFR Calculation Notes

**Man-Hours Data Requirements:**
- Must have man-hour records for the academic year(s) being calculated
- Man-hours should include both student and non-student groups
- Academic year calculation: Aug-Jul period

**Formula Validation:**
- SIFR should be rounded to 2 decimal places
- If man-hours = 0 or null, SIFR = 0 (avoid division by zero)
- Rates are calculated per 1,000,000 man-hours (standard safety metric)

### Parties Involved Logic

**Department-Based Classification:**
- Staff: Departments with staff-related codes or names
- Students: Departments with student-related codes or names
- External: No department association (departmentId = null)

**Source Priority:**
1. Injured Persons (primary source)
2. Witnesses (secondary source)
3. Deduplicate if same person appears in both

### Implementation Status

| Component | Data Source | Status |
|-----------|-------------|--------|
| Incident Summary Card | Mock | Pending |
| Incident Triangle Chart | Mock | Pending |
| Incident Case Status Chart | Mock | Pending |
| Type Non-Conformance Chart | Mock | Pending |
| Parties Involved Chart | Mock | Pending |
| SIFR Comparison Table | Mock | Pending |
| Year Comparison Chart | Mock | Pending |
| Incidents By Month Table | Mock | Pending |
| Security Summary Table | Mock | Pending |

---

## Schema Summary

| Metric / Dimension | Table(s) | Key Fields |
|--------------------|----------|------------|
| Incident Summary | t_incidents, t_incident_injured_persons | incidentClassification, levelOfInjury, incidentDate |
| Monthly Incidents | t_incidents, t_incident_injured_persons | incidentClassification, levelOfInjury, incidentDate |
| Type Non-Conformance | t_incidents, m_risk_categories, m_risk | riskCategoryId, riskId (security-specific) |
| Parties Involved | t_incident_injured_persons, t_incident_witnesses, m_departments | departmentId, department names/codes |
| Case Status | t_incidents | status |
| SIFR Comparison | t_incidents, t_incident_injured_persons, t_man_hours | incidentDate, month, year, total (man-hours) |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/security-team/` – Security Team module
- `docs/dashboard-hazard-analytic.md` – Hazard Analytics dashboard (similar pattern)
- `docs/dashboard-incident-profile-analytic.md` – Incident Profile Analytics dashboard

---

## Appendix: Mock Data Analysis

Based on the current mock data implementation:

### Incident Summary (Aug 2024 - Jul 2025)
- Major Incident: 24 incidents (-24 from previous year)
- Moderate Incident: 1 incident (-1 from previous year)
- Minor Incident: 63 incidents (-60 from previous year)
- Total Incident: 88 incidents (-77 from previous year)

### Type Distribution (Top Categories)
1. Others: 34 incidents
2. Lost and Found: 15 incidents
3. Inappropriate behavior: 14 incidents
4. Access Without RFID: 11 incidents
5. External Dispute: 9 incidents

### Parties Distribution (Top Categories)
1. Students: 41 incidents
2. Staff: 28 incidents
3. Contractors: 10 incidents
4. External: 10 incidents
5. Household staff: 7 incidents

### Case Status
- Open: 1 case
- Closed: 99 cases
- Total: 100 cases

### SIFR Comparison
- 2023-2024: Total SIFR 1.37 (Major: 0.35, Moderate: 0.0, Minor: 1.02)
- 2024-2025: Total SIFR 2.14 (Major: 0.66, Moderate: 0.02, Minor: 1.68)

**Note:** These values indicate the expected data patterns and volumes for the real implementation.
