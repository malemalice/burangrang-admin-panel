# Inspection Item Approval Workflow (Deprecated)

**Document type:** TRD
**Status:** Deprecated
**Audience:** Backend, Frontend Engineers
**Last updated:** 2026-05-12

> Split into [`prd-inspection-approval.md`](prd-inspection-approval.md) (business requirements) and [`trd-inspection-approval.md`](trd-inspection-approval.md) (technical requirements). Retained for historical reference only. Do not act on this document.

---

## 1. Executive Summary

The Inspection Item Approval Workflow enables systematic verification and approval of inspection items through a multi-level approval process. The system integrates with the Master Approval configuration to provide role-based approval workflows based on department and job position hierarchies.

---

## 2. Business Objectives

- **Objective 1:** Establish a structured approval workflow for inspection items based on master approval configuration
- **Objective 2:** Ensure only authorized approvers can verify and approve inspection items
- **Objective 3:** Track approval history and timeline for audit and compliance purposes
- **Objective 4:** Maintain clear status transitions: OPEN → WAITING_APPROVAL → CLOSED (or OPEN on rejection)

---

## 3. Stakeholders & User Roles

| Role | Responsibility |
|------|----------------|
| **Creator** | Creates inspection items with initial findings, risk assessment, and mitigation plans |
| **Updater** | Updates action items with progress, follow-up notes, and after-images |
| **Verifier/Approver** | Reviews, verifies, and approves/rejects inspection items based on approval rights |
| **Viewer** | Views inspection item details and approval timeline (read-only) |

---

## 4. Functional Requirements (BRD)

### 4.1 Approval Workflow Configuration

**FR-01:** System shall use Master Approval Items (`m_approval_item`) as reference for approval line configuration

**FR-02:** Inspection Item approval workflow shall reference entity type `INSPECTION_ITEM` in master approval configuration

**FR-03:** Approval lines shall support dynamic resolution:
- Department: Can use `@ENTITY_DEPARTMENT` (dynamic from inspection item's assigned department)
- Job Position: Can use `@ENTITY_JOB_POSITION` (dynamic from inspection item's creator)

**FR-04:** Default approval workflow (as seeded):
- **Line 1:** Dynamic approval (department and job position from entity data)
- **Line 2:** Lead position in Academic Department

### 4.2 Form Mode Access Control

**FR-05:** System shall support three form modes:
- **Creator Mode:** Initial creation of inspection items
- **Updater Mode:** Updating action items with progress and after-images
- **Verifier Mode:** Verifying and approving inspection items (approval rights required)

**FR-06:** Only users with valid approval rights (based on master approval items) shall access Verifier Mode

**FR-07:** System shall check approval rights before allowing access to Verifier Mode:
- Approval rights checked when user attempts to open verifier mode
- Approval rights checked when form is loaded in verifier mode
- Access denied with clear error message if user lacks approval rights

### 4.3 Status Management

**FR-08:** Inspection item status shall follow this lifecycle:
```
OPEN → WAITING_APPROVAL → CLOSED (on approval)
                           ↓
                        OPEN (on rejection)
```

**FR-09:** Status transitions:
- **Creator Mode:** Status remains OPEN (not changeable)
- **Updater Mode:** Status changes to WAITING_APPROVAL when submitting (with "Request for Approval" button)
- **Verifier Mode (Approve):** Status changes to CLOSED
- **Verifier Mode (Reject):** Status remains OPEN

**FR-10:** When status is CLOSED, only View action is available (all edit buttons hidden)

### 4.4 Button Visibility Rules

**FR-11:** Button visibility based on status and user permissions:

| Status | View | Edit as Creator | Update Action Item | Verify |
|--------|------|----------------|-------------------|--------|
| **OPEN** | ✓ | ✓ | ✓ | ✗ |
| **WAITING_APPROVAL** | ✓ | ✗ | ✗ | ✓ (only if user has approval rights) |
| **CLOSED** | ✓ | ✗ | ✗ | ✗ |

**FR-12:** Verify button shall only appear when:
- Status is `WAITING_APPROVAL`
- Current user has approval rights for the inspection item (based on master approval items)

**FR-13:** "Edit as Creator" and "Update Action Item" buttons shall be hidden when:
- Status is `WAITING_APPROVAL`
- Status is `CLOSED`

### 4.5 Approval Actions

**FR-14:** Verifier Mode shall provide Approve and Reject actions:
- **Approve Action:**
  - Opens approval dialog with optional notes
  - Submits approval to approval system
  - Updates inspection item status to CLOSED
  - Saves all form changes including status update
  
- **Reject Action:**
  - Opens rejection dialog with required reason
  - Submits rejection to approval system
  - Keeps inspection item status as OPEN (does not change status)
  - Does not save other form changes (only records rejection)

**FR-15:** Approval submission shall:
- Use entity type: `INSPECTION_ITEM`
- Record approval/rejection in approval history
- Track approver, department, job position, notes, and timestamp

### 4.6 Approval Timeline Display

**FR-16:** System shall display approval timeline on inspection item detail page showing:
- Approval history with status (APPROVED/REJECTED)
- Approver information (name, department, job position)
- Approval notes
- Timestamps
- Current approval line (waiting for approval)
- Pending approval lines (upcoming steps)

**FR-17:** Approval timeline shall be displayed alongside basic information in a two-column layout

**FR-18:** Approval timeline shall automatically fit content height (not endless scroll)

---

## 5. Business Rules

**BR-01:** Approval rights are determined by matching:
- User's current department with approval line department
- User's current job position with approval line job position
- Approval line order (current line in workflow)

**BR-02:** Master approval configuration uses entity type `INSPECTION_ITEM` to identify approval workflow

**BR-03:** Approval workflow can use sentinel values:
- `@ENTITY_DEPARTMENT`: Resolves to inspection item's assigned department
- `@ENTITY_JOB_POSITION`: Resolves to inspection item creator's job position

**BR-04:** Status cannot be manually changed in Creator or Updater mode (system-managed transitions)

**BR-05:** When Updater submits changes, status automatically changes to WAITING_APPROVAL

**BR-06:** Only the current approver in the workflow can approve/reject inspection items

**BR-07:** Rejection keeps item in OPEN status, allowing creator/updater to make corrections and resubmit

**BR-08:** Approval changes status to CLOSED, preventing further edits (only view available)

---

## 6. Technical Requirements (TRD)

### 6.1 Backend Implementation

#### 6.1.1 Approval Entity Configuration

**TR-01:** Add `INSPECTION_ITEM` to approval entities constants:
- File: `backend/src/shared/constants/approval-entities.ts`
- Constant: `APPROVAL_ENTITIES.INSPECTION_ITEM = 'INSPECTION_ITEM'`

**TR-02:** Add `INSPECTION_ITEM` to entity-to-table mapping:
- Mapping: `APPROVAL_ENTITY_TO_TABLE['INSPECTION_ITEM'] = 't_inspection_items'`

**TR-03:** Update master approval seed:
- File: `backend/prisma/seeds/master-approvals.seed.ts`
- Create approval workflow for `INSPECTION_ITEM` entity
- Default: 2-step approval (Dynamic → Lead in Academic Department)

#### 6.1.2 API Endpoints

**TR-04:** Inspection items service shall support:
- `checkApprovalRights(itemId)` - Check if current user has approval rights
- `checkApprovalStatus(itemId)` - Get approval history and current status
- `submitApproval(itemId, status, notes)` - Submit approval/rejection

**TR-05:** Approval endpoints use existing master approvals service:
- `/master-approvals/check-approval/:id?entity=INSPECTION_ITEM`
- `/master-approvals/check-approval-status/:id?entity=INSPECTION_ITEM`
- `/master-approvals/approval` (POST with entity: `INSPECTION_ITEM`)

### 6.2 Frontend Implementation

#### 6.2.1 Approval Constants

**TR-06:** Frontend approval entities:
- File: `frontend/src/modules/master-data/constants/approval-entities.ts`
- Constant: `APPROVAL_ENTITIES.INSPECTION_ITEM = 'INSPECTION_ITEM'`

#### 6.2.2 Inspection Items Service

**TR-07:** Service methods:
- File: `frontend/src/modules/inspections/inspection-items/services/inspectionItemsService.ts`
- `checkApprovalRights(id)` - Returns approval rights for item
- `checkApprovalStatus(id)` - Returns approval history and status
- `submitApproval(id, status, notes)` - Submits approval/rejection

#### 6.2.3 InspectionItemForm Component

**TR-08:** Form modes:
- File: `frontend/src/modules/inspections/components/InspectionItemForm.tsx`
- Props: `formMode?: 'creator' | 'updater' | 'verifier'`
- Field permissions controlled by `FIELD_PERMISSIONS` configuration

**TR-09:** Approval workflow integration:
- Check approval rights when `formMode === 'verifier'` and item has ID
- Show error/access denied if user lacks approval rights
- Display approve/reject buttons when `canApprove === true`
- Handle approve action: submit approval, update status to CLOSED
- Handle reject action: submit rejection, keep status as OPEN

**TR-10:** Submit button behavior:
- Creator mode: "Submit"
- Updater mode: "Request for Approval" (changes status to WAITING_APPROVAL)
- Verifier mode: Standard "Submit" + Approve/Reject buttons (if has approval rights)

**TR-11:** Approval dialogs:
- Approve dialog: Optional notes, sets status to CLOSED
- Reject dialog: Required reason, keeps status as OPEN

#### 6.2.4 Button Visibility Logic

**TR-12:** InspectionItemsPage button logic:
- File: `frontend/src/modules/inspections/inspection-items/pages/InspectionItemsPage.tsx`
- Check approval rights for items with `WAITING_APPROVAL` status on load
- Conditionally render buttons based on status and approval rights
- Verify button: Only show when status is `WAITING_APPROVAL` AND user has approval rights

**TR-13:** InspectionItemsTable component:
- File: `frontend/src/modules/inspections/components/InspectionItemsTable.tsx`
- Accept `approvalRights` prop (Record<string, boolean>)
- Apply same button visibility rules as InspectionItemsPage

**TR-14:** InspectionDetailPage:
- File: `frontend/src/modules/inspections/pages/InspectionDetailPage.tsx`
- Check approval rights for items with `WAITING_APPROVAL` status
- Pass `approvalRights` to InspectionItemsTable component

#### 6.2.5 Approval Timeline Display

**TR-15:** ViewInspectionItemPage:
- File: `frontend/src/modules/inspections/inspection-items/pages/ViewInspectionItemPage.tsx`
- Fetch approval status on page load
- Display ApprovalTimelineCard component (reused from risk assessment module)
- Layout: Two-column grid (Basic Information | Approval Timeline)
- Timeline container: Natural height with max-height constraint (not endless scroll)

**TR-16:** ApprovalTimelineCard component:
- Reused component from risk assessment module
- Accepts: `approvalHistory`, `isLoading`, `assessmentStatus`
- For inspection items: Pass `'DONE'` when status is CLOSED, otherwise pass current status
- Removed height constraints to prevent endless scroll appearance

---

## 7. Data Flow

### 7.1 Approval Workflow Flow

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

### 7.2 Approval Rights Check Flow

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

## 8. Database Schema

### 8.1 Master Approval Configuration

**Table:** `m_approval`
- `entity`: `'INSPECTION_ITEM'`
- `isActive`: `true`

**Table:** `m_approval_item`
- Links to `m_approval` via `mApprovalId`
- `order`: Approval line sequence (0, 1, 2, ...)
- `departmentId`: Department ID or sentinel value `@ENTITY_DEPARTMENT`
- `jobPositionId`: Job position ID or sentinel value `@ENTITY_JOB_POSITION`

### 8.2 Approval Transactions

**Table:** `t_approvals`
- `mApprovalId`: Reference to master approval
- `entityId`: Inspection item ID
- `entity`: `'INSPECTION_ITEM'` (implicit, from master approval)
- `status`: `'APPROVED'` or `'REJECTED'`
- `departmentId`: Resolved department ID
- `jobPositionId`: Resolved job position ID
- `notes`: Approval/rejection notes
- `createdBy`: Approver user ID
- `createdAt`: Timestamp

---

## 9. Status Enum Values

### Inspection Item Status (`IssueStatus`)

- **OPEN**: Initial status, item can be edited by creator/updater
- **WAITING_APPROVAL**: Submitted for approval, waiting for verifier action
- **CLOSED**: Approved and closed, read-only access

---

## 10. API Contracts

### 10.1 Check Approval Rights

**Endpoint:** `GET /master-approvals/check-approval/:id?entity=INSPECTION_ITEM`

**Response:**
```typescript
{
  canApprove: boolean;
}
```

### 10.2 Check Approval Status

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

### 10.3 Submit Approval

**Endpoint:** `POST /master-approvals/approval`

**Request Body:**
```typescript
{
  dataId: string; // Inspection item ID
  entity: 'INSPECTION_ITEM';
  status: 'APPROVED' | 'REJECTED';
  notes: string;
}
```

---

## 11. User Interface Requirements

### 11.1 Form Mode Indicators

- **Creator Mode:** "Inspection Item Details" section
- **Updater Mode:** "Section 1: Inspection Item Details (Read Only)" + "Update Action Item" section
- **Verifier Mode:** "Section 1: Creator Information" + "Section 2: Action Item Updates" + "Section 3: Verification"

### 11.2 Button Labels

- Creator mode: "Submit"
- Updater mode: "Request for Approval" (submitting changes status to WAITING_APPROVAL)
- Verifier mode: "Submit" + "Approve" + "Reject" buttons

### 11.3 Approval Timeline

- Display format: Vertical timeline with approval history
- Show: Status badges, timestamps, approver info, notes
- Visual indicators: Current approval line (highlighted), pending lines (grayed out)

---

## 12. Security Requirements

**SEC-01:** Only users with matching department and job position can approve inspection items

**SEC-02:** Approval rights are checked server-side before allowing approval actions

**SEC-03:** Verifier mode access is restricted based on approval rights check

**SEC-04:** Approval history cannot be modified (append-only)

---

## 13. Error Handling

**ERR-01:** If approval workflow not configured, show appropriate message (no approval buttons)

**ERR-02:** If user lacks approval rights, show clear error: "You do not have approval rights for this inspection item"

**ERR-03:** If approval check fails, show error and prevent verifier mode access

**ERR-04:** Failed approval submissions show error toast with details

---

## 14. Testing Requirements

**TEST-01:** Verify approval rights check works correctly for users with matching department/job position

**TEST-02:** Verify approval rights check denies access for users without matching department/job position

**TEST-03:** Verify button visibility changes based on status transitions

**TEST-04:** Verify approve action changes status to CLOSED and records approval

**TEST-05:** Verify reject action keeps status as OPEN and records rejection

**TEST-06:** Verify updater submit changes status to WAITING_APPROVAL

**TEST-07:** Verify approval timeline displays correctly with all approval history

**TEST-08:** Verify sentinel value resolution works for dynamic approval lines

---

## 15. Implementation Checklist

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

## 16. Future Enhancements (Out of Scope)

- Bulk approval for multiple inspection items
- Delegation of approval rights
- Approval deadline reminders
- Approval escalation workflow
- Mobile approval notifications

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Owner | _______________ | _______________ | ______ |
| HSE Manager | _______________ | _______________ | ______ |
| IT Manager | _______________ | _______________ | ______ |
| Project Manager | _______________ | _______________ | ______ |

---

**END OF DOCUMENT**
