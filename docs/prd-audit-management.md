# PRD: Audit Management

## Overview

The Audit Management module covers four pillars:

1. **Audit Policy** — master data hierarchy: AuditElement → AuditClause → AuditCriteria
2. **Audit Periods** — monthly/quarterly groupings that auto-generate audit schedules for all active elements
3. **Audit Schedules** — individual audit instances assigned to areas and auditors, with status lifecycle
4. **Audit Results** — item-level assessment records with evidence, corrective actions, and approval workflow

Policy is master data; periods are scheduling containers; schedules are executable instances; items link schedules to criteria and departments with a submit/approve/reject flow.

**Scope:**
- Backend: `audit-policy` (audit-elements, audit-clauses, audit-criteria controllers), `audit-periods`, `audit-schedules`, `audit-results` (results endpoint under audit-schedules)
- Frontend: `audit-policy`, `audit-criteria`, `audit-periods`, `audit-schedules`, `audit-results`

---

## Functional Requirements

### FR1 — Audit Policy (Master Data)

- **FR1.1** CRUD for Audit Elements (name, code, description, isActive). Code is unique.
- **FR1.2** CRUD for Audit Clauses under an element (name, code, description, order, isActive).
- **FR1.3** CRUD for Audit Criteria under a clause (name, code, description, order, isActive, transitionType: `INITIAL | TRANSITION_LEVEL | ADVANCE_LEVEL`).
- **FR1.4** Bulk reorder clauses under an element; bulk reorder criteria under a clause.
- **FR1.5** Regenerate sequential codes for all clauses under an element; for all criteria under a clause.
- **FR1.6** All policy list endpoints support `?options=true` bypass (JWT still required, permission check skipped) for dropdown data.
- **FR1.7** Look up element/clause/criteria by code (`GET .../code/:code`).

### FR2 — Audit Periods

- **FR2.1** Create a period (month 1–12, year 2020–2099, optional notes). Creation atomically generates one `t_audits` record per active AuditElement within the same transaction. Each generated audit has `periodId` set and status auto-determined by audit date.
- **FR2.2** List periods with pagination; response includes `totalAudits` and `completedAudits` counts for progress display.
- **FR2.3** View period detail: period metadata + full list of child audit schedules with their current status.
- **FR2.4** `GET /audit-periods/latest` — returns the most recent active period (for dashboard defaults).
- **FR2.5** `GET /audit-periods/element-count` — returns count of active audit elements (used to preview how many audits a new period will generate).
- **FR2.6** Delete period: soft-delete only (`deletedAt`/`deletedBy`). Blocked if any audit item under the period has been filled.

### FR3 — Audit Schedules

- **FR3.1** Create schedule: `code` (auto-generated if blank, format `AUD{timestamp}`), `auditElementId`, `areaIds[]` (required, multi-select), `auditDate`, `auditorIds[]` (optional), `periodId` (optional link to a period).
- **FR3.2** Status is auto-determined on create and update: if `auditDate` is in the past → `DONE`; if today or future → `SCHEDULED`. Manual status override is validated against the date.
- **FR3.3** When status is `SCHEDULED`: system auto-creates daily reminder notifications at 09:00 GMT+7 from today/tomorrow until `auditDate`.
- **FR3.4** On update: if status changes away from `SCHEDULED` → cancel pending reminders; if status changes to `SCHEDULED` → create reminders; if date changes while still `SCHEDULED` → cancel old reminders, create new ones.
- **FR3.5** List schedules with filtering: `search`, `status`, `areaIds[]`, `auditElementIds[]`, `auditorIds[]`, `periodIds[]`, `auditDateFrom/To`, `createdAtFrom/To`. Sorting by: `code`, `auditDate`, `createdAt`, `updatedAt`, `status`.
- **FR3.6** List endpoint supports `?options=true` bypass for dropdown use.
- **FR3.7** Delete schedule: cascade-removes audit items, auditor assignments, area assignments, and all pending reminders before deleting the record.

### FR4 — Audit Items (Assessment)

- **FR4.1** Create audit item linked to a criteria: `auditCriteriaId`, `compliantStatus` (`COMPLY | NOT_COMPLY_MAJOR | NOT_COMPLY_MINOR`), `departmentIds[]`, `dueDate`, `order`. Optional: `userIds[]`, `evidence`, `recommendation`, `actionRealization`, `images[]` (each image: `imageUrl`, `caption`, `order`).
- **FR4.2** If `compliantStatus = COMPLY`: item status auto-set to `DONE`; approval workflow is skipped entirely.
- **FR4.3** If `compliantStatus = NOT_COMPLY_MAJOR` or `NOT_COMPLY_MINOR`: item status defaults to `OPEN`; corrective actions and approval are required.
- **FR4.4** Update item: status transition rules are enforced server-side — cannot directly set status to `WAITING_APPROVAL`, `DONE`, or `REJECTED` via the update endpoint; `WAITING_APPROVAL` and `DONE` items are locked (only approval workflow endpoints can change their status). `REJECTED` items can be updated by assignees to correct before resubmitting.
- **FR4.5** Multiple evidence images per item with `caption` and `order`. Images are cascade-deleted with the item.

### FR5 — Approval Workflow

- **FR5.1 Submit for approval**: item must be `OPEN` or `REJECTED`; requesting user must be assigned to the item (via `departmentIds` or `userIds`); `SUPER_ADMIN` role bypasses the assignment check. On success: status → `WAITING_APPROVAL`.
- **FR5.2 Approve**: requester must have approval rights per `MasterApprovals` config. Approval advances the chain; when all lines complete → status → `CLOSE` (final state).
- **FR5.3 Reject**: approval rights required; `notes` is mandatory. Status → `REJECTED`. Assignee may then correct the item and resubmit (loop back to FR5.1).
- **FR5.4 Check approval rights**: `GET .../approval-rights` returns whether the current user can approve and who the next approver is.

### FR6 — Audit Results View

- **FR6.1** Cross-schedule results list (`GET /audit-schedules/results`) filtered by: `auditId`, `auditElementId`, `auditClauseId`, `auditCriteriaId`, `compliantStatus`, `status`, free-text `search`.
- **FR6.2** Each result record includes the full hierarchy: `auditElement → auditClause → auditCriteria → auditScheduleCode`.
- **FR6.3** Per-schedule and per-clause assessment statistics: total criteria count, filled count, COMPLY count, NOT_COMPLY count. Displayed in real time on the schedule detail and clause criteria pages.

---

## Non-Functional Requirements

- **NFR1 — Security**: All endpoints require JWT authentication. Guard chain: `JwtAuthGuard → RolesGuard → PermissionsGuard`. Options-bypass endpoints still require JWT; only the permission check is skipped.
- **NFR2 — Authorization granularity**: Each action (list/create/read/update/delete) maps to a distinct permission key per resource. Approval actions additionally require approval rights from the `MasterApprovals` configuration.
- **NFR3 — Data integrity**: Period deletion is blocked server-side if any child audit item has been filled. Audit item status transitions are enforced in the service layer — client cannot bypass them.
- **NFR4 — Soft delete**: Audit periods, elements, clauses, and criteria use `deletedAt`/`deletedBy` fields; records are not physically removed, preserving historical reporting.
- **NFR5 — Audit trail**: All transactional records carry `createdBy`, `createdAt`, `updatedAt`. Approval chain history is stored in `t_approvals` and exposed via the approval timeline UI.
- **NFR6 — Reminder reliability**: Reminder creation and cancellation are transactional with status changes. Prevents orphaned `PENDING` reminders when a schedule is updated or deleted.
- **NFR7 — Performance**: All list endpoints are paginated (page/limit). Assessment statistics are computed server-side; the frontend does not perform N+1 client-side aggregation.
- **NFR8 — UI/UX consistency**: Frontend uses design token colors only (no raw hex/Tailwind palette classes). Tables use the shared `DataTable` component. Status badges follow the standard color map. All UI supports light and dark mode.
- **NFR9 — State persistence**: List page filters, pagination, and sorting are persisted in the URL via `useSearchParams`. Back navigation uses `navigate(-1)`.

---

## User Roles & Permissions

| Permission key | Scope |
|---|---|
| `audit-policy:create/list/read/update/delete` | Elements and clauses CRUD, reorder, regenerate codes |
| `audit-criteria:create/list/read/update/delete` | Criteria CRUD, reorder, regenerate codes |
| `audit-period:create` | Create audit period (auto-generates schedules) |
| `audit-period:list` | List audit periods |
| `audit-period:read` | View period detail |
| `audit-period:delete` | Delete period (blocked if items filled) |
| `audit-schedule:create/list/read/update/delete` | Schedules CRUD; list/read audit items |
| `audit-result:create/update` | Create item, update item, submit-for-approval, approve, reject |
| `audit-result:list` | View aggregated results (`GET /audit-schedules/results`) |

---

## Workflows

### 1. Policy Setup

```
Admin
  → Create AuditElement (name, code, description)
      → Add AuditClauses (set order; reorder as needed)
          → Add AuditCriteria per clause (set transitionType; reorder; regenerate codes if needed)
```

All list endpoints support `?options=true` for use in form dropdowns.

---

### 2. Period & Schedule Creation

```
Admin creates AuditPeriod (month, year, notes)
  └─ System (in transaction) generates one Audit record per active AuditElement
       ├─ auditDate = first day of the period month
       ├─ status = SCHEDULED  (if auditDate is today or future)
       └─ status = DONE       (if auditDate is past)
  └─ For each SCHEDULED audit: system creates daily reminder notifications at 09:00 GMT+7

Alternatively: Admin creates a standalone Audit Schedule (not tied to a period)
  └─ Same status auto-determination and reminder logic applies
```

---

### 3. Audit Item Assessment

```
Auditor opens AuditScheduleDetailPage → selects a clause → AuditClauseCriteriaPage
  └─ For each criteria row → opens AuditItemForm

       ┌─ compliantStatus = COMPLY
       │    └─ Item saved, status = DONE  (no approval required)
       │
       └─ compliantStatus = NOT_COMPLY_MAJOR | NOT_COMPLY_MINOR
            └─ Item saved, status = OPEN
                 └─ Assigned department / user fills corrective action fields
                      (evidence, recommendation, actionRealization, images, dueDate)
                           └─ Submits for approval → status = WAITING_APPROVAL
                                │
                                ├─ Approver APPROVES
                                │    └─ Approval chain advances
                                │         └─ All lines complete → status = CLOSE  ✓
                                │
                                └─ Approver REJECTS (notes required)
                                     └─ status = REJECTED
                                          └─ Assignee corrects item and resubmits
                                               └─ (loop back to WAITING_APPROVAL)
```

---

### 4. Results Monitoring

```
User with audit-result:list
  → Opens AuditResultsPage
      → Filters by: element / clause / criteria / compliantStatus / status / schedule code
          → Views individual item detail on ViewAuditCriteriaPage
              → Sees: compliant status, evidence, corrective actions, images, departments, approval timeline
```

---

## Data Model Summary

### Master Data

| Model | Table | Key Fields |
|---|---|---|
| AuditElement | `m_audit_element` | id, name, code (unique), description, isActive, deletedAt |
| AuditClause | `m_audit_clause` | id, auditElementId, name, code, order, isActive, deletedAt |
| AuditCriteria | `m_audit_criteria` | id, auditClauseId, name, code, order, transitionType, isActive, deletedAt |

`transitionType` enum: `INITIAL | TRANSITION_LEVEL | ADVANCE_LEVEL`

### Transactional Data

| Model | Table | Key Fields |
|---|---|---|
| AuditPeriod | `t_audit_periods` | id, month (1–12), year, notes, isActive, createdBy, deletedAt |
| Audit (Schedule) | `t_audits` | id, code (unique), auditDate, auditElementId, periodId?, status, createdBy |
| AuditItem | `t_audit_items` | id, auditId, auditCriteriaId, compliantStatus, status, evidence, recommendation, actionRealization, dueDate, order |
| AuditImage | `t_audit_images` | id, auditItemId, imageUrl, caption, order |

### Junction Tables

| Model | Table | Purpose |
|---|---|---|
| AuditToArea | `_AuditToArea` | Areas covered by a schedule |
| AuditToUser | `_AuditToUser` | Auditors assigned to a schedule |
| AuditItemToDepartment | `_AuditItemToDepartment` | Departments responsible for corrective action |
| AuditItemToUser | `_AuditItemToUser` | Specific users assigned to an item |

### Status Enums

| Enum | Values |
|---|---|
| `GeneralStatusEnum` | `DRAFT \| SCHEDULED \| OPEN \| WAITING_APPROVAL \| DONE \| REJECTED \| CLOSE` |
| `CompliantStatusEnum` | `COMPLY \| NOT_COMPLY_MAJOR \| NOT_COMPLY_MINOR` |
| `TransitionTypeEnum` | `INITIAL \| TRANSITION_LEVEL \| ADVANCE_LEVEL` |

---

## API Endpoints Summary

### Audit Policy — `/audit-elements`, `/audit-clauses`, `/audit-criteria`

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/audit-elements` | audit-policy:create | |
| GET | `/audit-elements` | audit-policy:list | `?options=true` bypass |
| GET | `/audit-elements/:id` | audit-policy:read | |
| GET | `/audit-elements/code/:code` | audit-policy:read | |
| PATCH | `/audit-elements/:id` | audit-policy:update | |
| DELETE | `/audit-elements/:id` | audit-policy:delete | |
| POST | `/audit-clauses` | audit-policy:create | |
| GET | `/audit-clauses` | audit-policy:list | `?options=true` bypass |
| GET | `/audit-clauses/:id` | audit-policy:read | |
| PATCH | `/audit-clauses/:id` | audit-policy:update | |
| DELETE | `/audit-clauses/:id` | audit-policy:delete | |
| POST | `/audit-clauses/reorder` | audit-policy:update | Bulk reorder |
| POST | `/audit-clauses/regenerate-codes/:auditElementId` | audit-policy:update | |
| POST | `/audit-criteria` | audit-criteria:create | |
| GET | `/audit-criteria` | audit-criteria:list | `?options=true` bypass |
| GET | `/audit-criteria/:id` | audit-criteria:read | |
| PATCH | `/audit-criteria/:id` | audit-criteria:update | |
| DELETE | `/audit-criteria/:id` | audit-criteria:delete | |
| POST | `/audit-criteria/reorder` | audit-criteria:update | Bulk reorder |
| POST | `/audit-criteria/regenerate-codes/:auditClauseId` | audit-criteria:update | |

### Audit Periods — `/audit-periods`

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/audit-periods` | audit-period:create | Auto-generates child audits |
| GET | `/audit-periods` | audit-period:list | Paginated |
| GET | `/audit-periods/latest` | audit-period:list | Most recent active period |
| GET | `/audit-periods/element-count` | audit-period:list | Count of active elements |
| GET | `/audit-periods/:id` | audit-period:read | Full detail with child audits |
| DELETE | `/audit-periods/:id` | audit-period:delete | Blocked if items filled |

### Audit Schedules — `/audit-schedules`

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/audit-schedules` | audit-schedule:create | |
| GET | `/audit-schedules` | audit-schedule:list | `?options=true` bypass; extensive filters |
| GET | `/audit-schedules/results` | audit-result:list | Cross-schedule results |
| GET | `/audit-schedules/:id` | audit-schedule:read | |
| PATCH | `/audit-schedules/:id` | audit-schedule:update | |
| DELETE | `/audit-schedules/:id` | audit-schedule:delete | Cascade removes items/reminders |
| POST | `/audit-schedules/:id/items` | audit-result:create | Create audit item |
| GET | `/audit-schedules/:id/items` | audit-schedule:read | Paginated item list |
| PATCH | `/audit-schedules/:id/items/:itemId` | audit-result:update | Status transitions enforced |
| POST | `/audit-schedules/:id/items/:itemId/submit-for-approval` | audit-result:update | |
| POST | `/audit-schedules/:id/items/:itemId/approve` | audit-result:update | Approval rights checked |
| POST | `/audit-schedules/:id/items/:itemId/reject` | audit-result:update | Notes required |
| GET | `/audit-schedules/:id/items/:itemId/approval-rights` | audit-result:read | |

---

## Frontend Pages & Components

### Audit Policy (`/audit-policy`)
- AuditPolicyPage, AuditPolicyDetailPage, CreateAuditElementPage, EditAuditElementPage
- Components: AuditElementForm, AuditClauseForm, AuditClausesTable, AuditCriteriaForm, AuditCriteriaTable

### Audit Criteria standalone (`/audit-criteria`)
- AuditCriteriaPage, AuditCriteriaDetailPage, CreateAuditCriteriaPage, EditAuditCriteriaPage

### Audit Periods (`/audit-periods`)
- AuditPeriodsPage — list with per-period completion percentage badge
- AuditPeriodDetailPage — period info card, progress bar, audit schedule table
- CreateAuditPeriodPage
- Components: AuditPeriodForm

### Audit Schedules (`/audit-schedules`)
- AuditSchedulesPage — list with assessment status per row (total/filled/comply/not comply)
- CreateAuditSchedulePage, EditAuditSchedulePage
- AuditScheduleDetailPage — summary stats + clause table with per-clause assessment
- AuditClauseCriteriaPage — per-criteria assessment/update/approve actions
- ViewAuditCriteriaPage — read-only detail with evidence images and approval timeline
- Components: AuditScheduleForm, AuditItemForm, ApprovalDialog

### Audit Results (`/audit-results`)
- AuditResultsPage — cross-schedule item list with workflow info dialog and inline form editing

---

## Dependencies

- **Backend:** Prisma (AuditElement, AuditClause, AuditCriteria, AuditPeriod, Audit, AuditItem, AuditImage, AuditToArea, AuditToUser, AuditItemToDepartment, AuditItemToUser), MasterApprovalsService (approval chain), RemindersService (SCHEDULED audit reminders), JwtAuthGuard, RolesGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth module, master-data module (departments, areas, users for dropdowns), core API service, react-to-pdf (PDF export), shared DataTable, PageHeader, ModalCombobox.
