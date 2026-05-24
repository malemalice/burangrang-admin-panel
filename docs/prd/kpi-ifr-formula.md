# PRD: KPI IFR (Incident Frequency Rate) Formula

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-14

---

## Overview

This document defines the formula and data requirements for calculating **IFR Study Related Activities** and **IFR Work Related Activities** in the HSE Dashboard KPI module. IFR uses **general** incidents only (not security scope).

---

## HSE Terminology

| Term | Definition |
|------|------------|
| **IFR** | Incident Frequency Rate – number of recordable incidents per million man-hours |
| **TRIFR** | Total Recordable Incident Frequency Rate |
| **Study Related** | Activities involving students; incident `activities = STUDY`; man hours from STUDENT group |
| **Work Related** | Activities involving staff; incident `activities = WORK`; man hours from NON_STUDENT group |
| **Activity Type** | Incident field `activities`: WORK (work-related) or STUDY (study-related) |
| **Incident Type (Scope)** | Incident field `type`: GENERAL (HSE/safety) or SECURITY; **IFR uses GENERAL only** |

---

## Standard IFR Formula

```
IFR = (Number of Recordable Incidents × 1,000,000) ÷ Total Man Hours Worked
```

### Study vs Work Split

Incidents are classified by **activity type** (`activities`: WORK | STUDY). Only **general** incidents (`type = GENERAL`) are included; security incidents are excluded.

```
IFR study related = (Study-related recordable incidents × 1,000,000) ÷ Study-related man hours
                   where incidents: type = GENERAL, activities = STUDY

IFR work related  = (Work-related recordable incidents × 1,000,000) ÷ Work-related man hours
                   where incidents: type = GENERAL, activities = WORK
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
- **`activities`** (activity type): `WORK` (work-related) | `STUDY` (study-related) – aligns with man hour group for IFR split
- **`type`** (incident scope): `GENERAL` | `SECURITY` – **for IFR, count only incidents where `type = 'GENERAL'`**

Recordable incidents are typically accidents and dangerous occurrences that meet organizational recording criteria (e.g., medical treatment beyond first aid, lost time, fatality). For IFR calculation, only **general** incidents (`type = GENERAL`) are included; security incidents are excluded.

---

## Period Alignment

Fiscal year format: `YYYY-ZZZZ` (e.g., 2023-2024)

- **Start:** August of YYYY  
- **End:** July of ZZZZ  

Man hours and incidents must be filtered by the same fiscal period for consistent calculation.

---

## Implementation Formulas

All IFR calculations use **general** incidents only: filter `t_incidents` with **`type = 'GENERAL'`**. Use **`activities`** to split study-related vs work-related counts.

### IFR Study Related

```
IFR_study = (Count of recordable incidents WHERE type = 'GENERAL' AND activities = 'STUDY' AND incidentDate in period × 1,000,000)
            ÷
            SUM(t_man_hours.total) WHERE group = 'STUDENT' AND month, year in period
```

### IFR Work Related

```
IFR_work = (Count of recordable incidents WHERE type = 'GENERAL' AND activities = 'WORK' AND incidentDate in period × 1,000,000)
           ÷
           SUM(t_man_hours.total) WHERE group = 'NON_STUDENT' AND month, year in period
```

**Recordable** criteria: apply organizational rules (e.g. `incidentType` in ACCIDENT, DANGEROUS_OR_HAZARDOUS_OCCURRENCE; `incidentClassification` MAJOR/MINOR/FATALITY as per policy).

---

## Schema Summary

| Component | Available | Source |
|-----------|-----------|--------|
| Study man hours | ✅ Yes | `t_man_hours` where `group = 'STUDENT'` |
| Work man hours | ✅ Yes | `t_man_hours` where `group = 'NON_STUDENT'` |
| Recordable incidents | ✅ Yes | Filter by `incidentType`, `incidentClassification`, `incidentDate` |
| Activity type (study vs work) | ✅ Yes | `t_incidents.activities` = `STUDY` \| `WORK` |
| Incident type (general vs security) | ✅ Yes | `t_incidents.type` = `GENERAL` \| `SECURITY`; IFR uses `type = 'GENERAL'` only |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/kpi-frequency-rate/` – KPI Frequency Rate module
- `backend/src/modules/man-hours/` – Man Hours module
