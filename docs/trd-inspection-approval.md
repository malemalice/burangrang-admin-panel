# TRD: Inspection Item Approval Workflow

**Document type:** Technical Requirements Document
**Status:** Stable
**Audience:** Backend, Frontend Engineers
**Last updated:** 2026-05-12

## Overview

Technical implementation details for the Inspection Item Approval Workflow. See [`prd-inspection-approval.md`](prd-inspection-approval.md) for business requirements and user stories.

---

## Technical Requirements

### TR-01 — Backend: Approval Entity Constant

Add `INSPECTION_ITEM` to approval entities constants:

- **File:** `backend/src/shared/constants/approval-entities.ts`
- **Change:** `APPROVAL_ENTITIES.INSPECTION_ITEM = 'INSPECTION_ITEM'`

### TR-02 — Backend: Entity-to-Table Mapping

Add `INSPECTION_ITEM` to entity-to-table mapping:

- **Mapping:** `APPROVAL_ENTITY_TO_TABLE['INSPECTION_ITEM'] = 't_inspection_items'`

### TR-03 — Backend: Master Approval Seed

Update master approval seed:

- **File:** `backend/prisma/seeds/master-approvals.seed.ts`
- **Change:** Create approval workflow for `INSPECTION_ITEM` entity
- **Default:** 2-step approval — Line 1: Dynamic (`@ENTITY_DEPARTMENT` / `@ENTITY_JOB_POSITION`); Line 2: Lead in Academic Department

### TR-04 — Backend: Service Methods

Inspection items service must support:

- `checkApprovalRights(itemId)` — Check if current user has approval rights
- `checkApprovalStatus(itemId)` — Get approval history and current status
- `submitApproval(itemId, status, notes)` — Submit approval/rejection

### TR-05 — Backend: Approval Endpoints

Approval endpoints use existing master approvals service:

- `GET /master-approvals/check-approval/:id?entity=INSPECTION_ITEM`
- `GET /master-approvals/check-approval-status/:id?entity=INSPECTION_ITEM`
- `POST /master-approvals/approval` (body: `{ dataId, entity: 'INSPECTION_ITEM', status, notes }`)

### TR-06 — Frontend: Approval Entities Constant

- **File:** `frontend/src/modules/master-data/constants/approval-entities.ts`
- **Change:** `APPROVAL_ENTITIES.INSPECTION_ITEM = 'INSPECTION_ITEM'`

### TR-07 — Frontend: Inspection Items Service

- **File:** `frontend/src/modules/inspections/inspection-items/services/inspectionItemsService.ts`
- **Methods:** `checkApprovalRights(id)`, `checkApprovalStatus(id)`, `submitApproval(id, status, notes)`

### TR-08 — Frontend: InspectionItemForm Component

- **File:** `frontend/src/modules/inspections/components/InspectionItemForm.tsx`
- **Props:** `formMode?: 'creator' | 'updater' | 'verifier'`
- Field permissions controlled by `FIELD_PERMISSIONS` configuration per mode

### TR-09 — Frontend: Approval Workflow Integration in Form

- Check approval rights when `formMode === 'verifier'` and item has ID
- Show error/access denied if user lacks approval rights
- Display Approve/Reject buttons when `canApprove === true`
- Approve action: submit approval, update status to CLOSED
- Reject action: submit rejection, keep status as OPEN

### TR-10 — Frontend: Submit Button Behavior

| Form mode | Button label | Effect |
|---|---|---|
| Creator | "Submit" | Saves item; status stays OPEN |
| Updater | "Request for Approval" | Saves item; status → WAITING_APPROVAL |
| Verifier | "Submit" + "Approve" + "Reject" | Approve → CLOSED; Reject → OPEN |

### TR-11 — Frontend: Approval Dialogs

- **Approve dialog:** Optional notes; on confirm → status CLOSED
- **Reject dialog:** Required reason; on confirm → status OPEN

### TR-12 — Frontend: InspectionItemsPage Button Logic

- **File:** `frontend/src/modules/inspections/inspection-items/pages/InspectionItemsPage.tsx`
- Check approval rights for items with `WAITING_APPROVAL` status on load
- Verify button: Only show when status is `WAITING_APPROVAL` AND user has approval rights

### TR-13 — Frontend: InspectionItemsTable Component

- **File:** `frontend/src/modules/inspections/components/InspectionItemsTable.tsx`
- Accept `approvalRights` prop (`Record<string, boolean>`)
- Apply same button visibility rules as InspectionItemsPage

### TR-14 — Frontend: InspectionDetailPage

- **File:** `frontend/src/modules/inspections/pages/InspectionDetailPage.tsx`
- Check approval rights for items with `WAITING_APPROVAL` status
- Pass `approvalRights` to InspectionItemsTable component

### TR-15 — Frontend: ViewInspectionItemPage

- **File:** `frontend/src/modules/inspections/inspection-items/pages/ViewInspectionItemPage.tsx`
- Fetch approval status on page load
- Display ApprovalTimelineCard component (reused from risk assessment module)
- Layout: Two-column grid (Basic Information | Approval Timeline)
- Timeline container: Natural height with max-height constraint (not endless scroll)

### TR-16 — Frontend: ApprovalTimelineCard Component

- Reused from risk assessment module
- Props: `approvalHistory`, `isLoading`, `assessmentStatus`
- For inspection items: Pass `'DONE'` when status is CLOSED, otherwise pass current status
- Remove height constraints to prevent endless scroll appearance

---

## Data Flow

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

### Approval Rights Check Flow

```
1. User clicks Verify button
   ↓
2. Frontend calls checkApprovalRights(itemId) with entity: INSPECTION_ITEM
   ↓
3. Backend checks:
   - Finds master approval for INSPECTION_ITEM entity
   - Finds current approval line (first non-completed line)
   - Checks if user's department matches approval line department
   - Checks if user's job position matches approval line job position
   ↓
4. Returns { canApprove: boolean }
   ↓
5. Frontend shows/hides Verify button based on canApprove
```

---

## Database Schema

### Master Approval Configuration

**Table:** `m_approval`
- `entity`: `'INSPECTION_ITEM'`
- `isActive`: `true`

**Table:** `m_approval_item`
- `mApprovalId`: Links to `m_approval`
- `order`: Approval line sequence (0, 1, 2, ...)
- `departmentId`: Department ID or sentinel `@ENTITY_DEPARTMENT`
- `jobPositionId`: Job position ID or sentinel `@ENTITY_JOB_POSITION`

### Approval Transactions

**Table:** `t_approvals`
- `mApprovalId`: Reference to master approval
- `entityId`: Inspection item ID
- `status`: `'APPROVED'` or `'REJECTED'`
- `departmentId`: Resolved department ID
- `jobPositionId`: Resolved job position ID
- `notes`: Approval/rejection notes
- `createdBy`: Approver user ID
- `createdAt`: Timestamp

---

## API Contracts

### Check Approval Rights

**Endpoint:** `GET /master-approvals/check-approval/:id?entity=INSPECTION_ITEM`

**Response:**
```typescript
{
  canApprove: boolean;
}
```

### Check Approval Status

**Endpoint:** `GET /master-approvals/check-approval-status/:id?entity=INSPECTION_ITEM`

**Response:**
```typescript
{
  history: ApprovalHistory[];
  nextApprover: {
    line: number;
    department: { id: string; name: string };
    jobPosition: { id: string; name: string };
  } | null;
  allApprovalLines: ApprovalLine[];
  currentStatus: string;
}
```

### Submit Approval

**Endpoint:** `POST /master-approvals/approval`

**Request Body:**
```typescript
{
  dataId: string;           // Inspection item ID
  entity: 'INSPECTION_ITEM';
  status: 'APPROVED' | 'REJECTED';
  notes: string;
}
```

---

## Implementation Checklist

### Backend
- [x] Add `INSPECTION_ITEM` to `APPROVAL_ENTITIES`
- [x] Add `INSPECTION_ITEM` to `APPROVAL_ENTITY_TO_TABLE` mapping
- [x] Update master approval seed with `INSPECTION_ITEM` workflow
- [x] Verify approval service handles `INSPECTION_ITEM` entity

### Frontend
- [x] Add `INSPECTION_ITEM` to frontend `APPROVAL_ENTITIES`
- [x] Add approval methods to `inspectionItemsService`
- [x] Implement approval rights check in `InspectionItemForm`
- [x] Add approve/reject dialogs in `InspectionItemForm`
- [x] Update submit logic for updater mode (WAITING_APPROVAL)
- [x] Update button visibility in `InspectionItemsPage`
- [x] Update button visibility in `InspectionItemsTable`
- [x] Add approval timeline to `ViewInspectionItemPage`
- [x] Add approval rights checking in `InspectionDetailPage`
- [x] Fix approval timeline height (remove endless scroll)

---

## Related Documents

- [`prd-inspection-approval.md`](prd-inspection-approval.md) — Business requirements for this workflow
- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`prd-approvals.md`](prd-approvals.md) — Master approval workflow
