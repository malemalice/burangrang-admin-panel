# PRD: Audit Management

## Overview

The Audit Management module covers audit policy (elements → clauses → criteria hierarchy), audit schedules (scheduled audits with items), and audit results (view and manage item-level results with submit/approve/reject workflow). Policy is master data; schedules are instances to be executed; items link schedule to clause/criteria and departments, with approval flow. List endpoints support an `options` bypass where applicable.

**Scope:** Backend `audit-policy` (audit-elements, audit-clauses, audit-criteria controllers), `audit-schedules` module; frontend `audit-policy`, `audit-criteria`, `audit-schedules`, `audit-results` modules.

## Key Features

- **Audit elements:** CRUD; list (options bypass); get by code. Top-level policy entity. Reorder clauses under element (audit-clauses reorder); regenerate clause codes (by element).
- **Audit clauses:** CRUD; list (options bypass); get by code; reorder (bulk); regenerate codes (by auditElementId). Belong to an audit element. Have many criteria.
- **Audit criteria:** CRUD; list (options bypass); get by code; reorder (bulk); regenerate codes (by auditClauseId). Belong to an audit clause. Used in audit schedule items.
- **Audit schedules:** Create, list (options bypass), read, update, delete. Schedules have items (link to clause/criteria, departments, etc.). GET results (audit-result:list) for aggregated results view.
- **Audit items (per schedule):** Create item (POST :id/items), list items (GET :id/items), update item (PATCH :id/items/:itemId), submit for approval, approve, reject; get approval rights. Items can be linked to departments (e.g. AuditItemToDepartment).

## User Roles & Permissions

- **audit-policy:create/list/read/update/delete** — elements and clauses CRUD, reorder, regenerate codes.
- **audit-criteria:create/list/read/update/delete** — criteria CRUD, reorder, regenerate codes.
- **audit-schedule:create/list/read/update/delete** — schedules CRUD, list/read items.
- **audit-result:list** — get audit results (GET schedules/results).
- **audit-result:create/update** — create item, update item, submit-for-approval, approve, reject.

## User Stories

- As an admin, I can define audit elements and clauses and reorder them so that the audit policy structure is clear.
- As an admin, I can define audit criteria under clauses and reorder or regenerate codes so that schedules can reference consistent criteria.
- As a user, I can create audit schedules and add items (clause/criteria, departments) so that audits are planned.
- As a user, I can submit audit items for approval, and as an approver I can approve or reject so that results are controlled.
- As a user, I can view audit results (aggregated) so that I can see compliance across schedules.

## Key Workflows

1. **Policy setup:** Create audit elements → create clauses under element (reorder as needed) → create criteria under clause (reorder, regenerate codes). All list endpoints support options bypass for dropdowns.
2. **Schedule execution:** Create schedule → add items (link to clause/criteria, assign departments) → complete item (findings, etc.) → submit item for approval → approver approves or rejects. Check approval rights (GET :id/items/:itemId/approval-rights).
3. **Results view:** User opens Audit Results → data from GET audit-schedules/results (audit-result:list) to show aggregated results.

## Data Model Summary

- **AuditElement:** id, name, code, description?, order, isActive. Has many AuditClause.
- **AuditClause:** id, auditElementId, name, code, order, isActive. Has many AuditCriteria.
- **AuditCriteria:** id, auditClauseId, name, code, order, isActive. Referenced by audit schedule items.
- **Audit (schedule):** id, code, audit date, status, createdBy, etc. Has many AuditItem. May link to areas (AuditToArea).
- **AuditItem:** id, auditId, clause/criteria reference, department links (AuditItemToDepartment), findings, status, etc. Submit/approve/reject workflow.

## API Endpoints Summary

### Audit policy (elements) — prefix as per route (e.g. /audit-elements)
- POST, GET (options bypass), GET :id, GET code/:code, PATCH :id, DELETE :id

### Audit clauses — prefix as per route (e.g. /audit-clauses)
- POST, GET (options bypass), GET :id, GET code/:code, PATCH :id, DELETE :id, POST reorder, POST regenerate-codes/:auditElementId

### Audit criteria — prefix as per route (e.g. /audit-criteria)
- POST, GET (options bypass), GET :id, GET code/:code, PATCH :id, DELETE :id, POST reorder, POST regenerate-codes/:auditClauseId

### Audit schedules — prefix /audit-schedules (or as configured)
- POST /audit-schedules — create | GET /audit-schedules — list (options bypass) | GET /audit-schedules/results — results (audit-result:list) | GET /audit-schedules/:id — get | PATCH /audit-schedules/:id — update | DELETE /audit-schedules/:id — delete
- POST /audit-schedules/:id/items — create item | GET /audit-schedules/:id/items — list items | PATCH /audit-schedules/:id/items/:itemId — update item
- POST /audit-schedules/:id/items/:itemId/submit-for-approval — submit | POST .../approve — approve | POST .../reject — reject | GET .../approval-rights — check rights

## Frontend Pages & Components

- **Audit policy:** AuditPolicyPage, AuditPolicyDetailPage, CreateAuditElementPage, EditAuditElementPage. AuditElementForm, AuditClauseForm, AuditClausesTable, AuditCriteriaForm, AuditCriteriaTable.
- **Audit criteria (standalone):** AuditCriteriaPage, AuditCriteriaDetailPage, CreateAuditCriteriaPage, EditAuditCriteriaPage, ViewAuditCriteriaPage (audit-criteria module).
- **Audit schedules:** AuditSchedulesPage, CreateAuditSchedulePage, EditAuditSchedulePage, AuditScheduleDetailPage, AuditClauseCriteriaPage, ViewAuditCriteriaPage. AuditScheduleForm, AuditItemForm, ApprovalDialog.
- **Audit results:** AuditResultsPage (single route /audit-results).

Routes: /audit-policy, /audit-criteria, /audit-schedules (list, new, :id, :id/edit, clause/criteria views), /audit-results.

## Dependencies

- **Backend:** Prisma (AuditElement, AuditClause, AuditCriteria, Audit, AuditItem, AuditItemToDepartment, AuditToArea, etc.), approvals integration for item workflow, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data for departments, core API.
