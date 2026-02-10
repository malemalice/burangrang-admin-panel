# PRD: Work Permit Management

## Overview

The Work Permit Management module supports creating, submitting, approving, rejecting, extending, and closing work permits. A work permit describes a project (area, company, dates, work stages, JSA, requirements, safety guidelines), with optional course verification, and links to classifications, employees, heavy equipment, tools, materials, machines, workers (guests), professions, required courses, hazards, attachments, supervisors (guests), HSE officers, and safety equipment. List and single-record access are data-scoped (self/department/super) via DataScopeGuard. List supports an `options` bypass.

**Scope:** Backend `work-permits` module; frontend `work-permits` module.

## Key Features

- Create, list (paginated, filter by status, companyId, areaId, createdBy, start/end date range, isActive, search in code/project name), read, update, soft-delete work permits.
- Workflow: submit (with DTO), approve (HSE or Security), reject (with reason), request additional info (HSE), extend (new end date), close (completed).
- Approval rights check and approval timeline for the current user and permit.
- GET master-data: areas, companies, work classifications, guests, heavy equipment, tools, materials, machines, professions for form dropdowns.
- Data-level access: list and single-record access filtered by user’s data scope (SELF/DEPARTMENT/SUPER per role).

## User Roles & Permissions

- **work-permit:create** — create work permit.
- **work-permit:list** — list work permits (options bypass; list still subject to data scope).
- **work-permit:read** — get one, get master-data, approval-rights, timeline.
- **work-permit:update** — update, submit, approve, reject, request-info, extend, close.
- **work-permit:delete** — soft delete.

Access to records is further restricted by DataScopeGuard (user sees only own, department’s, or all records depending on role data level).

## User Stories

- As a requester, I can create a work permit with project details, area, company, dates, work stages, JSA, hazards, workers, equipment, and required courses so that the work can be reviewed and approved.
- As a requester, I can submit the work permit for approval and see timeline so that it moves through HSE/Security review.
- As an HSE or Security approver, I can approve, reject, or request more information so that only compliant work is allowed.
- As an HSE officer, I can extend or close a permit so that validity and completion are tracked.
- As a user, I see only work permits I am allowed to access (self/department/all) so that data access follows policy.

## Key Workflows

1. **Create work permit:** User fills form (project name, area, company, proposed start/end, work stages, JSA, requirements, safety guideline, require course verification) and adds classifications, employees, heavy equipment, tools, materials, machines, workers (guests), professions, required courses, hazards, attachments, supervisors, HSE officers, safety equipment → POST /work-permits.
2. **Submit:** User opens permit (draft) → Submit → POST :id/submit (body per SubmitWorkPermitDto); status moves to approval flow.
3. **Approve/Reject:** Approver opens permit → Approve (body: notes etc.) or Reject (reason) → POST :id/approve or :id/reject.
4. **Request info:** HSE opens permit → Request additional info → POST :id/request-info; requester can update and resubmit.
5. **Extend/Close:** User extends end date (POST :id/extend) or closes completed permit (POST :id/close).
6. **List and detail:** List filtered by status, company, area, creator, date range, search; detail and actions respect data scope (403 if no access).

## Data Model Summary

- **WorkPermit (t_work_permits):** id, code (unique), projectName, areaId, companyId, proposedStartDate, proposedEndDate, workStagesDescription, jobSafetyAnalysis, workRequirements, safetyGuideline, requireCourseVerification, status (e.g. DRAFT, OPEN, WAITING_APPROVAL, IN_REVIEW_HSE, IN_REVIEW_SECURITY, NEED_INFO, APPROVED, REJECTED, CLOSED, EXTENDED), isActive, createdBy. Relations: area, company, creator, classifications, employees, heavyEquipment, tools, materials, machines, workers, professions, requiredCourses, hazards, attachments, supervisors (WorkPermitSupervisorToGuest), hseOfficers (WorkPermitToUser), safetyEquipment (WorkPermitToSafetyEquipment).
- **WorkPermitClassification,** **WorkPermitEmployee,** **WorkPermitHeavyEquipment,** **WorkPermitTool,** **WorkPermitMaterial,** **WorkPermitMachine,** **WorkPermitWorker,** **WorkPermitProfession,** **WorkPermitRequiredCourse,** **WorkPermitHazard,** **WorkPermitAttachment:** junction or detail tables linking work permit to Company, Area, WorkClassification, User, Guest, HeavyEquipment, Tool, Material, Machine, Profession, Course, Risk (hazard), SafetyEquipment.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /work-permits | work-permit:create | Create |
| GET | /work-permits | work-permit:list | List (page, limit, search, sortBy, sortOrder, status, companyId, areaId, createdBy, startDateFrom/To, endDateFrom/To, isActive; options bypass; data-scoped) |
| GET | /work-permits/master-data | work-permit:read | Master data for form |
| GET | /work-permits/:id | work-permit:read | Get one (data-scoped) |
| PATCH | /work-permits/:id | work-permit:update | Update (data-scoped) |
| DELETE | /work-permits/:id | work-permit:delete | Soft delete (data-scoped) |
| POST | /work-permits/:id/submit | work-permit:update | Submit for approval |
| POST | /work-permits/:id/approve | work-permit:update | Approve (HSE/Security) |
| POST | /work-permits/:id/reject | work-permit:update | Reject |
| POST | /work-permits/:id/request-info | work-permit:update | Request additional info |
| POST | /work-permits/:id/extend | work-permit:update | Extend end date |
| POST | /work-permits/:id/close | work-permit:update | Close permit |
| GET | /work-permits/:id/approval-rights | work-permit:read | Check approval rights |
| GET | /work-permits/:id/timeline | work-permit:read | Get approval timeline |

## Frontend Pages & Components

- **WorkPermitsPage** — list with filters and data table (data-scoped).
- **CreateWorkPermitPage** — create form (uses WorkPermitForm).
- **EditWorkPermitPage** — edit form (uses WorkPermitForm).
- **WorkPermitDetailPage** — detail view with timeline and actions (submit, approve, reject, request info, extend, close).
- **WorkPermitForm** — shared form component.
- **statusColors** (utils) — status badge styling.

Routes: /work-permits, /work-permits/new, /work-permits/:id, /work-permits/:id/edit.

## Dependencies

- **Backend:** Prisma (WorkPermit and all related tables, Company, Area, User, Guest, etc.), approvals integration for workflow, DataScopeGuard, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass. Master data entities: Company, WorkClassification, Guest, HeavyEquipment, Tool, Material, Machine, Profession, Course, Risk, SafetyEquipment.
- **Frontend:** Auth, master-data/options for areas and related lookups, core API. Data scope is enforced by backend; frontend shows list/detail from API.
