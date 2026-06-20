> [← Design System Index](./index.md)
>
> *Reusable component patterns for back-office UI: data tables, search/filter behaviour, modal-vs-page decision, breadcrumbs, status indicators, empty states, bulk actions, undo/redo, audit trails, exports, comparison views, favourites. For full UI/UX principles, see [principles.md](./principles.md). For workflow status & approvals, see [workflow-status.md](./workflow-status.md). For PDF export, see [pdf-export.md](./pdf-export.md).*

## Component Patterns

### Data Tables
- **Sortable columns**: Arrow indicators for sort direction
- **Row selection**: Checkboxes in first column for bulk actions
- **Pagination**: Show total count, page size options (10, 25, 50, 100)
- **Row actions**: Icons or dropdown menu at row end
- **Inline editing**: Double-click or edit icon to enable
- **Row hover state**: Subtle background change for feedback
- **Alternating rows**: Optional zebra striping for readability
- **Empty state**: Clear message with action when no data

### Search & Filters
- **Global search**: Prominent in header, searches across entities
- **Scoped search**: Within specific page/table
- **Advanced filters**:
  - Collapsible filter panel (left/top)
  - Filter chips showing active filters
  - Clear all filters button
  - Save filter presets for reuse
- **Filter persistence**: Remember filters across sessions

**List page state persistence (index → view → back)** — For list pages with search/filters that link to a detail/view page, keep list state so "Back" returns to the same results. **Principles:** (1) **URL as source of truth**: Persist pagination, search, and filters in query params (`page`, `limit`, `search`, plus filter keys). (2) **Derive state from URL**: Use `useSearchParams()`; derive `pageIndex`, `limit`, `searchTerm`, `activeFilters` from `searchParams` in `useMemo` (not only `useState`). (3) **Sync URL on every list action**: When user changes search, filters, page, or page size, call `setSearchParams` (or an `updateSearchParams` helper) so the address bar matches list state. (4) **Back = history back**: On the detail page, the Back button MUST use `navigate(-1)` so the user returns to the previous URL (with query params); the list page then remounts with that URL and restores state. **Reference implementations:** `AuditResultsPage`, `RiskRegisterPage`, `RisksPage` (master-data).

### Modal vs Page Decision
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

### Breadcrumbs
- Show navigation path: `Dashboard > Orders > #12345`
- Each segment is clickable (except current)
- Place below header or above page title
- Collapse middle segments if too long: `Dashboard > ... > #12345`

### Status Indicators
- **Badges**: Small, pill-shaped, colored (Order Status, User Role)
- **Pills**: Larger than badges, for tags or categories
- **Progress Bars**: Percentage-based tasks or completion
- **Loading States**: Spinners, skeleton screens, progress indicators
- **Alerts/Toasts**: Success, error, warning, info messages (using Sonner)

### Empty States
- **Illustration or Icon**: Visual representation
- **Clear Message**: "No orders found" or "No data available"
- **Action Button**: "Create Order" or "Clear Filters"
- **Helper Text**: Guide users on next steps

### Multi-select & Bulk Actions
- **Select All**: Checkbox in table header
- **Select Across Pages**: Option to select all matching records
- **Bulk Action Bar**: Appears above table when items selected
- **Actions**: Export, Delete, Update Status, Assign, etc.
- **Confirmation**: Always confirm destructive bulk actions

### Undo/Redo
- **Auto-save with undo**: Allow reverting recent changes
- **Toast with undo button**: "Item deleted. [Undo]"
- **Time limit**: 5-10 seconds to undo
- **Action history**: Optional history panel for power users

### Audit Trails
- **Change Log**: Show who changed what and when
- **Field-level tracking**: Highlight modified fields
- **User attribution**: Display user name/avatar
- **Timestamp**: Relative (2 hours ago) and absolute (Dec 6, 2025 14:30)
- **Visibility**: Access via "History" or "Activity" tab

### Export Capabilities
- **Formats**: Excel (.xlsx), CSV, PDF (see [pdf-export.md](./pdf-export.md) for PDF rules)
- **Scope**: Current page, all pages, selected items, filtered results
- **Customization**: Choose columns to export
- **Background jobs**: For large exports with email notification

### Comparison Views
- **Side-by-side**: Compare two records or versions
- **Diff highlighting**: Show differences in colors
- **Use cases**: Price comparison, version changes, duplicate detection

### Favorites/Bookmarks
- **Star icon**: Quick-add to favorites
- **Quick access menu**: Favorites dropdown in header
- **Recent items**: Show last 5-10 accessed records
- **Pinned filters**: Save frequently used filter combinations
