> [← Frontend TRD Index](./index.md)
>
> *DataTable wiring, the Dropdown+Dialog focus-trap workaround, the ModalCombobox-inside-Dialog rule, and filter field configuration.*

## Table Display Patterns

### 1. DataTable Component Usage
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

### 2. Dropdown + Dialog Pattern (Critical)
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

### 3. Searchable Select/Combobox Inside Dialog Pattern (Critical)
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

### 4. Filter Field Configuration
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
