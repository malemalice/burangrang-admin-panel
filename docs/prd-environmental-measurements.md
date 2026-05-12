# PRD: Environmental Measurements

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Environmental Measurements module records environmental readings (e.g. lighting, noise, humidity, temperature) per room and date. It supports CRUD and list with filters (room, date range, isActive, search). List endpoint supports an `options` bypass.

**Scope:** Backend `environmental-measurements` module; frontend `environmental-measurements` module.

## Key Features

- Create, list (paginated, filter by isActive, search, roomId, startDate, endDate; options bypass), read, update, delete environmental measurement records.
- Each record typically has room, date, and measurement fields (e.g. lighting, noise, humidity, temperature, remarks).

## User Roles & Permissions

- **environmental-measurement:create** — create record.
- **environmental-measurement:list** — list records (options bypass).
- **environmental-measurement:read** — get one.
- **environmental-measurement:update** — update record.
- **environmental-measurement:delete** — delete record.

## User Stories

- As a user, I can record environmental measurements (room, date, lighting, noise, humidity, temperature, remarks) so that workplace conditions are monitored.
- As a user, I can list and filter measurements by room and date range so that I can review trends.

## Key Workflows

1. **Data entry:** User creates measurement (room, date, values, remarks) → list/filter by room and date range.
2. **Edit/delete:** User updates or deletes existing records as needed.

## Data Model Summary

- **EnvironmentalMeasurement (t_environmental_measurements or equivalent):** id, roomId, lighting?, noise?, humidity?, temperature?, remarks?, date, isActive, createdBy, etc. Relation: Room (from master data).

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /environmental-measurements | environmental-measurement:create | Create |
| GET | /environmental-measurements | environmental-measurement:list | List (page, limit, sortBy, sortOrder, isActive, search, roomId, startDate, endDate; options bypass) |
| GET | /environmental-measurements/:id | environmental-measurement:read | Get one |
| PATCH | /environmental-measurements/:id | environmental-measurement:update | Update |
| DELETE | /environmental-measurements/:id | environmental-measurement:delete | Delete |

## Frontend Pages & Components

- **EnvironmentalMeasurementsPage** — list with filters.
- **CreateEnvironmentalMeasurementPage,** **EditEnvironmentalMeasurementPage** — create/edit (EnvironmentalMeasurementForm).

Routes: /environmental-measurements (list, create, edit).

## Dependencies

- **Backend:** Prisma (EnvironmentalMeasurement, Room), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data for rooms (options), core API.

## Functional Requirements

- [FR-1] The system must support creating environmental measurement records with room, date, and measurement fields (lighting, noise, humidity, temperature, remarks).
- [FR-2] The system must support listing measurements with pagination and filters: `isActive`, search, `roomId`, `startDate`, and `endDate`.
- [FR-3] The list endpoint must support `options=true` bypass for dropdown use (JWT required).
- [FR-4] The system must support reading, updating, and deleting individual measurement records.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] All write operations must require a valid JWT and the corresponding `environmental-measurement:*` permission.
- [NFR-3] Permission checks must be enforced via `PermissionsGuard` on all endpoints.
- [NFR-4] API responses must return within 2 seconds under normal load.
- [NFR-5] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User creates a measurement with room, date, and all four measurement fields | 201; record created; accessible via GET by ID |
| AC-2 | User lists measurements filtered by `roomId` and a date range | 200; only records for that room within the date range returned |
| AC-3 | User updates a measurement's temperature value | 200; updated value reflected in subsequent GET |
| AC-4 | User deletes a measurement | 200; record no longer returned in list |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`prd-master-data.md`](prd-master-data.md) — rooms master data referenced by this module
