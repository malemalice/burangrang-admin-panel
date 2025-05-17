# Information Management System

## Project Overview
This is an information management system with basic modules for user management, role management (with permissions), menu management, and office management master data. The system follows a modern web application architecture with separate frontend and backend services.

## Technical Stack

### Backend
- **NestJS** (v11.0.1) - Node.js framework for building scalable server-side applications
- **Prisma** (v6.7.0) - Next-generation ORM with type safety
- **PostgreSQL** - Primary database
- **JWT** - Authentication mechanism
- **Class Validator/Transformer** - Data validation and transformation
- **Swagger** - API documentation

### Frontend
- **React** (v18.3.1) - UI library
- **Vite** (v5.4.1) - Build tool and development server
- **TypeScript** (v5.5.3) - Type-safe JavaScript
- **Tailwind CSS** (v3.4.11) - Utility-first CSS framework
- **shadcn/ui** - Component library built with Radix UI
- **React Query** (v5.56.2) - Data fetching and state management
- **React Router** (v6.26.2) - Client-side routing
- **React Hook Form** (v7.53.0) - Form handling
- **Zod** (v3.23.8) - Schema validation
- **Sonner** - Toast notifications

## Backend Architecture

### Directory Structure
```
backend/
├── src/
│   ├── core/                 # Core application services and configuration
│   │   ├── config/          # Environment and app configuration
│   │   ├── prisma/          # Prisma schema and migrations
│   │   └── services/        # Core services (e.g., PrismaService)
│   │
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── roles/          # Role management
│   │   ├── permissions/    # Permission management
│   │   ├── menus/          # Menu management
│   │   └── offices/        # Office management
│   │
│   ├── shared/              # Shared resources
│   │   ├── decorators/     # Custom decorators
│   │   ├── guards/         # Authentication/Authorization guards
│   │   ├── interceptors/   # Request/Response interceptors
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── services/       # Shared services
│   │   ├── types/          # Shared TypeScript types
│   │   └── enums/          # Shared enums
│   │
│   ├── app.module.ts        # Root application module
│   └── main.ts             # Application entry point
```

### Module Structure
Each feature module follows this structure:
```
modules/feature/
├── controllers/            # Route handlers
├── services/              # Business logic
├── dto/                   # Data Transfer Objects
├── entities/              # Domain entities
├── interfaces/            # TypeScript interfaces
└── feature.module.ts      # Module definition
```

### Design Patterns & Best Practices

#### 1. Clean Architecture
- **Separation of Concerns**: Clear boundaries between layers (controllers, services, repositories)
- **Dependency Injection**: NestJS's built-in DI container for loose coupling
- **Interface-based Design**: Contracts defined through interfaces

#### 2. Security Patterns
- **JWT Authentication**: Token-based authentication with refresh mechanism
- **Permission-based Authorization**: Fine-grained access control using permissions
- **Global Guards**: Centralized security enforcement
- **Request Validation**: DTO validation using class-validator

#### 3. Database Patterns
- **Repository Pattern**: Prisma as the ORM layer
- **Migrations**: Version-controlled database schema changes
- **Seeding**: Initial data population

#### 4. API Design
- **RESTful Endpoints**: Resource-based routing
- **Swagger Documentation**: OpenAPI specification
- **Error Handling**: Consistent error responses
- **Standardized Index Query Parameters**:
  ```typescript
  interface IndexQueryParams {
    page?: number;        // Current page number (1-based)
    limit?: number;       // Items per page
    sortBy?: string;      // Field to sort by
    sortOrder?: 'asc' | 'desc'; // Sort direction
    search?: string;      // Global search term
    filters?: Record<string, any>; // Field-specific filters
  }
  ```
- **Standardized Response Format**:
  ```typescript
  interface PaginatedResponse<T> {
    data: T[];
    meta: {
      total: number;      // Total number of items
      page: number;       // Current page
      limit: number;      // Items per page
      pageCount: number;  // Total number of pages
    }
  }
  ```
- **Filter Handling**:
  - Boolean filters: Convert string 'true'/'false' to boolean
  - Status filters: Handle 'active'/'inactive' consistently
  - Search: Case-insensitive partial matching
  - Date filters: Support single date and date range
  - Relation filters: Support filtering by related entity IDs

#### 5. Code Organization
- **Feature Modules**: Self-contained business features
- **Shared Resources**: Reusable components and utilities
- **Core Services**: Application-wide services
- **Type Safety**: Comprehensive TypeScript usage

### Authentication & Authorization

#### 1. Authentication Flow
- JWT-based authentication
- Refresh token mechanism
- Password hashing with bcrypt
- Session management

#### 2. Authorization System
- Role-based access control (RBAC)
- Permission-based authorization
- Global guards for security enforcement
- Custom decorators for access control

### Error Handling
- Global exception filter
- Custom exception classes
- Consistent error response format
- Validation error handling

### Logging & Monitoring
- Request logging
- Error logging
- Performance monitoring
- Audit trails

### Testing Strategy
- Unit tests for services
- Integration tests for controllers
- E2E tests for critical flows
- Test coverage requirements

### Development Guidelines

#### 1. Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Consistent naming conventions

#### 2. Git Workflow
- Feature branch workflow
- Commit message conventions
- Pull request reviews
- CI/CD integration

#### 3. Documentation
- API documentation with Swagger
- Code documentation with JSDoc
- README files for modules
- Architecture documentation

### Performance Considerations
- Database query optimization
- Caching strategies
- Request validation
- Response compression

### Security Measures
- CORS configuration
- Rate limiting
- Input sanitization
- Security headers
- Password policies

## Core Features

### 1. User Management
- User CRUD operations
- User authentication and authorization
- User profile management
- Filtering and searching users
- Pagination support
- Status management (active/inactive)

### 2. Role Management
- Role CRUD operations
- Permission assignment
- Role-based access control
- Filtering and searching roles
- Pagination support

### 3. Menu Management
- Menu CRUD operations
- Menu hierarchy management
- Menu access control
- Filtering and searching menus
- Pagination support

### 4. Office Management
- Office CRUD operations
- Office hierarchy management
- Office-related data management
- Filtering and searching offices
- Pagination support

## UI/UX Features
- Modern admin panel layout with side menu
- Responsive design
- Confirmation dialogs for destructive actions
- Toast notifications for user feedback
- Loading states and spinners
- Data tables with:
  - Pagination
  - Column filtering
  - Search functionality
  - Sorting
  - Row actions
- Form validation with error messages
- Modal dialogs for CRUD operations

## Architecture Requirements

### Backend
- Clean Code Architecture implementation
- REST API design
- Proper error handling and validation
- JWT-based authentication
- Role-based authorization
- Database migrations and seeding
- Environment configuration
- API documentation with Swagger

### Frontend
- Clean Code Architecture implementation
- Component-based architecture
- Type-safe development
- Responsive design
- State management
- Form handling and validation
- API integration
- Error handling
- Loading states

## Development Guidelines

### Code Organization
- Follow Clean Code principles
- Use TypeScript for type safety
- Implement proper error handling
- Follow REST API best practices
- Use proper state management
- Implement responsive design
- Follow accessibility guidelines

### Security
- Implement proper authentication
- Use role-based authorization
- Validate all inputs
- Sanitize data
- Use environment variables
- Implement proper error handling
- Follow security best practices

### Performance
- Implement proper caching
- Optimize database queries
- Use pagination for large datasets
- Implement proper loading states
- Optimize bundle size
- Use proper code splitting
- Implement proper error boundaries

## Testing Requirements
- Unit tests for backend services
- Integration tests for API endpoints
- E2E tests for critical flows
- Component tests for UI
- Proper test coverage
- CI/CD integration

## Documentation Requirements
- API documentation with Swagger
- Component documentation
- Setup instructions
- Development guidelines
- Deployment instructions
- Environment variables documentation

## Frontend Architecture

### File Structure
```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   └── shared/       # Shared components
│   ├── features/         # Feature-specific components
│   │   ├── auth/        # Authentication related
│   │   ├── users/       # User management
│   │   ├── roles/       # Role management
│   │   ├── menus/       # Menu management
│   │   └── offices/     # Office management
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   │   ├── api/        # API client setup
│   │   ├── utils/      # Helper functions
│   │   └── types/      # TypeScript types
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── store/          # State management
│   ├── styles/         # Global styles
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── vite.config.ts      # Vite config
```

### Component Patterns

#### 1. Layout Components
- **AdminLayout**: Main layout with sidebar and header
- **PageHeader**: Consistent page headers with actions
- **Sidebar**: Navigation menu with collapsible sections
- **Breadcrumbs**: Navigation breadcrumbs

#### 2. Feature Components
- **List/Table Views**:
  - DataTable component with pagination, sorting, filtering
  - FilterDrawer for advanced filtering
  - Action buttons (Add, Edit, Delete)
  - Status badges and indicators

- **Form Components**:
  - FormDialog for create/edit operations
  - Form validation with Zod
  - Error message display
  - Loading states

- **Confirmation Components**:
  - ConfirmDialog for destructive actions
  - Toast notifications for feedback

#### 3. State Management
- React Query for server state
- Local state with useState/useReducer
- Context for global state
- Custom hooks for reusable logic

#### 4. API Integration
- Service layer for API calls
- React Query for data fetching
- Error handling and loading states
- Type-safe API responses

### Common Patterns

#### 1. Data Table Pattern
```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  filterFields?: FilterField[];
  onSearch?: (term: string) => void;
  onApplyFilters?: (filters: FilterValue[]) => void;
}
```

#### 2. Form Dialog Pattern
```typescript
interface FormDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  initialData?: T;
  title: string;
  schema: z.ZodSchema<T>;
}
```

#### 3. Service Pattern
```typescript
interface Service<T> {
  getAll: (params?: QueryParams) => Promise<PaginatedResponse<T>>;
  getById: (id: string) => Promise<T>;
  create: (data: CreateDTO<T>) => Promise<T>;
  update: (id: string, data: UpdateDTO<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}
```

### Best Practices

1. **Component Organization**:
   - Feature-based folder structure
   - Shared components in common directories
   - Clear separation of concerns

2. **State Management**:
   - Use React Query for server state
   - Local state for UI-only state
   - Context for global state
   - Custom hooks for reusable logic

3. **Type Safety**:
   - TypeScript for all components
   - Zod for runtime validation
   - Proper type definitions
   - Generic components where appropriate

4. **Performance**:
   - Code splitting with React.lazy
   - Memoization with useMemo/useCallback
   - Virtual scrolling for large lists
   - Optimistic updates

5. **Error Handling**:
   - Global error boundary
   - Toast notifications
   - Form validation
   - Loading states

6. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Color contrast

### Data Fetching & State Management

#### 1. Service Layer Pattern
```typescript
interface BaseService<T> {
  getAll(params: PaginationParams): Promise<PaginatedResponse<T>>;
  getById(id: string): Promise<T>;
  create(data: CreateDTO<T>): Promise<T>;
  update(id: string, data: UpdateDTO<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}
```

#### 2. Filter Handling
- **Filter State Structure**:
  ```typescript
  interface FilterState {
    [key: string]: {
      value: any;
      label: string;
    }
  }
  ```
- **Filter Types**:
  - Text filters: Free text input
  - Select filters: Single selection from options
  - Multi-select filters: Multiple selections
  - Date filters: Single date or date range
  - Boolean filters: True/false selection
  - Searchable select: For related entity selection

#### 3. DataTable Component Pattern
```typescript
interface DataTableProps<T> {
  columns: {
    id: string;
    header: string;
    cell: (item: T) => React.ReactNode;
    isSortable?: boolean;
    isFilterable?: boolean;
  }[];
  data: T[];
  isLoading?: boolean;
  pagination: {
    pageIndex: number;
    limit: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    total: number;
  };
  filterFields?: FilterField[];
  onSearch?: (term: string) => void;
  onApplyFilters?: (filters: FilterValue[]) => void;
}
```

#### 4. Status Management
- Consistent status handling across modules
- Status filters in tabs (All/Active/Inactive)
- Status badges with consistent styling
- Status changes through actions menu

create information management system, consist of basic modul for user management, role management (with permissions inside it), menu management, and master data for office management. Layout will be like admin panel, with sidemenu. tech stack, separate frontend and backend, communicate using rest. backend use nest js with prisma as orm. frontend use react js with vite, ui/ux component use shadcn. Add also basic fitur for admin panel,like confirm alert, alert, notification using toast, pagination, column filter and search on index page/table page. Both need to implement clean code architecture. Do this first, put your understanding context inside prompt.md, to be used later for communication with you. Then create todo checklist of the feature, update the checklist if you had done build it. After finish, please check again for errors


create frontend boilerplate, store on frontend folder, use react vite, with shadcn/ui. layout was admin panel with sidemenu item, and main content. create dummy for login page, dashboard, user management, with implementation of basic function like add, edit, delete, pagination, column filter, search, alert dialog, toast notification, loading state. no need to connect to backend, just create dummy data.

please understand the requirements first, explain the problem and then do the fix step, then write the code if needed. then update todo.md
please understand the requirements first, explain the problem and then do the fix step, then write the code if needed. then update todo.md

on frontend, learn code pattern and implemented functionality from module offices and job position, then create new module called hse category. follow attributes stated on backend. please understand the requirements first, explain the problem and then do the fix step, then write the code
