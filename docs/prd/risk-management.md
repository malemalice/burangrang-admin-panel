# PRD: Risk Management Suite

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Risk Management suite covers three related capabilities: (1) **Risk Assessment** — department-scoped assessments with items (risk, risk category, likelihood/consequence, pre/post ratings, images), approval workflow, Zoho ticket sync, and automated reminders for scheduled assessments; (2) **Risk Matrix** — master configuration of likelihood × consequence and calculation of risk rating (interpretation); (3) **Risk Register** — read-only aggregated view of risk mitigation records from risk assessment items and inspection items, with filters and source context. List endpoints support an `options` bypass where applicable.

**Scope:** Backend `risk-assessment`, `risk-matrix`, `risk-register` modules; frontend `risk-assessment`, `risk-matrix`, `risk-register` modules.

## Key Features

- **Risk Assessment:** Create, list (paginated, filter by department, status, isActive, search), read, update, delete. Assessments have department, assessment date, creator, assignee, status (`SCHEDULED|DRAFT|OPEN|WAITING_APPROVAL|DONE|REJECTED|CLOSE`), action plan. Assessment creation accepts inline `items[]` array for bulk item creation. Items: risk, risk category, likelihood/consequence levels, risk matrix rating, interpretation, post-mitigation levels and rating. Each item may have a `RiskMitigationRecord` (eliminate/substitute/engineer/admin/PPE/transfer/accept/legalAspect controls). Approval workflow: submit for approval, approve/reject with notes, approval timeline card. Reminders auto-created daily for SCHEDULED assessments until assessment date. Zoho ticket sync on create and status change. PDF export client-side via `react-to-pdf`.
- **Risk Assessment Items:** Create, list (per assessment, paginated), read, update, delete. Each item links to Risk and RiskCategory; stores pre- and post-mitigation matrix data; can have RiskControl and RiskMitigationRecord (polymorphic).
- **Risk Matrix:** Calculate rating from likelihood + consequence (POST calculate); CRUD risk matrix entries (likelihood level/name/desc, consequence level/name/desc, interpretation). List supports options bypass. Frontend has three views: read-only grid display (`RiskMatrixViewPage`), paginated list (`RiskMatricesPage`), and bulk editor for add/update/delete entries (`RiskMatrixManagementPage`).
- **Risk Register:** List aggregated risk mitigation records (paginated, filter by entityType RISK_ASSESSMENT_ITEM|INSPECTION_ITEM, departmentId, riskId, riskCategoryId, status, isActive, search, createdAtFrom, createdAtTo); get one record with source context. Read-only; data comes from RiskMitigationRecord linked to assessment or inspection items. Status display unified to three labels: Open, Close, Waiting Verification. Source badge distinguishes record origin.

## User Roles & Permissions

- **risk-assessment:create** — create assessment, create item.
- **risk-assessment:list** — list assessments (options bypass).
- **risk-assessment:read** — get assessment, get items.
- **risk-assessment:update** — update assessment, update item.
- **risk-assessment:delete** — delete assessment, delete item.
- **risk-matrix:read** — calculate risk rating, get one matrix entry.
- **risk-matrix:create** — create matrix entry.
- **risk-matrix:list** — list matrix entries (options bypass).
- **risk-matrix:update** — update matrix entry.
- **risk-matrix:delete** — delete matrix entry.
- **risk-register:list** — list register (options bypass).
- **risk-register:read** — get one register record.

## User Stories

- As a user, I can create a risk assessment for a department with items (risk, category, likelihood, consequence, rating) and optional post-mitigation data and images so that risks are documented and tracked.
- As a user, I can calculate risk rating from likelihood and consequence using the risk matrix so that assessments use consistent ratings.
- As an admin, I can maintain risk matrix entries (likelihood/consequence combinations and interpretation) so that calculation is configurable.
- As a user, I can view the risk register (aggregated mitigations from assessments and inspections) and filter by source, department, risk so that I have a single view of risk controls.

## Key Workflows

1. **Risk assessment lifecycle:** Create assessment (department, date, assignee, status) → add items (risk, risk category, likelihood, consequence; rating from matrix or manual) → optionally add post-mitigation levels and images → update/delete as needed. Items may create RiskMitigationRecord/ RiskControl (entity=RISK_ASSESSMENT_ITEM).
2. **Risk matrix configuration:** Admin creates/edits risk matrix entries (likelihood level/name/desc, consequence level/name/desc, interpretation). Users call POST /risk-matrix/calculate with likelihood and consequence to get rating when building assessment items.
3. **Risk register view:** User opens Risk Register → list from GET /risk-register with filters (entityType, departmentId, riskId, riskCategoryId, status, isActive, search) → open record to see mitigation detail and source (assessment item or inspection item).

## Data Model Summary

- **RiskAssessment (t_risk_assessment):** id, code, description, departmentId, assessmentDate, createdBy, status (`SCHEDULED|DRAFT|OPEN|WAITING_APPROVAL|DONE|REJECTED|CLOSE`), isActive, assigneeId?, actionPlan, deletedAt, deletedBy. Relations: department, creator, assignee, items (RiskAssessmentItem[]), zohoTicketMapping.
- **RiskAssessmentItem (t_risk_assessment_item):** id, riskAssessmentId, mRiskId, mRiskCategoryId, likelihoodLevel, consequenceLevel, riskMatrixRating, interpretation, postLikelihoodLevel, postConsequenceLevel, postRiskMatrixRating, postInterpretation, deletedAt, deletedBy. Relations: riskAssessment, mRisk, mRiskCategory. Linked to RiskMitigationRecord (entity=RISK_ASSESSMENT_ITEM). Note: no image sub-model on items in current implementation.
- **RiskMatrix (m_risk_matrix):** id, likelihoodLevel, likelihoodName, likelihoodDesc, consequenceLevel, consequenceName, consequenceDesc, interpretation (RiskRatingEnum), isActive.
- **RiskMitigationRecord (t_risk_mitigation):** id, code (RSK-prefixed, auto-generated), eliminationControl, substitutionControl, engineeringControl, administrationControl, personalProtectiveEquipment, transfer, accept, legalAspect, isActive, entity (RISK_ASSESSMENT_ITEM|INSPECTION_ITEM), entityId, deletedAt, deletedBy. Used by risk register to aggregate with source context (assessment/inspection item, department, risk, etc.).
- **RiskControl (t_risk_control):** id, eliminationControl, substitutionControl, engineeringControl, administrationControl, personalProtectiveEquipment, transfer, isOpen, isAccept, isActive, entity, entityId. Model exists in schema; no API endpoints exposed.

## API Endpoints Summary

### Risk Assessment (prefix /risk-assessment)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /risk-assessment | risk-assessment:create | Create assessment |
| GET | /risk-assessment | risk-assessment:list | List (page, limit, sortBy, sortOrder, isActive, departmentId, status, search; options bypass) |
| GET | /risk-assessment/:id | risk-assessment:read | Get one |
| PATCH | /risk-assessment/:id | risk-assessment:update | Update |
| DELETE | /risk-assessment/:id | risk-assessment:delete | Delete |
| POST | /risk-assessment/:id/items | risk-assessment:create | Create item |
| GET | /risk-assessment/:id/items | risk-assessment:read | List items (page, limit, sortBy, sortOrder, search) |
| GET | /risk-assessment/:id/items/:itemId | risk-assessment:read | Get item |
| PATCH | /risk-assessment/:id/items/:itemId | risk-assessment:update | Update item |
| DELETE | /risk-assessment/:id/items/:itemId | risk-assessment:delete | Delete item |

### Risk Matrix (prefix /risk-matrix)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /risk-matrix/calculate | risk-matrix:read | Calculate rating (body: likelihoodLevel, consequenceLevel) |
| POST | /risk-matrix/risk-matrices | risk-matrix:create | Create matrix entry |
| GET | /risk-matrix/risk-matrices | risk-matrix:list | List (page, limit, sortBy, sortOrder, isActive, search; options bypass) |
| GET | /risk-matrix/risk-matrices/:id | risk-matrix:read | Get one |
| PATCH | /risk-matrix/risk-matrices/:id | risk-matrix:update | Update |
| DELETE | /risk-matrix/risk-matrices/:id | risk-matrix:delete | Delete |

### Risk Register (prefix /risk-register)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /risk-register | risk-register:list | List (page, limit, sortBy, sortOrder, entityType, departmentId, riskId, riskCategoryId, status, isActive, search, createdAtFrom, createdAtTo; options bypass) |
| GET | /risk-register/:id | risk-register:read | Get one with source context |

## Frontend Pages & Components

- **Risk Assessment:** RiskAssessmentsPage (list), CreateRiskAssessmentPage, EditRiskAssessmentPage, RiskAssessmentDetailPage. Components: RiskAssessmentForm, RiskAssessmentItemForm, RiskAssessmentItemsTable, AssessmentDetailsCard, ApprovalDialog, ApprovalTimelineCard, RiskAssessmentPDFTemplate, ViewItemDialog, RiskMatrixReferenceDialog. Utils: riskBadgeHelpers. Hooks: useRiskAssessmentDetail, useRiskAssessment. Services: riskAssessmentService (CRUD + risk control ops), riskMitigationService (fetches m_risk_mitigations by riskId).
- **Risk Matrix:** RiskMatrixViewPage (read-only grid), RiskMatricesPage (list), RiskMatrixManagementPage (bulk editor), CreateRiskMatrixPage, EditRiskMatrixPage, RiskMatrixForm. Hooks: useRiskMatrices, useRiskMatrix. Service: riskMatrixService.
- **Risk Register:** RiskRegisterPage (list + filters), ViewRiskRegisterPage (detail). Components: RiskRegisterTable, RiskRegisterSourceBadge. Hooks: useRiskRegister, useRiskRegisterDetail. Service: riskRegisterService (read-only). Utils: riskRegisterStatus (maps statuses → Open / Close / Waiting Verification).

Routes: /risk-assessment (list, new, :id, :id/edit), /risk-matrix (view grid), /risk-matrix/list (list), /risk-matrix/edit (bulk management), /risk-matrix/new, /risk-matrix/:id/edit, /risk-register (list, :id view).

## Dependencies

- **Backend:** Prisma (RiskAssessment, RiskAssessmentItem, RiskMatrix, RiskMitigationRecord, RiskControl, Department, User, Risk, RiskCategory, RiskMitigation). Approvals integrated into risk assessment (approvals module). Reminders module used for SCHEDULED assessment daily reminders. Zoho integration for ticket creation and status sync. Risk register service joins RiskMitigationRecord with assessment/inspection item and related entities.
- **Frontend:** Auth, master-data (departments, risk categories, risks, risk mitigations), risk-matrix service for calculate, approvals service (approval workflow), core API. PDF export via `react-to-pdf` / `generateTableAwarePdf` utility.

## Functional Requirements

- [FR-1] The system must support full CRUD for risk assessments, including inline creation of multiple items in a single request.
- [FR-2] Risk assessment status must follow the lifecycle: `SCHEDULED → DRAFT → OPEN → WAITING_APPROVAL → DONE → CLOSE`, with `REJECTED` as a terminal branch off `WAITING_APPROVAL`.
- [FR-3] The system must support an approval workflow for risk assessments (submit, approve with notes, reject with reason) using the master approval configuration.
- [FR-4] The system must automatically create daily reminders for assessments in `SCHEDULED` status until the assessment date.
- [FR-5] The system must sync risk assessments with Zoho (ticket creation on create; status update on status change).
- [FR-6] Each risk assessment item must store pre-mitigation and post-mitigation likelihood/consequence levels and their risk matrix ratings.
- [FR-7] The risk matrix must accept likelihood and consequence levels and return the interpretation rating via `POST /risk-matrix/calculate`.
- [FR-8] Admins must be able to create, update, and delete risk matrix entries; the matrix drives rating lookups for all modules.
- [FR-9] The risk register must aggregate `RiskMitigationRecord` entries from both risk assessment items and inspection items into a single read-only list with source context.
- [FR-10] All list endpoints must support `options=true` bypass for dropdown use.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Soft-deleted records (`deletedAt` set) must be excluded from all list and options responses.
- [NFR-3] All write operations must require a valid JWT and the corresponding permission.
- [NFR-4] Permission checks must be enforced via `PermissionsGuard` on all non-public endpoints.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.
- [NFR-7] PDF export must be client-side only; no server-side rendering required for PDF generation.
- [NFR-8] The approval workflow must use the master approval configuration dynamically; approver lists must not be hardcoded.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User creates risk assessment with 3 items inline | 201; assessment and all items saved; `GET :id` returns items array |
| AC-2 | User calls `POST /risk-matrix/calculate` with likelihood 3 and consequence 4 | 200; returns matching `RiskRatingEnum` interpretation |
| AC-3 | User submits risk assessment for approval | Status transitions to `WAITING_APPROVAL`; approver receives notification |
| AC-4 | Approver approves risk assessment | Status transitions to `DONE`; timeline updated |
| AC-5 | SCHEDULED assessment is created | Daily reminder created automatically until assessment date |
| AC-6 | User views risk register with `entityType=RISK_ASSESSMENT_ITEM` filter | 200; only assessment-sourced records returned with source context |
| AC-7 | Admin soft-deletes a risk assessment | `deletedAt` set; assessment excluded from list |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`approvals.md`](approvals.md) — master approval workflow system
- [`master-data.md`](master-data.md) — risk categories, risks, risk mitigations master data
