# Backend Technical Reference Document — Index

> Read only the sub-file relevant to your task. Do not load all sub-files.
> Authoritative source for all backend NestJS patterns at HSE Dashboard. Content split from the original `backend/TRD.md` on 2026-05-24 (see [exec-plan](../../exec-plans/completed/2026-05-24-tidy-leftover-docs.md)).

## Cross-cutting patterns

| File | Section |
|---|---|
| [overview.md](./overview.md) | Project overview, technologies, core principles |
| [architecture.md](./architecture.md) | High-level architecture diagram, module architecture |
| [folder-structure.md](./folder-structure.md) | Backend file/folder layout |
| [core-patterns.md](./core-patterns.md) | Module / DTO / Controller patterns |
| [api-design.md](./api-design.md) | REST, pagination, query, response, options bypass |
| [security.md](./security.md) | Guards, decorators, security layer, data-level access, approval-assignee exception |
| [error-handling.md](./error-handling.md) | ErrorHandlingService, response standardisation |
| [dto-mapping.md](./dto-mapping.md) | DtoMapperService and mapping patterns |
| [database.md](./database.md) | Prisma config, naming convention, service pattern, migration/seeding |
| [testing.md](./testing.md) | Unit testing structure and patterns, coverage goals |
| [deployment.md](./deployment.md) | Env config, Docker, production optimisations, health checks |
| [checklist.md](./checklist.md) | Module + code-quality implementation checklists |
| [quality-guidelines.md](./quality-guidelines.md) | Code pattern audit, best practices summary, module compliance scoring |

## Module-specific TRDs

| Module | File |
|---|---|
| Upload Module | [modules/upload.md](./modules/upload.md) |
| Reminder Module | [modules/reminder.md](./modules/reminder.md) |
| Approval Module | [modules/approval.md](./modules/approval.md) |
| Mail Services | [modules/mail.md](./modules/mail.md) |
| Zoho Integration | [modules/zoho-integration.md](./modules/zoho-integration.md) |

See [modules/index.md](./modules/index.md) for a quick description of each.

## Related references

- Master orchestration: [AGENTS.md](../../../AGENTS.md)
- Backend agent rules: [docs/agents/developer-backend.md](../../agents/developer-backend.md)
- Database schema: [`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma) (source of truth)
- ERD docs: [docs/erd/index.md](../../erd/index.md)
