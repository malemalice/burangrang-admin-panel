> [← Frontend TRD Index](./index.md)

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
      limit: 100, // Get all for dropdown
      options: true // Bypass permission check - user needs options for form, not full module access
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
};
```

**Options Bypass for Select/Dropdown Data:** When fetching list data for form dropdowns (roles, departments, offices, etc.), add `options: true` to the query params. This allows users who have form access (e.g. `certificate:create`) but not the list permission (e.g. `department:list`) to still load options. The backend accepts `?options=true` and bypasses the permission check for authenticated users on endpoints that support it.

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
Consistent form handling across all modules. **See [docs/design-system/principles.md](../../design-system/principles.md) §Form Page Specific Guidelines for complete page structure and layout patterns.**

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

      // Fetch options from other modules (options: true bypasses permission check for dropdown data)
      const [rolesResponse, officesResponse] = await Promise.all([
        roleService.getRoles({ page: 1, limit: 100, options: true }),
        officeService.getOffices({ page: 1, limit: 100, options: true })
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

#### 3. Data-Level Access (Backend)

For **data-scoped modules** (Enrollments, Work Permits, Certificates, PPE Withdrawals), the backend enforces row-level access (SELF / DEPARTMENT / SUPER). The frontend does not implement data-level logic; it must handle backend behavior correctly:

- **List (findAll):** The API may return fewer rows or an empty list when the user's role has SELF or DEPARTMENT scope. Treat empty or partial results as **valid** — do not show a generic "error" or assume data is missing due to a bug. Show an empty state (e.g. "No records" or "No records you have access to") when the list is empty.
- **Single record (get by id, update, delete, related actions):** The API may return **403 Forbidden** (e.g. message "You do not have access to this record") when the user does not have access to that row. Handle 403 with a clear, user-friendly message (e.g. toast or inline: "You do not have access to this record") and navigate away or back to list as appropriate; do not treat 403 as a generic server error.
- **Principle:** Do not assume the user can see all rows in these modules. Empty lists and 403 on detail/update/delete are expected for users with SELF or DEPARTMENT scope.

Reference: [docs/trd/backend/security.md](../backend/security.md), `docs/auth.md`.
