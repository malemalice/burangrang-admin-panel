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

This Technical Reference Document (TRD) provides comprehensive guidance for the backend implementation of the Office Nexus Admin Panel. The backend is built using NestJS with TypeScript, following enterprise-grade patterns and best practices established through systematic refactoring.

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

// Model definitions with proper relationships
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

  @@map("users")
}
```

### 2. Database Service Pattern

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

### 3. Migration and Seeding

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
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});
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

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
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

## Best Practices Summary

1. **Always import SharedModule** in feature modules
2. **Use standardized guards** (`JwtAuthGuard` + `RolesGuard`)
3. **Apply appropriate roles** to endpoints (`@Roles()`)
4. **Use standardized DTO mapping** with `DtoMapperService`
5. **Handle errors consistently** with `ErrorHandlingService`
6. **Document all endpoints** with Swagger decorators
7. **Validate all inputs** with class-validator
8. **Follow RESTful conventions** for API design
9. **Use TypeScript properly** with strict typing
10. **Write comprehensive tests** for all functionality

This TRD serves as the authoritative guide for backend development in the Office Nexus Admin Panel project. All new implementations should follow these established patterns and conventions. 🚀
