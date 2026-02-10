# PRD: KPI IFR (Incident Frequency Rate) Formula

**Document Version:** 1.0  
**Last Updated:** February 7, 2025  
**Related Modules:** KPI Frequency Rate, Man Hours, Incidents

---

## Overview

This document defines the formula and data requirements for calculating **IFR Study Related Activities** and **IFR Work Related Activities** in the HSE Dashboard KPI module.

---

## HSE Terminology

| Term | Definition |
|------|------------|
| **IFR** | Incident Frequency Rate – number of recordable incidents per million man-hours |
| **TRIFR** | Total Recordable Incident Frequency Rate |
| **Study Related** | Activities involving students (STUDENT group in Man Hour) |
| **Work Related** | Activities involving staff (NON_STUDENT group in Man Hour) |

---

## Standard IFR Formula

```
IFR = (Number of Recordable Incidents × 1,000,000) ÷ Total Man Hours Worked
```

### Study vs Work Split

```
IFR study related = (Study-related recordable incidents × 1,000,000) ÷ Study-related man hours

IFR work related  = (Work-related recordable incidents × 1,000,000) ÷ Work-related man hours
```

---

## Data Sources (Schema Reference)

### 1. Man Hours (Denominator)

**Table:** `t_man_hours`  
**Group field:** `ManHourGroupEnum` (STUDENT | NON_STUDENT)

| Metric | Query / Logic |
|--------|---------------|
| **Study man hours** | `SUM(t_man_hours.total)` WHERE `group = 'STUDENT'` AND (month, year) in period |
| **Work man hours** | `SUM(t_man_hours.total)` WHERE `group = 'NON_STUDENT'` AND (month, year) in period |

**Man hour calculation** (from `man-hours.service.ts`):
```
total = qty × manHourPerDay × 22  (22 working days per month)
```

### 2. Recordable Incidents (Numerator)

**Table:** `t_incidents`  
**Relevant fields:**
- `incidentType`: NEAR_MISS | ACCIDENT | DANGEROUS_OR_HAZARDOUS_OCCURRENCE
- `incidentClassification`: MAJOR | MINOR | FATALITY
- `incidentDate`: for period filtering

Recordable incidents are typically accidents and dangerous occurrences that meet organizational recording criteria (e.g., medical treatment beyond first aid, lost time, fatality).

---

## Period Alignment

Fiscal year format: `YYYY-ZZZZ` (e.g., 2023-2024)

- **Start:** August of YYYY  
- **End:** July of ZZZZ  

Man hours and incidents must be filtered by the same fiscal period for consistent calculation.

---

## Gap: Incident Classification (Study vs Work)

**Current state:** The `Incident` model does not have a field to classify incidents as study-related or work-related.

**Possible approaches:**

| Approach | Description |
|----------|-------------|
| **A. Add field on Incident** | Add `activityGroup` (STUDY_RELATED \| WORK_RELATED) or similar to `t_incidents`, set during incident creation/approval |
| **B. Use injured person's department** | Add `activityGroup` to `m_departments`, derive from `IncidentInjuredPerson.departmentId` |
| **C. Use requester's department** | Add `activityGroup` to `m_departments`, derive from `User.departmentId` (requester/reporter) |

**Recommendation:** Add `activityGroup` (or equivalent) to `t_incidents` for explicit classification during incident workflow.

---

## Implementation Formulas

### IFR Study Related

```
IFR_study = (Count of recordable incidents with activityGroup = STUDY_RELATED in period × 1,000,000)
            ÷
            SUM(t_man_hours.total) WHERE group = 'STUDENT' AND month, year in period
```

### IFR Work Related

```
IFR_work = (Count of recordable incidents with activityGroup = WORK_RELATED in period × 1,000,000)
           ÷
           SUM(t_man_hours.total) WHERE group = 'NON_STUDENT' AND month, year in period
```

---

## Schema Summary

| Component | Available | Source |
|-----------|-----------|--------|
| Study man hours | ✅ Yes | `t_man_hours` where `group = 'STUDENT'` |
| Work man hours | ✅ Yes | `t_man_hours` where `group = 'NON_STUDENT'` |
| Recordable incidents | ⚠️ Partial | Filter by `incidentType`, `incidentClassification`, `incidentDate` |
| Study vs work classification | ❌ No | Requires `activityGroup` on Incident or equivalent mapping |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/kpi-frequency-rate/` – KPI Frequency Rate module
- `backend/src/modules/man-hours/` – Man Hours module
