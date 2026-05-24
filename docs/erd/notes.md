> [← ERD Index](./index.md)
>
> *Naming convention, soft delete, data-scoped entities (Enrollments / WorkPermits / Certificates / PPE), workflow status enum order, audit columns, identifier conventions, migration rules.*

# ERD Notes

## Naming convention

| Prefix | Class | Examples |
|---|---|---|
| `m_` | Master data | `m_roles`, `m_permissions`, `m_menus`, `m_offices`, `m_departments`, `m_job_positions` |
| `t_` | Transactional | `t_users`, `t_incidents`, `t_approvals`, `t_risk_assessments`, `t_work_permits` |
| `_` | Junction | `_PermissionToRole`, `_MenuToRole` |

## Soft delete

Most tables soft-delete via `deletedAt` (timestamp) + `deletedBy` (FK to `t_users`).

- Active queries filter `WHERE deletedAt IS NULL`.
- Business uniqueness enforced via **partial unique indexes** that ignore deleted rows.
- Authoritative inventory: [../trd-soft-delete-inventory.md](../trd-soft-delete-inventory.md)
- Rollout history: [../trd-soft-delete-rollout.md](../trd-soft-delete-rollout.md)

## Data-scoped entities (DataScopeGuard)

Apply `@DataScoped('EntityName')` + `DataScopeGuard` **only** for:

| Entity | Why scoped |
|---|---|
| Enrollments | A user should only see their own training enrollments unless DEPARTMENT/SUPER |
| Work Permits | Department-scoped; approval-assignee read exception applies (see [docs/trd/backend/security.md §4a](../trd/backend/security.md)) |
| Certificates | Own certificates default; department head sees department's |
| PPE Withdrawals | Same pattern as Work Permits |

Data scope levels:
- `SUPER` — see everything (admin)
- `DEPARTMENT` — see own department's rows
- `SELF` — see own rows only

Other entities are governed by role/permission only — do **not** add `@DataScoped` reflexively.

See [docs/trd/backend/security.md](../trd/backend/security.md) and [../trd-authorization-data-scope-validation.md](../trd-authorization-data-scope-validation.md).

## Status enums

Workflow status order (default for approval-bearing entities):

```
DRAFT or SCHEDULED → OPEN → WAITING_APPROVAL → DONE or REJECTED
```

Modeled as Prisma enums; never as free-text strings.

## Audit columns

| Column | On | Type |
|---|---|---|
| `createdAt` | all | DateTime default `now()` |
| `updatedAt` | all | DateTime updated automatically |
| `createdBy` | transactional (`t_*`) | UUID FK → `t_users.id` |
| `updatedBy` | transactional (`t_*`), optional | UUID FK → `t_users.id` |

## Identifiers

- **UUIDs for joins** — globally unique, no row-count leakage
- **`code` / `slug` for humans** — URLs, exports, references in UI
- Filename convention for DTOs: `entity.response.ts`, `entity.create.ts`, `entity.update.ts`

## Migration rules

- Never run `npx prisma migrate` without explicit user approval
- Always check `backend/prisma/schema.prisma` before editing
- Always update `backend/erd.md` after a schema change
- Never edit historical migration files in `backend/prisma/migrations/`
