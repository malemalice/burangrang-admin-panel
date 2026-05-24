# PRD: Waste Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Waste Management module is a multi-entity subsystem covering treatment plants, water quality parameters, waste types, waste sources, storage locations, monthly flow reports, water quality lab reports, weight reports, and dispatch orders. Each sub-entity has its own backend controller and service and frontend pages (list, create, edit, detail where applicable). List endpoints typically support pagination, filters, and an `options` bypass for dropdown use.

**Scope:** Backend `waste-management` module (10 controllers, 9+ services); frontend `waste-management` module (9 sub-areas with routes under /waste-management/*).

## Key Features

- **Treatment plants:** CRUD; list with pagination and filters. Master/operational data for waste treatment facilities.
- **Water quality parameters:** CRUD; list. Reference data for lab reports and monitoring.
- **Waste types:** CRUD; list (e.g. DOMESTIC, HAZARDOUS, FOOD, GREEN). Classification of waste.
- **Waste sources:** CRUD; list. Sources that generate waste.
- **Storage locations:** CRUD; list. Where waste is stored (linked to area).
- **Monthly flow reports:** CRUD; list. Periodic flow reporting.
- **Water quality lab reports:** CRUD; list. Lab results linked to parameters.
- **Weight reports:** CRUD; list. Weight-based reporting.
- **Dispatch orders:** CRUD; list. Orders for waste dispatch.

## User Roles & Permissions

Permissions follow pattern per entity (e.g. treatment-plant:create/list/read/update/delete, waste-type:*, etc.). List endpoints use AllowOptionsBypass where implemented.

## User Stories

- As a user, I can manage treatment plants, waste types, waste sources, and storage locations so that waste operations are configured.
- As a user, I can manage water quality parameters and record lab reports and weight reports so that environmental compliance is tracked.
- As a user, I can create and manage monthly flow reports and dispatch orders so that waste flow and dispatch are documented.

## Key Workflows

1. **Master/reference setup:** Create treatment plants, waste types, waste sources, storage locations, water quality parameters → use in transactional forms (options list).
2. **Reporting:** Create monthly flow reports, water quality lab reports, weight reports; create and track dispatch orders. List and filter by date, type, location, etc.

## Data Model Summary

- **TreatmentPlant:** linked to Office in schema. Other entities: WasteType (enum or table), WasteSource, StorageLocation (area), MonthlyFlowReport, WaterQualityLabReport, WaterQualityParameter, WeightReport, DispatchOrder. Relationships and enums (e.g. WasteTypeEnum, ReportStatusEnum, MonthEnum) defined in Prisma.

## API Endpoints Summary

Each sub-domain has standard REST endpoints under its path (e.g. /waste-management/treatment-plants, /waste-management/waste-types, ...): POST (create), GET (list with query params), GET :id (read), PATCH :id (update), DELETE :id (delete). Exact paths and permission names follow backend route configuration.

## Frontend Pages & Components

- **Treatment plants:** TreatmentPlantsPage, CreateTreatmentPlantPage, EditTreatmentPlantPage, TreatmentPlantDetailPage.
- **Water quality parameters:** WaterQualityParametersPage, CreateWaterQualityParameterPage, WaterQualityParameterDetailPage, EditWaterQualityParameterPage.
- **Waste types:** WasteTypesPage, CreateWasteTypePage, EditWasteTypePage, WasteTypeDetailPage.
- **Waste sources:** WasteSourcesPage, CreateWasteSourcePage, EditWasteSourcePage, WasteSourceDetailPage.
- **Storage locations:** StorageLocationsPage, CreateStorageLocationPage, StorageLocationDetailPage, EditStorageLocationPage.
- **Monthly flow reports:** MonthlyFlowReportsPage, CreateMonthlyFlowReportPage, EditMonthlyFlowReportPage.
- **Water quality lab reports:** WaterQualityLabReportsPage, CreateWaterQualityLabReportPage, EditWaterQualityLabReportPage.
- **Weight reports:** WeightReportsPage, CreateWeightReportPage, EditWeightReportPage.
- **Dispatch orders:** DispatchOrdersPage, CreateDispatchOrderPage, EditDispatchOrderPage, DispatchOrderDetailPage.

Routes: all under /waste-management/* (e.g. /waste-management/treatment-plants, .../create, .../:id, .../:id/edit).

## Dependencies

- **Backend:** Prisma (all waste-management tables), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass. Office/Area for treatment plants and storage locations.
- **Frontend:** Auth, master-data where referenced (e.g. areas), core API, wasteManagementService and entity-specific services.

## Functional Requirements

- [FR-1] The system must support full CRUD for all nine sub-entities: treatment plants, water quality parameters, waste types, waste sources, storage locations, monthly flow reports, water quality lab reports, weight reports, and dispatch orders.
- [FR-2] All list endpoints must support pagination, and applicable endpoints must support relevant filters (e.g. date range, type, location, status).
- [FR-3] List endpoints that serve form dropdown data must support `options=true` bypass (JWT required; permission check relaxed).
- [FR-4] Treatment plants must be linkable to an Office. Storage locations must be linkable to an Area.
- [FR-5] Water quality lab report records must be linkable to water quality parameters.
- [FR-6] Dispatch orders must record waste dispatch details and be trackable by status.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Soft-deleted or inactive records must be excluded from list and options responses where soft-delete is implemented.
- [NFR-3] All write operations must require a valid JWT and the corresponding `<entity>:create/update/delete` permission.
- [NFR-4] Permission checks must be enforced via `PermissionsGuard` on all non-public endpoints.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User with `treatment-plant:create` creates a treatment plant linked to an office | 201; record created; accessible via GET and list |
| AC-2 | User lists monthly flow reports with a date-range filter | 200; only reports in range returned; pagination present |
| AC-3 | User with `waste-type:list` calls list with `options=true` | 200; options returned without full permission check |
| AC-4 | User creates a water quality lab report linked to a parameter | 201; report linked to correct parameter; visible in list |
| AC-5 | User soft-deletes a dispatch order (if soft-delete supported) | Record excluded from list; still resolvable by ID for history |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`master-data.md`](master-data.md) — master data entities (areas, offices) referenced by this module
