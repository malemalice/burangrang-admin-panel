# Technical Requirements Document (TRD)
## Frontend Modular Architecture Restructuring

### 📋 Document Information
- **Version**: 1.0
- **Date**: 2024-01-XX
- **Status**: Draft
- **Author**: Development Team

---

## 🎯 Executive Summary

This document outlines the technical requirements and architectural principles for restructuring the frontend application from a traditional layered architecture to a modular, feature-based architecture. The restructuring aims to improve maintainability, scalability, and developer experience while following modern frontend best practices.

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
| 1.0 | 2024-01-XX | Development Team | Initial version |

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

**Next Steps**: Review this document with the development team and proceed with the migration plan outlined in `todo-refactor.md`.
