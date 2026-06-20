# PRD: Inspection Item Approval Workflow

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Inspection Item Approval Workflow enables systematic verification and approval of inspection items through a multi-level approval process. The system integrates with the Master Approval configuration to provide role-based approval workflows based on department and job position hierarchies.

**Scope:** Backend `inspections` module (approval rights, approval submission); frontend `inspection-items` submodule (form modes, approval timeline, button visibility).

## Key Features

- **Form mode access control:** Three distinct form modes (Creator, Updater, Verifier) with field-level permissions per mode.
- **Status lifecycle:** OPEN → WAITING_APPROVAL → CLOSED (approve) or back to OPEN (reject).
- **Approval rights check:** Only users whose department and job position match the current approval line can access Verifier mode and submit approvals.
- **Approval timeline:** Vertical timeline displaying history (approved/rejected), current pending line, and upcoming lines on the item detail page.
- **Dynamic approval line resolution:** Sentinel values (`@ENTITY_DEPARTMENT`, `@ENTITY_JOB_POSITION`) resolve at runtime from the inspection item's assigned department and creator's job position.

## User Roles & Permissions

| Role | Responsibility |
|------|----------------|
| **Creator** | Creates inspection items with initial findings, risk assessment, and mitigation plans |
| **Updater** | Updates action items with progress, follow-up notes, and after-images; submits for approval |
| **Verifier/Approver** | Reviews, verifies, and approves/rejects inspection items (requires approval rights from Master Approval config) |
| **Viewer** | Views inspection item details and approval timeline (read-only) |

## User Stories

- As a Creator, I can submit an inspection item so that it enters the system in OPEN status ready for follow-up.
- As an Updater, I can update action items with progress, follow-up notes, and after-images, and then request approval so that the item moves to WAITING_APPROVAL status.
- As a Verifier, I can approve an inspection item so that its status is changed to CLOSED and no further edits are allowed.
- As a Verifier, I can reject an inspection item with a required reason so that the Creator/Updater can correct and resubmit.
- As any user, I can view the approval timeline on the item detail page so that I can track who approved or rejected at each step and what notes were given.

## Functional Requirements

- [FR-1] The system must support three form modes (Creator, Updater, Verifier); field permissions must be controlled per mode.
- [FR-2] Only users with valid approval rights may access Verifier mode. The "current approval line" is **dynamically resolved at runtime** — sentinel values `@ENTITY_DEPARTMENT` / `@ENTITY_JOB_POSITION` in the Master Approval config are replaced server-side using the inspection item's assigned `departmentId` and the creator's `jobPositionId` (see `approval-resolver.service.ts`). The user's department + job position is then compared against those resolved values. Static department/job-position IDs in the master config (when not sentinels) are matched literally. See [`approvals.md`](approvals.md) §3 / FR-6 for the runtime resolution contract; this PRD does not introduce a separate static-master matching mode.
- [FR-3] The system must enforce the status lifecycle: OPEN → WAITING_APPROVAL (on Updater submit) → CLOSED (on approve) or OPEN (on reject).
- [FR-4] When status is CLOSED, all edit actions must be hidden; only View is available.
- [FR-5] The Verify button must only appear when status is `WAITING_APPROVAL` AND the current user has approval rights for the item.
- [FR-6] The Approve action must record approval, advance the approval chain, and set status to CLOSED when all lines complete.
- [FR-7] The Reject action must require a reason, record the rejection, and leave status as OPEN so the assignee can correct and resubmit.
- [FR-8] The approval timeline must display history (approver, department, job position, notes, timestamp), the current waiting line, and pending upcoming lines.
- [FR-9] The Master Approval configuration must support sentinel values `@ENTITY_DEPARTMENT` and `@ENTITY_JOB_POSITION` that resolve at runtime from the inspection item's assigned department and creator's job position.
- [FR-10] Status cannot be manually set by the user in Creator or Updater mode; transitions are system-managed.

## Non-Functional Requirements

- [NFR-1] Approval rights must be checked server-side before allowing approve/reject actions; client-side checks are supplementary only.
- [NFR-2] Approval history is append-only; existing approval records must not be modified.
- [NFR-3] All approval endpoints must require a valid JWT and the corresponding `inspection:update` permission.
- [NFR-4] API responses must return within 2 seconds under normal load.
- [NFR-5] All UI components must support light and dark mode via semantic design tokens.

## Key Workflows

### Approval Workflow

```
1. Creator creates inspection item (status: OPEN)
   ↓
2. Updater updates with action progress and submits
   ↓
3. System checks if approval workflow exists for INSPECTION_ITEM
   ↓
4. If yes, creates approval records for each approval line
   ↓
5. Status changes to WAITING_APPROVAL
   ↓
6. Current approver sees Verify button (if has approval rights)
   ↓
7a. Approver approves → Status: CLOSED
7b. Approver rejects → Status: OPEN (item can be updated again)
```

### Button Visibility Rules

| Status | View | Edit as Creator | Update Action Item | Verify |
|--------|------|----------------|-------------------|--------|
| **OPEN** | ✓ | ✓ | ✓ | ✗ |
| **WAITING_APPROVAL** | ✓ | ✗ | ✗ | ✓ (only if user has approval rights) |
| **CLOSED** | ✓ | ✗ | ✗ | ✗ |

## Data Model Summary

- **Master Approval (`m_approval`):** entity = `INSPECTION_ITEM`, isActive = true.
- **Approval Line (`m_approval_item`):** order, departmentId (or `@ENTITY_DEPARTMENT`), jobPositionId (or `@ENTITY_JOB_POSITION`).
- **Approval Transaction (`t_approvals`):** mApprovalId, entityId (inspection item id), entity = `INSPECTION_ITEM`, status (APPROVED/REJECTED), departmentId (resolved), jobPositionId (resolved), notes, createdBy, createdAt.
- **Inspection Item Status (`IssueStatus`):** OPEN, WAITING_APPROVAL, CLOSED.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /master-approvals/check-approval/:id?entity=INSPECTION_ITEM | inspection:read | Check if current user can approve the item |
| GET | /master-approvals/check-approval-status/:id?entity=INSPECTION_ITEM | inspection:read | Get approval history, current and pending lines |
| POST | /master-approvals/approval | inspection:update | Submit approve/reject for inspection item |

## Frontend Pages & Components

- **InspectionItemForm** (`InspectionItemForm.tsx`): Renders in Creator/Updater/Verifier mode; controls field permissions per mode; shows Approve/Reject dialogs in Verifier mode.
- **InspectionItemsPage** (`InspectionItemsPage.tsx`): Checks approval rights for items in WAITING_APPROVAL status; conditionally renders Verify button.
- **InspectionItemsTable** (`InspectionItemsTable.tsx`): Accepts `approvalRights` prop; applies same button visibility rules.
- **InspectionDetailPage** (`InspectionDetailPage.tsx`): Checks approval rights and passes to InspectionItemsTable.
- **ViewInspectionItemPage** (`ViewInspectionItemPage.tsx`): Fetches approval status; renders ApprovalTimelineCard in two-column layout.

## Dependencies

- **Backend:** MasterApprovalsService (approval rights check, approval submission, history); `APPROVAL_ENTITIES.INSPECTION_ITEM` constant; `APPROVAL_ENTITY_TO_TABLE` mapping; inspection items service.
- **Frontend:** `inspectionItemsService` (checkApprovalRights, checkApprovalStatus, submitApproval); `APPROVAL_ENTITIES` constant; shared `ApprovalTimelineCard` component from risk assessment module.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Updater submits inspection item with progress | Status changes to WAITING_APPROVAL |
| AC-2 | User without matching department/job position opens Verify | Access denied; Verify button hidden or error shown |
| AC-3 | Verifier approves inspection item | Status changes to CLOSED; edit buttons hidden; approval recorded in `t_approvals` |
| AC-4 | Verifier rejects inspection item with reason | Status remains OPEN; rejection recorded; Creator/Updater can edit and resubmit |
| AC-5 | User opens item detail page | Approval timeline shows history, current line, and pending lines correctly |
| AC-6 | Item in CLOSED status | All edit buttons hidden; only View action available |

## Related Documents

- [`trd-inspection-approval.md`](trd-inspection-approval.md) — Technical implementation details for this workflow
- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`approvals.md`](approvals.md) — Master approval workflow (used by inspection items)
- [`inspections.md`](inspections.md) — Parent inspections module PRD
