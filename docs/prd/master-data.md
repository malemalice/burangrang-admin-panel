# PRD: Master Data Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Master Data Management module provides CRUD and list capabilities for organizational and risk-reference data used across the HSE Dashboard: offices (with hierarchy), departments, job positions, areas, rooms, risk categories, risks, and risk mitigations. All list endpoints support an `options` query bypass for use in dropdowns/selects. Approvals master data is covered in PRD Approvals.

**Scope:** Backend `offices`, `departments`, `job-positions`, `areas`, `rooms`, `risk-categories`, `risks`, `risk-mitigations` modules; frontend `master-data` module (pages under `/master/*` for these entities only).

## Key Features

- **Offices:** CRUD; list with pagination, search, isActive, parent; hierarchy endpoint. Parent/child structure for multi-site org.
- **Departments:** CRUD; list with pagination, search, isActive; get by code. Referenced by users, risk assessments, certificates, etc.
- **Job positions:** CRUD; list with pagination, search, isActive. Level and code for hierarchy/display.
- **Areas:** CRUD; list with pagination, search, isActive, officeId. Linked to offices; used by work permits, rooms, inspections, incidents.
- **Rooms:** CRUD; list with pagination, search, isActive, areaId. Belong to area; used by environmental measurements, incidents.
- **Risk categories:** CRUD; list with pagination, search, isActive. Group risks; used in risk assessments, inspections, incidents.
- **Risks:** CRUD; list with pagination, search, isActive, riskCategoryId. Linked to risk category and risk mitigations; used in risk assessments, work permits, inspections.
- **Risk mitigations:** CRUD; list with pagination, isActive, riskId. Per-risk master (eliminate, transfer, reduce, accept text); linked to Risk.

## User Roles & Permissions

Each entity has its own permission set: `office:*`, `department:*`, `job-position:*`, `area:*`, `room:*`, `risk-category:*`, `risk:*`, `risk-mitigation:*` (create, list, read, update, delete). List endpoints use `AllowOptionsBypass()` so that when `options=true` only JWT is required (for dropdowns).

## User Stories

- As an admin, I can manage offices and their hierarchy so that the organization structure is reflected.
- As an admin, I can manage departments and job positions so that users and approvals can be assigned correctly.
- As an admin, I can manage areas and rooms so that work permits, inspections, and environmental data can be scoped.
- As an admin, I can manage risk categories and risks so that risk assessments and inspections use consistent reference data.
- As an admin, I can manage risk mitigations per risk so that standard controls are available when assessing or inspecting.

## Key Workflows

1. **Office hierarchy:** Create/edit offices with optional parent → list or GET hierarchy for tree display/selects.
2. **Department/Job position:** Create with code and metadata → use in user forms and approval configs (options list).
3. **Area/Room:** Create area (optional office); create room with area → use in work permits, inspections, environmental measurements (options list).
4. **Risk category → Risk → Risk mitigation:** Create category → create risks under category → create risk mitigations for each risk. Risk and category used in risk assessment items and inspection items (options list).

## Data Model Summary

- **Office (m_offices):** id, name, code, description, address, phone, email, parentId, isActive. Self-relation parent/children; has Users, Areas.
- **Department (m_departments):** id, name, code, description, emails (Json), isActive. Referenced by User, RiskAssessment, Certificate, InspectionItem, Incident, etc.
- **JobPosition (m_job_positions):** id, name, code, level, description, isActive. Referenced by User, Approval.
- **Area (m_areas):** id, name, code, description, officeId, isActive. Has Rooms, WorkPermits, InspectionItems, Incidents.
- **Room (m_rooms):** id, name, code, description, areaId (unique), isActive. Has EnvironmentalMeasurements, Incident (optional).
- **RiskCategory (m_risk_categories):** id, name, code, description, isActive. Has Risks, RiskAssessmentItems, InspectionItems, Incidents.
- **Risk (m_risk):** id, name, code, description, riskCategoryId, isActive. Has RiskMitigation(s), RiskAssessmentItems, WorkPermitHazards, InspectionItems.
- **RiskMitigation (m_risk_mitigations):** id, eliminate, transfer, reduce, accept (text), riskId, isActive.

## API Endpoints Summary

| Entity           | Method | Path                    | Permission           | Description |
|------------------|--------|-------------------------|----------------------|-------------|
| offices          | POST   | /offices                | office:create        | Create |
| offices          | GET    | /offices                | office:list          | List (options bypass) |
| offices          | GET    | /offices/hierarchy      | office:list          | Hierarchy tree |
| offices          | GET    | /offices/:id            | office:read          | Get one |
| offices          | PATCH  | /offices/:id            | office:update        | Update |
| offices          | DELETE | /offices/:id            | office:delete        | Delete |
| departments      | POST   | /departments            | department:create    | Create |
| departments      | GET    | /departments            | department:list      | List (options bypass) |
| departments      | GET    | /departments/code/:code | department:read     | Get by code |
| departments      | GET    | /departments/:id        | department:read     | Get one |
| departments      | PATCH  | /departments/:id        | department:update   | Update |
| departments      | DELETE | /departments/:id        | department:delete   | Delete |
| job-positions    | POST   | /job-positions         | job-position:create  | Create |
| job-positions    | GET    | /job-positions         | job-position:list    | List (options bypass) |
| job-positions    | GET    | /job-positions/:id    | job-position:read    | Get one |
| job-positions    | PATCH  | /job-positions/:id     | job-position:update  | Update |
| job-positions    | DELETE | /job-positions/:id     | job-position:delete  | Delete |
| areas            | POST   | /areas                  | area:create          | Create |
| areas            | GET    | /areas                  | area:list            | List (options bypass) |
| areas            | GET    | /areas/:id              | area:read            | Get one |
| areas            | PATCH  | /areas/:id              | area:update          | Update |
| areas            | DELETE | /areas/:id              | area:delete          | Delete |
| rooms            | POST   | /rooms                  | room:create          | Create |
| rooms            | GET    | /rooms                  | room:list            | List (options bypass) |
| rooms            | GET    | /rooms/:id              | room:read            | Get one |
| rooms            | PATCH  | /rooms/:id              | room:update          | Update |
| rooms            | DELETE | /rooms/:id              | room:delete          | Delete |
| risk-categories  | POST   | /risk-categories       | risk-category:create  | Create |
| risk-categories  | GET    | /risk-categories       | risk-category:list    | List (options bypass) |
| risk-categories  | GET    | /risk-categories/:id   | risk-category:read   | Get one |
| risk-categories  | PATCH  | /risk-categories/:id    | risk-category:update | Update |
| risk-categories  | DELETE | /risk-categories/:id   | risk-category:delete | Delete |
| risks            | POST   | /risks                  | risk:create          | Create |
| risks            | GET    | /risks                  | risk:list            | List (options bypass) |
| risks            | GET    | /risks/:id              | risk:read            | Get one |
| risks            | PATCH  | /risks/:id              | risk:update          | Update |
| risks            | DELETE | /risks/:id              | risk:delete          | Delete |
| risk-mitigations | POST   | /risk-mitigations       | risk-mitigation:create | Create |
| risk-mitigations | GET   | /risk-mitigations      | risk-mitigation:list   | List (options bypass) |
| risk-mitigations | GET   | /risk-mitigations/:id  | risk-mitigation:read   | Get one |
| risk-mitigations | PATCH | /risk-mitigations/:id  | risk-mitigation:update | Update |
| risk-mitigations | DELETE | /risk-mitigations/:id  | risk-mitigation:delete | Delete |

## Frontend Pages & Components

- **Offices:** OfficesPage, CreateOfficePage, EditOfficePage, OfficeDetailPage (paths: /master/offices, .../new, .../:id, .../:id/edit).
- **Departments:** DepartmentsPage, CreateDepartmentPage, DepartmentDetailPage, EditDepartmentPage.
- **Job positions:** JobPositionsPage, CreateJobPositionPage, EditJobPositionPage (no separate detail; edit at :id).
- **Risk categories:** RiskCategoriesPage, CreateRiskCategoryPage, RiskCategoryDetailPage, EditRiskCategoryPage.
- **Risks:** RisksPage, CreateRiskPage, RiskDetailPage, EditRiskPage.
- **Risk mitigations:** RiskMitigationsPage, CreateRiskMitigationPage, EditRiskMitigationPage, ViewRiskMitigationPage.
- **Areas:** AreasPage, CreateAreaPage, EditAreaPage (paths: .../areas/create, .../areas/:id/edit).
- **Rooms:** RoomsPage, CreateRoomPage, EditRoomPage.

All under `frontend/src/modules/master-data`; routes in `masterDataRoutes.ts`. Approvals under /master/approvals are documented in PRD Approvals.

## Dependencies

- **Backend:** Prisma (all master tables), JwtAuthGuard, RolesGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, core API; other modules (users, risk-assessment, work-permits, inspections, etc.) consume these entities via options/list APIs.

## Functional Requirements

- [FR-1] The system must support full CRUD for offices, departments, job positions, areas, rooms, risk categories, risks, and risk mitigations.
- [FR-2] All list endpoints must support pagination, search, and `isActive` filter; applicable endpoints must support additional entity-specific filters (e.g. `parentId` for offices, `officeId` for areas, `areaId` for rooms, `riskCategoryId` for risks, `riskId` for risk mitigations).
- [FR-3] All list endpoints must support `options=true` bypass so that form dropdowns can load options without requiring the full list permission (JWT still required).
- [FR-4] The office endpoint must expose a hierarchy endpoint (`GET /offices/hierarchy`) for building a tree view of parent/child offices.
- [FR-5] The department endpoint must support a get-by-code route (`GET /departments/code/:code`).
- [FR-6] Each entity must enforce active/inactive state (`isActive`) so that inactive master data is excluded from options and lookups by default.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Inactive records must be excluded from `options=true` responses.
- [NFR-3] All write operations must require a valid JWT and the corresponding entity permission (e.g. `office:create`).
- [NFR-4] Permission checks must be enforced via `PermissionsGuard` on all non-public endpoints.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.
- [NFR-7] Master data changes must not cascade-delete dependent transactional records; referential integrity must be handled gracefully.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Admin creates a department with a unique code | 201; department accessible via GET by ID and GET by code |
| AC-2 | Admin calls `GET /offices/hierarchy` | 200; returns tree structure of offices with nested children |
| AC-3 | Form calls `GET /risks?options=true` with user who lacks `risk:list` | 200; risk options returned (JWT required) |
| AC-4 | Admin sets an area `isActive: false` | Area excluded from `GET /areas?options=true` results |
| AC-5 | Admin creates a risk mitigation linked to a risk | 201; mitigation linked to correct risk; `GET /risk-mitigations?riskId=<id>` returns it |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
