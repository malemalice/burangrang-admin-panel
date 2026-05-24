> [← Frontend TRD Index](./index.md)
>
> *Service-layer architecture for module API calls, inter-module fetches with `options: true`, DTO↔model transformation, pagination shapes, and error/loading/403 handling.*

## API Calling Patterns

### 1. Service Layer Architecture
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

### 2. Inter-Module API Calls
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

## Data Transformation Patterns

### 1. DTO to Model Mapping
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

### 2. Pagination Response Handling
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

## Error Handling Patterns

### 1. Consistent Error Messages
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

### 2. Loading States
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

### 3. Data-Level Access (Backend)

For **data-scoped modules** (Enrollments, Work Permits, Certificates, PPE Withdrawals), the backend enforces row-level access (SELF / DEPARTMENT / SUPER). The frontend does not implement data-level logic; it must handle backend behavior correctly:

- **List (findAll):** The API may return fewer rows or an empty list when the user's role has SELF or DEPARTMENT scope. Treat empty or partial results as **valid** — do not show a generic "error" or assume data is missing due to a bug. Show an empty state (e.g. "No records" or "No records you have access to") when the list is empty.
- **Single record (get by id, update, delete, related actions):** The API may return **403 Forbidden** (e.g. message "You do not have access to this record") when the user does not have access to that row. Handle 403 with a clear, user-friendly message (e.g. toast or inline: "You do not have access to this record") and navigate away or back to list as appropriate; do not treat 403 as a generic server error.
- **Principle:** Do not assume the user can see all rows in these modules. Empty lists and 403 on detail/update/delete are expected for users with SELF or DEPARTMENT scope.

Reference: [docs/trd/backend/security.md](../backend/security.md), `docs/auth.md`.
