# PRD: Man Hours Tracking

## Overview

The Man Hours module records and reports workforce exposure by **named line** (`name`, e.g. class or cohort), **month**, **year**, and **group** (`STUDENT` or `NON_STUDENT`). Each record carries **quantity** (`qty`), **man hours per day** (`manHourPerDay`), and **derived** totals (`totalWorkingDays`, `lostHour`, `total`) with optional **notes**. Records are **soft-deleted** (not removed from the database). The module supports full CRUD (with list pagination and filters), a **read-only detail** view, and an **aggregated report** by year range and optional group for dashboards and KPIs (e.g. IFR; see prd-kpi-ifr-formula.md). The list endpoint supports an **`options`** bypass (JWT auth; permission check relaxed when used as documented in Swagger).

**Scope:** Backend [`backend/src/modules/man-hours/`](backend/src/modules/man-hours/); frontend [`frontend/src/modules/man-hours/`](frontend/src/modules/man-hours/).

## Key Features

- Create, list (paginated; filter by `isActive`, `search` on name and notes, `month`, `year`, `group`; `options` bypass on list), read one, update, and **soft** delete man hour records.
- **Derived totals on create/update:** `totalWorkingDays` = `qty × manHourPerDay × 22` (22 working days per month). If `lostHour` is provided, `total` = `totalWorkingDays − lostHour`. If `total` is provided (and lost hour not driving the pair), `lostHour` = `totalWorkingDays − total`. Otherwise `lostHour` = 0 and `total` = `totalWorkingDays`.
- **Get report:** aggregated data for `startYear`–`endYear`, optional `group`; only **active**, **non-deleted** rows. Response includes per-name rows, monthly keys, grand totals, and KPI-style rollups (`totalStudentHour`, `totalAccumulationStudentHour`).

## User Roles & Permissions

- **man-hour:create** — create record.
- **man-hour:list** — list records (`options` bypass on `GET /man-hours`).
- **man-hour:read** — get one, get report.
- **man-hour:update** — update record.
- **man-hour:delete** — soft-delete record.

## User Stories

- As a user, I can record man hours by name, month, year, group, qty, and man-hour per day so that workforce exposure is tracked for safety KPIs.
- As a user, I can list and filter man hour records, open a **detail** view for one record, and run a **report** for a year range (and optional group) so that I can verify data and feed KPI calculations.
- As a user, I can **export** the man hour report (e.g. spreadsheet) for offline analysis.

## Key Workflows

1. **Data entry:** User creates or edits records via `ManHourForm` → list with filters/tabs for verification; optional navigation to **view** (`/man-hours/:id`).
2. **Reporting:** User opens Man Hour Report → selects start year, end year, and group (or all groups) → API returns aggregated rows and totals; UI can **export** (XLSX) for the current report range/filter.

## Data Model Summary

- **ManHour** — Prisma model mapped to **`t_man_hours`** (`@@map("t_man_hours")`).
- **Fields:** `id`, `name`, `group` (`ManHourGroupEnum`: `STUDENT`, `NON_STUDENT`), `qty` (int), `manHourPerDay` (decimal), `month` (`MonthEnum`), `year` (int), `totalWorkingDays`, `lostHour`, `total` (decimals), `notes` (optional), `isActive`, soft-delete fields (`deletedAt`, `deletedBy`), `createdAt`, `updatedAt`, `createdBy` (relation to **creator** user).
- **Indexes:** `(month, year)`, `group`.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /man-hours | man-hour:create | Create (body: name, group, qty, manHourPerDay, month, year; optional lostHour, total, notes) |
| GET | /man-hours | man-hour:list | List; query: `page`, `limit`, `sortBy`, `sortOrder`, `isActive`, `search` (name + notes, case-insensitive), `month`, `year`, `group`, `options` |
| GET | /man-hours/report | man-hour:read | Report; query: `startYear`, `endYear`, `group` (optional) |
| GET | /man-hours/:id | man-hour:read | Get one (non-deleted) |
| PATCH | /man-hours/:id | man-hour:update | Update (partial; recalculates derived fields when qty/manHourPerDay/lostHour/total change) |
| DELETE | /man-hours/:id | man-hour:delete | **Soft delete** (sets deleted/inactive per shared soft-delete utility) |

**List response shape:** `{ data: ManHourDto[], meta: { total, page, limit } }`.

**GET /man-hours/report** is registered **before** `GET /man-hours/:id` so `report` is not captured as an id.

### Report response shape (`ManHourReportDto`)

- **rows:** One entry per distinct `name` after aggregation: `name`, `group`, `studyHour` (from first row’s `manHourPerDay`), `monthlyData` — map keyed by `${MonthEnum}_${year}` with aggregated `qty` and `total` per key, `yearlyTotal` (sum of `total` for that name).
- **grandTotals:** Map of same month-year keys to summed `total` across all rows.
- **totalStudentHour:** Sum of `yearlyTotal` for rows where `group === STUDENT`.
- **totalAccumulationStudentHour:** Sum of `yearlyTotal` across **all** rows (naming reflects current API; not only student).

## Frontend Pages & Components

| Page / component | Route | Notes |
|------------------|-------|--------|
| **ManHoursPage** | `/man-hours` | DataTable, filters (e.g. year, group), tabs, search; actions to view / edit / soft-delete (confirm). |
| **CreateManHourPage** | `/man-hours/new` | Uses **ManHourForm**. |
| **EditManHourPage** | `/man-hours/:id/edit` | Uses **ManHourForm**. |
| **ViewManHourPage** | `/man-hours/:id` | Read-only detail for a single record. |
| **ManHourReportPage** | `/man-hours/report` | Year range, group filter (including all groups), loads report API; **XLSX export** for the current view. |

**Route order (lazy routes):** `/man-hours` → `/man-hours/new` → `/man-hours/report` → `/man-hours/:id/edit` → `/man-hours/:id` (static segments before the `:id` detail route).

**Service:** [`manHourService`](frontend/src/modules/man-hours/services/manHourService.ts) — `getManHours`, `getManHour`, `createManHour`, `updateManHour`, `deleteManHour`, `getReport`.

**Types:** [`man-hour.types.ts`](frontend/src/modules/man-hours/types/man-hour.types.ts) — `ManHour`, DTOs, `ManHourReport` / `ManHourReportRow`, `ManHourGroup`, `Month`, label maps.

## Dependencies

- **Backend:** Prisma (`ManHour` → `t_man_hours`), `JwtAuthGuard` + `RolesGuard` + `PermissionsGuard`, `AllowOptionsBypass`, `ErrorHandlingService`, in-service DTO mapping to `ManHourDto`, soft-delete helpers (`isNotDeleted`, `buildSoftDeleteDataWithInactive`). Report consumption by KPI/dashboard modules as needed.
- **Frontend:** Auth, core API client, UI primitives (PageHeader, DataTable, etc.), **xlsx** for report export.
