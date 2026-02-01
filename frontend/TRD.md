# Technical Requirements Document (TRD)
## Frontend Modular Architecture Restructuring

### 📋 Document Information
- **Version**: 1.8
- **Date**: 2024-12-20
- **Status**: Active
- **Author**: Development Team
- **Last Updated**: PDF Export (Detail Page) implementation principles added

---

## 🎯 Executive Summary

This document outlines the technical requirements and architectural principles for restructuring the frontend application from a traditional layered architecture to a modular, feature-based architecture. The restructuring aims to improve maintainability, scalability, and developer experience while following modern frontend best practices.

**Version 1.8 Updates**: Added "PDF Export (Detail Page) — Implementation Principles" under Advanced Features: react-to-pdf, dedicated PDF template, full data fetch before capture, hidden target, data fallback, filename/UX, template structure. Reference: RiskAssessmentDetailPage, RiskAssessmentPDFTemplate.
**Version 1.7 Updates**: Added "List page state persistence (index → view → back)" under Search & Filters: URL as source of truth for list state, derive state from `useSearchParams`, sync URL on list actions, Back button uses `navigate(-1)`. Reference: AuditResultsPage, RiskRegisterPage, RisksPage.
**Version 1.6 Updates**: Added "Searchable Select/Combobox Inside Dialog Pattern" documenting critical aria-hidden conflicts when using portaled components (Popover, Select) inside Dialog modals. Provides solution using ModalCombobox component with absolute positioning (no portals) for guaranteed interactivity. Includes root cause analysis, failed solution attempts, implementation principles, and usage patterns.
**Version 1.5 Updates**: Added Dropdown + Dialog pattern to prevent focus trap issues when dropdown menus interact with dialogs. Includes state management, event handling, and cleanup patterns to ensure proper dropdown closing and prevent `aria-hidden` focus traps that block user interactions.
**Version 1.4 Updates**: Merged form layout principles from `frontend-form-general-layout.md`, including page structure patterns (PageHeader → max-w-4xl wrapper → Form Component), component hierarchy guidelines, layout patterns (two-column grid, spacing standards), state patterns (loading/error states), and action button patterns. Enhanced "Form Page Specific Guidelines" and "Form Component Patterns" sections with complete implementation examples and quick reference checklist.

**Version 1.3 Updates**: Added comprehensive UI/UX principles section for back-office systems, including user-centered design principles, layout patterns (Master-Detail, Data Density), component patterns (Data Tables, Search & Filters, Modal vs Page), advanced features (Bulk Actions, Undo/Redo, Audit Trails, Export), form-specific guidelines, and enhanced design system details (typography scale, spacing system, button hierarchy, icon usage, semantic status colors). Merged UI/UX principles from `ui-ux-principle.md` to provide complete design guidance.

**Version 1.2 Updates**: Added comprehensive design system documentation including color system, typography, spacing, component patterns, theme system, animations, and design system best practices. Provides complete reference for UI/UX consistency across all modules.

**Version 1.1 Updates**: Added comprehensive module interaction patterns including API calling conventions, table display standards, CRUD operation patterns, form handling guidelines, data transformation patterns, error handling strategies, and cross-module communication protocols. Includes implementation checklists, code examples library, and development workflow guidelines.

---

## 🏗️ Current State Analysis

### Current Modules Identified
1. **Core Module** (Dashboard, Settings, Login, NotFound)
2. **Users Module** (User management)
3. **Roles Module** (Role & permissions management)
4. **Menus Module** (Navigation menu management)
5. **Master Data Module** (Offices, Departments, Job Positions, Approvals)

---

## 🎯 Target Architecture

### Architectural Principles

#### 1. Domain-Driven Design (DDD)
- Groups related functionality by business domain
- Reduces cognitive load when working on specific features
- Follows the "screaming architecture" principle

#### 2. Feature-Based Architecture
- Each module is self-contained
- Easier to maintain, test, and scale
- Supports micro-frontend patterns if needed later

#### 3. Separation of Concerns
- Clear boundaries between modules
- Reduces coupling between different business areas
- Follows Single Responsibility Principle

#### 4. Scalability & Maintainability
- New modules won't affect existing ones
- Team members can work on different modules independently
- Easier onboarding for new developers

---

## 📁 Target Folder Structure

```
src/
├── core/                          # Core infrastructure & shared utilities
│   ├── components/                # Shared UI components
│   │   ├── layout/               # Layout components (MainLayout, Sidebar, etc.)
│   │   └── ui/                   # Reusable UI components (shadcn/ui)
│   ├── hooks/                    # Shared custom hooks
│   ├── lib/                      # Core utilities & configurations
│   │   ├── api.ts               # HTTP client & interceptors
│   │   ├── auth.tsx             # Authentication logic
│   │   ├── types.ts             # Global/shared types
│   │   ├── utils.ts             # Utility functions
│   │   └── theme/               # Theme configuration
│   ├── pages/                    # Core application pages
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── Index.tsx
│   └── routes/                   # Core routing configuration
│       ├── index.ts
│       ├── types.ts
│       └── renderRoutes.tsx
│
├── modules/                       # Feature modules
│   ├── users/                    # User management module
│   │   ├── components/           # User-specific components
│   │   ├── pages/               # User pages
│   │   ├── services/            # User business logic
│   │   ├── types/               # User-specific types
│   │   ├── hooks/               # User-specific hooks
│   │   ├── routes/              # User routing
│   │   └── index.ts             # Module exports
│   │
│   ├── roles/                   # Role management module
│   ├── master-data/             # Master data module (renamed from master)
│   ├── menus/                   # Menu management module
│   └── settings/                # Settings module
│
├── shared/                      # Cross-module shared resources
│   ├── constants/               # Application constants
│   ├── utils/                   # Helper utilities
│   ├── validators/              # Zod schemas
│   └── types/                   # Cross-module types
│
├── App.tsx                      # Root application component
├── main.tsx                     # Application entry point
└── index.css                    # Global styles
```

---

## 🏛️ Module Structure Template

Each module MUST follow this consistent structure:

```
modules/[module-name]/
├── components/           # Module-specific components
├── pages/               # Module pages
├── services/            # Business logic & API calls
├── types/               # Module-specific types
├── hooks/               # Module-specific hooks
├── routes/              # Module routing configuration
├── validators/          # Module validation schemas (optional)
├── constants/           # Module constants (optional)
└── index.ts             # Module barrel exports
```

### Module Barrel Export Pattern
```typescript
// modules/[module-name]/index.ts
export * from './components';
export * from './pages';
export * from './services';
export * from './types';
export * from './hooks';
export * from './routes';
```

---

## 🔧 Technical Implementation Guidelines

### 1. Import Path Management
- Use TypeScript path mapping in `tsconfig.json`
- Create barrel exports for cleaner imports
- Use IDE refactoring tools for automated updates

```typescript
// tsconfig.json paths
{
  "paths": {
    "@/core/*": ["./src/core/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/shared/*": ["./src/shared/*"]
  }
}
```

### 2. Route Registration Pattern
```typescript
// core/routes/index.ts
import userRoutes from '@/modules/users/routes/userRoutes';
import roleRoutes from '@/modules/roles/routes/roleRoutes';

export const allRoutes = [
  ...coreRoutes,
  ...userRoutes,
  ...roleRoutes,
  // ... other routes
];
```

### 3. Module Communication Guidelines
- **Keep module state local** when possible
- Use React Context for cross-module state
- Consider Zustand for complex shared state
- Implement event bus for module communication if needed

### 4. Shared Component Strategy
- Keep truly shared components in `core/components/ui/`
- Create module-specific variants when needed
- Use composition over inheritance
- Document component usage and dependencies

---

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
3. **Full data before capture**: If the page shows paginated children, PDF must include all. On export: fetch all items (e.g. `page: 1`, `limit: 10000`) and refresh approval status in parallel; put results in state; wait ~200 ms for re-render; then call `toPDF()` so the captured DOM has the full dataset.
4. **Hidden target**: Render the template in a div with `ref={targetRef}`, off-screen (`position: 'absolute', left: '-9999px', top: '-9999px'`), fixed width (e.g. `210mm`), `aria-hidden="true"`. Only this div is used for PDF.
5. **Data fallback**: Pass to template: items = `allItemsForPDF.length ? allItemsForPDF : items`, approval = `approvalHistoryForPDF ?? approvalHistory` so PDF still works if the full fetch hasn’t completed or fails.
6. **UX**: Filename = `{entityCode}-{yyyyMMdd-HHmmss}.pdf`. Disable export and show "Preparing PDF…" while loading; toast on success/error.
7. **Template structure**: Header (title + code + date) → Details (key fields; optional HTML with `dangerouslySetInnerHTML` in a constrained block) → Full data table(s) → Approval timeline (workflow + history) if applicable. Format dates with `date-fns`; use semantic colors for status.

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

---

## 🎨 Design System

### Overview

The frontend application uses a comprehensive design system built on modern web technologies to ensure consistency, accessibility, and maintainability across all modules. The design system is based on **shadcn/ui** components, **Tailwind CSS** for styling, and a custom **BurangrangDesign System** color and theme system.

### Core Technologies

#### 1. Component Library: shadcn/ui
- **Base**: Built on **Radix UI** primitives for accessibility and functionality
- **Styling**: Tailwind CSS with `class-variance-authority` for variant management
- **Location**: `src/core/components/ui/`
- **Philosophy**: Copy-paste components that can be customized per project needs
- **Key Features**:
  - Fully accessible components with ARIA support
  - Unstyled by default, styled with Tailwind
  - TypeScript-first with full type safety
  - Composable and customizable

#### 2. Styling: Tailwind CSS
- **Version**: 3.4+
- **Configuration**: `tailwind.config.ts`
- **Base Colors**: Imported from `src/core/lib/theme/colors.ts`
- **CSS Variables**: Dynamic theming via HSL color variables
- **Plugins**: `tailwindcss-animate` for animations
- **Dark Mode**: Class-based (`dark:` prefix)

#### 3. Icon System: Lucide React
- **Library**: `lucide-react` (v0.462+)
- **Wrapper Component**: `src/core/components/ui/icon.tsx`
- **Icon Picker**: `src/core/components/ui/icon-picker.tsx` for dynamic icon selection
- **Usage**: Import icons directly or use the `Icon` wrapper component
- **Size Standards**:
  - 16px (h-4 w-4) - Inline with text, default
  - 20px (h-5 w-5) - Buttons, form fields
  - 24px (h-6 w-6) - Cards, section headers
  - 32px+ (h-8 w-8+) - Empty states, large displays
- **Consistency**: Use one icon library (Lucide React) throughout
- **Placement**: Left of text in buttons, right for dropdowns
- **Color**: Inherit text color or use semantic colors (primary, destructive, etc.)

### Color System

#### BurangrangDesign System Colors

The application uses a comprehensive color token system defined in `src/core/lib/theme/colors.ts`:

```typescript
// Base color palette with full scale (50-950)
baseColors = {
  indigo: { 50-950 },    // Primary brand color
  purple: { 50-950 },    // Secondary brand color
  orange: { 50-950 },     // Accent color
  slate: { 50-950 },     // Neutrals
  green: { 50-950 },     // Success states
  red: { 50-950 },       // Error/destructive states
  yellow: { 50-950 },    // Warning states
  blue: { 50-950 },      // Info states
  gray: { 50-950 },      // Additional neutrals
}
```

#### Semantic Color Tokens

Semantic colors map to specific UI purposes:

```typescript
semanticColors = {
  app: {
    background: slate[50],
    foreground: slate[800],
    primary: indigo[500],
    secondary: purple[700],
    accent: orange[500],
    muted: slate[100],
    border: slate[200],
  },
  text: {
    primary: slate[800],
    secondary: slate[600],
    muted: slate[500],
    disabled: slate[400],
    link: indigo[600],
  },
  status: {
    success: { light, base, dark, foreground },
    warning: { light, base, dark, foreground },
    error: { light, base, dark, foreground },
    info: { light, base, dark, foreground },
  }
}
```

#### Theme Color Variants

Users can select from multiple theme color options:
- `blue` (default)
- `green`
- `purple`
- `red`
- `orange`
- `indigo`

Each theme provides `primary`, `secondary`, and `accent` color variants in HSL format for Tailwind CSS compatibility.

### Typography

#### Font System
- **Base Font**: System font stack (inherits from Tailwind defaults)
- **Font Sizes**: Tailwind's default scale (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
- **Font Weights**: 
  - `font-medium` (500) - Default for buttons and emphasis
  - `font-semibold` (600) - Card titles, section headers
  - `font-bold` (700) - Page titles, important headings

#### Typography Scale Reference

Complete typography scale for back-office systems:

```
H1: 2rem (32px) - Page titles
H2: 1.5rem (24px) - Section headers
H3: 1.25rem (20px) - Sub-sections
H4: 1.125rem (18px) - Card headers
Body: 0.875rem - 1rem (14-16px) - Main content
Small: 0.75rem - 0.875rem (12-14px) - Labels, captions
Tiny: 0.625rem - 0.75rem (10-12px) - Hints, timestamps

Font Weight:
- Regular (400): Body text
- Medium (500): Labels, emphasized text, buttons
- Semibold (600): Table headers, form labels
- Bold (700): Headings, important numbers
```

#### Typography Patterns

```typescript
// Page titles
<h1 className="text-2xl font-bold tracking-tight">{title}</h1>

// Card titles
<h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>

// Section headers
<h3 className="text-lg font-medium mb-4">{title}</h3>

// Body text
<p className="text-sm text-muted-foreground">{content}</p>

// Labels
<label className="text-sm font-medium">{label}</label>
```

### Spacing & Layout

#### Spacing Scale
Uses Tailwind's default spacing scale (0.25rem increments) following 8px grid system:
- `space-1` = 0.25rem (4px) - xs: Icon gaps, tight spacing
- `space-2` = 0.5rem (8px) - sm: Input padding, compact lists
- `space-3` = 0.75rem (12px)
- `space-4` = 1rem (16px) - md: Form field spacing, card padding
- `space-6` = 1.5rem (24px) - lg: Section spacing
- `space-8` = 2rem (32px) - xl: Major section dividers
- `space-12` = 3rem (48px) - 2xl: Page content margins

Additional custom spacing variables in `theme.css`:
```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
```

#### Layout Patterns

**Main Layout Structure**:
```typescript
// Main content area
<main className="flex-1 p-4 md:p-6 overflow-x-auto">
  <div className="animate-fade-in">{children}</div>
</main>

// Sidebar widths
sidebarOpen ? "md:ml-64" : "md:ml-20"  // 256px / 80px

// Card padding
<CardContent className="p-6 pt-0" />
<CardHeader className="flex flex-col space-y-1.5 p-6" />
```

**Common Spacing Patterns**:
- Page padding: `p-4 md:p-6`
- Card padding: `p-6`
- Form field gaps: `gap-4` or `space-y-6`
- Button groups: `gap-2`
- Section margins: `mb-6` or `mb-4`

### Border Radius

Consistent border radius across components:
- **Default**: `--radius: 0.5rem` (8px)
- **Small**: `calc(var(--radius) - 4px)` = 4px
- **Medium**: `calc(var(--radius) - 2px)` = 6px
- **Large**: `var(--radius)` = 8px
- **Full**: `rounded-full` for badges and avatars

### Shadows & Elevation

Standard shadow utilities for visual hierarchy:
- `shadow-sm` - Subtle elevation (cards): `0 1px 3px rgba(0,0,0,0.1)`
- `shadow-md` - Medium elevation (modals, popovers): `0 4px 6px rgba(0,0,0,0.1)`
- `shadow-lg` - High elevation (dropdowns): `0 10px 15px rgba(0,0,0,0.1)`

### Borders

Consistent border styling:
- **Border width**: 1px solid for dividers, inputs
- **Border color**: Neutral-200 to neutral-300 (`border-border` token)
- **Border radius**: Follows radius system (see Border Radius section)

### Component Variants

#### Button Variants & Hierarchy

Button hierarchy for back-office systems (priority order):

1. **Primary** (default): Filled, high contrast - Main action (Save, Submit, Create)
   ```typescript
   default: "bg-primary text-primary-foreground hover:bg-primary/90"
   ```

2. **Secondary**: Outlined - Alternative actions (Cancel, Back)
   ```typescript
   outline: "border border-input bg-background hover:bg-accent"
   secondary: "bg-secondary text-secondary-foreground"
   ```

3. **Tertiary/Ghost**: Text only - Low priority (View Details, Edit)
   ```typescript
   ghost: "hover:bg-accent hover:text-accent-foreground"
   ```

4. **Destructive**: Red primary - Delete, Remove, Reject
   ```typescript
   destructive: "bg-destructive text-destructive-foreground"
   ```

5. **Link**: Text with underline - Navigation actions
   ```typescript
   link: "text-primary underline-offset-4 hover:underline"
   ```

6. **Icon Buttons**: Square/circular for compact actions
   ```typescript
   icon: "h-10 w-10"
   ```

**Size variants**:
- `sm`: h-9 (36px) - Compact contexts
- `default`: h-10 (40px) - Standard buttons
- `lg`: h-11 (44px) - Prominent actions
- `icon`: h-10 w-10 (40px) - Icon-only buttons

#### Badge Variants
```typescript
default: "border-transparent bg-primary text-primary-foreground"
secondary: "border-transparent bg-secondary text-secondary-foreground"
destructive: "border-transparent bg-destructive text-destructive-foreground"
outline: "text-foreground"
```

### Theme System

#### Light/Dark Mode
- **Toggle**: User-selectable via `useTheme()` hook
- **Persistence**: Saved to localStorage and backend
- **System Detection**: Respects `prefers-color-scheme` on first load
- **Implementation**: CSS variables with `.dark` class on `document.documentElement`

#### Theme Provider
```typescript
// Usage
import { useTheme } from '@/core/lib/theme';

const { theme, mode, setTheme, setMode, toggleMode, isDark } = useTheme();
```

#### CSS Variables
Dynamic CSS variables set via JavaScript:
```css
--primary: [HSL values from theme]
--secondary: [HSL values from theme]
--accent: [HSL values from theme]
--background: [mode-dependent]
--foreground: [mode-dependent]
--muted: [mode-dependent]
--border: [mode-dependent]
--radius: 0.5rem
```

### Animation & Transitions

#### Animation Durations
```css
--transition-fast: 150ms;
--transition-normal: 250ms;
--transition-slow: 400ms;
```

#### Custom Animations
Defined in `tailwind.config.ts`:
- `fade-in`: Opacity + translateY animation
- `fade-out`: Reverse fade-in
- `accordion-down/up`: Height transitions
- `spin-slow`: 3s rotation for loading indicators

#### Common Animation Patterns
```typescript
// Loading spinner
<div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />

// Page transitions
<div className="animate-fade-in">{content}</div>

// Sidebar transitions
<div className="transition-all duration-300 ease-in-out" />
```

### Form Components

#### Form Library Stack
- **Validation**: Zod schemas
- **Form Management**: React Hook Form
- **Resolver**: `@hookform/resolvers/zod`
- **Components**: shadcn/ui Form components

#### Form Patterns
```typescript
// Form setup
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
});

// Form field
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**⚠️ Important**: When forms are rendered inside Dialog modals, use `ModalCombobox` instead of `SearchableSelect` for searchable select fields. See "Searchable Select/Combobox Inside Dialog Pattern" in Module Interaction Patterns section for details.

### Status & Feedback

#### Toast Notifications
- **Library**: Sonner
- **Position**: `bottom-right`
- **Features**: Rich colors, action buttons, auto-dismiss
- **Usage**: `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`

#### Status Badges
Consistent status color mapping following semantic color system:

```typescript
// Semantic Status Colors
active/approved/success: green-100 bg, green-800 text
pending/in-progress/warning: yellow-100 bg, yellow-800 text (amber)
inactive/draft: gray-100 bg, gray-800 text
rejected/error/destructive: red-100 bg, red-800 text
info/new: blue-100 bg, blue-800 text
```

**Status Color Guidelines**:
- **Active/Approved**: Green - Positive states, completed actions
- **Pending/In Progress**: Yellow/Amber - Warnings, pending states
- **Inactive/Draft**: Gray - Neutral, non-active states
- **Rejected/Error**: Red - Errors, destructive actions, critical alerts
- **Info/New**: Blue - Informational messages, new items

All status badges use light background (100) with dark text (800) for optimal readability and contrast.

### Component Usage Guidelines

#### ✅ DO - Best Practices

1. **Use Design System Components**
   ```typescript
   // ✅ Use shared components
   import { Button } from '@/core/components/ui/button';
   import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
   ```

2. **Use Semantic Color Tokens**
   ```typescript
   // ✅ Use semantic colors
   className="bg-primary text-primary-foreground"
   className="text-muted-foreground"
   className="border-border"
   ```

3. **Consistent Spacing**
   ```typescript
   // ✅ Use Tailwind spacing scale
   <div className="flex gap-4 p-6">
   <div className="space-y-2">
   ```

4. **Theme-Aware Components**
   ```typescript
   // ✅ Use theme hook for dynamic theming
   const { theme, isDark } = useTheme();
   ```

5. **Accessible Components**
   ```typescript
   // ✅ Use shadcn/ui components (built on Radix UI)
   // ✅ Include ARIA labels where needed
   // ✅ Use proper semantic HTML
   ```

#### ❌ DON'T - Anti-Patterns

1. **Hard-coded Colors**
   ```typescript
   // ❌ DON'T use hard-coded colors
   className="bg-blue-500 text-white"
   
   // ✅ DO use semantic tokens
   className="bg-primary text-primary-foreground"
   ```

2. **Inline Styles for Colors**
   ```typescript
   // ❌ DON'T use inline styles for theming
   style={{ backgroundColor: '#6366f1' }}
   
   // ✅ DO use CSS variables or Tailwind classes
   className="bg-primary"
   ```

3. **Custom Component Variants**
   ```typescript
   // ❌ DON'T create module-specific button variants
   <button className="custom-module-button">
   
   // ✅ DO extend existing variants or use composition
   <Button variant="outline" className="module-specific-class">
   ```

4. **Inconsistent Spacing**
   ```typescript
   // ❌ DON'T use arbitrary values
   className="p-[13px] m-[7px]"
   
   // ✅ DO use Tailwind scale
   className="p-4 m-2"
   ```

5. **Direct Icon Imports Everywhere**
   ```typescript
   // ❌ DON'T import all icons in every file
   import { User, Settings, Home } from 'lucide-react';
   
   // ✅ DO use Icon component or import only needed icons
   import { Icon } from '@/core/components/ui/icon';
   <Icon name="User" />
   ```

### Design System Files Reference

```
src/
├── core/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── icon.tsx
│   │   │   └── ...
│   │   └── layout/                # Layout components
│   │       ├── MainLayout.tsx
│   │       ├── DynamicSidebar.tsx
│   │       └── TopNavbar.tsx
│   └── lib/
│       ├── theme/
│       │   ├── colors.ts          # Color tokens
│       │   ├── utils.ts           # Theme utilities
│       │   ├── ThemeProvider.tsx  # Theme context
│       │   └── theme.css          # CSS variables
│       └── utils.ts               # cn() utility
├── index.css                      # Tailwind imports + CSS variables
└── tailwind.config.ts             # Tailwind configuration
```

### Design System Checklist

When implementing new components or pages:

- [ ] **Colors**: Use semantic color tokens, not hard-coded values
- [ ] **Spacing**: Use Tailwind spacing scale consistently
- [ ] **Typography**: Follow established text size and weight patterns
- [ ] **Components**: Use shadcn/ui components from `@/core/components/ui`
- [ ] **Icons**: Use Lucide React icons consistently
- [ ] **Theme**: Ensure components work in both light and dark modes
- [ ] **Accessibility**: Include ARIA labels, keyboard navigation support
- [ ] **Responsive**: Use Tailwind responsive prefixes (sm:, md:, lg:)
- [ ] **Animations**: Use established animation patterns
- [ ] **Forms**: Use React Hook Form + Zod validation
- [ ] **Feedback**: Use Sonner toast notifications for user feedback

---

## 🔄 Module Interaction Patterns

### API Calling Patterns

#### 1. Service Layer Architecture
Each module MUST follow this service pattern:

```typescript
// modules/[module-name]/services/[moduleName]Service.ts
import api from '@/core/lib/api';
import { [Entity]DTO, Create[Entity]DTO, Update[Entity]DTO } from '../types/[moduleName].types';

// Data transformation functions
const map[Entity]DtoTo[Entity] = ([entity]Dto: [Entity]DTO): [Entity] => ({
  // Transform DTO to frontend model
});

const map[Entity]ToUpdateDto = ([entity]: Partial<[Entity]>): Update[Entity]DTO => ({
  // Transform frontend model to update DTO
});

const [moduleName]Service = {
  // GET all with pagination
  get[Entities]: async (params: PaginationParams): Promise<PaginatedResponse<[Entity]>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/[entities]?${queryParams.toString()}`);
    return {
      data: response.data.data.map(map[Entity]DtoTo[Entity]),
      meta: response.data.meta
    };
  },

  // GET single entity
  get[Entity]ById: async (id: string): Promise<[Entity]> => {
    const response = await api.get(`/[entities]/${id}`);
    return map[Entity]DtoTo[Entity](response.data);
  },

  // CREATE entity
  create[Entity]: async ([entity]Data: Create[Entity]DTO): Promise<[Entity]> => {
    const response = await api.post('/[entities]', [entity]Data);
    return map[Entity]DtoTo[Entity](response.data);
  },

  // UPDATE entity
  update[Entity]: async (id: string, [entity]Data: Update[Entity]DTO): Promise<[Entity]> => {
    const response = await api.patch(`/[entities]/${id}`, [entity]Data);
    return map[Entity]DtoTo[Entity](response.data);
  },

  // DELETE entity
  delete[Entity]: async (id: string): Promise<void> => {
    await api.delete(`/[entities]/${id}`);
  }
};

export default [moduleName]Service;
```

#### 2. Inter-Module API Calls
When one module needs data from another module:

```typescript
// ❌ DON'T - Direct service import from another module
import { roleService } from '@/modules/roles';

// ✅ DO - Import through barrel export
import { roleService } from '@/modules/roles';

// ✅ BETTER - Use shared service for common operations
import { roleService } from '@/modules/roles';

// In component/service that needs role data
const fetchRolesForDropdown = async () => {
  try {
    const response = await roleService.getRoles({
      page: 1,
      limit: 100 // Get all for dropdown
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
};
```

### Table Display Patterns

#### 1. DataTable Component Usage
All tables MUST use the shared `DataTable` component:

```typescript
// modules/[module-name]/pages/[ModuleName]sPage.tsx
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/core/components/ui/dropdown-menu';
import { [Entity] } from '../types/[moduleName].types';

const [ModuleName]sPage = () => {
  const [data, setData] = useState<[Entity][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [[entity]ToDelete, set[Entity]ToDelete] = useState<[Entity] | null>(null);

  // Define columns with consistent structure
  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: ([entity]: [Entity]) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {[entity].name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{[entity].name}</div>
            <div className="text-sm text-gray-500">{[entity].email}</div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: ([entity]: [Entity]) => (
        <Badge variant="outline" className={`${
          [entity].status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        } border-0`}>
          {[entity].status}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ([entity]: [Entity]) => (
        <DropdownMenu
          open={openDropdownId === [entity].id}
          onOpenChange={(open) => setOpenDropdownId(open ? [entity].id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/${entities}/${[entity].id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/${entities}/${[entity].id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDeleteClick([entity], e)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false
    }
  ];

  return (
    <div>
      <PageHeader
        title="[ModuleName]s"
        subtitle="Manage your organization's [entities]"
        actions={
          <Button onClick={() => navigate('/[entities]/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add [Entity]
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalItems / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalItems
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            set[Entity]ToDelete(null);
            setOpenDropdownId(null);
          }
        }}
        title="Delete [Entity]"
        description={`Are you sure you want to delete "${[entity]ToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};
```

#### 2. Dropdown + Dialog Pattern (Critical)
**IMPORTANT**: When using dropdown menus with delete/action dialogs, follow this pattern to prevent focus trap issues:

**Problem**: Dropdown portal wrapper gets stuck with `aria-hidden="true"` when dialog opens, causing focus trap that blocks all clicks.

**Solution Pattern**:

```typescript
// State management - use single openDropdownId (not Record<string, boolean>)
const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [[entity]ToDelete, set[Entity]ToDelete] = useState<[Entity] | null>(null);

// Close dropdown FIRST, then open dialog
const handleDeleteClick = ([entity]: [Entity], event?: React.MouseEvent) => {
  event?.stopPropagation(); // Prevent event bubbling
  setOpenDropdownId(null); // Explicitly close dropdown
  set[Entity]ToDelete([entity]);
  setDeleteDialogOpen(true);
};

// Close dropdown after successful delete
const handleDeleteConfirm = async () => {
  if (![entity]ToDelete) return;
  try {
    await [moduleName]Service.delete[Entity]([entity]ToDelete.id);
    toast.success('[Entity] deleted successfully');
    setOpenDropdownId(null); // Ensure closed
    fetch[Entities]();
  } catch (error) {
    toast.error('Failed to delete [entity]');
  } finally {
    setDeleteDialogOpen(false);
    set[Entity]ToDelete(null);
  }
};

// Always close dropdown when dialog closes
const handleDialogCancel = () => {
  setDeleteDialogOpen(false);
  set[Entity]ToDelete(null);
  setOpenDropdownId(null); // Ensure closed
};

// In JSX - use controlled dropdown state
<DropdownMenu
  open={openDropdownId === [entity].id}
  onOpenChange={(open) => setOpenDropdownId(open ? [entity].id : null)}
>
  {/* ... dropdown content */}
  <DropdownMenuItem
    className="text-red-600"
    onClick={(e) => handleDeleteClick([entity], e)} // Pass event
  >
    <Trash2 className="mr-2 h-4 w-4" /> Delete
  </DropdownMenuItem>
</DropdownMenu>

// Dialog with onOpenChange callback
<ConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={(open) => {
    if (!open) handleDialogCancel(); // Ensure cleanup
  }}
  title="Delete [Entity]"
  description={`Delete "${[entity]ToDelete?.name}"?`}
  onConfirm={handleDeleteConfirm}
  variant="destructive"
/>
```

**Key Principles**:
1. **Single State**: Use `openDropdownId: string | null` (not `Record<string, boolean>`)
2. **Explicit Closing**: Close dropdown at multiple points (click, confirm, cancel)
3. **Event Handling**: Use `stopPropagation()` to prevent bubbling
4. **Defensive Cleanup**: Always close dropdown when dialog closes

**Apply to**: All pages with dropdown + delete dialogs (UsersPage, RolesPage, OfficesPage, DepartmentsPage, MenusPage, RiskAssessmentsPage, etc.)

#### 3. Searchable Select/Combobox Inside Dialog Pattern (Critical)
**IMPORTANT**: When using searchable select/combobox components inside Dialog modals, you MUST use portal-free components to avoid aria-hidden conflicts.

**Problem**: When a Popover or Select component (using portals) opens inside a Dialog, Radix UI Dialog sets `aria-hidden="true"` on itself, blocking ALL interactions with the portaled content. This causes:
- ❌ Cannot type in search input
- ❌ Cannot click on options
- ❌ Hover cursor doesn't change
- ❌ Console warnings: "Blocked aria-hidden on an element because its descendant retained focus"

**Root Cause**: Radix UI Dialog's focus trap management conflicts with portaled Popover/Select content. Both components use portals, and Dialog's focus management sets `aria-hidden` on sibling portals.

**Failed Solutions** (What doesn't work):
1. ❌ `modal={true}` on Popover - Creates competing focus traps
2. ❌ `modal={false}` on Dialog - Dialog still manages focus scope
3. ❌ High z-index values - Doesn't solve aria-hidden blocking
4. ❌ Inline rendering with `inModal` prop - Positioning issues with scrollable dialogs
5. ❌ Using Radix UI Select primitive - Still uses portals, same conflict

**The ONLY Working Solution**: Use `ModalCombobox` component which uses **absolute positioning WITHOUT portals**.

**Solution Pattern**:

```typescript
// ✅ DO - Use ModalCombobox inside Dialog
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';

// In form component
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        {showCard ? (
          // Outside modal - use SearchableSelect with portal
          <SearchableSelect
            options={options}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Select option"
            searchPlaceholder="Search..."
          />
        ) : (
          // Inside Dialog - use ModalCombobox without portal
          <ModalCombobox
            options={options}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Select option"
            searchPlaceholder="Search..."
          />
        )}
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// In Dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <FormComponent showCard={false} /> {/* Pass showCard={false} */}
  </DialogContent>
</Dialog>
```

**ModalCombobox Implementation Principles**:
1. **No Portals**: Uses `position: absolute` instead of portals
2. **Native HTML Elements**: Uses `<button>`, `<input>`, `<div>` - no Radix UI primitives
3. **Direct Event Handlers**: `onClick`, `onMouseEnter`, `onMouseLeave` for guaranteed interactivity
4. **Auto-focus Search**: Search input automatically focuses when dropdown opens
5. **Proper z-index**: `z-[100]` to ensure visibility above dialog content
6. **Event Propagation**: `onClick={(e) => e.stopPropagation()}` on search input

**Key Principles**:
1. **Portal-Free Inside Dialogs**: Never use portaled components (Popover, Select with portal) inside Dialog
2. **Conditional Rendering**: Use `showCard` prop to switch between SearchableSelect (with portal) and ModalCombobox (without portal)
3. **Native Elements**: When inside Dialog, prefer native HTML elements over Radix UI primitives
4. **Absolute Positioning**: Use `position: absolute` with proper z-index for dropdown content
5. **Direct Event Handling**: Use direct event handlers (`onClick`, `onMouseEnter`) instead of library abstractions

**Component Location**: `src/core/components/ui/modal-combobox.tsx`

**Apply to**: All forms that are rendered inside Dialog modals (RiskAssessmentItemForm, AssignCourseDialog, etc.)

#### 4. Filter Field Configuration
Consistent filter patterns across all modules:

```typescript
// Define filter fields for dropdowns and search
const filterFields: FilterField[] = [
  {
    id: 'name',
    label: 'Name',
    type: 'text'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  {
    id: 'roleId',
    label: 'Role',
    type: 'searchableSelect',
    options: roles.map(role => ({
      label: role.name,
      value: role.id
    }))
  }
];
```

### CRUD Operation Patterns

#### 1. Hook-Based CRUD Operations
Each module MUST provide custom hooks for data operations:

```typescript
// modules/[module-name]/hooks/use[ModuleName].ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import [moduleName]Service from '../services/[moduleName]Service';
import { [Entity], PaginatedResponse, [Entity]SearchParams, Create[Entity]DTO, Update[Entity]DTO } from '../types/[moduleName].types';

export const use[Entities] = () => {
  const [[entities], set[Entities]] = useState<[Entity][]>([]);
  const [total[Entities], setTotal[Entities]] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch[Entities] = async (params: [Entity]SearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<[Entity]> = await [moduleName]Service.get[Entities](params);
      set[Entities](response.data);
      setTotal[Entities](response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch [entities]';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const create[Entity] = async ([entity]Data: Create[Entity]DTO) => {
    try {
      const new[Entity] = await [moduleName]Service.create[Entity]([entity]Data);
      set[Entities](prev => [new[Entity], ...prev]);
      setTotal[Entities](prev => prev + 1);
      toast.success('[Entity] created successfully');
      return new[Entity];
    } catch (err) {
      toast.error('Failed to create [entity]');
      throw err;
    }
  };

  const update[Entity] = async (id: string, [entity]Data: Update[Entity]DTO) => {
    try {
      const updated[Entity] = await [moduleName]Service.update[Entity](id, [entity]Data);
      set[Entities](prev => prev.map(item => item.id === id ? updated[Entity] : item));
      toast.success('[Entity] updated successfully');
      return updated[Entity];
    } catch (err) {
      toast.error('Failed to update [entity]');
      throw err;
    }
  };

  const delete[Entity] = async (id: string) => {
    try {
      await [moduleName]Service.delete[Entity](id);
      set[Entities](prev => prev.filter(item => item.id !== id));
      setTotal[Entities](prev => prev - 1);
      toast.success('[Entity] deleted successfully');
    } catch (err) {
      toast.error('Failed to delete [entity]');
      throw err;
    }
  };

  return {
    [entities],
    total[Entities],
    currentPage,
    isLoading,
    error,
    fetch[Entities],
    create[Entity],
    update[Entity],
    delete[Entity],
  };
};

export const use[Entity] = (id: string | null = null) => {
  const [[entity], set[Entity]] = useState<[Entity] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch[Entity] = async (entityId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await [moduleName]Service.get[Entity]ById(entityId);
      set[Entity](data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch [entity]';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetch[Entity](id);
    }
  }, [id]);

  return {
    [entity],
    isLoading,
    error,
    fetch[Entity],
    set[Entity],
  };
};
```

#### 2. Form Component Patterns
Consistent form handling across all modules. **See "Form Page Specific Guidelines" section above for complete page structure and layout patterns.**

**Page-Level Structure (Create/Edit Page):**
```typescript
// modules/[module-name]/pages/Create[Entity]Page.tsx or Edit[Entity]Page.tsx
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { [Entity]Form } from './[Entity]Form';

const Create[Entity]Page = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <PageHeader
        title="Create [Entity]"
        subtitle="Add a new [entity] to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/[entities]')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <[Entity]Form mode="create" />
      </div>
    </>
  );
};
```

**Form Component:**
```typescript
// modules/[module-name]/pages/[Entity]Form.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import [moduleName]Service from '../services/[moduleName]Service';
import { Create[Entity]DTO, Update[Entity]DTO } from '../types/[moduleName].types';
import { SearchableSelect } from '@/core/components/ui/searchable-select';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  // ... other fields
});

type FormValues = z.infer<typeof formSchema>;

interface [Entity]FormProps {
  [entity]?: [Entity];
  mode: 'create' | 'edit';
}

const [Entity]Form = ({ [entity], mode }: [Entity]FormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      // ... other defaults
    },
  });

  useEffect(() => {
    if ([entity]) {
      form.reset({
        name: [entity].name,
        email: [entity].email,
        // ... map other fields
      });
    }
    setIsLoading(false);
  }, [[entity]]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        await [moduleName]Service.create[Entity](data);
        toast.success('[Entity] created successfully');
      } else if ([entity]) {
        await [moduleName]Service.update[Entity]([entity].id, data);
        toast.success('[Entity] updated successfully');
      }
      navigate('/[entities]');
    } catch (error) {
      console.error('Error saving [entity]:', error);
      toast.error(`Failed to ${mode} [entity]`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} [Entity]</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... other form fields */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/[entities]')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

**Form Layout Quick Checklist:**
- [ ] PageHeader at page level (not inside form component)
- [ ] `max-w-4xl mx-auto` wrapper around form component
- [ ] Form component returns Card directly (no PageHeader inside)
- [ ] Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-6`) for related fields
- [ ] Consistent spacing (`space-y-6` for form, `gap-6` for grids, `gap-4` for buttons)
- [ ] Standardized loading/error states (see State Patterns above)
- [ ] Action buttons with `flex justify-end gap-4` at form bottom
- [ ] Cancel button uses `variant="outline"`, Submit uses primary button

#### 3. Cross-Module Data Dependencies
When forms need data from other modules:

```typescript
// In [Entity]Form.tsx - Loading options from other modules
useEffect(() => {
  const fetchOptions = async () => {
    try {
      setIsLoading(true);

      // Fetch options from other modules
      const [rolesResponse, officesResponse] = await Promise.all([
        roleService.getRoles({ page: 1, limit: 100 }),
        officeService.getOffices({ page: 1, limit: 100 })
      ]);

      setRoles(rolesResponse.data);
      setOffices(officesResponse.data);
    } catch (error) {
      console.error('Failed to load form options:', error);
      toast.error('Failed to load form options');
    } finally {
      setIsLoading(false);
    }
  };

  fetchOptions();
}, []);
```

### Data Transformation Patterns

#### 1. DTO to Model Mapping
Consistent data transformation patterns:

```typescript
// modules/[module-name]/services/[moduleName]Service.ts

// DTO from backend
interface [Entity]DTO {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  // ... other backend fields
}

// Frontend model
interface [Entity] {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  // ... frontend-specific fields
}

// Transformation function
const map[Entity]DtoTo[Entity] = ([entity]Dto: [Entity]DTO): [Entity] => ({
  id: [entity]Dto.id,
  name: [entity]Dto.name,
  status: [entity]Dto.isActive ? 'active' : 'inactive',
  createdAt: [entity]Dto.createdAt,
  // ... transform other fields
});

// Reverse transformation for updates
const map[Entity]ToUpdateDto = ([entity]: Partial<[Entity]>): Update[Entity]DTO => ({
  name: [entity].name,
  isActive: [entity].status === 'active',
  // ... transform other fields
});
```

#### 2. Pagination Response Handling
Standard pagination response pattern:

```typescript
// Shared types in core/lib/types.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}
```

### Error Handling Patterns

#### 1. Consistent Error Messages
Standard error handling across all modules:

```typescript
// In services
try {
  const response = await api.post('/[entities]', data);
  return map[Entity]DtoTo[Entity](response.data);
} catch (error: any) {
  console.error('Error creating [entity]:', error);
  const errorMessage = error.response?.data?.message || 'Failed to create [entity]';
  throw new Error(errorMessage);
}

// In hooks/components
try {
  await create[Entity](data);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Failed to create [entity]';
  toast.error(errorMessage);
}
```

#### 2. Loading States
Consistent loading state management:

```typescript
// In hooks
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// In components
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}
```

---

## 🚫 Anti-Patterns to Avoid

### 1. Circular Dependencies
- Define clear module boundaries
- Use dependency inversion principle
- Create shared interfaces in `shared/types/`

### 2. Tight Coupling
- Avoid direct imports between modules
- Use shared interfaces for communication
- Implement proper abstraction layers

### 3. Shared State Pollution
- Keep module state isolated
- Use proper state management patterns
- Avoid global state for module-specific data

### 4. Inconsistent Structure
- Follow the module template strictly
- Use linting rules to enforce structure
- Regular code reviews for compliance

### 5. Inconsistent API Patterns
- ❌ DON'T mix different error handling patterns
- ❌ DON'T skip data transformation in services
- ❌ DON'T bypass custom hooks for direct service calls in components
- ❌ DON'T create module-specific table components

### 6. Poor Cross-Module Communication
- ❌ DON'T access another module's internal state directly
- ❌ DON'T create direct dependencies between modules
- ❌ DON'T duplicate data fetching logic across modules

### 7. Inconsistent Form Handling
- ❌ DON'T skip Zod validation schemas
- ❌ DON'T mix different form libraries
- ❌ DON'T handle form state manually when using react-hook-form

### 8. Design System Violations
- ❌ DON'T use hard-coded color values instead of semantic tokens
- ❌ DON'T create module-specific component variants when existing ones suffice
- ❌ DON'T use arbitrary spacing values outside Tailwind scale
- ❌ DON'T bypass design system components for custom implementations
- ❌ DON'T ignore theme support (light/dark mode)

---

## ✅ Implementation Checklist

### Module Structure Compliance
- [ ] **Barrel exports**: All modules have proper `index.ts` with exports
- [ ] **Consistent folder structure**: All required folders exist (`components/`, `pages/`, `services/`, `types/`, `hooks/`, `routes/`)
- [ ] **TypeScript path mapping**: All imports use `@/` aliases
- [ ] **Module boundaries**: Clear separation between modules

### API & Service Layer
- [ ] **Service pattern**: All services follow the established CRUD pattern
- [ ] **Data transformation**: DTO to model mapping implemented for all entities
- [ ] **Error handling**: Consistent error handling across all services
- [ ] **API consistency**: All endpoints follow RESTful patterns

### Table & Data Display
- [ ] **DataTable usage**: All tables use the shared `DataTable` component
- [ ] **Column definitions**: Consistent column structure across modules
- [ ] **Action menus**: Standardized action dropdowns with icons
- [ ] **Pagination**: Consistent pagination implementation
- [ ] **Filtering**: Proper filter field configuration

### CRUD Operations
- [ ] **Custom hooks**: All modules provide `use[Entities]` and `use[Entity]` hooks
- [ ] **Loading states**: Proper loading state management
- [ ] **Error states**: Comprehensive error handling with user feedback
- [ ] **Success feedback**: Toast notifications for all operations

### Form Handling
- [ ] **Zod validation**: All forms use Zod schemas for validation
- [ ] **React Hook Form**: Consistent form library usage
- [ ] **Form components**: Proper form field components and layouts
- [ ] **Cross-module dependencies**: Proper handling of related entity data

### Cross-Module Communication
- [ ] **Barrel imports**: All inter-module imports use barrel exports
- [ ] **Service isolation**: No direct access to other modules' internal state
- [ ] **Shared types**: Common types defined in `shared/types/`
- [ ] **Dependency management**: Clear dependency hierarchy

### Design System Compliance
- [ ] **Color usage**: All colors use semantic tokens from design system
- [ ] **Component usage**: shadcn/ui components used consistently
- [ ] **Spacing**: Tailwind spacing scale used throughout
- [ ] **Typography**: Consistent font sizes and weights
- [ ] **Theme support**: Components work in both light and dark modes
- [ ] **Icons**: Lucide React icons used consistently
- [ ] **Animations**: Standard animation patterns followed

### Code Quality
- [ ] **TypeScript compliance**: Full type safety across all modules
- [ ] **Error boundaries**: Proper error boundaries where needed
- [ ] **Performance**: No unnecessary re-renders or API calls
- [ ] **Accessibility**: ARIA labels and keyboard navigation support

---

## 📚 Code Examples Library

### Quick Reference Patterns

#### 1. Module Setup Template
```typescript
// modules/[module-name]/index.ts
export * from './components';
export * from './pages';
export * from './services';
export * from './types';
export * from './hooks';
export * from './routes';
```

#### 2. Service Method Template
```typescript
// Standard CRUD methods
get[Entities]: async (params: PaginationParams) => { /* ... */ }
get[Entity]ById: async (id: string) => { /* ... */ }
create[Entity]: async (data: Create[Entity]DTO) => { /* ... */ }
update[Entity]: async (id: string, data: Update[Entity]DTO) => { /* ... */ }
delete[Entity]: async (id: string) => { /* ... */ }
```

#### 3. Hook Template
```typescript
// Collection hook
export const use[Entities] = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (params) => { /* ... */ };
  const createItem = async (data) => { /* ... */ };
  const updateItem = async (id, data) => { /* ... */ };
  const deleteItem = async (id) => { /* ... */ };

  return { data, isLoading, error, fetchData, createItem, updateItem, deleteItem };
};

// Single item hook
export const use[Entity] = (id) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (id) fetchData(id); }, [id]);

  return { data, isLoading, error, setData };
};
```

#### 4. Form Schema Template
```typescript
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  roleId: z.string().min(1, 'Role is required'),
  officeId: z.string().min(1, 'Office is required'),
  departmentId: z.string().optional(),
  jobPositionId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;
```

#### 5. Table Column Template
```typescript
const columns = [
  {
    id: 'name',
    header: 'Name',
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar><AvatarFallback>{item.name[0]}</AvatarFallback></Avatar>
        <div><div className="font-medium">{item.name}</div></div>
      </div>
    ),
    isSortable: true
  },
  {
    id: 'status',
    header: 'Status',
    cell: (item) => (
      <Badge variant="outline" className={item.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}>
        {item.status}
      </Badge>
    ),
    isSortable: true
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: (item) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/${item.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(item)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    isSortable: false
  }
];
```

---

## 🔧 Development Workflow

### 1. Creating a New Module
1. Create module folder: `src/modules/[module-name]/`
2. Create required folders: `components/`, `pages/`, `services/`, `types/`, `hooks/`, `routes/`
3. Implement types first (`types/[moduleName].types.ts`)
4. Create service layer (`services/[moduleName]Service.ts`)
5. Implement custom hooks (`hooks/use[ModuleName].ts`)
6. Create pages following established patterns
7. Add routes and update main routing
8. Create barrel exports (`index.ts`)
9. Update navigation and permissions if needed

### 2. Adding Features to Existing Modules
1. Add new types to `types/[moduleName].types.ts`
2. Extend service with new methods
3. Update hooks to include new functionality
4. Create/update pages following patterns
5. Update barrel exports
6. Test integration with existing features

### 3. Cross-Module Integration
1. Identify shared data needs
2. Use barrel exports for clean imports
3. Create shared types if needed
4. Implement proper error handling
5. Test both modules independently
6. Test integrated functionality

---

## 📊 Module Development Metrics

### Quality Gates
- **Test Coverage**: > 80% for all modules
- **TypeScript Compliance**: 100% type safety
- **Performance Budget**: < 100KB bundle per module
- **Accessibility Score**: > 90 on Lighthouse
- **SEO Score**: > 85 on Lighthouse (where applicable)

### Code Review Checklist
- [ ] Module structure follows template
- [ ] All patterns are correctly implemented
- [ ] No circular dependencies
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] TypeScript types are complete
- [ ] Tests are included
- [ ] Documentation is updated

---

## 🎯 Next Steps

1. **Review Current Implementation**: Audit existing modules against these patterns
2. **Create Module Template**: Develop a Yeoman/generator for new modules
3. **Establish Linting Rules**: Create ESLint rules for pattern compliance
4. **Documentation Updates**: Keep this document synchronized with implementation
5. **Team Training**: Ensure all developers understand these patterns
6. **Continuous Improvement**: Regularly review and update patterns based on experience

---

## 📊 Success Metrics

### Code Quality Metrics
- [ ] **Cyclomatic Complexity**: < 10 per function
- [ ] **Coupling**: < 3 dependencies per module
- [ ] **Cohesion**: > 80% related functionality per module
- [ ] **Test Coverage**: > 90% for critical paths

### Developer Experience Metrics
- [ ] **Time to locate files**: < 30 seconds
- [ ] **Onboarding time**: < 2 days for new developers
- [ ] **Build time**: No significant increase
- [ ] **Bundle size**: No significant increase

### Maintainability Metrics
- [ ] **Module independence**: 100% of modules can be developed independently
- [ ] **Change impact**: < 2 modules affected per feature change
- [ ] **Code reuse**: > 60% of components are reusable

---

## 🔄 Migration Strategy

### Phase 1: Core Infrastructure (Week 1-2)
1. Move shared components to `core/components/`
2. Restructure `lib/` into `core/lib/`
3. Update import paths and TypeScript configuration
4. Create shared utilities in `shared/`

### Phase 2: Module by Module (Week 3-6)
1. Start with smallest module (e.g., settings)
2. Create module structure following template
3. Move and reorganize files
4. Update imports and routes
5. Test thoroughly before next module
6. Repeat for each module

### Phase 3: Cleanup & Optimization (Week 7-8)
1. Remove duplicate services
2. Optimize barrel exports
3. Update documentation
4. Performance testing and optimization
5. Team training and knowledge transfer

---

## 🎯 Benefits

### Immediate Benefits
- ✅ **Clear ownership**: Each module has defined boundaries
- ✅ **Easier navigation**: Related files are co-located
- ✅ **Reduced cognitive load**: Focus on one module at a time
- ✅ **Better testing**: Module-specific test organization

### Long-term Benefits
- ✅ **Scalability**: Easy to add new modules
- ✅ **Team collaboration**: Multiple developers can work independently
- ✅ **Code reusability**: Clear separation of shared vs module-specific code
- ✅ **Maintainability**: Changes isolated to specific modules
- ✅ **Micro-frontend ready**: Easy to extract modules if needed

---

## 📚 References

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Feature-Based Architecture](https://martinfowler.com/articles/feature-toggles.html)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 📝 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.8 | 2024-12-20 | Development Team | Added "PDF Export (Detail Page) — Implementation Principles" under Advanced Features: react-to-pdf, dedicated PDF template, full data fetch before capture, hidden target, data fallback, filename/UX, template structure. Reference: RiskAssessmentDetailPage, RiskAssessmentPDFTemplate. |
| 1.7 | 2024-12-20 | Development Team | Added "List page state persistence (index → view → back)" under Search & Filters: URL as source of truth for list state, derive state from useSearchParams, sync URL on list actions, Back uses navigate(-1). Reference: AuditResultsPage, RiskRegisterPage, RisksPage. |
| 1.6 | 2024-12-20 | Development Team | Added "Searchable Select/Combobox Inside Dialog Pattern" to Module Interaction Patterns section. Documents critical issue where portaled components (Popover, Select) inside Dialog modals cause aria-hidden conflicts that block all interactions. Provides solution using ModalCombobox component with absolute positioning (no portals) for guaranteed interactivity inside Dialogs. Includes failed solution attempts, root cause analysis, implementation principles, and usage patterns. Updated Form Components section with warning about using ModalCombobox inside dialogs. |
| 1.5 | 2024-12-XX | Development Team | Merged form layout principles from `frontend-form-general-layout.md`, including page structure patterns (PageHeader → max-w-4xl wrapper → Form Component), component hierarchy guidelines, layout patterns (two-column grid, spacing standards), state patterns (loading/error states), and action button patterns. Enhanced "Form Page Specific Guidelines" and "Form Component Patterns" sections with complete implementation examples and quick reference checklist. |
| 1.4 | 2024-12-XX | Development Team | Added Dropdown + Dialog pattern to Table Display Patterns section. Includes critical pattern for preventing focus trap issues when dropdown menus interact with dialogs, with state management, event handling, and cleanup best practices. |
| 1.3 | 2024-12-XX | Development Team | Added comprehensive UI/UX principles section for back-office systems, including user-centered design principles, layout patterns (Master-Detail, Data Density), component patterns (Data Tables, Search & Filters, Modal vs Page), advanced features (Bulk Actions, Undo/Redo, Audit Trails, Export), form-specific guidelines, and enhanced design system details (typography scale, spacing system, button hierarchy, icon usage, semantic status colors). Merged UI/UX principles from `ui-ux-principle.md`. |
| 1.2 | 2024-12-XX | Development Team | Added comprehensive design system documentation including color system, typography, spacing, component patterns, theme system, animations, and design system best practices |
| 1.1 | 2024-12-XX | Development Team | Added comprehensive module interaction patterns, API conventions, CRUD patterns, form handling, error handling, implementation checklists, code examples library, and development workflow guidelines |
| 1.0 | 2024-01-XX | Development Team | Initial version with modular architecture principles |

---

## 📚 Appendix: Barrel Export Patterns & Guidelines

### Barrel Export Best Practices

#### 1. Module Structure Organization

Each module MUST follow this export hierarchy:

```
modules/[module-name]/
├── index.ts                    # Main module exports
├── pages/
│   ├── index.ts               # Sub-module page exports
│   └── [sub-module]/
│       ├── index.ts          # Component-specific exports
│       └── [Component].tsx
├── services/
├── types/
├── hooks/
└── routes/
```

#### 2. Main Module Index.ts Pattern

```typescript
/**
 * [Module Name] module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - Group by functionality
export { default as [MainPage] } from './pages/[MainPage]';
export { default as [CreatePage] } from './pages/[CreatePage]';
export { default as [EditPage] } from './pages/[EditPage]';
export { default as [DetailPage] } from './pages/[DetailPage]';

// Routes - Single export per module
export { default as [moduleName]Routes } from './routes/[moduleName]Routes';

// Services - Export all services
export { default as [serviceName] } from './services/[serviceName]';

// Types - Group related types
export type {
  // Core entity types
  [Entity],
  [Entity]DTO,

  // CRUD operation types
  Create[Entity]DTO,
  Update[Entity]DTO,

  // Form and UI types
  [Entity]FormData,
  [Entity]Filters,
  [Entity]SearchParams,

  // Statistics and analytics
  [Entity]Stats,

  // Common shared types
  PaginatedResponse,
  PaginationParams,
} from './types/[moduleName].types';

// Hooks - Export all custom hooks
export {
  use[Entities],
  use[Entity],
  use[Entity]Stats,
  // ... other hooks
} from './hooks/use[ModuleName]';
```

#### 3. Sub-module Index.ts Pattern

For modules with multiple sub-modules (like master-data):

```typescript
// Main pages index.ts
export * from './offices';
export * from './departments';
export * from './job-positions';
export * from './approvals';

// Sub-module index.ts
export { default as [SubModule]Page } from './[SubModule]Page';
export { default as Create[SubModule]Page } from './Create[SubModule]Page';
export { default as Edit[SubModule]Page } from './Edit[SubModule]Page';
export { default as [SubModule]Form } from './[SubModule]Form'; // If applicable
```

#### 4. Import Optimization Guidelines

**✅ DO - Use barrel exports for:**
- Importing multiple components from same module
- Importing related services
- Importing type definitions
- Cross-module dependencies

```typescript
// ✅ Good - Using barrel exports
import { officeService, departmentService } from '@/modules/master-data';
import { useUsers, useUser } from '@/modules/users';

// ✅ Good - Single service import
import { roleService } from '@/modules/roles';

// ✅ Good - Type imports
import type { User, UserDTO, CreateUserDTO } from '@/modules/users';
```

**❌ DON'T - Avoid these patterns:**
```typescript
// ❌ Bad - Individual component imports
import OfficesPage from '@/modules/master-data/pages/offices/OfficesPage';
import DepartmentsPage from '@/modules/master-data/pages/departments/DepartmentsPage';

// ❌ Bad - Deep service imports
import officeService from '@/modules/master-data/services/officeService';

// ❌ Bad - Mixing import styles
import { officeService } from '@/modules/master-data/services/officeService';
```

#### 5. Export Organization Rules

1. **Group by functionality**: Pages, Routes, Services, Types, Hooks
2. **Consistent naming**: Use camelCase for exports, PascalCase for components
3. **Type exports**: Use `export type` for type-only exports
4. **Default exports**: Use for main components and services
5. **Named exports**: Use for multiple exports from same file

#### 6. Maintenance Guidelines

**Regular Review Checklist:**
- [ ] All exported components are actually used
- [ ] No duplicate exports across modules
- [ ] Type exports are properly grouped
- [ ] Import paths are optimized
- [ ] Cross-module dependencies are minimal

**When Adding New Exports:**
1. Add to appropriate section in index.ts
2. Update import statements in dependent files
3. Test build to ensure no conflicts
4. Update documentation if needed

#### 7. Implementation Examples

**Simple Module (Settings):**
```typescript
// index.ts
export { default as SettingsPage } from './pages/SettingsPage';
export { default as settingsRoutes } from './routes/settingsRoutes';
export { default as settingsService } from './services/settingsService';
export type { UserSettings, UpdateSettingsRequest } from './types/settings.types';
export { useSettings } from './hooks/useSettings';
```

**Complex Module (Master Data):**
```typescript
// index.ts
// Pages grouped by sub-module
export { default as OfficesPage } from './pages/offices/OfficesPage';
// ... other page exports

// Single route export
export { default as masterDataRoutes } from './routes/masterDataRoutes';

// Multiple service exports
export { default as officeService } from './services/officeService';
// ... other service exports

// Comprehensive type exports
export type {
  Office, Department, JobPosition, MasterApproval,
  OfficeDTO, DepartmentDTO, JobPositionDTO, MasterApprovalDTO,
  CreateOfficeDTO, UpdateOfficeDTO,
  // ... other types
} from './types/master-data.types';

// Multiple hook exports
export {
  useOffices, useDepartments, useJobPositions, useMasterApprovals,
  useMasterDataStats
} from './hooks/useMasterData';
```

---

**Next Steps**: The module interaction patterns, design system, and UI/UX principles have been comprehensively documented. Proceed with implementing these patterns, design system guidelines, and UI/UX principles in existing modules. Use this document as the reference for all future module development, ensuring architectural consistency, design system compliance, and adherence to back-office UI/UX best practices for efficiency, clarity, and error prevention.
