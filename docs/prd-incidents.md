# PRD: Incident Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Incident Management module supports reporting, tracking, and approving safety and security incidents. Incidents have rich metadata (type, classification, priority, location, risk category, requester, reporter, assignee, department), optional nested data (injured persons, witnesses, assets, images, attachments), and a submit/approve/reject workflow with timeline. List supports pagination and multiple filters; list endpoint allows `options` bypass for dropdown use.

**Scope:** Backend `incidents` module; frontend `incidents` module.

## Key Features

- Create, list (paginated, filter by area, risk category, status, type, classification, priority, source, assigned department, assignee, search), read, update, soft-delete incidents.
- Nested create/update: injured persons (name, gender, level of injury, body part, type of injury, mechanism of injury, department), witnesses (name, gender, department), assets (polymorphic: ASSET/HEAVY_EQUIPMENT/SAFETY_EQUIPMENT or free-text), images (URL, caption, order), attachments (URL, order).
- Workflow: submit for approval, approve (with optional notes), reject (with reason); check approval rights; get approval timeline.
- List supports `options=true` for permission bypass (e.g. selects).

## User Roles & Permissions

- **incident:create** — create incident.
- **incident:list** — list incidents (with optional options bypass).
- **incident:read** — get one incident, approval rights, timeline.
- **incident:update** — update incident, submit, approve, reject.
- **incident:delete** — soft delete (set isActive false).

## User Stories

- As a user, I can report an incident with location, type, classification, description, and optional injured persons/witnesses/assets/images so that safety events are recorded.
- As a user, I can list and filter incidents by area, department, status, type, and search so that I can find and track cases.
- As an assignee or approver, I can submit, approve, or reject an incident and see the approval timeline so that workflow is auditable.
- As a user, I can view incident detail including all nested data and approval history so that I have full context.

## Key Workflows

1. **Create incident:** User fills main form (subject, date, room/area, type, classification, requester, reporter, priority, risk category, description, control measure, due date, treatment/absence flags, assigned department, assignee) and optionally adds injured persons, witnesses, assets, images, attachments → POST /incidents.
2. **List and filter:** User opens Incidents list → applies filters (area, risk category, status, type, classification, priority, department, assignee, search) and pagination → GET /incidents.
3. **Submit for approval:** User opens incident detail → Submit → POST :id/submit; status changes to pending approval.
4. **Approve/Reject:** Approver opens incident → Approve (notes) or Reject (reason) → POST :id/approve or :id/reject; timeline updated.
5. **Approval rights and timeline:** Frontend calls GET :id/approval-rights (for current user) and GET :id/timeline for display on detail page.

## Data Model Summary

- **Incident (t_incidents):** id, code (unique), subject, incidentDate, roomId?, areaId, incidentType, incidentClassification, requesterId, reportedBy, technicianId?, priority, riskCategoryId, description, controlMeasure, dueDate, expectedOutcome, needToStopActivity, stopActivityDescription, treatment, treatmentDescription, absence, resolution, assignedDepartmentId, assigneeId?, status (GeneralStatusEnum), source, isActive, createdBy. Relations: Room, Area, RiskCategory, Requester/Reporter/Technician/Assignee/Creator (User), AssignedDepartment (Department), InjuredPersons, Witnesses, Assets, Images, Attachments.
- **IncidentInjuredPerson:** incidentId, injuredPersonName, gender, levelOfInjury, injuredBodyPart, typeOfInjury, mechanismOfInjury, departmentId?, order.
- **IncidentWitness:** incidentId, witnessName, gender, departmentId?, order.
- **IncidentAsset:** incidentId, entity (ASSET|HEAVY_EQUIPMENT|SAFETY_EQUIPMENT)?, entityId?, assetName, assetCode?, quantity?, order.
- **IncidentImage:** incidentId, imageUrl, caption?, order.
- **IncidentAttachment:** incidentId, attachmentUrl, order.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /incidents | incident:create | Create incident (with nested DTOs) |
| GET | /incidents | incident:list | List with query (page, limit, sortBy, sortOrder, isActive, areaId, riskCategoryId, status, incidentType, incidentClassification, priority, source, assignedDepartmentId, assigneeId, search; options bypass) |
| GET | /incidents/:id | incident:read | Get one incident |
| PATCH | /incidents/:id | incident:update | Update incident |
| DELETE | /incidents/:id | incident:delete | Soft delete |
| POST | /incidents/:id/submit | incident:update | Submit for approval |
| POST | /incidents/:id/approve | incident:update | Approve (body: notes?) |
| POST | /incidents/:id/reject | incident:update | Reject (body: reason) |
| GET | /incidents/:id/approval-rights | incident:read | Check if current user can approve/reject |
| GET | /incidents/:id/timeline | incident:read | Get approval timeline |

## Frontend Pages & Components

- **IncidentsPage** — list with filters and data table.
- **CreateIncidentPage** — create form (uses IncidentForm).
- **EditIncidentPage** — edit form (uses IncidentForm).
- **IncidentDetailPage** — read-only detail with nested data and approval timeline/actions (submit, approve, reject).
- **IncidentForm** — shared form component for create/edit (main fields and nested sections for injured persons, witnesses, assets, images, attachments).

Routes: /incidents, /incidents/new, /incidents/:id/edit, /incidents/:id.

## Dependencies

- **Backend:** Prisma (Incident and nested models, User, Department, Area, Room, RiskCategory), approval resolver if integrated with global approval config, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data (areas, rooms, risk categories, departments, users for assignee/requester/reporter), uploads for images/attachments, core API.

## Functional Requirements

- [FR-1] The system must allow authenticated users with `incident:create` permission to create an incident with all required and optional fields, including nested injured persons, witnesses, assets, images, and attachments in a single request.
- [FR-2] The system must support listing incidents with pagination (page, limit) and filters by area, risk category, status, type, classification, priority, source, assigned department, assignee, and search.
- [FR-3] The list endpoint must support `options=true` bypass so that users without `incident:list` can retrieve incident options for dropdowns (JWT still required).
- [FR-4] The system must allow users with `incident:read` to view a single incident with all nested data, approval rights, and timeline.
- [FR-5] The system must allow users with `incident:update` to update an incident and its nested collections.
- [FR-6] The system must allow users with `incident:delete` to soft-delete an incident (set `isActive: false`).
- [FR-7] The system must expose a submit-for-approval endpoint (`POST :id/submit`) that transitions the incident status to pending approval.
- [FR-8] The system must expose approve (`POST :id/approve`) and reject (`POST :id/reject`) endpoints, with notes or reason respectively, and update the approval timeline.
- [FR-9] The system must expose `GET :id/approval-rights` so the frontend can determine whether the current user can approve or reject.
- [FR-10] The system must expose `GET :id/timeline` to return the full ordered approval history.
- [FR-11] The system must soft-delete incidents rather than hard-delete them; `deletedAt` and `isActive: false` must be set on delete.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Soft-deleted and inactive incidents (`isActive: false`) must be excluded from all list responses by default.
- [NFR-3] All write operations must require a valid JWT (Bearer token) and the corresponding `incident:*` permission.
- [NFR-4] Permission checks must be enforced via `PermissionsGuard` on all non-public endpoints.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.
- [NFR-7] The approval workflow must use the Master Approval configuration dynamically; approver lists must not be hardcoded.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User with `incident:create` submits incident form with main fields and nested injured person | 201; incident record created with nested injured person row; `GET :id` returns all nested data |
| AC-2 | User lists incidents with `status=DRAFT` and `areaId=<id>` filters | 200; only incidents matching both filters returned; pagination metadata present |
| AC-3 | User without `incident:list` permission calls `GET /incidents?options=true` | 200; options list returned (JWT still required) |
| AC-4 | User submits incident for approval | Incident status transitions to pending-approval state; approver receives notification |
| AC-5 | Approver approves incident | Status transitions to approved; timeline updated; original requester notified |
| AC-6 | Approver rejects incident with reason | Status returns to prior state; rejection reason saved in timeline |
| AC-7 | User with `incident:delete` soft-deletes incident | `isActive: false` and `deletedAt` set; incident excluded from default list |
| AC-8 | User calls `GET :id/approval-rights` | Returns `{ canApprove: boolean }` reflecting current user's eligibility |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`prd-approvals.md`](prd-approvals.md) — master approval workflow system
- [`investigation-report-prd.md`](investigation-report-prd.md) — post-incident investigation form extension
