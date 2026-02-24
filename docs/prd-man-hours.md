# PRD: Man Hours Tracking

## Overview

The Man Hours module records and reports workforce hours by month, year, and group (e.g. STUDENT, other ManHourGroupEnum values). It supports CRUD for man hour records and an aggregated report (by year range and optional group) used for KPI calculations (e.g. IFR). List endpoint supports an `options` bypass.

**Scope:** Backend `man-hours` module; frontend `man-hours` module.

## Key Features

- Create, list (paginated, filter by isActive, search, month, year, group; options bypass), read, update, delete man hour records.
- Get report: aggregated man hour data for a year range (startYear, endYear) and optional group (ManHourGroupEnum). Used for dashboards and KPI frequency rate (see prd-kpi-ifr-formula.md).

## User Roles & Permissions

- **man-hour:create** — create record.
- **man-hour:list** — list records (options bypass).
- **man-hour:read** — get one, get report.
- **man-hour:update** — update record.
- **man-hour:delete** — delete record.

## User Stories

- As a user, I can record man hours by month, year, and group so that workforce exposure is tracked for safety KPIs.
- As a user, I can list and filter man hour records and run a report for a year range so that I can analyze trends and feed KPI calculations.

## Key Workflows

1. **Data entry:** User creates man hour records (month, year, group, hours value, etc.) → list/filter by month, year, group for verification.
2. **Reporting:** User opens Man Hour Report → selects start year, end year, optional group → GET report returns aggregated data for charts/KPIs.

## Data Model Summary

- **ManHour (t_man_hours or equivalent):** id, month (MonthEnum), year, group (ManHourGroupEnum), hours/value fields, isActive, createdBy, etc. Used for list and report aggregation.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /man-hours | man-hour:create | Create |
| GET | /man-hours | man-hour:list | List (page, limit, sortBy, sortOrder, isActive, search, month, year, group; options bypass) |
| GET | /man-hours/report | man-hour:read | Report (startYear, endYear, group?) |
| GET | /man-hours/:id | man-hour:read | Get one |
| PATCH | /man-hours/:id | man-hour:update | Update |
| DELETE | /man-hours/:id | man-hour:delete | Delete |

## Frontend Pages & Components

- **ManHoursPage** — list with filters.
- **CreateManHourPage,** **EditManHourPage** — create/edit (ManHourForm).
- **ManHourReportPage** — report view (year range, group filter; displays aggregated data/charts).

Routes: /man-hours (list, new, :id/edit), /man-hours/report (or equivalent).

## Dependencies

- **Backend:** Prisma (ManHour model), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass. Report logic used by KPI/dashboard modules.
- **Frontend:** Auth, core API. KPI Frequency Rate module may consume report API.
