# PRD: Waste Management

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
