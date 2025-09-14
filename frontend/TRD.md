# Technical Requirements Document (TRD)
## Frontend Modular Architecture Restructuring

### 📋 Document Information
- **Version**: 1.1
- **Date**: 2024-12-XX
- **Status**: Active
- **Author**: Development Team
- **Last Updated**: Module Interaction Patterns Added

---

## 🎯 Executive Summary

This document outlines the technical requirements and architectural principles for restructuring the frontend application from a traditional layered architecture to a modular, feature-based architecture. The restructuring aims to improve maintainability, scalability, and developer experience while following modern frontend best practices.

**Version 1.1 Updates**: Added comprehensive module interaction patterns including API calling conventions, table display standards, CRUD operation patterns, form handling guidelines, data transformation patterns, error handling strategies, and cross-module communication protocols. Includes implementation checklists, code examples library, and development workflow guidelines.

---

## 🏗️ Current State Analysis

### Existing Architecture Issues
- ❌ **Scattered files**: Pages, routes, and services are in separate top-level folders
- ❌ **Mixed patterns**: Some modules grouped (master data), others scattered (users, roles)
- ❌ **Duplicate services**: `role.service.ts` and `roleService.ts` exist
- ❌ **Inconsistent organization**: Master data is grouped, but users/roles are not
- ❌ **Tight coupling**: Pages directly import multiple services
- ❌ **No clear module boundaries**: Difficult to identify feature ownership

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
        <DropdownMenu>
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
            <DropdownMenuItem onClick={() => handleDelete([entity])}>
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
    </div>
  );
};
```

#### 2. Filter Field Configuration
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
Consistent form handling across all modules:

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

**Next Steps**: The module interaction patterns have been documented. Proceed with implementing these patterns in existing modules and use this document as the reference for all future module development.
