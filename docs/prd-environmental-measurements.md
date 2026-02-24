# PRD: Environmental Measurements

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
