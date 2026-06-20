> [← Frontend TRD Index](./index.md)
>
> *Quick-reference templates: module barrel, service methods, hook scaffolds, Zod form schema, table column definitions. Plus the barrel export patterns appendix.*

> This file bundles two reference sections originally found in `frontend/TRD.md`: Code Examples Library and Barrel Export Patterns appendix.

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
