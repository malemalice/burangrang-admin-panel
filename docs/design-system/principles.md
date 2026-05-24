> [← Design System Index](./index.md)

> This file holds the **UI/UX Principles** section originally in `frontend/TRD.md` L236–914, absorbed into the design system on 2026-05-24. See [exec-plan](../exec-plans/active/2026-05-24-tidy-leftover-docs.md).

## 🎨 UI/UX Principles

### Overview

When designing UI/UX for **back-office systems** (ERP, Internal Dashboards), the focus is on **efficiency, clarity, and accuracy** rather than aesthetics. Users are professionals who perform repetitive tasks, so the design should minimize friction and errors. These principles guide all design decisions and implementation patterns.

### Core Principles

#### 1. User-Centered Design
- **Understand your users**: Identify roles, responsibilities, and workflow patterns
- **Design for efficiency**: Minimize clicks, typing, and unnecessary data exposure
- **Role-based access**: Different users may need different views or permissions
- **Smart defaults**: Default frequently used values to reduce user effort

*Example:* Default frequently used products or warehouses in inventory forms.

#### 2. Task-Oriented Layout
- Prioritize **frequent tasks** prominently
- Group related fields logically following natural data entry flow
- Highlight **primary actions** (Save, Submit, Approve) consistently
- Arrange form fields to follow the natural **flow of data entry**

#### 3. Clarity and Simplicity
- Use **clear labels and hints**; avoid unnecessary jargon
- **Avoid clutter**: Show only fields needed for the task
- Ensure consistent alignment, spacing, and typography
- Left-aligned labels, right-aligned inputs, consistent font sizes

#### 4. Feedback and Error Prevention
- Provide **real-time validation** with immediate, contextual feedback
- Confirm destructive actions (delete, approve) before execution
- Use **progress indicators** for multi-step forms
- **Principle**: "Prevent mistakes and help users recover quickly"

#### 5. Efficiency & Keyboard Navigation
- Support **keyboard shortcuts** and full tab navigation
- Minimize modal popups; prefer inline editing when possible
- Enable **bulk actions** for repetitive operations
- Logical tab order, skip disabled/readonly fields

#### 6. Consistency & Predictability
- Maintain consistent layout, colors, icons, and terminology across all modules
- Users should **predict outcomes** of actions
- Follow platform conventions for web apps and ERP dashboards
- Use design system components consistently

#### 7. Hierarchy and Visual Prioritization
- Highlight important fields and actions prominently
- Secondary info can be muted or collapsible
- Use spacing and grouping to **guide attention efficiently**
- Visual weight should match importance

#### 8. Accessibility
- Ensure **readable font sizes** and high color contrast (WCAG AA minimum)
- Support screen readers with proper ARIA labels
- Enable **keyboard-only navigation** for power users
- Semantic HTML structure

#### 9. Performance Awareness
- Optimize for **fast load times** and responsive interactions
- Minimize server calls and unnecessary page refreshes
- Provide smart defaults to reduce user effort
- Use loading states and skeleton screens appropriately

#### 10. Mobile / Responsive Design
- Desktop-first approach is standard for back-office systems
- Minimum viewport width: 1280px for comfortable ERP work
- Responsive design may be needed for tablet/portable devices
- Prioritize simplified forms for smaller screens

### Layout & Structure Patterns

#### Master-Detail Pattern
- **Left/Top**: List view with selectable items
- **Right/Bottom**: Detail panel showing selected item
- Common in order management, customer records, product catalogs
- Enables quick scanning and detailed editing

#### Data Density
- ERP users often prefer **dense information** (more rows visible)
- Provide density toggle options: Comfortable → Compact → Dense
- Balance: Too sparse wastes space, too cramped causes errors
- Default to comfortable, allow user preference

#### Fixed Navigation
- **Fixed header**: Keep primary navigation and search always visible
- **Fixed sidebar**: Pin menu for quick access across pages
- **Sticky table headers**: Column headers remain visible during scroll
- Maintains context during long data entry sessions

#### Layout Options
- **Card View**: Better for visual content, fewer items
- **List/Table View**: Optimal for scanning many items with details (primary for ERP)
- **Grid View**: Product catalogs, image galleries

#### Whitespace Strategy
- Use **consistent spacing units** (8px grid: 4px, 8px, 16px, 24px, 32px)
- Group related content with tighter spacing
- Separate sections with wider spacing or dividers
- Follow Tailwind spacing scale consistently

### Component Patterns

#### Data Tables
- **Sortable columns**: Arrow indicators for sort direction
- **Row selection**: Checkboxes in first column for bulk actions
- **Pagination**: Show total count, page size options (10, 25, 50, 100)
- **Row actions**: Icons or dropdown menu at row end
- **Inline editing**: Double-click or edit icon to enable
- **Row hover state**: Subtle background change for feedback
- **Alternating rows**: Optional zebra striping for readability
- **Empty state**: Clear message with action when no data

#### Search & Filters
- **Global search**: Prominent in header, searches across entities
- **Scoped search**: Within specific page/table
- **Advanced filters**:
  - Collapsible filter panel (left/top)
  - Filter chips showing active filters
  - Clear all filters button
  - Save filter presets for reuse
- **Filter persistence**: Remember filters across sessions

**List page state persistence (index → view → back)** — For list pages with search/filters that link to a detail/view page, keep list state so "Back" returns to the same results. **Principles:** (1) **URL as source of truth**: Persist pagination, search, and filters in query params (`page`, `limit`, `search`, plus filter keys). (2) **Derive state from URL**: Use `useSearchParams()`; derive `pageIndex`, `limit`, `searchTerm`, `activeFilters` from `searchParams` in `useMemo` (not only `useState`). (3) **Sync URL on every list action**: When user changes search, filters, page, or page size, call `setSearchParams` (or an `updateSearchParams` helper) so the address bar matches list state. (4) **Back = history back**: On the detail page, the Back button MUST use `navigate(-1)` so the user returns to the previous URL (with query params); the list page then remounts with that URL and restores state. **Reference implementations:** `AuditResultsPage`, `RiskRegisterPage`, `RisksPage` (master-data).

#### Modal vs Page Decision
- **Use Modals for**:
  - Quick edits (single field changes)
  - Confirmations (delete, approve)
  - Short forms (3-5 fields max)
  - Focused tasks without navigation
- **Use Pages for**:
  - Complex forms (10+ fields)
  - Multi-step workflows
  - Content requiring full context
  - When users need to reference other data

#### Breadcrumbs
- Show navigation path: `Dashboard > Orders > #12345`
- Each segment is clickable (except current)
- Place below header or above page title
- Collapse middle segments if too long: `Dashboard > ... > #12345`

#### Status Indicators
- **Badges**: Small, pill-shaped, colored (Order Status, User Role)
- **Pills**: Larger than badges, for tags or categories
- **Progress Bars**: Percentage-based tasks or completion
- **Loading States**: Spinners, skeleton screens, progress indicators
- **Alerts/Toasts**: Success, error, warning, info messages (using Sonner)

#### Document Workflow & Status Management Patterns

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

#### Empty States
- **Illustration or Icon**: Visual representation
- **Clear Message**: "No orders found" or "No data available"
- **Action Button**: "Create Order" or "Clear Filters"
- **Helper Text**: Guide users on next steps

### Advanced Features

#### Multi-select & Bulk Actions
- **Select All**: Checkbox in table header
- **Select Across Pages**: Option to select all matching records
- **Bulk Action Bar**: Appears above table when items selected
- **Actions**: Export, Delete, Update Status, Assign, etc.
- **Confirmation**: Always confirm destructive bulk actions

#### Undo/Redo
- **Auto-save with undo**: Allow reverting recent changes
- **Toast with undo button**: "Item deleted. [Undo]"
- **Time limit**: 5-10 seconds to undo
- **Action history**: Optional history panel for power users

#### Audit Trails
- **Change Log**: Show who changed what and when
- **Field-level tracking**: Highlight modified fields
- **User attribution**: Display user name/avatar
- **Timestamp**: Relative (2 hours ago) and absolute (Dec 6, 2025 14:30)
- **Visibility**: Access via "History" or "Activity" tab

#### Export Capabilities
- **Formats**: Excel (.xlsx), CSV, PDF
- **Scope**: Current page, all pages, selected items, filtered results
- **Customization**: Choose columns to export
- **Background jobs**: For large exports with email notification

#### PDF Export (Detail Page) — Implementation Principles
Use these when adding "Export PDF" on entity detail pages (e.g. Risk Assessment, Inspection, Dispatch Order). Reference: `RiskAssessmentDetailPage`, `RiskAssessmentPDFTemplate`.

1. **Library**: `react-to-pdf` (`usePDF`). Client-side only; no backend PDF generation.
2. **Dedicated template**: One component only for PDF content (e.g. `[Entity]PDFTemplate`). Props: main entity + full list data + approval history (if applicable). Use print-safe layout: white bg, Arial, HTML tables with `borderCollapse: 'collapse'`, Tailwind for colors. No complex layout or portals.
3. **Full data before capture**: If the page shows paginated children, PDF must include all. On export: fetch all items (e.g. `page: 1`, `limit: 10000`) and refresh approval status in parallel; put results in state; wait ~200 ms for re-render; then call `generateTableAwarePdf(targetRef, buildPdfOptions({...}))` (see §8) so the captured DOM has the full dataset.
4. **Hidden target**: Render the template in a div with `ref={targetRef}`, off-screen (`position: 'absolute', left: '-9999px', top: '-9999px'`), fixed width (e.g. `210mm`), `aria-hidden="true"`. Only this div is used for PDF.
5. **Data fallback**: Pass to template: items = `allItemsForPDF.length ? allItemsForPDF : items`, approval = `approvalHistoryForPDF ?? approvalHistory` so PDF still works if the full fetch hasn't completed or fails.
6. **UX**: Filename = `{entityCode}-{yyyyMMdd-HHmmss}.pdf`. Disable export and show "Preparing PDF…" while loading; toast on success/error.
7. **Template structure**: Header (title + code + date) → Details (key fields; optional HTML with `dangerouslySetInnerHTML` in a constrained block) → Full data table(s) → **Verification and approval** (digital; see below) when the entity uses Master Approvals. Format dates with `date-fns`; use semantic colors for status.
8. **Table rows vs page breaks (html2canvas slicing)**: `react-to-pdf` tiles the screenshot at fixed page heights; long tables can look "cut" mid-row. Mark data tables with `data-pdf-table-splittable` and use `generateTableAwarePdf` from `@/core/lib/pdfExport` (clone + `prepareTableAwarePdfDom`) instead of `toPDF()` for detail/list exports that include long tables. Shared options remain `buildPdfOptions`.

#### PDF — Verification and approval section (digital)

For entities integrated with **Master Approvals**, exported PDFs must include a **Verification and approval** section that reflects **digital approval** data from the backend. Do **not** rely on a standalone traditional "Persetujuan" table or wet-signature blocks as the only source of approval evidence—use the same pattern as **`EnvironmentalMeasurementPDFTemplate`** and **`WeightReportPDFTemplate`**.

**Data source**

- Load `ApprovalStatusHistory` via `approvalService.checkApprovalStatus(entityId, APPROVAL_ENTITIES.<ENTITY>)` (align entity with backend `m_approvals.entity`).
- Pass into the PDF template as `approvalHistory?: ApprovalStatusHistory | null`.
- **Detail export**: Prefer refreshing approval immediately before capture (e.g. `approvalHistoryForPDF` snapshot) so the PDF matches the latest `t_approvals` rows—same idea as `EnvironmentalMeasurementDetailPage` / `handleExportPDF`.
- **List / bulk export**: Fetch approval status **per record** in the export queue before calling `generateTableAwarePdf` / `toPDF()` for that row so each file embeds the correct workflow and log.

**Section structure** (order and labels)

1. **Section title**: `Verification and approval` (use this English heading for consistency across modules; introductory copy elsewhere on the PDF may stay bilingual per module).
2. **Summary line**
   - **Current approval status**: `approvalHistory.currentStatus`, or fallback to the entity's workflow status field if needed.
   - If the record is **not** in a terminal "done/closed" state and `approvalHistory.nextApprover` is set: append **Next responsible party**: organizational unit (`department.name`) — position (`jobPosition.name`), and **Step** using 1-based step index (`line + 1` from the API).
3. **Approval workflow (by step)** — render when `approvalHistory.allApprovalLines.length > 0`
   - One row per configured line from Master Approval.
   - Columns: Step no., Organizational unit, Position, Status (derive per line from `line.status` and the latest matching entry in `history` for the same `line`: e.g. completed / awaiting verification / pending), Action by (approver name when completed), Date and time (of the last action on that line, if any).
4. **Chronological approval log** — render when `approvalHistory.history.length > 0`
   - Sort by `createdAt` ascending.
   - Columns: No., Status, Action by, Organizational unit, Position, Date and time, Remarks (`notes`).
5. **No workflow**: If there are no approval lines and no history rows, show a short message such as: *No approval workflow is associated with this record.*

**Layout and capture**

- Prefer plain HTML `<table>` with `style={{ borderCollapse: 'collapse' }}`, borders `border-gray-300`, header row background `bg-gray-100` for reliable `react-to-pdf` / html2canvas output.
- Optional: root wrapper `style={{ fontFamily: 'Arial, sans-serif' }}` and `text-gray-900` / `bg-white` for print clarity.
- Status text may use semantic color classes (e.g. green for approved, red for rejected), matching the on-screen timeline where practical.

**References**: `EnvironmentalMeasurementPDFTemplate.tsx`, `WeightReportPDFTemplate.tsx`, `EnvironmentalMeasurementDetailPage` (PDF + `approvalHistoryForPDF` pattern).

#### Comparison Views
- **Side-by-side**: Compare two records or versions
- **Diff highlighting**: Show differences in colors
- **Use cases**: Price comparison, version changes, duplicate detection

#### Favorites/Bookmarks
- **Star icon**: Quick-add to favorites
- **Quick access menu**: Favorites dropdown in header
- **Recent items**: Show last 5-10 accessed records
- **Pinned filters**: Save frequently used filter combinations

### Form Page Specific Guidelines

#### Field Organization
1. **Field grouping & sequence**: Match the workflow of users
2. **Default values & smart suggestions**: Reduce typing effort
3. **Inline help / tooltips**: Only show on focus or hover
4. **Mandatory vs optional fields**: Clearly mark required fields with asterisk
5. **Save progress / draft**: For long forms, allow partial saves
6. **Validation & error messages**: Immediate, contextual, non-intrusive
7. **Field width**: Match expected input length (zip code narrower than address)
8. **Related fields grouping**: Address fields together, contact fields together
9. **Tab stops**: Logical order, skip disabled/readonly fields

#### Form Column Layout
- **Single column** (mobile, narrow screens):
  - Stack all fields vertically
  - Full-width inputs
- **Two column** (desktop, standard):
  - Related fields side-by-side
  - Reduce vertical scrolling
  - Each column: 300-400px
- **Three column** (wide screens, dense forms):
  - Maximum density
  - Only for simple, short fields
  - Not recommended for complex inputs

#### Page Structure & Component Hierarchy

**Standard Form Page Structure:**
```
PageHeader → max-w-4xl wrapper → Form Component (Card)
```

**Create/Edit Pages Pattern:**
- **PageHeader** with title, subtitle, and optional back button
- **max-w-4xl mx-auto** wrapper to constrain form width
- Form component (Card inside wrapper)

**Form Component Structure:**
- ❌ **NO PageHeader inside form component** - PageHeader belongs at page level
- Returns **Card** directly with CardHeader and CardContent
- Uses `space-y-6` for consistent form field spacing

**Example Structure:**
```tsx
// Page level (Create/Edit Page)
<PageHeader
  title="Create/Edit [Entity]"
  subtitle="Description or context"
  actions={
    <Button variant="outline" onClick={() => navigate('/path')}>
      <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
    </Button>
  }
/>
<div className="max-w-4xl mx-auto">
  <[Entity]Form entity={entity} mode={mode} />
</div>

// Form Component
<Card>
  <CardHeader>
    <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} [Entity]</CardTitle>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields */}
      </form>
    </Form>
  </CardContent>
</Card>
```

#### Layout Patterns & Spacing Standards

**Field Organization:**
- **Two-column grid**: Related fields (name/code, first/last name)
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField name="firstName" />
    <FormField name="lastName" />
  </div>
  ```
- **Single column**: Full-width fields (email, description, textareas)

**Spacing Standards:**
- Form container: `space-y-6` (between form sections)
- Grid gaps: `gap-6` (between grid columns/rows)
- Button group: `gap-4` (between action buttons)
- CardContent: `space-y-6` (internal form spacing)

**Action Buttons:**
- **Position**: `flex justify-end gap-4` at form bottom
- **Cancel**: `variant="outline"`
- **Submit**: Primary button (default variant)
- **Text**: Context-specific ("Create", "Save Changes", "Update")

#### State Patterns

**Loading State:**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="flex items-center gap-2">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span>Loading [entity] details...</span>
  </div>
</div>
```

**Error State (Not Found):**
```tsx
<div className="text-center py-12">
  <h2 className="text-xl font-semibold text-gray-900 mb-2">[Entity] not found</h2>
  <p className="text-gray-600 mb-4">The [entity] you're looking for doesn't exist or has been deleted.</p>
  <Button onClick={() => navigate('/path')}>
    <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
  </Button>
</div>
```

#### Optimal Viewport & Layout
- **Minimum width**: 1280px (comfortable ERP work)
- **Ideal width**: 1366px - 1920px (most common desktop)
- **Maximum content width**: 1600px (prevents excessive line length)
- **Below 1280px**: Show simplified view or horizontal scroll warning
- **Sidebar Navigation**: 240-280px (expanded), 64-72px (collapsed)
- **Content Layout**:
  - Full-width: Data tables, dashboards, reports
  - Constrained width: Forms (max 800-1000px for readability)
  - Two-column: Long forms with left-right split
  - Three-column: Master-detail with additional panel

### Summary Principle

> For back-office systems, **efficiency, clarity, and error prevention** are more important than visual flourish. Design with **consistent spacing, semantic colors, clear typography, and dense data displays**. Use **data tables as primary interface**, support **keyboard navigation and bulk actions**, and provide **immediate feedback** with proper status indicators. Layout should be **task-oriented, logically grouped**, and guide users with minimal cognitive load while maximizing information density.
