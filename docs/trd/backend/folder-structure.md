> [← Backend TRD Index](./index.md)

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
│   │   │   ├── data-scope.service.ts     # Data-level buildWhereForList / canAccessRecord
│   │   │   └── settings.service.ts       # Application settings
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication
│   │   │   ├── roles.guard.ts            # Role-based authorization
│   │   │   ├── permissions.guard.ts      # Permission-based access
│   │   │   └── data-scope.guard.ts       # Data-level userContext (data-scoped modules only)
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts        # @Roles() decorator
│   │   │   ├── permissions.decorator.ts  # @Permissions() decorator
│   │   │   ├── allow-options-bypass.decorator.ts  # @AllowOptionsBypass() for list endpoints
│   │   │   ├── data-scoped.decorator.ts  # @DataScoped(entityName) for data-level routes
│   │   │   └── public.decorator.ts       # @Public() for public routes
│   │   ├── types/
│   │   │   ├── user-context.ts           # UserContext, DataLevel (data-level access)
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
