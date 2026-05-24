> [← Frontend TRD Index](./index.md)
>
> *Anti-patterns to avoid, global implementation checklist, the new-module workflow, and the original modular-restructure migration strategy.*

> This file bundles four short guidance sections originally found in `frontend/TRD.md`: Anti-Patterns to Avoid, Implementation Checklist, Development Workflow, and Migration Strategy.

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

### 8. Design System Violations
- ❌ DON'T use hard-coded color values instead of semantic tokens
- ❌ DON'T create module-specific component variants when existing ones suffice
- ❌ DON'T use arbitrary spacing values outside Tailwind scale
- ❌ DON'T bypass design system components for custom implementations
- ❌ DON'T ignore theme support (light/dark mode)

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

### Design System Compliance
- [ ] **Color usage**: All colors use semantic tokens from design system
- [ ] **Component usage**: shadcn/ui components used consistently
- [ ] **Spacing**: Tailwind spacing scale used throughout
- [ ] **Typography**: Consistent font sizes and weights
- [ ] **Theme support**: Components work in both light and dark modes
- [ ] **Icons**: Lucide React icons used consistently
- [ ] **Animations**: Standard animation patterns followed

### Code Quality
- [ ] **TypeScript compliance**: Full type safety across all modules
- [ ] **Error boundaries**: Proper error boundaries where needed
- [ ] **Performance**: No unnecessary re-renders or API calls
- [ ] **Accessibility**: ARIA labels and keyboard navigation support

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
