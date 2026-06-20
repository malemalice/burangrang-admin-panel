> [← Design System Index](./index.md)
>
> *Status-based action visibility, button hierarchy for workflow actions, approval timeline rendering (history vs allApprovalLines), dynamic workflow guideline UI, status transition handlers, approval dialog pattern. Source: split from principles.md L155–454 on 2026-05-24.*

## Document Workflow & Status Management Patterns

**Overview**: Documents and entities in back-office systems often follow defined workflow states (DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED). Action buttons must be dynamically displayed based on current status and user permissions, providing clear workflow progression.

**Core Principles**:

1. **Status-Based Action Visibility**
   - Actions appear only when relevant to current status
   - Hide actions that are not applicable to current state
   - Show next logical step in workflow prominently

2. **Button Hierarchy for Workflow Actions**
   - **Primary Actions** (default variant): Submit, Request Approval, Approve
   - **Destructive Actions** (destructive variant): Reject, Cancel
   - **Secondary Actions** (outline variant): Edit, Export, View
   - **Status-Specific Colors**: Approve buttons may use semantic green (`bg-green-600 hover:bg-green-700`) for positive actions

3. **Permission-Based Visibility**
   - Check user permissions before showing action buttons
   - Use `canApprove`, `canEdit`, `canSubmit` flags from hooks/services
   - Hide actions user cannot perform

4. **Workflow State Transitions**
   - Each status transition should have a dedicated handler function
   - Update status via service layer, not direct state manipulation
   - Refresh data after status change to reflect new state

5. **Loading States During Transitions**
   - Disable action buttons during status updates
   - Show loading text: "Submitting...", "Requesting...", "Approving..."
   - Prevent multiple simultaneous status changes

6. **Error Handling**
   - Display toast notifications for success/error
   - Handle API errors gracefully
   - Allow retry on failure

7. **Dynamic Approval Options**
   - Master approval items can use sentinel values (`@ENTITY_DEPARTMENT`, `@ENTITY_JOB_POSITION`) for dynamic resolution
   - Display sentinel values with human-readable labels: "Dynamic: From Entity Data" / "Dynamic: From Entity Data (Department Head)"
   - Form selects include sentinel options alongside regular department/job position options
   - Approval timeline displays resolved approver info (sentinel values resolved by backend before approval record creation)

8. **Approval Timeline Rendering Principles**

**Understanding Approval Data Sources**:
- **`history[]`**: Actual approval actions from `t_approvals` (records created AFTER approvers take action)
  - Contains completed approvals/rejections with status, notes, creator, timestamps
  - Represents execution history of the approval workflow
- **`allApprovalLines[]`**: Workflow configuration from `m_approvals` (defines pending/current lines)
  - Shows all configured approval lines with status: `completed`, `current`, or `pending`
  - Represents the workflow definition, not execution records
  - Source of truth for what approvals are expected

**Timeline Rendering Guidelines**:

1. **Render History First**: Display all items from `history` array in chronological order
   - These are actual actions taken by approvers
   - Show status badges, notes, creator info, timestamps
   - Use proper icons/colors based on status (approved/rejected/pending)

2. **Render Pending/Current Lines Second**: Display items from `allApprovalLines` that are not yet completed
   - Show lines with status `current` (waiting for approval - highlight with pulse animation)
   - Show lines with status `pending` (not yet reached - show with muted/dashed style)
   - **Skip lines with status `completed`** - they're already shown in history

3. **Avoid Duplication**: When rendering `allApprovalLines`, check if a specific combination already exists in history
   - Match by `department.id` + `jobPosition.id` + `line` number
   - If a matching history entry exists, don't render the corresponding line from `allApprovalLines`
   - This prevents showing the same approval line twice (once as history, once as pending)

4. **Key Matching Logic**:
   ```typescript
   // Check if a specific department/job position combo already has history
   const getApprovalForLine = (lineNumber: number, departmentId: string, jobPositionId: string) => {
     return allApprovals.find((item) => 
       item.line === lineNumber &&
       item.department.id === departmentId &&
       item.jobPosition.id === jobPositionId
     );
   };
   
   // When rendering allApprovalLines
   approvalHistory.allApprovalLines
     .filter(line => line.status !== 'completed')
     .filter(line => {
       const existingHistory = getApprovalForLine(line.line, line.department.id, line.jobPosition.id);
       return !existingHistory; // Only show if no history entry exists
     })
     .map(line => {
       // Render pending/current line
     });
   ```

5. **Visual Distinction**:
   - **History items**: Full cards with status badges, notes, creator info (completed actions)
   - **Current lines**: Highlighted with blue background, pulse animation (waiting for action)
   - **Pending lines**: Muted appearance with dashed border (future steps)

9. **Workflow Guideline UI — Principles for Creating Workflow Information**

When exposing "how this workflow works" to users (e.g. an info dialog or help section), follow these principles so the guideline is clear, scannable, and aligned with actual statuses and roles. **Approval steps (who approves) must be dynamic from Master Approval configuration**, not hardcoded.

**Dynamic data — Master Approval**

0. **Approval steps driven by Master Approval**: The "who approves" (Role / Dept) content must come from the active Master Approval configuration for the entity, not from static copy (e.g. avoid hardcoding "HSE Department Head" or "default one line"). This keeps the guideline in sync with what is configured under Master Data → Master Approvals.
   - **Entity key**: Use the module's approval entity constant from `@/modules/master-data/constants/approval-entities` (e.g. `APPROVAL_ENTITIES.INCIDENT`, `APPROVAL_ENTITIES.INSPECTION_ITEM`). Align with backend `APPROVAL_ENTITIES` so the same entity name is used in `m_approvals.entity`.
   - **Fetch config**: Load the active Master Approval for that entity (e.g. `masterApprovalService.getAll({ search: entityName, limit: 20, isActive: true })` then take the record where `entity === entityName`, or use a dedicated by-entity API if available).
   - **Render approval lines**: For the approval step(s), render one line or one sub-card per `masterApproval.items` entry (ordered by `order`). For each item display:
     - **Department**: Use `item.department.name` when present; if `item.departmentId` is the sentinel `@ENTITY_DEPARTMENT`, display the label **"Dynamic: From Entity Data"**.
     - **Job position**: Use `item.jobPosition.name` when present; if `item.jobPositionId` is the sentinel `@ENTITY_JOB_POSITION`, display **"Dynamic: From Entity Data (Department Head)"**.
   - **Fallback**: If no active Master Approval exists for the entity, show a short fallback line (e.g. "Approval is configured in Master Data → Master Approvals.") instead of inventing static approver text.

**Content principles**

1. **Status per step**: For each step, state which **status(es)** apply. Use the same labels as in the app (e.g. "Open Issue / Rejected", "Waiting Verification"), not internal enum names.
2. **Concrete ownership**: For each step, state **who** is responsible. For approval steps, use the dynamic approval lines from Master Approval (see Dynamic data above). For non-approval steps, prefer:
   - **Who**: Short, direct label (e.g. "Inspection creator", "Assigned dept / Assignee", "Approver (per approval line)").
   - **Role / Dept**: One line describing the role or department (e.g. "User who created the parent inspection (any department)", "Department or person set as Assigned Department or Assignee on the item"). Avoid vague labels like "Creator" or "Verifier" without this context.
3. **One-line description**: Add a single sentence per step describing what the responsible party does and how the step ends (e.g. "Records the finding and initial details. Editable until submitted for verification.").
4. **Terminal/outcome state**: If the workflow has a final state (e.g. Closed), include a short callout: one line that states the state name and that no further edits are allowed (e.g. "Closed — When all approvers have approved, status becomes Close. No further edits; view only.").

**Structure principles**

5. **Sequential steps**: Present a small number of ordered steps (e.g. 3). Label each as "Step 1", "Step 2", "Step 3" with a clear title (e.g. Finding, Action Plan, Verify).
6. **Consistent fields per step**: Use the same structure for every step so users can scan quickly. Recommended: **Status** | **Responsible** | **Role / Dept**, then the one-line description. Use a definition list (`<dl>`) or equivalent for the first three so layout is consistent.
7. **Short intro**: Keep the dialog/section intro to one line (e.g. "Three stages with clear ownership. See who is responsible at each step.").

**UI/UX principles**

8. **One card per step**: Each step is one card with: (a) header row: icon + step number + title, (b) definition list for Status / Responsible / Role-Dept, (c) footer: one-line description with a visual separator (e.g. `border-t`). For approval steps, Role/Dept may list multiple lines (one per Master Approval item) or a short summary when many lines exist.
9. **Semantic color per step**: Use a distinct color per step (e.g. blue, orange, green) with light tint and border; support dark mode (e.g. `dark:bg-*-950/20`, `dark:border-*-800/50`).
10. **Connectors**: Between steps use a simple connector (e.g. arrow icon). On desktop show horizontally with connectors; on mobile stack steps. Mark decorative connectors with `aria-hidden`.
11. **Terminal state callout**: Render the terminal state (e.g. Closed) in a single, muted callout below the steps (e.g. `bg-muted/60`, one line with bold label and short explanation).
12. **Dialog layout**: If the guideline is in a dialog: `p-0 gap-0` on content; header and body use consistent horizontal padding (e.g. `px-6`); body has bottom padding (e.g. `pb-6`).

**Reference**: Master Approval setup: `MasterApprovalForm.tsx` (entity, items with order, department/job position, sentinel values). Workflow info dialog pattern: Inspection Items list page — "Inspection Item Workflow" info dialog (`InspectionItemsPage.tsx`). Apply the same pattern to Incidents, Incident Security, Risk Assessments, Audits, and any entity with status-based workflow and approval lines; **use dynamic approval steps from Master Approval** for the entity.

**Implementation Pattern**:

```typescript
// Status-based action buttons in PageHeader actions
<PageHeader
  title={`Document: ${document.code}`}
  actions={
    <div className="flex gap-2 flex-wrap">
      {/* Status-based workflow actions */}
      {(status === GeneralStatusEnum.SCHEDULED || 
        status === GeneralStatusEnum.DRAFT) && (
        <Button 
          variant="default"
          onClick={handleSubmit}
          disabled={isUpdatingStatus}
        >
          <Send className="h-4 w-4 mr-2" />
          {isUpdatingStatus ? 'Submitting...' : 'Submit'}
        </Button>
      )}

      {status === GeneralStatusEnum.OPEN && (
        <Button 
          variant="default"
          onClick={handleRequestApproval}
          disabled={isUpdatingStatus}
        >
          <Send className="h-4 w-4 mr-2" />
          {isUpdatingStatus ? 'Requesting...' : 'Request Approval'}
        </Button>
      )}

      {status === GeneralStatusEnum.WAITING_APPROVAL && canApprove && (
        <>
          <Button 
            variant="default"
            onClick={() => {
              setApprovalInitialStatus(ApprovalStatus.APPROVED);
              setIsApprovalModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              setApprovalInitialStatus(ApprovalStatus.REJECTED);
              setIsApprovalModalOpen(true);
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </>
      )}

      {/* Standard actions (always visible when applicable) */}
      <Button variant="outline" onClick={handleExportPDF}>
        <FileDown className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      
      {/* Conditional edit based on status */}
      {status !== GeneralStatusEnum.DONE && 
       status !== GeneralStatusEnum.REJECTED && (
        <Button 
          variant="outline"
          onClick={() => navigate(`/path/${id}/edit`)}
        >
          <FileEdit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
    </div>
  }
/>
```

**Status Transition Handlers**:

```typescript
// Handler for status transitions
const handleSubmit = async () => {
  if (!id || !document) return;

  try {
    setIsUpdatingStatus(true);
    await documentService.update(id, {
      status: GeneralStatusEnum.OPEN,
    });
    toast.success('Document submitted successfully');
    await refreshDocument(); // Refresh to show new status
  } catch (error) {
    console.error('Failed to submit document:', error);
    toast.error('Failed to submit document');
  } finally {
    setIsUpdatingStatus(false);
  }
};

const handleRequestApproval = async () => {
  if (!id || !document) return;

  try {
    setIsUpdatingStatus(true);
    await documentService.update(id, {
      status: GeneralStatusEnum.WAITING_APPROVAL,
    });
    toast.success('Approval requested successfully');
    await refreshDocument();
  } catch (error) {
    console.error('Failed to request approval:', error);
    toast.error('Failed to request approval');
  } finally {
    setIsUpdatingStatus(false);
  }
};
```

**Approval Dialog Pattern**:

```typescript
// Approval dialog with pre-selected status
<ApprovalDialog
  open={isApprovalModalOpen}
  onOpenChange={setIsApprovalModalOpen}
  documentId={id}
  onApprovalSubmitted={handleApprovalSubmitted}
  initialStatus={approvalInitialStatus} // Pre-select approve/reject
/>

// ApprovalDialog component accepts initialStatus prop
interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  onApprovalSubmitted: () => void;
  initialStatus?: ApprovalStatus; // Pre-select status
}
```

**Key Guidelines**:

1. **Status Enum Usage**: Use `GeneralStatusEnum` constants consistently across modules
2. **Button Placement**: Place workflow actions first, then standard actions (Export, Edit)
3. **Icon Consistency**: Use semantic icons (Send for submit/request, CheckCircle2 for approve, XCircle for reject)
4. **Responsive Layout**: Use `flex-wrap` for button groups to handle overflow on smaller screens
5. **State Management**: Use separate state for status updates (`isUpdatingStatus`) vs general loading
6. **Data Refresh**: Always refresh document data after status change to reflect new state and button visibility
7. **Permission Checks**: Verify user permissions server-side; use client-side checks for UI optimization only

**Common Workflow Patterns**:

- **Draft/Scheduled → Open**: "Submit" button
- **Open → Waiting Approval**: "Request Approval" button
- **Waiting Approval**: "Approve" and "Reject" buttons (permission-based)
- **Done/Rejected**: Hide edit and workflow actions, show read-only actions only

**Apply to**: Risk Assessments, Work Permits, Approvals, Certificates, PPE Withdrawals, and any entity with status-based workflow.
