# Backend Technical Reference Document (TRD)

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File and Folder Structure](#file-and-folder-structure)
4. [Core Implementation Patterns](#core-implementation-patterns)
5. [API Design Patterns](#api-design-patterns)
6. [Security Implementation](#security-implementation)
7. [Error Handling](#error-handling)
8. [DTO Mapping](#dto-mapping)
9. [Database Integration](#database-integration)
10. [Testing Guidelines](#testing-guidelines)
11. [Deployment Considerations](#deployment-considerations)

## Overview

This Technical Reference Document (TRD) provides comprehensive guidance for the backend implementation of the BurangrangAdmin Panel. The backend is built using NestJS with TypeScript, following enterprise-grade patterns and best practices established through systematic refactoring.

### Key Technologies

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Serialization**: class-transformer

### Core Principles

- **DRY (Don't Repeat Yourself)**: Eliminated code duplication through shared utilities
- **KISS (Keep It Simple, Stupid)**: Simplified complex logic and patterns
- **Consistency**: Standardized patterns across all modules
- **Security First**: Comprehensive authentication and authorization
- **Maintainability**: Clear separation of concerns and modular architecture
- **Dynamic Resolution**: Use sentinel values for entity-based field resolution; resolve at runtime, never store sentinels in transactional data
- **PDF Export**: PDF export for detail pages (e.g. risk assessment, inspection) is client-side only; the frontend uses `react-to-pdf` and fetches full data via existing list/approval APIs. No server-side PDF generation is required for this pattern.
- **Options Bypass**: List endpoints serving dropdown/select data support `?options=true` to bypass permission checks. Users need options for forms without needing full module access. Apply `@AllowOptionsBypass()` to list endpoints; JWT remains required.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │   Database      │
│                 │    │                 │    │   (PostgreSQL)  │
│ • API Endpoints │◄──►│ • Business Logic│◄──►│ • Prisma ORM    │
│ • Request/Resp  │    │ • Data Mapping  │    │ • Migrations    │
│ • Validation    │    │ • Error Handling│    │ • Seeds         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
┌─────────────────┐    ┌─────────────────┐
│   Guards        │    │   Shared        │
│                 │    │   Services      │
│ • JWT Auth      │    │                 │
│ • Role-based    │    │ • DTO Mapper    │
│ • Permissions   │    │ • Error Handler │
└─────────────────┘    └─────────────────┘
```

### Module Architecture

The application follows a modular architecture with clear separation of concerns:

- **Feature Modules**: Each domain has its own module (users, roles, departments, etc.)
- **Shared Module**: Common utilities and services
- **Core Module**: Database and configuration setup

## File and Folder Structure

```
backend/
├── src/
│   ├── app.module.ts                 # Root application module
│   ├── app.controller.ts             # Health check endpoints
│   ├── app.service.ts                # Application-level services
│   ├── main.ts                       # Application bootstrap
│   ├── core/                         # Core application setup
│   │   ├── config/
│   │   │   └── app.config.ts         # Application configuration
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts      # Prisma database module
│   │   │   └── prisma.service.ts     # Database service
│   │   └── services/                 # Core services
│   ├── modules/                      # Feature modules
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   └── services/
│   │   │       └── auth.service.ts
│   │   ├── users/                    # Users management module
│   │   │   ├── users.module.ts
│   │   │   ├── controllers/
│   │   │   │   └── users.controller.ts
│   │   │   ├── services/
│   │   │   │   └── users.service.ts
│   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user.dto.ts
│   │   │   └── entities/             # Domain entities (if needed)
│   │   └── [other-modules...]/       # Similar structure for all modules
│   ├── shared/                       # Shared utilities and services
│   │   ├── shared.module.ts
│   │   ├── services/
│   │   │   ├── dto-mapper.service.ts    # Standardized DTO mapping
│   │   │   ├── error-handling.service.ts # Centralized error handling
│   │   │   └── settings.service.ts       # Application settings
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication
│   │   │   ├── roles.guard.ts            # Role-based authorization
│   │   │   └── permissions.guard.ts      # Permission-based access
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts        # @Roles() decorator
│   │   │   ├── permissions.decorator.ts  # @Permissions() decorator
│   │   │   ├── allow-options-bypass.decorator.ts  # @AllowOptionsBypass() for list endpoints
│   │   │   └── public.decorator.ts       # @Public() for public routes
│   │   ├── types/
│   │   │   ├── pagination-params.ts      # Pagination interfaces
│   │   │   └── role.enum.ts              # Role enumeration
│   │   └── validators/                 # Custom validators (if needed)
│   └── common/                        # Common utilities (deprecated, use shared/)
├── prisma/
│   ├── schema.prisma                 # Database schema definition
│   ├── migrations/                   # Database migrations
│   └── seeds/                        # Database seed files
├── test/                            # Test files
├── dist/                            # Compiled output (generated)
├── node_modules/                    # Dependencies (generated)
├── package.json                     # Project dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── nest-cli.json                    # NestJS CLI configuration
├── eslint.config.mjs                # ESLint configuration
└── .prettierrc                      # Prettier configuration
```

## Core Implementation Patterns

### 1. Module Structure Pattern

Each feature module follows this consistent structure:

```typescript
// [module].module.ts
import { Module } from '@nestjs/common';
import { [Module]Controller } from './controllers/[module].controller';
import { [Module]Service } from './services/[module].service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule], // Always import SharedModule for utilities
  controllers: [[Module]Controller],
  providers: [[Module]Service],
  exports: [[Module]Service],
})
export class [Module]Module {}

// [module].controller.ts
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../shared/guards/[guards]';

@ApiTags('[module]')
@ApiBearerAuth()
@Controller('[module]')
@UseGuards(JwtAuthGuard, RolesGuard)
export class [Module]Controller {
  constructor(private readonly [module]Service: [Module]Service) {}
  // Implementation
}

// [module].service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class [Module]Service {
  // Initialize mappers in constructor
  private [entity]Mapper: (entity: any) => [Entity]Dto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.[entity]Mapper = this.dtoMapper.createSimpleMapper([Entity]Dto);
  }
  // Implementation
}
```

### 2. DTO Pattern

Standardized DTO structure with proper validation and documentation:

```typescript
// dto/[entity].dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

export class [Entity]Dto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  name: string;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  constructor(partial: Partial<[Entity]Dto>) {
    Object.assign(this, partial);
  }
}

// dto/create-[entity].dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class Create[Entity]Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  // Required fields for creation
}
```

### 3. Controller Pattern

Consistent controller implementation with proper guards and documentation:

```typescript
@Controller('[entities]')
@UseGuards(JwtAuthGuard, RolesGuard)
export class [Entities]Controller {
  constructor(private readonly [entities]Service: [Entities]Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all [entities] with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: [Entity]Dto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: FindAllQueryDto): Promise<PaginatedResponse<EntityDto>> {
    return this.[entities]Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get [entity] by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EntityDto })
  @ApiResponse({ status: 404, description: '[Entity] not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string): Promise<EntityDto> {
    return this.[entities]Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new [entity]' })
  @ApiBody({ type: CreateEntityDto })
  @ApiResponse({ status: 201, type: EntityDto })
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() createDto: CreateEntityDto): Promise<EntityDto> {
    return this.[entities]Service.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update [entity]' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateEntityDto })
  @ApiResponse({ status: 200, type: EntityDto })
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEntityDto,
  ): Promise<EntityDto> {
    return this.[entities]Service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete [entity]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: '[Entity] deleted successfully' })
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.[entities]Service.remove(id);
  }
}
```

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

## Security Implementation

### 1. Authentication Guards

```typescript
// JWT Authentication Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // JWT token validation
}

// Role-based Authorization Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    return requiredRoles?.some(role => user.roles?.includes(role));
  }
}
```

### 2. Decorator-Based Security

```typescript
// Role-based access
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Get()
findAll() { }

// Permission-based access
@Permissions('user:create')
@Post()
create() { }

// Options bypass (list endpoints only) - allows ?options=true to skip permission check for dropdown data
@AllowOptionsBypass()
@Permissions('department:list')
@Get()
findAll() { }

// Public endpoints
@Public()
@Post('login')
login() { }
```

### 3. Security Layer Architecture

```
Request → JwtAuthGuard → RolesGuard → PermissionsGuard → Controller
     ↓           ↓           ↓           ↓           ↓
  Validate    Verify      Check       Check       Execute
   JWT        JWT         Roles       Permissions  Method
   Token      Token       Access      Access
```

## Error Handling

### 1. Centralized Error Handling Service

```typescript
@Injectable()
export class ErrorHandlingService {
  throwIfNotFound<T>(
    entityName: string,
    identifier: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    if (!entity) {
      throw new NotFoundException(`${entityName} with ${identifier} not found`);
    }
  }

  throwIfNotFoundById<T>(
    entityName: string,
    id: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    this.throwIfNotFound(entityName, `ID ${id}`, entity);
  }

  async safeExecute<T>(
    operation: () => Promise<T>,
    errorContext: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Handle Prisma and other errors
      return this.handleDatabaseError(error, errorContext);
    }
  }
}
```

### 2. Error Response Standardization

```typescript
// 400 Bad Request - Validation errors
{
  "statusCode": 400,
  "message": ["name must be a string", "email must be a valid email"],
  "error": "Bad Request"
}

// 401 Unauthorized - Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// 403 Forbidden - Insufficient permissions
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found - Resource not found
{
  "statusCode": 404,
  "message": "User with ID 123 not found",
  "error": "Not Found"
}

// 409 Conflict - Unique constraint violation
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}

// 500 Internal Server Error - Unexpected errors
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```

## DTO Mapping

### 1. Standardized DTO Mapping Service

```typescript
@Injectable()
export class DtoMapperService {
  mapToDto<T>(
    DtoClass: new (partial: Partial<T>) => T,
    entity: any,
    options: DtoMapperOptions = {},
  ): T {
    // Implementation with exclusions, transformations, and relations
  }

  createSimpleMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
  ): (entity: any) => T {
    return this.createMapper(DtoClass);
  }

  createRelationMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    relationMappers: Record<string, RelationConfig>,
    exclude: string[] = [],
  ): (entity: any) => T {
    return this.createMapper(DtoClass, { relations: relationMappers, exclude });
  }
}
```

### 2. Mapping Patterns

```typescript
// Simple entity mapping
this.userMapper = this.dtoMapper.createSimpleMapper(UserDto);

// Entity with relations
this.roleMapper = this.dtoMapper.createRelationMapper(RoleDto, {
  permissions: {
    mapper: this.permissionMapper,
    isArray: true,
  },
});

// Entity with exclusions
this.userMapper = this.dtoMapper.createMapper(UserDto, {
  exclude: ['password'], // Exclude sensitive fields
});

// Array mapping
this.userArrayMapper = this.dtoMapper.createSimpleArrayMapper(UserDto);

// Paginated results
this.userPaginatedMapper = this.dtoMapper.createPaginatedMapper(UserDto);
```

## Database Integration

### 1. Prisma ORM Configuration

```typescript
// schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Model definitions with proper relationships and table naming convention
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  firstName     String
  lastName      String
  isActive      Boolean        @default(true)
  roleId        String
  officeId      String
  departmentId  String?
  jobPositionId String?

  role          Role           @relation(fields: [roleId], references: [id])
  office        Office         @relation(fields: [officeId], references: [id])
  department    Department?    @relation(fields: [departmentId], references: [id])
  jobPosition   JobPosition?   @relation(fields: [jobPositionId], references: [id])

  @@map("t_users")  // Transactional data table
}
```

### 2. Database Table Naming Convention

The project follows a strict naming convention for database tables:

**Master Data Tables (m_ prefix):**
- `m_roles` - Role definitions
- `m_permissions` - Permission definitions  
- `m_offices` - Office structure
- `m_departments` - Department definitions
- `m_job_positions` - Job position definitions
- `m_menus` - Navigation menu structure
- `m_settings` - System configuration
- `m_approval` - Approval workflow templates
- `m_approval_item` - Approval workflow steps

**Transactional Data Tables (t_ prefix):**
- `t_users` - User accounts
- `t_refresh_tokens` - Authentication sessions
- `t_approvals` - Individual approval instances

**Junction Tables:**
- `_PermissionToRole` - Role-permission relationships
- `_MenuToRole` - Role-menu access relationships

This naming convention helps distinguish between:
- **Master Data**: Reference data that changes infrequently (roles, permissions, etc.)
- **Transactional Data**: Business data that changes frequently (users, sessions, approvals)

### 3. Database Service Pattern

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 4. Migration and Seeding

```bash
# Generate migration
npx prisma migrate dev --name add_new_field

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Run seeds
npx prisma db seed
```

## Testing Guidelines

### 1. Unit Testing Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── users.service.spec.ts
│   │   ├── users.controller.spec.ts
│   │   └── dto/
│   │       └── create-user.dto.spec.ts
│   └── [other-modules...]
├── shared/
│   └── services/
│       ├── dto-mapper.service.spec.ts
│       └── error-handling.service.spec.ts
└── test/
    ├── setup.ts
    ├── utils/
    │   ├── test-helpers.ts
    │   └── mock-data.ts
    └── fixtures/
        └── sample-data.json
```

### 2. Testing Patterns

```typescript
// Service testing
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        ErrorHandlingService,
        DtoMapperService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    // Test implementation
  });
});

// Controller testing
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });
});
```

### 3. Test Coverage Goals

- **Unit Tests**: 80%+ coverage for services
- **Integration Tests**: API endpoints testing
- **E2E Tests**: Full user workflows
- **Performance Tests**: Load testing for critical endpoints

## Deployment Considerations

### 1. Environment Configuration

```typescript
// config/app.config.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    // Support multiple frontend domains
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',  // webapp frontend
          'http://localhost:5173',  // webv2 frontend
          'http://localhost:3001',  // additional frontend if needed
        ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  },
});
```

#### Environment Variables

```env
# CORS Configuration - Multiple Frontend Domains
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:3001,https://yourdomain.com"

# Production Example:
# CORS_ORIGINS="https://admin.soulyousee.com,https://app.soulyousee.com,https://soulyousee.com"
```

### 2. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 3. Production Optimizations

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'], // Disable debug logs in production
  });

  // Security headers
  app.use(helmet());

  // CORS configuration with multiple domains
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origins,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  await app.listen(3000);
}
```

### 4. Health Checks and Monitoring

```typescript
// app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  async getReadiness(): Promise<object> {
    // Check database connection, external services, etc.
    return {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Implementation Checklist

### Module Implementation Checklist

- [ ] Create module directory structure
- [ ] Implement DTOs with validation and documentation
- [ ] Create service with standardized patterns
- [ ] Implement controller with guards and documentation
- [ ] Add module to AppModule imports
- [ ] Update Prisma schema if needed
- [ ] Create database migrations
- [ ] Add seed data if required
- [ ] Write unit and integration tests
- [ ] Update API documentation
- [ ] Test with existing modules

### Code Quality Checklist

- [ ] Follows established patterns and conventions
- [ ] Includes comprehensive error handling
- [ ] Has proper TypeScript typing
- [ ] Includes Swagger documentation
- [ ] Has appropriate security guards
- [ ] Uses standardized DTO mapping
- [ ] Includes input validation
- [ ] Has proper logging
- [ ] Includes unit tests
- [ ] Passes all linting rules

## Code Pattern Audit & Consistency Guidelines

### Module Consistency Checklist

#### ✅ **Module Structure Requirements**
- [ ] Module follows standard directory structure: `[module]/[module].module.ts`, `[module].controller.ts`, `[module].service.ts`, `dto/`
- [ ] Module imports `PrismaModule` (NOT `PrismaService` directly) and `SharedModule`
- [ ] Module exports the service for use in other modules
- [ ] All DTOs follow naming convention: `[entity].dto.ts`, `create-[entity].dto.ts`, `update-[entity].dto.ts`

#### ✅ **Controller Pattern Requirements**
- [ ] Uses `@ApiTags('[module]')` and `@ApiBearerAuth()` decorators
- [ ] Applies `@UseGuards(JwtAuthGuard, RolesGuard)` to controller class
- [ ] All endpoints have `@ApiOperation()` with descriptive summaries
- [ ] All endpoints have appropriate `@ApiResponse()` decorators
- [ ] All endpoints have `@Roles()` decorators with appropriate role restrictions
- [ ] CRUD endpoints follow standard pattern: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
- [ ] Pagination endpoints include `@ApiQuery()` decorators for all query parameters

#### ✅ **Service Pattern Requirements**
- [ ] Injects `PrismaService`, `ErrorHandlingService`, and `DtoMapperService` in constructor
- [ ] Initializes DTO mappers in constructor using `DtoMapperService`
- [ ] Uses `ErrorHandlingService.throwIfNotFoundById()` instead of direct `NotFoundException`
- [ ] Implements standard CRUD operations: `create()`, `findAll()`, `findOne()`, `update()`, `remove()`
- [ ] `findAll()` method supports pagination with `page`, `limit`, `sortBy`, `sortOrder`, `search`, `isActive` parameters
- [ ] Uses `DtoMapperService` for all entity-to-DTO transformations

#### ✅ **DTO Pattern Requirements**
- [ ] All DTOs extend base class with `constructor(partial: Partial<DtoClass>)`
- [ ] Response DTOs use `@Expose()` decorators for serialization
- [ ] Response DTOs use `@ApiProperty()` decorators for Swagger documentation
- [ ] Create/Update DTOs use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.)
- [ ] Sensitive fields (like passwords) are excluded using `@Exclude()` decorator

#### ✅ **Security Pattern Requirements**
- [ ] All controllers use `JwtAuthGuard` and `RolesGuard`
- [ ] All endpoints have appropriate `@Roles()` decorators
- [ ] Permission-based endpoints use `@Permissions()` decorators
- [ ] Public endpoints use `@Public()` decorator
- [ ] Role hierarchy: `SUPER_ADMIN` > `ADMIN` > `MANAGER` > `USER`

### Consistency Violations to Avoid

#### ❌ **Common Anti-Patterns**
```typescript
// ❌ WRONG: Direct PrismaService injection in module
providers: [Service, PrismaService]

// ✅ CORRECT: Use PrismaModule
imports: [PrismaModule, SharedModule]

// ❌ WRONG: Direct NotFoundException usage
if (!entity) {
  throw new NotFoundException(`Entity with ID ${id} not found`);
}

// ✅ CORRECT: Use ErrorHandlingService
this.errorHandler.throwIfNotFoundById('Entity', id, entity);

// ❌ WRONG: Missing role restrictions
@Get()
findAll() { }

// ✅ CORRECT: Always specify roles
@Get()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
findAll() { }
```

### Module-Specific Guidelines

#### **Users Module** (Reference Implementation)
- ✅ Complete CRUD with advanced filtering
- ✅ Password handling with bcrypt
- ✅ Profile endpoint (`GET /me`)
- ✅ Complex relation mapping (role, office, department, jobPosition)

#### **Roles Module** (Reference Implementation)
- ✅ Permission management with default permissions
- ✅ Complex relation mapping with permissions
- ✅ Configuration-based default permissions

#### **Offices Module** (Hierarchical Pattern)
- ✅ Recursive parent/child relationships
- ✅ Hierarchy endpoint (`GET /hierarchy`)
- ✅ Complex relation mapping for nested structures

#### **Menus Module** (Complex Relations Pattern)
- ✅ Multi-level hierarchy with roles
- ✅ Role-based filtering (`GET /sidebar`)
- ✅ Statistics endpoint (`GET /stats`)
- ✅ Order management (`PUT /order`)

### Quality Assurance Checklist

#### **Before Code Review**
- [ ] Module follows all structure requirements
- [ ] Controller has complete Swagger documentation
- [ ] Service uses ErrorHandlingService consistently
- [ ] All endpoints have appropriate security decorators
- [ ] DTOs have proper validation and serialization
- [ ] No direct PrismaService injection in modules
- [ ] No direct exception throwing in services

#### **Code Review Focus Areas**
1. **Consistency**: Does it follow established patterns?
2. **Security**: Are all endpoints properly protected?
3. **Error Handling**: Uses ErrorHandlingService consistently?
4. **Documentation**: Complete Swagger documentation?
5. **Validation**: Proper input validation and DTO mapping?

### Automated Checks

#### **ESLint Rules** (Add to eslint.config.mjs)
```javascript
// Ensure consistent import patterns
'@typescript-eslint/no-unused-vars': 'error',
'@typescript-eslint/explicit-function-return-type': 'warn',
'@typescript-eslint/no-explicit-any': 'warn'
```

#### **Pre-commit Hooks** (Recommended)
- Run linting and formatting
- Check for missing role decorators
- Verify ErrorHandlingService usage
- Validate Swagger documentation completeness

## Best Practices Summary

1. **Always import PrismaModule and SharedModule** in feature modules
2. **Use standardized guards** (`JwtAuthGuard` + `RolesGuard`)
3. **Apply appropriate roles** to ALL endpoints (`@Roles()`)
4. **Use standardized DTO mapping** with `DtoMapperService`
5. **Handle errors consistently** with `ErrorHandlingService` (never direct exceptions)
6. **Document all endpoints** with complete Swagger decorators
7. **Validate all inputs** with class-validator
8. **Follow RESTful conventions** for API design
9. **Use TypeScript properly** with strict typing
10. **Write comprehensive tests** for all functionality
11. **Follow established patterns** from reference modules (Users, Roles)
12. **Maintain consistency** across all modules

## Module Compliance Scoring

| Pattern | Weight | Score |
|---------|--------|-------|
| Module Structure | 20% | Must be 100% |
| Controller Patterns | 25% | Must be 95%+ |
| Service Patterns | 25% | Must be 95%+ |
| Security Implementation | 20% | Must be 100% |
| DTO Consistency | 10% | Must be 90%+ |

**Target Overall Score: 95%+**

## Upload Module

### Overview

The Upload Module provides a comprehensive file management system for handling uploads of images, PDFs, and videos with support for public and private access control. It is designed with a storage abstraction layer to facilitate easy migration to cloud storage services.

### Key Features

1. **File Upload and Management**
   - Upload files via `POST /uploads/upload` with multipart form data
   - CRUD operations for file metadata
   - File deduplication using SHA256 hash

2. **Storage Abstraction**
   - `StorageService` interface for storage operations
   - `LocalStorageService` for local file system storage (current implementation)
   - `StorageFactoryService` for selecting storage providers
   - Ready for cloud storage integration (AWS S3, Google Cloud, Azure)

3. **Access Control**
   - Public files accessible via `GET /uploads/public/:id`
   - Private files accessible via `GET /uploads/private/:accessToken` with unique tokens
   - Role-based access to upload and management endpoints
   - Complete access logging for audit trail

4. **File Categories and Validation**
   - Predefined categories with specific MIME types and size limits:
     - `profile-images` (5MB max)
     - `documents` (50MB max)
     - `course-materials` (100MB max)
     - `system-assets` (10MB max)
     - `videos` (500MB max)
     - `audio` (50MB max)
   - File type and size validation based on category

### Database Schema

#### Master Data Tables
- `m_file_storage_providers` - Configuration for storage providers (local, AWS S3, etc.)
- `m_file_categories` - File category definitions with allowed MIME types and size limits

#### Transactional Data Tables
- `t_file_uploads` - Metadata for uploaded files including access control settings
- `t_file_access_logs` - Audit trail for file access with IP and user agent information

### Module Structure

```
backend/src/modules/uploads/
├── dto/
│   ├── file-upload.dto.ts
│   ├── create-file-upload.dto.ts
│   ├── update-file-upload.dto.ts
│   ├── find-file-uploads.dto.ts
│   ├── file-category.dto.ts
│   └── file-storage-provider.dto.ts
├── uploads.controller.ts
├── uploads.service.ts
└── uploads.module.ts
```

### Storage Services

```
backend/src/shared/services/
├── storage.service.ts (interface)
├── local-storage.service.ts
└── storage-factory.service.ts
```

### API Endpoints

#### File Upload
- `POST /uploads/upload` - Upload file with category and access control settings
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- **Parameters**: 
  - `file`: The file to upload (multipart form data)
  - `categoryId`: UUID of the file category
  - `isPublic`: Boolean indicating if the file is public (default: false)
  - `expiresAt`: Optional expiration date for the file access
  - `metadata`: Optional additional metadata as JSON

#### File Management
- `GET /uploads` - List files with pagination and filtering
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER
- `GET /uploads/:id` - Get file metadata by ID
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `PATCH /uploads/:id` - Update file metadata
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER
- `DELETE /uploads/:id` - Delete file
- **Required Roles**: SUPER_ADMIN

#### File Access
- `GET /uploads/public/:id` - Download public file by ID
- **Access**: Public (no authentication required)
- `GET /uploads/private/:accessToken` - Download private file by access token
- **Access**: Public (no authentication required, token-based)

#### Public Product Access
- `GET /products/public` - Get published products (public access)
- **Access**: Public (no authentication required)
- **Parameters**: Same as regular products endpoint but only returns PUBLISHED and ACTIVE products
- **Use Case**: Frontend applications that need to display products without authentication

### Usage Examples

#### Upload a File
```bash
curl -X POST http://localhost:3000/uploads/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "categoryId=CATEGORY_ID" \
  -F "isPublic=false"
```

#### Download Public File
```bash
curl http://localhost:3000/uploads/public/FILE_ID
```

#### Download Private File
```bash
curl http://localhost:3000/uploads/private/ACCESS_TOKEN
```

### Cloud Migration Strategy

1. **Phase 1: Local Storage (Current)**
   - Local file system storage
   - Basic URL generation for access

2. **Phase 2: Cloud Storage (Future)**
   - Implement AWS S3, Google Cloud Storage, Azure Blob Storage services
   - Update `StorageFactoryService` to support provider selection
   - Migrate existing files to cloud storage

3. **Phase 3: Advanced Features (Future)**
   - CDN integration for improved performance
   - Image processing and resizing
   - Video streaming and transcoding capabilities
   - File versioning for change tracking

### Security Features

- **File Validation**: MIME type and size validation based on category
- **Access Control**: Role-based permissions for upload and management; token-based access for private files
- **Audit Trail**: Comprehensive logging of file access with user, IP, and user agent information
- **Deduplication**: SHA256 hash to prevent duplicate file storage

### Configuration

#### Environment Variables
```env
# Upload Configuration
UPLOAD_DIR=./uploads
PUBLIC_URL=http://localhost:3000

# AWS S3 (for future use)
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google Cloud (for future use)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET=your-bucket-name
GOOGLE_CLOUD_KEY_FILE=path/to/keyfile.json
```

### TRD Compliance

- **Module Structure**: Follows standard directory structure with DTOs, controller, service, and module files
- **Controller Pattern**: Uses required decorators (`@ApiTags`, `@ApiBearerAuth`, `@UseGuards`) and Swagger documentation
- **Service Pattern**: Injects necessary services (`PrismaService`, `ErrorHandlingService`, `DtoMapperService`) and uses standardized error handling and DTO mapping
- **DTO Pattern**: Implements proper validation, serialization, and documentation decorators
- **Security**: Implements role-based access control and public/private file access with token system

## Reminder Module

### Overview

The Reminder Module provides a comprehensive scheduling and notification system that allows users to create one-time and recurring reminders associated with various business entities (e.g., incidents, audits, inspections). The system automatically triggers notifications and sends emails when reminders are due.

### Key Features

1. **Reminder Scheduling**
   - Create one-time reminders for specific dates/times
   - Create recurring reminders (weekly, monthly)
   - Dynamic entity linking via context and contextId
   - Automatic expiration handling for recurring reminders

2. **Automated Execution**
   - Cron job runs every 1 minute to process due reminders
   - Processes up to 500 reminders per execution cycle
   - Prevents duplicate execution with lock mechanism
   - Comprehensive error handling and recovery

3. **Notification Integration**
   - Automatically creates in-app notifications when reminders trigger
   - Links reminders to business entities (incidents, audits, inspections)
   - Role-based notification delivery
   - Complete execution audit trail

4. **Email Notifications**
   - Email sending capability (placeholder ready for integration)
   - Email error tracking and logging
   - Supports Nodemailer, AWS SES, or SMTP integration

5. **Status Management**
   - Status lifecycle: PENDING → SENT/EXPIRED/CANCELLED/FAILED
   - Automatic status updates based on execution results
   - Manual cancellation support
   - Failed execution tracking with error details

### Database Schema

#### Transactional Data Tables
- `t_reminders` - Scheduled reminders with recurrence support
  - Fields: userId, entity, entityId, message, remindAt, repeatType, repeatUntil, status, lastSentAt
  - Indexes: (status, remindAt), userId, (entity, entityId)
- `t_reminder_logs` - Audit trail for reminder executions
  - Fields: reminderId, executionStatus, executionDuration, failureReason, notificationId, emailSent, emailError
  - Indexes: reminderId, executedAt, executionStatus

#### Enums
- `ReminderStatusEnum`: PENDING, SENT, EXPIRED, CANCELLED, FAILED
- `ReminderRepeatTypeEnum`: NONE, WEEKLY, MONTHLY

### Module Structure

```
backend/src/modules/reminders/
├── dto/
│   ├── reminder.dto.ts              # ReminderDto, ReminderLogDto, Enums
│   ├── create-reminder.dto.ts       # Create reminder input
│   ├── update-reminder.dto.ts       # Update reminder input
│   └── find-reminders.dto.ts        # Query parameters with filters
├── reminders.service.ts              # Business logic & CRUD operations
├── reminders.controller.ts           # REST API endpoints
├── reminders.scheduler.ts            # Cron job processor
├── reminders.module.ts               # Module configuration
├── README.md                         # Comprehensive documentation
└── QUICK_START.md                    # Quick start guide
```

### API Endpoints

#### Reminder Management
- `POST /reminders` - Create new reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
  - **Body**: CreateReminderDto (message, remindAt, entity, entityId, repeatType, repeatUntil)
- `GET /reminders` - List reminders with pagination and filtering
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
  - **Query Params**: page, limit, sortBy, sortOrder, search, status, entity, entityId, fromDate, toDate
- `GET /reminders/:id` - Get single reminder by ID
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `GET /reminders/:id/logs` - Get execution logs for a reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `PATCH /reminders/:id` - Update reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `DELETE /reminders/:id` - Cancel/delete reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER

### Cron Job Specification

#### Execution Frequency
- Runs every 1 minute using `@Cron(CronExpression.EVERY_MINUTE)`
- Processes reminders where: `status = 'PENDING'` AND `remindAt <= NOW()`
- Maximum batch size: 500 reminders per execution cycle

#### Processing Flow
1. Fetch due reminders from database
2. For each reminder:
   - Get user details
   - Create in-app notification
   - Send email notification (if configured)
   - Log execution results
   - Update reminder status
3. Handle recurring reminders:
   - Calculate next execution time (weekly: +7 days, monthly: +1 month)
   - Check if exceeds repeatUntil date
   - Mark as EXPIRED if completed, otherwise reschedule

### Recurrence Logic

- **WEEKLY**: Adds 7 days to current remindAt date
- **MONTHLY**: Adds 1 month to current remindAt date
- **Expiration**: If next execution exceeds repeatUntil, reminder is marked as EXPIRED

### Usage Examples

#### Create One-time Reminder
```bash
POST /reminders
{
  "message": "Submit monthly HSE report",
  "remindAt": "2025-11-30T09:00:00Z"
}
```

#### Create Weekly Recurring Reminder
```bash
POST /reminders
{
  "entity": "t_incidents",
  "entityId": "incident-uuid",
  "message": "Weekly follow-up on unresolved incident",
  "remindAt": "2025-11-25T10:00:00Z",
  "repeatType": "WEEKLY",
  "repeatUntil": "2025-12-31T23:59:59Z"
}
```

### Security Features

- **Authentication**: JWT-based authentication required for all endpoints
- **Authorization**: Role-based access control (all roles can manage their own reminders)
- **Ownership**: Users can only view, update, and delete their own reminders
- **Input Validation**: Comprehensive validation using class-validator
- **SQL Injection Protection**: Prisma ORM provides parameterized queries

### Error Handling

- **Email Failure**: Logs error but doesn't mark reminder as failed if notification was created
- **Notification Failure**: Marks reminder as FAILED and logs reason
- **User Not Found**: Logs error and marks reminder as FAILED
- **Concurrent Execution**: Prevents duplicate processing using lock flag
- **Execution Logging**: All executions logged with duration, status, and error details

### Performance Requirements

- **Reminder Scan Latency**: < 200ms (per requirement)
- **Batch Size**: Maximum 500 reminders per execution cycle
- **Database Indexes**: Optimized indexes on (status, remindAt), userId, (entity, entityId)
- **Execution Duration Tracking**: Monitors processing time for performance optimization

### Integration with Other Modules

#### Notifications Module
- Creates in-app notifications when reminders are triggered
- Uses "REMINDER" notification type (auto-created if not exists)
- Targets user's role for notification delivery

#### Email Service (To Be Implemented)
- Placeholder for email sending logic in `reminders.scheduler.ts`
- Ready for integration with Nodemailer, AWS SES, or SMTP
- Email template includes reminder message and context

### Configuration

#### Environment Variables
```env
# No additional configuration required
# Cron job is automatically enabled when module is imported
```

#### Dependencies
- `@nestjs/schedule` - Required for cron job functionality
- `@nestjs/common` - Core NestJS functionality
- `@prisma/client` - Database access

### TRD Compliance

- **Module Structure**: Follows standard directory structure with DTOs, controller, service, and module files
- **Controller Pattern**: Uses required decorators (`@ApiTags`, `@ApiBearerAuth`, `@UseGuards`) and complete Swagger documentation
- **Service Pattern**: Injects necessary services (`PrismaService`, `ErrorHandlingService`, `DtoMapperService`) and uses standardized error handling and DTO mapping
- **DTO Pattern**: Implements proper validation, serialization, and documentation decorators
- **Security**: Implements role-based access control and user ownership validation
- **Error Handling**: Uses ErrorHandlingService consistently throughout
- **Pagination**: Standard pagination implementation with filtering and sorting

### Future Enhancements

- Queue-based processing (RabbitMQ / Redis)
- Multiple notification channels (SMS, Push Notification)
- Retry strategy with exponential backoff
- Reminder priority levels (High / Medium / Low)
- Timezone support for global users
- DST (Daylight Saving Time) handling
- Bulk reminder creation
- Reminder templates for common use cases

This TRD serves as the authoritative guide for backend development in the BurangrangAdmin Panel project. All new implementations must follow these established patterns and conventions. Any deviations must be documented and approved. 🚀

## Approval Module

### Overview
Multi-level sequential approval workflow system using template-based configuration. Supports department + job position matching for authorization.

### Database Schema

**Master Data:**
- `m_approval` - Workflow templates (entity, isActive)
- `m_approval_item` - Sequential steps (order, jobPositionId, departmentId)

**Transactional:**
- `t_approvals` - Approval records (mApprovalId, entityId, status, notes, createdBy)

### Key Features
- Template-based workflows per entity type
- Sequential approval steps (order 0, 1, 2...)
- Department + Job Position matching for authorization
- **Dynamic field resolution** via sentinel values for entity-based approvals
- Status flow: PENDING → WAITING_APPROVAL → COMPLETED/REJECTED
- Complete approval history tracking
- Automatic source entity status updates

### Dynamic Approval Options Principles

**Sentinel Values Approach**: Use special string constants (`@ENTITY_DEPARTMENT`, `@ENTITY_JOB_POSITION`) instead of fixed IDs to enable dynamic field resolution from entity data at approval creation time.

**Core Principles**:
1. **Sentinel Values**: Store sentinel strings in `m_approval_item.departmentId`/`jobPositionId` to indicate dynamic lookup
2. **Resolution at Creation**: Resolve sentinel values to actual UUIDs when creating `t_approvals` records (never store sentinels in transactional data)
3. **Backward Compatibility**: Fixed UUIDs continue to work unchanged; sentinel detection via `isApprovalFieldMarker()`
4. **Schema Handling**: Foreign key constraints removed from `m_approval_item` (via migration) to allow sentinel storage; `t_approvals` keeps constraints
5. **Relation Loading**: Load `department`/`jobPosition` relations separately, skip when sentinel detected, use display labels ("Dynamic: From Entity Data")
6. **Entity Resolution**: `ApprovalResolverService.getEntityData()` reads entity `departmentId`; `findDepartmentHead()` resolves job position via department head lookup

**Implementation**:
- Constants: `APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT`, `FROM_ENTITY_JOB_POSITION`
- Service: `ApprovalResolverService.resolveApprovalItem()` - resolves sentinels before creating approval records
- Usage: Master approval items can mix fixed IDs and sentinels (e.g., first step dynamic, second step fixed)

### Approval Record Creation Principles

**Separation of Workflow Definition and Execution Records**:
- **`m_approvals` / `m_approval_item`**: Define the approval workflow configuration (source of truth for pending/current lines)
- **`t_approvals`**: Record actual approval actions taken by approvers (execution history)

**Core Principles**:

1. **`t_approvals` Records Only After Approver Action**:
   - `t_approvals` should **ONLY** contain records AFTER an approver takes action (approves/rejects)
   - `t_approvals` should **NOT** be created when status changes to `WAITING_APPROVAL`
   - Records are created via `POST /master-approvals/approval` when approver submits their decision

2. **Workflow Definition vs. Execution**:
   - `m_approvals` defines the workflow (shown via `allApprovalLines` in API responses)
   - `t_approvals` records the execution history (shown via `history` in API responses)
   - These serve different purposes and should not duplicate each other

3. **Status Change to WAITING_APPROVAL**:
   - When entity status changes to `WAITING_APPROVAL`, do **NOT** call `createApproval()` service
   - The workflow is already defined in `m_approvals` and shown via `allApprovalLines`
   - Creating `t_approvals` records at this point causes duplication in the approval timeline

4. **Avoiding Duplication**:
   - The API response from `GET /master-approvals/check-approval-status/:dataId` includes:
     - `history[]`: Actual approval actions from `t_approvals` (after approvers act)
     - `allApprovalLines[]`: Workflow configuration from `m_approvals` (pending/current lines)
   - Frontend should render both separately, avoiding duplication by checking if a specific department/job position combination already exists in history before showing from `allApprovalLines`

**Implementation Guidelines**:
- **DO NOT** create `t_approvals` records when entity status changes to `WAITING_APPROVAL`
- **DO** create `t_approvals` records when approver submits via `POST /master-approvals/approval`
- **DO** rely on `m_approvals` configuration for showing pending/current approval lines
- **DO** use `t_approvals` records for showing completed approval history

### Module Structure
```
backend/src/modules/approvals/
├── dto/
│   ├── master-approval.dto.ts
│   ├── create-master-approval.dto.ts
│   ├── update-master-approval.dto.ts
│   └── submit-approval.dto.ts
├── master-approvals.controller.ts
├── master-approvals.service.ts
└── master-approvals.module.ts
```

### API Endpoints

**Template Management:**
- `POST /master-approvals` - Create template (SUPER_ADMIN, ADMIN)
- `GET /master-approvals` - List templates (SUPER_ADMIN, ADMIN, MANAGER)
- `GET /master-approvals/:id` - Get template
- `PATCH /master-approvals/:id` - Update template (SUPER_ADMIN, ADMIN)
- `DELETE /master-approvals/:id` - Delete template (SUPER_ADMIN, ADMIN)

**Approval Operations:**
- `GET /master-approvals/check-approval-status/:dataId` - Get status & history
- `GET /master-approvals/check-approval/:dataId` - Check if user can approve
- `POST /master-approvals/approval` - Submit approval/rejection

### Workflow Logic

**Status Determination:**
1. No approvals → PENDING, nextApprover = items[0]
2. Last approval APPROVED → Check if more steps exist
   - More steps → WAITING_APPROVAL, nextApprover = items[nextIndex]
   - No more steps → COMPLETED, nextApprover = null
3. Last approval REJECTED → REJECTED, nextApprover = null

**Authorization:**
```typescript
canApprove = 
  user.departmentId === nextApprover.departmentId &&
  user.jobPositionId === nextApprover.jobPositionId
```

**Source Entity Update:**
- Reads `APPROVAL_ENTITY` env var (JSON: `{"EntityName":"table_name"}`)
- Updates source entity status via raw SQL: `UPDATE table SET status = ? WHERE id = ?`

### Configuration

**Environment Variables:**
```env
APPROVAL_ENTITY={"RiskAssessment":"t_risk_assessment","WORK_PERMIT":"t_work_permits"}
```

**Module Integration:**
- Manual setup required: Create master approval template via API/UI
- Entity name must match exactly (case-sensitive)
- Source entity must have `status` column and `id` (uuid)

### Module Integration Examples

**1. Module Setup (Import MasterApprovalsModule):**
```typescript
// work-permits.module.ts
import { Module } from '@nestjs/common';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';

@Module({
  imports: [PrismaModule, SharedModule, MasterApprovalsModule],
  // ...
})
export class WorkPermitsModule {}
```

**2. Service Injection:**
```typescript
// work-permits.service.ts
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { ApprovalStatus } from '../approvals/dto/submit-approval.dto';

@Injectable()
export class WorkPermitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterApprovalsService: MasterApprovalsService,
    // ...
  ) {}
}
```

**3. Approve Method Implementation:**
```typescript
async approve(id: string, approveDto: ApproveDto, userId: string) {
  // 1. Get entity and validate
  const entity = await this.prisma.workPermit.findUnique({ where: { id } });
  this.errorHandler.throwIfNotFoundById('WorkPermit', id, entity);

  // 2. Get user with department/jobPosition
  const userRecord = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  // 3. Convert to User type expected by MasterApprovalsService
  const user: any = {
    id: userRecord.id,
    departmentId: userRecord.departmentId,
    jobPositionId: userRecord.jobPositionId,
    // ... other required fields
  };

  // 4. Update entity status
  const updated = await this.prisma.workPermit.update({
    where: { id },
    data: { status: 'APPROVED' },
  });

  // 5. Submit approval record
  await this.masterApprovalsService.submitApproval(
    {
      entity: 'WORK_PERMIT', // Must match master approval entity name
      dataId: id,
      status: ApprovalStatus.APPROVED,
      notes: approveDto.notes || '',
    },
    user,
  );

  return updated;
}
```

**4. Reject Method Implementation:**
```typescript
async reject(id: string, rejectDto: RejectDto, userId: string) {
  const entity = await this.prisma.workPermit.findUnique({ where: { id } });
  this.errorHandler.throwIfNotFoundById('WorkPermit', id, entity);

  const updated = await this.prisma.workPermit.update({
    where: { id },
    data: { status: 'REJECTED' },
  });

  const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
  const user: any = {
    id: userRecord.id,
    departmentId: userRecord.departmentId,
    jobPositionId: userRecord.jobPositionId,
    // ... other fields
  };

  // Submit rejection record
  await this.masterApprovalsService.submitApproval(
    {
      entity: 'WORK_PERMIT',
      dataId: id,
      status: ApprovalStatus.REJECTED,
      notes: rejectDto.reason,
    },
    user,
  );

  return updated;
}
```

**5. Check Approval Status (Frontend/API):**
```typescript
// In controller or service
async getApprovalStatus(entityId: string) {
  return this.masterApprovalsService.checkApprovalStatus(
    entityId,
    'WORK_PERMIT', // Entity name
  );
}

// Returns:
// {
//   history: [...],
//   nextApprover: { department: {...}, jobPosition: {...} },
//   currentStatus: "WAITING_APPROVAL"
// }
```

**6. Check User Approval Rights:**
```typescript
async canUserApprove(entityId: string, user: User) {
  return this.masterApprovalsService.checkApprovalRights(
    entityId,
    user,
    'WORK_PERMIT',
  );
  // Returns: { canApprove: boolean }
}
```

### Usage Example

**Create Template:**
```json
POST /master-approvals
{
  "entity": "RiskAssessment",
  "isActive": true,
  "items": [
    {"order": 0, "jobPositionId": "uuid", "departmentId": "uuid"},
    {"order": 1, "jobPositionId": "uuid", "departmentId": "uuid"}
  ]
}
```

**Submit Approval:**
```json
POST /master-approvals/approval
{
  "dataId": "entity-uuid",
  "entity": "RiskAssessment",
  "status": "APPROVED", // or "REJECTED"
  "notes": "Approval comments"
}
```

### Entity Name Mapping

**Constants File:** `backend/src/shared/constants/approval-entities.ts`
- Central registry: `APPROVAL_ENTITIES` object
- Type-safe entity names
- Helper function: `getApprovalEntityName(moduleName)`

**Module Pattern:**
```typescript
// Each module exports its entity constant
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
export const MODULE_NAME_APPROVAL_ENTITY = APPROVAL_ENTITIES.ENTITY_NAME;
```

**Usage:**
- Import constant from module: `import { RISK_ASSESSMENT_APPROVAL_ENTITY } from './risk-assessment.module'`
- Use in service methods: `entity: RISK_ASSESSMENT_APPROVAL_ENTITY`
- API endpoints accept `?entity=EntityName` query parameter

**Current Entities:**
- `RISK_ASSESSMENT` → 'RiskAssessment'
- `WORK_PERMIT` → 'WORK_PERMIT'

### Known Limitations
- Raw SQL for source entity updates (should use Prisma)
- Sequential only (no parallel approvals)
- No delegation or SLA tracking

### TRD Compliance
- ✅ Standard module structure with DTOs, controller, service
- ✅ Complete Swagger documentation
- ✅ ErrorHandlingService usage
- ✅ Role-based access control
- ✅ DTO validation and serialization

## Mail Services

### Overview

The Mail module centralizes email delivery using `@nestjs-modules/mailer` with Handlebars templates. Email templates are stored in the database and manageable via CRUD endpoints, enabling runtime updates without code deployments. The service provides typed methods for common flows (verification, password reset, invitations, password change notification) and a generic templated send method.

### Principles

- Use configuration-driven transports (from `app.mail.*` in config).
- Store templates in DB (`m_email_templates`) with subject/body Handlebars; compile at send-time.
- Use typed DTOs for payload validation and clear contracts.
- Prefer dedicated service methods for common flows; fall back to generic templated send for custom cases.
- Keep consistent template keys (`code`) to address templates from services.
- Never block critical flows on email failures; log and continue where appropriate.

### Configuration

Mail settings are resolved from the database `m_settings` table via `SettingsHelperService` with environment fallbacks. Precedence:

1) DB settings (preferred)
- `mail.provider` — smtp | gmail | mailgun
- `mail.host`
- `mail.port`
- `mail.secure` — "true" | "false"
- `mail.user`
- `mail.password`
- `mail.from`

2) Environment fallbacks (via `src/core/config/app.config.ts` → `config.get('app.mail.*')`):

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SECURE`

The `MailModule` config uses an async factory that injects `SettingsHelperService` and constructs the transporter in the service (controller never builds transporters):

```ts
imports: [ConfigModule, SettingsModule]
useFactory: async (config: ConfigService, settings: SettingsHelperService) => ({
  /* resolves values from DB keys above with env fallbacks */
})
```

### Module Structure

```
src/modules/mail/
├── mail.module.ts
├── mail.service.ts
├── dto/
│   └── mail.dto.ts
└── templates/
    └── helpers.ts            # handlebars helpers (available to DB templates)
```

### Service API

- `sendVerificationEmail({ email, name, verificationLink })`
- `sendPasswordResetEmail({ email, name, resetLink })`
- `sendTeamInvitationEmail({ email, name, inviterName, teamName, invitationLink })`
- `sendPasswordChangeNotification({ email, name, changedAt? })`
- `sendTemplatedMail({ email, template, subject?, context })`

DTOs are defined in `dto/mail.dto.ts`.

### Templates Storage (Database)

- Table: `m_email_templates`
  - `id` (uuid)
  - `code` (string, unique) — e.g. `verification`, `password-reset`
  - `name` (string)
  - `subjectTemplate` (text) — Handlebars template for subject
  - `bodyTemplate` (text) — Handlebars template for HTML body
  - `isActive` (boolean)
  - `createdAt`, `updatedAt`

- CRUD Endpoints:
  - `GET /mail/templates` — list with pagination/filtering
  - `GET /mail/templates/:id` — get template by id
  - `POST /mail/templates` — create template
  - `PATCH /mail/templates/:id` — update template
  - `PATCH /mail/templates/:id/toggle` — toggle active state
  - `DELETE /mail/templates/:id` — delete template

- The service compiles templates at send-time using Handlebars:
  - Finds template by `code`
  - Validates `isActive`
  - Compiles `subjectTemplate` and `bodyTemplate`
  - Sends via transporter configured from settings

### Error Handling

- Email send failures should be caught and logged; do not throw from user-critical flows (e.g. password reset initiation).
- Prefer structured logs including email and context identifiers.

### Example Integration (Auth)

The `AuthService.forgotPassword` generates a reset token and calls:
- `mailService.sendPasswordResetEmail({ email, name, resetLink })`
