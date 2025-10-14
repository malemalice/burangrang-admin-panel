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

## Order Status Management

### Overview

The Order Status Management system provides a comprehensive workflow for digital product orders, following industry best practices for ecommerce platforms. The system ensures clear communication of order progress and proper access control for digital products.

### Order Status Flow

The system implements a 7-status workflow optimized for digital products:

```typescript
export type OrderStatus = 
  | 'PENDING'           // Order received, awaiting payment
  | 'PAYMENT_PENDING'   // Payment initiated, awaiting confirmation  
  | 'PAYMENT_FAILED'    // Payment failed, retry needed
  | 'CONFIRMED'         // Payment confirmed, preparing access
  | 'FULFILLED'         // ✅ User has access to digital product (DONE)
  | 'CANCELLED'         // Order cancelled before completion
  | 'REFUNDED';         // Order refunded, access revoked
```

### Status Definitions

| Status | Description | User Access | Payment Status | Next Actions |
|--------|-------------|-------------|----------------|--------------|
| **PENDING** | Order received, awaiting payment | ❌ No access | PENDING | Pay or Cancel |
| **PAYMENT_PENDING** | Payment initiated, awaiting confirmation | ❌ No access | PENDING | Wait or Retry |
| **PAYMENT_FAILED** | Payment failed, retry needed | ❌ No access | FAILED | Retry or Cancel |
| **CONFIRMED** | Payment confirmed, preparing access | ❌ No access | PAID | System processes |
| **FULFILLED** | ✅ **User has access to digital product** | ✅ **Full access** | PAID | Access product |
| **CANCELLED** | Order cancelled before completion | ❌ No access | CANCELLED | Terminal |
| **REFUNDED** | Order refunded, access revoked | ❌ No access | REFUNDED | Terminal |

### Status Transitions

```typescript
const validTransitions: Record<string, string[]> = {
  PENDING: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAYMENT_PENDING', 'CANCELLED'],
  CONFIRMED: ['FULFILLED', 'CANCELLED'],
  FULFILLED: ['REFUNDED'], // Only refund is possible after fulfillment
  CANCELLED: [], // Terminal state
  REFUNDED: [], // Terminal state
};
```

### Business Rules

1. **FULFILLED Status**: Indicates order completion and user access to digital products
2. **Enrollment Creation**: Course enrollments are created when order reaches FULFILLED status
3. **Access Control**: Digital product access is granted only at FULFILLED status
4. **No Backward Transitions**: Once an order progresses, it cannot go backward
5. **Terminal States**: CANCELLED and REFUNDED are final states

### Implementation Guidelines

#### Backend Implementation
- Use enum validation in all DTOs
- Implement status transition validation in service layer
- Create enrollments at FULFILLED status
- Log all status changes for audit trail

#### Frontend Implementation
- Display clear status descriptions to users
- Use appropriate icons and colors for each status
- Show progress indicators for order flow
- Provide access links when status is FULFILLED

## Product Type UI Mapping

### Overview

The SoulYouSee platform uses different product type naming conventions between the backend API and the frontend UI (webv2) to provide better user experience and brand alignment.

### Product Type Aliases

#### Backend Product Types (API)
The backend uses standardized product type enums for data consistency:

```typescript
export enum ProductType {
  EBOOK = 'EBOOK',
  COURSE = 'COURSE',
  VIDEO = 'VIDEO',
  BUNDLE = 'BUNDLE'
}
```

#### Frontend UI Display Names (webv2 Only)
The webv2 frontend application uses branded display names for product types:

| Backend Type | Frontend UI Display | Description |
|--------------|---------------------|-------------|
| `COURSE` | **Kelas Healing** | E-learning courses focused on mental health and personal growth |
| `EBOOK` | **Toolkit Refleksi** | Digital toolkits and reflection guides |
| `VIDEO` | **Toolkit Refleksi** | Video-based content and workshops |
| `BUNDLE` | **Toolkit Refleksi** | Bundled content packages |

### Implementation Notes

1. **Backend Consistency**: The backend continues to use standard product type enums (`COURSE`, `EBOOK`, `VIDEO`, `BUNDLE`)
2. **Frontend Mapping**: Only the webv2 frontend UI displays these as "Kelas Healing" and "Toolkit Refleksi"
3. **No Code Changes**: This is purely a UI display mapping - no changes to backend APIs, database schema, or business logic
4. **API Communication**: All API requests and responses continue to use standard backend product types

### Usage in Frontend

```typescript
// Frontend display mapping (webv2 only)
export const getProductTypeDisplayName = (backendType: ProductType): string => {
  switch (backendType) {
    case 'COURSE':
      return 'Kelas Healing';
    case 'EBOOK':
    case 'VIDEO':
    case 'BUNDLE':
      return 'Toolkit Refleksi';
    default:
      return 'Product';
  }
};
```

### Business Context

- **Kelas Healing**: Represents structured e-learning experiences with modules, lessons, and interactive content
- **Toolkit Refleksi**: Represents self-paced resources, guides, and reflection tools for personal development

This naming strategy aligns with the SoulYouSee brand identity and makes the product categories more meaningful and accessible to Indonesian users.

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

This TRD serves as the authoritative guide for backend development in the BurangrangAdmin Panel project. All new implementations must follow these established patterns and conventions. Any deviations must be documented and approved. 🚀
