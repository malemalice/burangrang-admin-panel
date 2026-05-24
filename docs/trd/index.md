# Technical Requirements — Index

> The authoritative TRDs have been split into structured sub-files (2026-05-24):
> - Backend: [docs/trd/backend/](./backend/) (`backend/TRD.md` is now a redirect)
> - Frontend: [docs/trd/frontend/](./frontend/) (`frontend/TRD.md` is now a redirect — Phase 2)
> The cross-cutting sub-files below complement those structured layers.

## Cross-cutting

| File | Contents |
|---|---|
| [stack-architecture.md](./stack-architecture.md) | Stack summary + anchors into backend/frontend TRD sections |
| [constraints-integrations.md](./constraints-integrations.md) | Zoho, Google Site embed, email/SMTP, OAuth |
| [deployment.md](./deployment.md) | Docker compose, nginx, .github/workflows, environments |
| [decisions.md](./decisions.md) | ADR-style log of architectural decisions |

## Structured TRDs (authoritative)

- [docs/trd/backend/index.md](./backend/index.md) — 15 cross-cutting + 4 module-specific sub-files (NestJS patterns, security, error handling, Prisma, upload/reminder/approval/mail)
- [docs/trd/frontend/index.md](./frontend/index.md) — frontend stack docs (Phase 2 of the tidy-up exec-plan; currently `frontend/TRD.md` is still the source until that phase completes)

## Topic-specific cross-cutting TRDs (in `docs/`)

| Topic | File |
|---|---|
| Authentication | [../trd-auth.md](../trd-auth.md) |
| Authorization | [../trd-authorization.md](../trd-authorization.md) |
| Data-scope validation | [../trd-authorization-data-scope-validation.md](../trd-authorization-data-scope-validation.md) |
| Sidebar permission lookup | [../trd-sidebar-permission-lookup.md](../trd-sidebar-permission-lookup.md) |
| Soft delete (inventory) | [../trd-soft-delete-inventory.md](../trd-soft-delete-inventory.md) |
| Soft delete (rollout) | [../trd-soft-delete-rollout.md](../trd-soft-delete-rollout.md) |
| Inspection approval | [../trd-inspection-approval.md](../trd-inspection-approval.md) |
| Inspection approval (legacy) | [../trd-inspection-approval-legacy.md](../trd-inspection-approval-legacy.md) |
| Investigation report schema | [../trd-investigation-report-schema.md](../trd-investigation-report-schema.md) |
| Reminders & calendar | [../trd-reminders-calendar.md](../trd-reminders-calendar.md) |
