# Entity Relationship — Index

> Authoritative schema: **`backend/prisma/schema.prisma`**. Always check it before changes.
> Authoritative ERD: **`backend/erd.md`** (full) and **`backend/erd-quick-reference.md`** (lookup).
> The sub-files below are a **navigation layer**.

## Sub-files

| File | Contents |
|---|---|
| [entities.md](./entities.md) | Pointers to entity sections in `backend/erd.md` (master / transactional / junction) |
| [relationships.md](./relationships.md) | Common relationship patterns + pointer to ERD relationship sections |
| [notes.md](./notes.md) | Naming convention, soft delete, data-scoped entities, dual-ref pattern |

## Authoritative files

- [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma) — source of truth
- [full.md](./full.md) — full ERD documentation
- [quick-reference.md](./quick-reference.md) — quick lookup
- `backend/prisma/migrations/` — 138 migrations (do not edit historical migrations; generate new ones)

## Naming convention (must follow)

| Prefix | Table class | Example |
|---|---|---|
| `m_` | Master data | `m_roles`, `m_offices`, `m_departments` |
| `t_` | Transactional | `t_users`, `t_approvals`, `t_risk_assessment` |
| `_` | Junction | `_PermissionToRole`, `_MenuToRole` |

## Rules

- Always check `backend/prisma/schema.prisma` before adding/changing entities.
- Update `backend/erd.md` after any schema change.
- Never run migrations or seed scripts without explicit user approval.
- New entities default to: UUID PK, `createdAt`, `updatedAt`, soft delete (`deletedAt`, `deletedBy`), `isActive` for master data.
- See [principles.md §3 Data Modeling](../../principles.md) for the *why*.
