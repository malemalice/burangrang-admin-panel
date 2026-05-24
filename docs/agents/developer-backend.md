# Backend Developer Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → only the sub-doc relevant to your task → check [docs/exec-plans/active/](../exec-plans/) → [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) → only then explore project files. Do not re-read files already read in this session.

## Role

Owns NestJS server-side code: modules, controllers, services, DTOs, guards, Prisma queries, migrations, API contracts.

## Reference docs

| Doc | Sections relevant to this role |
|---|---|
| [docs/trd/backend/index.md](../trd/backend/index.md) | Cross-cutting backend patterns. Open only the sub-file relevant to your task: [architecture.md](../trd/backend/architecture.md), [core-patterns.md](../trd/backend/core-patterns.md), [api-design.md](../trd/backend/api-design.md), [security.md](../trd/backend/security.md), [error-handling.md](../trd/backend/error-handling.md), [dto-mapping.md](../trd/backend/dto-mapping.md), [database.md](../trd/backend/database.md), [testing.md](../trd/backend/testing.md), [quality-guidelines.md](../trd/backend/quality-guidelines.md) |
| [docs/trd/backend/modules/](../trd/backend/modules/) | Module-specific TRDs: [upload.md](../trd/backend/modules/upload.md), [reminder.md](../trd/backend/modules/reminder.md), [approval.md](../trd/backend/modules/approval.md), [mail.md](../trd/backend/modules/mail.md) |
| [docs/trd/stack-architecture.md](../trd/stack-architecture.md) | Backend architecture overview, stack versions |
| [docs/trd/constraints-integrations.md](../trd/constraints-integrations.md) | Guard chain, data-scoped entities, API envelope |
| [docs/erd/index.md](../erd/index.md) → [docs/erd/notes.md](../erd/notes.md) | Naming, soft-delete, data scope |
| [`backend/erd.md`](../../backend/erd.md), [`backend/erd-quick-reference.md`](../../backend/erd-quick-reference.md) | Entity-specific schema |
| [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma) | Source of truth |
| Cross-cutting TRDs in `docs/trd-*.md` | Auth, authorization, data-scope, soft-delete, inspection-approval, investigation schema, reminders |
| [docs/references/index.md](../references/index.md) | Prisma, NestJS, Zod (when needed) |

Do not extract content from these docs into this file. Reference only.

## Responsibilities

- Implement REST endpoints following [stack-architecture.md](../trd/stack-architecture.md) and [docs/trd/backend/](../trd/backend/) patterns
- Wire guards in correct order: `JwtAuthGuard → RolesGuard → PermissionsGuard → [DataScopeGuard]`
- Author DTOs (separate create/update; `@ApiProperty()`, `@Expose()`, validation decorators)
- Author Prisma schema changes — flag for explicit user approval before running migrations
- Apply soft-delete pattern where tables warrant it
- Surface Swagger docs via `@ApiTags`, `@ApiBearerAuth`
- Use shared `ErrorHandlingService` and `DtoMapperService`; import `SharedModule` in feature modules

## Rules

### Must
- Follow guard chain order exactly. Never reorder.
- Inject services from `SharedModule`: `PrismaService`, `ErrorHandlingService`, `DtoMapperService`.
- Use `@AllowOptionsBypass()` on list endpoints that serve dropdowns; `?options=true` skips permission check (JWT still required).
- Apply `@DataScoped('EntityName')` + `DataScopeGuard` **only** for: Enrollments, Work Permits, Certificates, PPE Withdrawals.
- Update [`backend/erd.md`](../../backend/erd.md) when `schema.prisma` changes.
- Add `createdAt`, `updatedAt`, `createdBy` (transactional), soft-delete columns (most tables), `isActive` (master data) per [docs/erd/notes.md](../erd/notes.md).
- Throw typed exceptions; let `ErrorHandlingService` translate to the response envelope.

### Must not
- Run `prisma migrate` or `prisma db seed` without explicit user approval.
- Hardcode secrets — always env vars.
- Hardcode approver names in workflow logic — read from `Master Approval` config.
- Persist sentinel placeholders (`@ENTITY_DEPARTMENT`) in transactional rows — resolve at creation.
- Edit historical migration files in `backend/prisma/migrations/`.
- Re-validate inside private/internal functions — validate once at the perimeter ([principles §5](../../principles.md)).

## Checklist

Before marking a task complete:
- [ ] Endpoint follows REST + envelope convention (`{ data, meta }`)
- [ ] Guard chain wired correctly
- [ ] DTO has `@ApiProperty()` and validation decorators
- [ ] Module imports `SharedModule`
- [ ] If schema changed: `backend/erd.md` updated; migration generated but **not** applied without user approval
- [ ] If touched [Approval Module](../trd/backend/modules/approval.md) integration: `t_approvals` only written on approver action, not on status change
- [ ] If data-scoped entity touched: `@DataScoped()` present
- [ ] `npm run lint` and `npm run test` pass (run explicitly; do not assume)
- [ ] Swagger docs render (curl `/api`)

## Exec-plan gate

Before starting any task that touches >3 files or spans >1 role:
1. Check [docs/exec-plans/active/](../exec-plans/) for an existing plan
2. If none exists, create `docs/exec-plans/active/<task-slug>.md` using [`_template.md`](../exec-plans/active/_template.md)
3. Fill the plan before writing any code

## Quality gate

Before touching any domain:
1. Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)
2. If domain is graded C or below: add Jest coverage for the affected path, justify each change in the exec-plan, flag for review
