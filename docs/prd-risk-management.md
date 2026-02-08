# PRD: Risk Management Suite

## Overview

The Risk Management suite covers three related capabilities: (1) **Risk Assessment** — department-scoped assessments with items (risk, risk category, likelihood/consequence, pre/post ratings, images); (2) **Risk Matrix** — master configuration of likelihood × consequence and calculation of risk rating (interpretation); (3) **Risk Register** — read-only aggregated view of risk mitigation records from risk assessment items and inspection items, with filters and source context. List endpoints support an `options` bypass where applicable.

**Scope:** Backend `risk-assessment`, `risk-matrix`, `risk-register` modules; frontend `risk-assessment`, `risk-matrix`, `risk-register` modules.

## Key Features

- **Risk Assessment:** Create, list (paginated, filter by department, status, isActive, search), read, update, delete. Assessments have department, assessment date, creator, assignee, status, action plan. Items: risk, risk category, likelihood/consequence levels, risk matrix rating, interpretation, post-mitigation levels and rating, images (BEFORE/AFTER/GENERAL).
- **Risk Assessment Items:** Create, list (per assessment, paginated), read, update, delete. Each item links to Risk and RiskCategory; stores pre- and post-mitigation matrix data; can have RiskControl and RiskMitigationRecord (polymorphic).
- **Risk Matrix:** Calculate rating from likelihood + consequence (POST calculate); CRUD risk matrix entries (likelihood level/name/desc, consequence level/name/desc, interpretation). List supports options bypass.
- **Risk Register:** List aggregated risk mitigation records (paginated, filter by entityType RISK_ASSESSMENT_ITEM|INSPECTION_ITEM, departmentId, riskId, riskCategoryId, status, isActive, search); get one record with source context. Read-only; data comes from RiskMitigationRecord linked to assessment or inspection items.

## User Roles & Permissions

- **risk-assessment:create** — create assessment, create item.
- **risk-assessment:list** — list assessments (options bypass).
- **risk-assessment:read** — get assessment, get items.
- **risk-assessment:update** — update assessment, update item.
- **risk-assessment:delete** — delete assessment, delete item.
- **risk-matrix:read** — calculate risk rating.
- **risk-matrix:create,** **risk-matrix:list,** **risk-matrix:read,** **risk-matrix:update,** **risk-matrix:delete** — CRUD risk matrix entries (list has options bypass).
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

- **RiskAssessment (t_risk_assessment):** id, code, description, departmentId, assessmentDate, createdBy, status, isActive, assigneeId?, actionPlan. Relations: department, creator, assignee, items (RiskAssessmentItem[]).
- **RiskAssessmentItem (t_risk_assessment_item):** id, riskAssessmentId, mRiskId, mRiskCategoryId, likelihoodLevel, consequenceLevel, riskMatrixRating, interpretation, postLikelihoodLevel, postConsequenceLevel, postRiskMatrixRating, postInterpretation. Relations: riskAssessment, mRisk, mRiskCategory, images (RiskAssessmentItemImage[]). Linked to RiskMitigationRecord (entity=RISK_ASSESSMENT_ITEM).
- **RiskAssessmentItemImage:** riskAssessmentItemId, imageUrl, caption, type (BEFORE/AFTER/GENERAL), order.
- **RiskMatrix (m_risk_matrix):** id, likelihoodLevel, likelihoodName, likelihoodDesc, consequenceLevel, consequenceName, consequenceDesc, interpretation (RiskRatingEnum), isActive.
- **RiskMitigationRecord (t_risk_mitigation):** id, code, eliminate, transfer, reduce, accept, legalAspect, entity (RISK_ASSESSMENT_ITEM|INSPECTION_ITEM), entityId. Used by risk register to aggregate with source context (assessment/inspection item, department, risk, etc.).

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
| GET | /risk-register | risk-register:list | List (page, limit, sortBy, sortOrder, entityType, departmentId, riskId, riskCategoryId, status, isActive, search; options bypass) |
| GET | /risk-register/:id | risk-register:read | Get one with source context |

## Frontend Pages & Components

- **Risk Assessment:** RiskAssessmentsPage (list), CreateRiskAssessmentPage, EditRiskAssessmentPage, RiskAssessmentDetailPage. RiskAssessmentForm, RiskAssessmentItemForm, RiskAssessmentItemsTable, AssessmentDetailsCard, ApprovalDialog, ApprovalTimelineCard, RiskAssessmentPDFTemplate, ViewItemDialog, riskBadgeHelpers.
- **Risk Matrix:** RiskMatricesPage, RiskMatrixManagementPage, CreateRiskMatrixPage, EditRiskMatrixPage, RiskMatrixForm.
- **Risk Register:** RiskRegisterPage, ViewRiskRegisterPage. RiskRegisterTable, RiskRegisterSourceBadge, riskRegisterStatus (utils).

Routes: /risk-assessment (list, new, :id, :id/edit), /risk-matrix (management, new, :id/edit), /risk-register (list, :id view).

## Dependencies

- **Backend:** Prisma (RiskAssessment, RiskAssessmentItem, RiskAssessmentItemImage, RiskMatrix, RiskMitigationRecord, RiskControl, Department, User, Risk, RiskCategory). Approvals may integrate with risk assessment (see approvals module). Risk register service joins RiskMitigationRecord with assessment/inspection item and related entities.
- **Frontend:** Auth, master-data (departments, risk categories, risks, risk mitigations), risk-matrix service for calculate, core API.
