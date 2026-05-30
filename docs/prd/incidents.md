# PRD: Incident Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-30

## Overview

The Incident Management module supports reporting, tracking, and approving safety and security incidents. Incidents have rich metadata (type, classification, priority, location, risk category, requester, reporter, assignee, department), optional nested data (injured persons, witnesses, third parties, assets, images, attachments), and a submit/approve/reject workflow with timeline. List supports pagination and multiple filters; list endpoint allows `options` bypass for dropdown use.

**Scope:** Backend `incidents` module; frontend `incidents` module.

## Key Features

- Create, list (paginated, filter by area, risk category, status, type, classification, priority, source, assigned department, assignee, search), read, update, soft-delete incidents. Soft-delete does **not** cascade to the linked `InvestigationReport` (1:1 via `incidentId`); see [`../investigation-report-accident.md`](../investigation-report-accident.md) §1.1 for the current interaction between incident soft-delete and investigation edits.
- Nested create/update: injured persons (name, gender, position, level of injury, body part, type of injury, mechanism of injury, department), witnesses (name, gender, position, department), third parties (name, gender, company, position — external persons such as contractors/visitors), assets (polymorphic: ASSET/HEAVY_EQUIPMENT/SAFETY_EQUIPMENT or free-text; includes brand), images (URL, caption, order), attachments (URL, order).
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

1. **Create incident:** User fills the form following BSJ section order (A→G) and optionally adds injured persons, witnesses, third parties, assets, images, attachments → POST /incidents.
2. **List and filter:** User opens Incidents list → applies filters (area, risk category, status, type, classification, priority, department, assignee, search) and pagination → GET /incidents.
3. **Submit for approval:** User opens incident detail → Submit → POST :id/submit; status changes to pending approval.
4. **Approve/Reject:** Approver opens incident → Approve (notes) or Reject (reason) → POST :id/approve or :id/reject; timeline updated.
5. **Approval rights and timeline:** Frontend calls GET :id/approval-rights (for current user) and GET :id/timeline for display on detail page.

## Form Layout — BSJ Section Structure

The form and detail page are organized following the BSJ/F/H-3-3.5B paper incident report form. Each section displays its BSJ letter, English title, and Indonesian subtitle.

| Section | Label | Indonesian | Color | Who fills |
|---------|-------|-----------|-------|-----------|
| A | INCIDENT/NEARMISS DETAILS | Detail Insiden/Nearmiss | blue | Creator |
| B | ACTION | Tindakan | green | Creator (B1/B3) + Investigator (outcomes) |
| C | PERSON INVOLVED AT THE INCIDENT | Orang yang terlibat dalam kejadian | red | Creator |
| D | THIRD PARTIES INVOLVED AT THE INCIDENT | Pihak ketiga yang terlibat dalam kejadian | violet | Creator |
| E | ASSETS/EQUIPMENT INVOLVED | Aset/Peralatan yang terlibat | indigo | Creator |
| F | WITNESS | Saksi | orange | Creator |
| G | REPORTER | Pelapor | purple | Creator |
| — | Images | — | teal | Creator (digital-only) |
| — | Attachments | — | slate | Creator (digital-only) |

### Section B role-based access

Section B (ACTION) is split between the initial reporter and the HSE investigator:
- **Creator can fill:** B1 (Need to Stop Activity, Stop Locally, Stop Whole School) and B3 (Action Taken / `controlMeasure`). These map directly to the BSJ paper form fields filled at incident time.
- **Investigator only:** Due Date (`dueDate`), Expected Outcome, Treatment, Treatment Description, Absence, Resolution. These are investigation outcome fields filled after HSE review.
- **Both:** `needFurtherInvestigation` checkbox — either the reporter or the investigator can flag for a formal Investigation Report (BSJ/F/H-3-3.5C).

## Data Model Summary

- **Incident (t_incidents):** id, code (unique), subject, incidentDate (`DateTime` — stores date AND time of incident), roomId?, areaId, incidentType (`IncidentTypeEnum`: NEAR_MISS, DAMAGE_TO_PREMISES_OR_EQUIPMENT, DANGEROUS_OCCURRENCE), incidentClassification, requesterId, reportedBy, technicianId?, priority, riskCategoryId, description, controlMeasure, dueDate, expectedOutcome, needToStopActivity (deprecated enum), stopLocally (bool), stopWholeSchool (bool), treatment, treatmentDescription, absence, resolution, needFurtherInvestigation (bool), assignedDepartmentId, assigneeId?, status (GeneralStatusEnum), source, isActive, createdBy. Relations: Room, Area, RiskCategory, Requester/Reporter/Technician/Assignee/Creator (User), AssignedDepartment (Department), InjuredPersons, Witnesses, ThirdParties, Assets, Images, Attachments.
- **IncidentInjuredPerson:** incidentId, injuredPersonName, gender, position?, levelOfInjury, injuredBodyPart, typeOfInjury, mechanismOfInjury, departmentId?, order. Maps to BSJ Section C.
- **IncidentWitness:** incidentId, witnessName, gender, position?, departmentId?, order. Maps to BSJ Section F.
- **IncidentThirdParty (t_incident_third_parties):** incidentId, name, gender?, company?, position?, order. External persons involved (contractors, visitors) — BSJ Section D.
- **IncidentAsset:** incidentId, entity (ASSET|HEAVY_EQUIPMENT|SAFETY_EQUIPMENT)?, entityId?, assetName, assetCode?, brand?, quantity?, order. Maps to BSJ Section E.
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
- **CreateIncidentPage** — create form (uses IncidentForm). `PageHeader` + `max-w-4xl mx-auto` layout.
- **EditIncidentPage** — edit form (uses IncidentForm). Supports `?mode=creator|investigator|approver` query param to override role detection.
- **IncidentDetailPage** — read-only detail with all BSJ sections (A–G), nested data, image thumbnails, approval timeline, and metadata.
- **IncidentForm** — shared form component for create/edit. Standalone section cards (no outer wrapper) in BSJ section order. Role-based field access per Section B split (see above).

Routes: /incidents, /incidents/new, /incidents/:id/edit, /incidents/:id.

### Detail page display notes

- Section C (Person Involved): displays `position` field alongside name, gender, department.
- Section E (Assets): displays `brand` and `quantity` fields.
- Images: rendered as `<img>` thumbnails (clickable to open full URL), not raw links.
- Section B: shows amber "Need Further Investigation" banner when `needFurtherInvestigation = true`, linking to BSJ/F/H-3-3.5C.

## Dependencies

- **Backend:** Prisma (Incident and nested models, User, Department, Area, Room, RiskCategory), approval resolver if integrated with global approval config, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data (areas, rooms, risk categories, departments, users for assignee/requester/reporter), uploads for images/attachments, core API.

## Functional Requirements

- [FR-1] The system must allow authenticated users with `incident:create` permission to create an incident with all required and optional fields, including nested injured persons, witnesses, third parties, assets, images, and attachments in a single request.
- [FR-12] The system must support nested third-party persons (external contractors/visitors) on create and update, stored in `t_incident_third_parties` (name, gender, company, position, order). Maps to BSJ Section D.
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
- [FR-13] The form must follow the BSJ/F/H-3-3.5B paper form section structure (A–G) with English titles and Indonesian subtitles. Section order: A (Incident Details), B (Action), C (Person Involved), D (Third Parties), E (Assets/Equipment), F (Witness), G (Reporter).
- [FR-14] Section B fields must be split by role: creator fills B1 (stop activity) and B3 (action taken / `controlMeasure`); investigator fills outcome fields (dueDate, treatment, absence, resolution, expectedOutcome). Both can set `needFurtherInvestigation`.

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
| AC-9 | Creator fills Section B (B1 + B3) on new incident | needToStopActivity, stopLocally, stopWholeSchool, controlMeasure are editable; dueDate/treatment/absence are disabled |
| AC-10 | Investigator opens incident in investigator mode | B outcome fields (dueDate, treatment, absence, resolution) are editable; all other sections are read-only |
| AC-11 | Detail page for incident with injured persons | Section C shows name, gender, position, department, level of injury, body part, type, mechanism |
| AC-12 | Detail page for incident with assets | Section E shows asset name, brand, and quantity |
| AC-13 | Detail page for incident with images | Images rendered as thumbnails (not URLs); clicking opens full image |
| AC-14 | Detail page for incident with `needFurtherInvestigation = true` | Amber banner shown in Section B with link to BSJ/F/H-3-3.5C |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`approvals.md`](approvals.md) — master approval workflow system
- [`investigation-report-accident.md`](investigation-report-accident.md) — post-incident investigation form extension
- BSJ/F/H-3-3.5B — physical BSJ incident report form (source of section structure A–G)
