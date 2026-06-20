# NestJS Reference

> Version: 11.0.1 (`@nestjs/core`, `@nestjs/common`)
> Source: https://docs.nestjs.com
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

NestJS is the backend framework. 53 feature modules under `backend/src/modules/`. DI-driven; module-scoped providers; guards/interceptors/filters globally registered in `app.module.ts`.

## Key APIs used in this project

<!-- TODO: populate with actual decorators/classes used. Expected core surface:
- @Module, @Controller, @Injectable
- @Get/@Post/@Patch/@Delete, @Body/@Query/@Param
- @UseGuards, custom decorators (@AllowOptionsBypass, @DataScoped, @Roles, @Permissions)
- @ApiTags, @ApiBearerAuth, @ApiProperty (Swagger)
- Passport AuthGuard, JwtStrategy
- ConfigService, ScheduleModule
-->

## Common patterns

- Guard chain: `JwtAuthGuard → RolesGuard → PermissionsGuard → [DataScopeGuard]`
- Custom decorators in `backend/src/shared/decorators/`
- Shared services injected: `PrismaService`, `ErrorHandlingService`, `DtoMapperService`
- DTO split: `entity.create.ts`, `entity.update.ts`, `entity.response.ts`
- Swagger auto-doc on all controllers

## Gotchas

- Provider registration is module-scoped — re-import `SharedModule` in every feature module that needs shared services
- Guards run in the order declared on `@UseGuards()` — never reorder
- `class-validator` decorators run in the global `ValidationPipe`; DTO classes must use `@Expose()` for `class-transformer` to include the property

## Do not use

- Reordering the guard chain
- Skipping `SharedModule` import and re-instantiating shared services in a feature module
