> [← Design System Index](./index.md)
>
> *Back-office UI/UX principles, layout patterns, component patterns (tables, filters, modals, status), and advanced features (PDF export, bulk actions). Two large sub-topics live in their own files: [workflow-status.md](./workflow-status.md) (action visibility, approval timeline, dynamic workflow guideline UI) and [form-layout.md](./form-layout.md) (page structure, spacing, state patterns).*

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

Moved to its own file on 2026-05-24 — see **[workflow-status.md](./workflow-status.md)** for status-based action visibility, approval timeline rendering, dynamic workflow guideline UI, status transition handlers, and the approval dialog pattern.

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

Moved to its own file on 2026-05-24 — see **[form-layout.md](./form-layout.md)** for field organisation, column layout, page structure (PageHeader → max-w-4xl → Card form), spacing, action buttons, state patterns, and optimal viewport.

### Summary Principle

> For back-office systems, **efficiency, clarity, and error prevention** are more important than visual flourish. Design with **consistent spacing, semantic colors, clear typography, and dense data displays**. Use **data tables as primary interface**, support **keyboard navigation and bulk actions**, and provide **immediate feedback** with proper status indicators. Layout should be **task-oriented, logically grouped**, and guide users with minimal cognitive load while maximizing information density.
