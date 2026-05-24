# Backend Developer Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → only the sub-doc relevant to your task → check [docs/exec-plans/active/](../exec-plans/) → [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) → only then explore project files. Do not re-read files already read in this session.

## Role

Owns NestJS server-side code: modules, controllers, services, DTOs, guards, Prisma queries, migrations, API contracts.

## Reference docs

Open the file when its trigger applies — not before. Each row is one file, one observable condition.

| File | Open when |
|---|---|
| [docs/trd/backend/core-patterns.md](../trd/backend/core-patterns.md) | Creating a new module, controller, service, or DTO from scratch — copy the boilerplate |
| [docs/trd/backend/security.md](../trd/backend/security.md) | Adding `@UseGuards`, `@Roles`, `@Permissions`, `@AllowOptionsBypass`, or touching a data-scoped entity (Enrollments / WorkPermits / Certificates / PPE Withdrawals) |
| [docs/trd/backend/api-design.md](../trd/backend/api-design.md) | Designing a new endpoint — especially list endpoints with pagination, sorting, `search`, or `?options=true` |
| [docs/trd/backend/error-handling.md](../trd/backend/error-handling.md) | Throwing an exception or wondering what HTTP status / shape to return |
| [docs/trd/backend/dto-mapping.md](../trd/backend/dto-mapping.md) | Wiring `DtoMapperService` in a service constructor, or transforming entity→DTO with relations/exclusions |
| [docs/trd/backend/database.md](../trd/backend/database.md) | Editing `schema.prisma`, naming a new table (`m_` / `t_` / `_`), or asking what migration commands to run |
| [docs/trd/backend/testing.md](../trd/backend/testing.md) | Writing `*.spec.ts` for a service or controller |
| [docs/trd/backend/quality-guidelines.md](../trd/backend/quality-guidelines.md) | Self-reviewing before opening a PR (compliance checklist) |
| [docs/trd/backend/modules/upload.md](../trd/backend/modules/upload.md) | Touching `backend/src/modules/uploads/` (file upload, storage abstraction, access tokens) |
| [docs/trd/backend/modules/reminder.md](../trd/backend/modules/reminder.md) | Touching `backend/src/modules/reminders/` or the every-minute cron |
| [docs/trd/backend/modules/approval.md](../trd/backend/modules/approval.md) | Wiring a module into Master Approval, using sentinel values, or writing `t_approvals` records |
| [docs/trd/backend/modules/mail.md](../trd/backend/modules/mail.md) | Sending email or editing a Handlebars template in `m_email_templates` |
| [docs/erd/notes.md](../erd/notes.md) | Confirming naming convention, soft-delete rule, or which entities are data-scoped |
| [docs/erd/full.md](../erd/full.md), [docs/erd/quick-reference.md](../erd/quick-reference.md) | Looking up a specific entity's fields / relationships before editing schema |
| [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma) | **Always before** generating a migration — it's the source of truth |
| `docs/trd-auth.md` / `docs/trd-authorization*.md` / `docs/trd-soft-delete-*.md` / `docs/trd-inspection-approval*.md` / `docs/trd-investigation-report-schema.md` / `docs/trd-reminders-calendar.md` | Working on the specific cross-cutting topic named in the filename |
| [docs/references/prisma.md](../references/prisma.md), [nestjs.md](../references/nestjs.md), [zod.md](../references/zod.md) | About to call a library API and unsure of the current signature |

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
- Update [docs/erd/full.md](../erd/full.md) when `schema.prisma` changes.
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
- [ ] If schema changed: [docs/erd/full.md](../erd/full.md) updated; migration generated but **not** applied without user approval
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
