# PRD: Approval Workflow System

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Approval Workflow System provides (1) **Master Approvals** — configurable approval configurations (entity, department, job position, order) that define who can approve which entities (e.g. RISK_ASSESSMENT, WORK_PERMIT, INCIDENT, AUDIT_ITEM); (2) **Approval runtime** — check if current user can approve (check-approval), check approval status/history (check-approval-status), and submit an approval (submitApproval). The ApprovalResolverService is used by other modules (risk assessment, work permits, incidents, audit) to resolve approvers and apply workflow. Frontend manages master approvals under /master/approvals.

**Scope:** Backend `approvals` module (ApprovalsService, ApprovalResolverService, MasterApprovalsController); frontend master-data approval pages (MasterApproval*, under /master/approvals).

## Key Features

- **Master approvals:** Create, list (paginated, isActive, search; options bypass), read, update, delete. Each record defines entity type, department, job position, order (approval line). Used by resolver to determine next approver and status.
- **Check approval rights:** GET check-approval/:dataId?entity=ENTITY — returns whether current user can approve the given record (canApprove, error, message). Entity enum: RISK_ASSESSMENT, WORK_PERMIT, etc. (APPROVAL_ENTITIES).
- **Check approval status:** GET check-approval-status/:dataId?entity=ENTITY — returns history, nextApprover, currentStatus, allApprovalLines for display (timeline, next approver).
- **Submit approval:** POST approval (SubmitApprovalDto) — submit an approval step for an entity (used by modules that own the entity to record approve/reject and advance workflow).

## User Roles & Permissions

- **master-approval:create/list/read/update/delete** — master approval CRUD (list has options bypass).
- **approval:read** — check approval rights and status.
- **approval:update** — submit approval (POST approval).

## User Stories

- As an admin, I can configure master approval lines (entity, department, job position, order) so that the system knows who approves which entities at each step.
- As a user, I can see whether I can approve a given record and see approval status/history so that I know if I should act and what the current state is.
- As an approver, I can submit an approval (approve/reject) so that the workflow advances; the owning module (e.g. work permits, incidents) calls the approval service and updates its own status.

## Key Workflows

1. **Setup:** Admin creates master approval records (entity type, department, job position, order) for each approval line → list/edit/delete as needed.
2. **Runtime:** User opens a record (e.g. work permit) → frontend calls check-approval and check-approval-status → shows "Approve"/"Reject" if canApprove and timeline. User clicks Approve/Reject → owning module (or frontend) calls POST master-approvals/approval with entity, dataId, action, notes → ApprovalResolverService and entity-specific logic update status and history.

## Data Model Summary

- **MasterApproval (Approval or similar):** id, entity (or entityType), departmentId, jobPositionId, order, isActive, etc. Defines approval line. Approval status history may be stored in entity-specific tables (e.g. WorkPermit status history) or in a shared ApprovalStatus/History table; resolver uses master config to compute next approver and status.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /master-approvals | master-approval:create | Create master approval |
| GET | /master-approvals | master-approval:list | List (options bypass) |
| GET | /master-approvals/:id | master-approval:read | Get one |
| GET | /master-approvals/check-approval/:dataId | approval:read | Check if user can approve (query: entity) |
| GET | /master-approvals/check-approval-status/:dataId | (public or approval:read) | Approval status/history (query: entity) |
| PATCH | /master-approvals/:id | master-approval:update | Update master approval |
| DELETE | /master-approvals/:id | master-approval:delete | Delete |
| POST | /master-approvals/approval | approval:update | Submit approval for an entity |

## Frontend Pages & Components

- **Master approvals:** MasterApprovalsPage, CreateMasterApprovalPage, EditMasterApprovalPage, MasterApprovalDetailPage. Under master-data routes: /master/approvals, .../new, .../:id, .../:id/edit.
- **Approval UI in other modules:** ApprovalDialog, ApprovalTimelineCard used in work permits, incidents, risk assessment, audit (each module calls check-approval and check-approval-status and submit approval).

## Dependencies

- **Backend:** Prisma (MasterApproval/Approval, Department, JobPosition), ApprovalResolverService (used by work-permits, incidents, risk-assessment, audit-schedules), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data (departments, job positions for master approval form), core API. Other modules (work-permits, incidents, etc.) depend on approval APIs for their detail pages.

## Functional Requirements

- [FR-1] The system must support full CRUD for master approval records, each defining an entity type, department, job position, and approval line order.
- [FR-2] The master approval list must support `options=true` bypass for dropdown use.
- [FR-3] The system must expose a check-approval endpoint (`GET check-approval/:dataId?entity=ENTITY`) that returns `{ canApprove, error, message }` for the current user.
- [FR-4] The system must expose a check-approval-status endpoint that returns approval history, next approver, current status, and all approval lines for a given record.
- [FR-5] The system must expose a submit-approval endpoint (`POST approval`) that records an approve or reject action and advances the workflow for the entity.
- [FR-6] The approval resolver must support sentinel values for department (`@ENTITY_DEPARTMENT`) and job position (`@ENTITY_JOB_POSITION`) to enable dynamic approval lines derived from the entity record.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] All write operations must require a valid JWT and the corresponding permission.
- [NFR-3] The approval system must be entity-agnostic; adding a new entity type must not require code changes to the resolver beyond registering the new `APPROVAL_ENTITIES` constant.
- [NFR-4] Approval history must be append-only; no record may be modified after creation.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Admin creates a master approval for WORK_PERMIT with department X and job position Y at order 1 | 201; record created; appears in master approval list |
| AC-2 | User calls check-approval for a work permit they are not in the approval line for | Returns `{ canApprove: false }` |
| AC-3 | User in the current approval line calls check-approval for a record awaiting approval | Returns `{ canApprove: true }` |
| AC-4 | Approver submits approval (approve) for a work permit | 200; approval recorded in history; work permit status advances; next approver (if any) notified |
| AC-5 | Approver submits rejection | 200; rejection recorded; workflow terminates; entity status reverts |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
