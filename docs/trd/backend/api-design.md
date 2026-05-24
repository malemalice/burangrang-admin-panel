> [← Backend TRD Index](./index.md)
>
> *REST conventions, pagination response envelope, query-param standardisation, error response shape, and the `@AllowOptionsBypass` pattern for dropdown endpoints.*

## API Design Patterns

### 1. RESTful API Design

- **GET** `/{resource}` - List all resources with pagination/filtering
- **GET** `/{resource}/{id}` - Get single resource by ID
- **POST** `/{resource}` - Create new resource
- **PATCH** `/{resource}/{id}` - Update existing resource
- **DELETE** `/{resource}/{id}` - Delete resource

### 2. Pagination Pattern

Standardized pagination across all list endpoints:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  // Domain-specific filters
}
```

### 3. Query Parameter Standardization

```typescript
// Common query parameters
page=1&limit=10&sortBy=name&sortOrder=asc&search=term&isActive=true

// Domain-specific parameters
officeId=uuid&roleId=uuid&departmentId=uuid
```

### 4. Response Format Standardization

```typescript
// Success responses
{
  "data": { /* entity data */ },
  "meta": { /* pagination info */ }
}

// Error responses
{
  "statusCode": 404,
  "message": "Entity not found",
  "error": "Not Found"
}
```

### 5. Options Bypass for Select/Dropdown Data

When forms need reference data (departments, roles, offices, etc.) for dropdowns, users may not have the module's list permission. The options bypass allows any authenticated user to fetch list data for form options without requiring the specific `*:list` permission.

**Principles:**

- **Query parameter**: `?options=true` — when present, `PermissionsGuard` skips the permission check for list endpoints that have `@AllowOptionsBypass()`
- **JWT required**: Authentication is still enforced; only the permission check is bypassed
- **Explicit opt-in**: Add `@AllowOptionsBypass()` only to list endpoints that serve dropdown/select options
- **Documentation**: Add `@ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })` for Swagger

**Controller pattern:**

```typescript
@Get()
@AllowOptionsBypass()
@Permissions('department:list')
@ApiOperation({ summary: 'Get all departments' })
@ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
findAll(@Query() query) { ... }
```

**Flow**: `GET /departments?options=true` with valid JWT → allowed for any logged-in user. Without `?options=true` → requires `department:list` permission.
