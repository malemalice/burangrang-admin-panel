> [← Backend TRD Index](./index.md)

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
- **Data-Level Access**: For selected modules (enrollments, work permits, certificates, PPE withdrawals), row-level access is driven by the role's `dataLevel` (SELF | DEPARTMENT | SUPER). List endpoints hide rows the user may not see; single-record operations return 403 when the user has no access. Implement via `DataScopeGuard`, `DataScopeService`, and `@DataScoped(entityName)`; all other modules are unchanged.
