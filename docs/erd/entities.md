> [← ERD Index](./index.md)
>
> *Pointers into the full ERD by entity class (`m_*` / `t_*` / `_*`) and the required columns for new entities (UUID PK, audit, soft-delete, isActive, code/slug).*

# Entities

> This file points into `backend/erd.md` and `backend/prisma/schema.prisma`. It does not duplicate entity definitions — those would drift.

## How to find an entity

1. Quick name lookup: open [quick-reference.md](./quick-reference.md)
2. Full definition & relationships: open [full.md](./full.md), search for the entity name
3. Source of truth: open [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma), search for `model <EntityName>`

## Entity classes by prefix

### Master data (`m_*`)
Reference / lookup tables. Soft-disabled via `isActive`. Examples: `m_roles`, `m_permissions`, `m_menus`, `m_offices`, `m_departments`, `m_job_positions`, `m_approval` (workflow config).

### Transactional (`t_*`)
Business records. Include `createdBy` audit column; soft-deleted with `deletedAt` + `deletedBy`. Examples: `t_users`, `t_incidents`, `t_work_permits`, `t_inspections`, `t_risk_assessments`, `t_certificates`, `t_ppe_withdrawals`, `t_approvals` (execution history).

### Junction (`_*`)
Many-to-many bridges. Carry metadata when natural (e.g. `order`, `role`). Examples: `_PermissionToRole`, `_MenuToRole`.

## Data-scoped entities

Subject to `DataScopeGuard` (`SELF` / `DEPARTMENT` / `SUPER`):

- Enrollments
- Work Permits
- Certificates
- PPE Withdrawals

See [notes.md](./notes.md) and [../trd-authorization.md §6](../trd-authorization.md).

## Required columns on new entities

Per [principles.md §3](../../principles.md):

| Column | When | Notes |
|---|---|---|
| `id` UUID PK | always | globally unique, safe for distributed |
| `createdAt` | always | timestamp default `now()` |
| `updatedAt` | always | auto-updated |
| `createdBy` | transactional only | FK to `t_users` |
| `deletedAt`, `deletedBy` | soft-delete tables (most) | partial unique indexes ignore deleted rows |
| `isActive` | master data | soft-disable without breaking historical FKs |
| `code` / `slug` | when human-referenced | humans read `code`, joins use `id` |
