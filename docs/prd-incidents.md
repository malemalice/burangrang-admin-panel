# PRD: Incident Management

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
