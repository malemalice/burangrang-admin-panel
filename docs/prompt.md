# Information Management System

## Project Overview
This is an information management system with basic modules for user management, role management (with permissions), menu management, and office management master data. The system follows a modern web application architecture with separate frontend and backend services.

This project is an admin panel for managing risk assessments and HSE (Health, Safety, and Environment) categories. It includes modules for risk assessment, risk matrix, threats, threat mitigations, and HSE categories.

## Modules

### Core Modules
- **User Management**: Manages user accounts and profiles
- **Role Management**: Handles role-based access control (RBAC)
- **Permission Management**: Manages granular permissions for roles
- **Menu Management**: Controls navigation and access to system features
- **Office Management**: Manages office locations and hierarchies
- **Department Management**: Handles department organization and structure
- **Job Position Management**: Manages job positions and responsibilities

### Risk Management Modules
- **Risk Assessment**: Manages risk assessments and their items
- **Risk Matrix**: Handles risk matrix configurations and scoring
- **Threats**: Manages threat identification and analysis
- **Threat Mitigations**: Manages mitigation strategies for identified threats
- **HSE Categories**: Manages Health, Safety, and Environment categories
- **Approvals**: Handles approval workflows for risk assessments

### Analytics
- **Dashboard**: Provides comprehensive analytics including:
  - Risk Overview: Key risk metrics and trends
  - Department Profile: Department-specific risk profiles
  - HSE Category Analysis: Analysis of HSE categories and trends
  - Threat Analysis: Analysis of threats and their impact
  - Compliance Progress: Tracking of compliance and mitigation progress

## Dashboard Endpoints

- `/dashboard/risk-overview`: Provides an overview of risk metrics.
- `/dashboard/department-profile`: Provides department-specific risk profiles.
- `/dashboard/hse-category-analysis`: Provides analysis of HSE categories.
- `/dashboard/threat-analysis`: Provides analysis of threats.
- `/dashboard/compliance-progress`: Provides compliance and progress tracking metrics.

## Next Steps

- Implement the actual metrics logic for each dashboard endpoint.
- Test the endpoints to ensure they return the expected data.
- Integrate the dashboard with the frontend to display the metrics.

## Technical Stack

### Backend
- **NestJS** (v11.0.1) - Node.js framework for building scalable server-side applications
- **Prisma** (v6.7.0) - Next-generation ORM with type safety
- **PostgreSQL** - Primary database
- **JWT** (v11.0.0) - Authentication mechanism
- **Class Validator** (v0.14.1) / **Class Transformer** (v0.5.1) - Data validation and transformation
- **Swagger** (v11.1.6) - API documentation
- **Passport** (v0.7.0) - Authentication middleware
- **bcrypt** (v5.1.1) - Password hashing
- **TypeScript** (v5.7.3) - Type-safe JavaScript

### Frontend
- **React** (v18.3.1) - UI library
- **Vite** (v5.4.1) - Build tool and development server
- **TypeScript** (v5.5.3) - Type-safe JavaScript
- **Tailwind CSS** (v3.4.11) - Utility-first CSS framework
- **shadcn/ui** (via Radix UI v1.x) - Component library built with Radix UI
- **React Query** (@tanstack/react-query v5.56.2) - Data fetching and state management
- **React Router** (v6.26.2) - Client-side routing
- **React Hook Form** (v7.53.0) - Form handling
- **Zod** (v3.23.8) - Schema validation
- **Sonner** (v1.5.0) - Toast notifications
- **Axios** (v1.9.0) - HTTP client
- **date-fns** (v3.6.0) - Date utility library
- **Lucide React** (v0.462.0) - Icon library
- **TipTap** (v2.12.0) - Rich text editor
- **Recharts** (v2.12.7) - Charting library

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
├── prisma/                  # Prisma configuration and migrations
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Database seeding
├── test/                    # Test files
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
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
│   ├── routes/           # Route definitions and configurations
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── services/        # API services and data fetching
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
├── tailwind.config.ts  # Tailwind CSS config
└── postcss.config.js   # PostCSS config
```

### ESLint Configuration
- Use ESLint for code linting and style enforcement.
- Configure ESLint to enforce consistent code style and catch common errors.
- Include rules for TypeScript, React, and general JavaScript best practices.
- Use Prettier for code formatting, integrated with ESLint.

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
