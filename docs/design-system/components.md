# Components

> All UI primitives live in `frontend/src/core/components/ui/` (shadcn/ui over Radix).
> Use the existing component before creating a new one.

## Primitives (shadcn/ui)

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Card`, `Dialog`, `Sheet`, `Popover`, `Tooltip`, `Badge`, `Avatar`, `Tabs`, `Accordion`, `Table`, `Toast` (Sonner), `Form`, `Label`, `Separator`, `Skeleton`, `ScrollArea`, `Calendar`, `DropdownMenu`, `Command`.

## Project-specific shared components

| Component | Use |
|---|---|
| `DataTable` (`@/core/components/ui/data-table/DataTable`) | **All** tables. Provides sorting, selection, pagination, row actions, empty state. |
| `PageHeader` | **All** pages. Title + breadcrumb + actions row. Never put inside a form component. |
| `ModalCombobox` | Combobox **inside a Dialog**. Not portal-based — avoids aria-hidden/focus issues. |
| `SearchableSelect` | Combobox **outside** dialogs only. |
| `Icon` (`@/core/components/ui/icon`) | Wrapper over Lucide for consistent sizing. |

## Button hierarchy

| Variant | Use |
|---|---|
| Primary (default) | Main action (Submit, Save, Create) |
| Outline / Secondary | Cancel, Back |
| Ghost | Tertiary actions in tight UI |
| Destructive | Delete, Reject |

Action-color rules:
- Approve = `bg-green-600 hover:bg-green-700` (semantic green for approval)
- Reject = `variant="destructive"`
- Submit = primary

## Page form layout

```
PageHeader (page level)
  └── max-w-4xl mx-auto wrapper
      └── Card form
          └── CardHeader / CardContent (space-y-6)
              └── grid grid-cols-1 md:grid-cols-2 gap-6 (related fields)
                  or single column (full-width fields like textarea)
```

## Form rules

- React Hook Form + Zod resolver
- Schema-validated; one source of state
- Two-column grid for related short fields; single column for textareas, long inputs, file upload
- Modal for ≤5 fields; full page for complex/multi-step

## Dialog rules

- **Inside Dialog**: use `ModalCombobox`, **not** `SearchableSelect` (portal/focus conflict)
- **Dropdown opens a Dialog**: close the dropdown first to prevent focus traps
- Use `Sheet` for side-panel forms when full-page is overkill

## Tables (via DataTable)

- Sortable headers, sticky header
- Row hover, action menu in three-dot dropdown (View / Edit / Delete; Delete confirms)
- Selection + bulk action bar for repetitive ops
- Empty state with friendly message + primary CTA
- Loading state via skeleton

## Workflow / status UI

- Action buttons appear based on `(status × permission)` — never always-visible
- Disable during transitions; show "Approving…", "Submitting…"
- Refresh data after every status change
- Approval timeline: `history[]` first, then non-completed `allApprovalLines[]` deduped by `(dept.id + jobPosition.id + line)`. See `frontend/TRD.md` §Document Workflow & Status Management Patterns (line 386).

## PDF export

Client-side via `react-to-pdf`. Dedicated template component, hidden off-screen, full data fetched before capture. See `frontend/TRD.md` §PDF Export (line 720).

## Empty / loading / error states

- Empty: icon + short message + primary CTA ("Create first item")
- Loading: skeleton when layout is known; spinner only as fallback
- 403 on data-scoped row: explicit message "You do not have access to this record"
- Empty list ≠ error; show empty state, not an error
