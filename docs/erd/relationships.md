# Relationships

> This file documents recurring relationship patterns. Specific relationships live in [`backend/erd.md`](../../backend/erd.md) and [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma).

## Common patterns

### Self-referencing FK (hierarchy)
Used for: org charts, menus, comment threads, checklist trees.
One table, parent pointer (`parentId`), depth implicit.
Example: `m_menus.parentId` → `m_menus.id`

### Junction with metadata
Used for: many-to-many where the link carries data.
Example: `_PermissionToRole` (also encodes role/permission ordering)

### Dual-ref (FK + free-text fallback)
Used when master data may be incomplete (external personnel, ad-hoc equipment).
Example: an incident reporter may be a linked `t_users.id` OR a free-text name.
See [principles.md §3](../../principles.md) — "Dual-ref pattern".

### Workflow config vs execution history
- **Config tables** (`m_approval`, approval lines): describe steps, who approves, in what order.
- **History tables** (`t_approvals`): record what actually happened, when, by whom.
- Never overload one for the other.

### Sentinel approval assignees
Approval config stores markers like `@ENTITY_DEPARTMENT` (resolved at runtime to real `t_users.id` when the entity is created). Never persist sentinels in transactional rows.

## FK actions

| Action | When |
|---|---|
| `UPDATE CASCADE` | always (id renames propagate) |
| `DELETE RESTRICT` | default — protect referential integrity |
| `DELETE SET NULL` | only for genuinely optional refs |
| `DELETE CASCADE` | rare — only where deletion semantics are unambiguous |

## Composite uniques

Use for natural keys:
- `(parentId, childId)` on parent-child tables
- `(attemptId, questionId)` on assessment answer tables
- `(roleId, permissionId)` on `_PermissionToRole`
- `(entityType, entityId, line)` on approval line config

Let the database enforce what the domain demands.

## Cardinality cheat-sheet

For a quick visual of who-relates-to-whom, see [`backend/erd-quick-reference.md`](../../backend/erd-quick-reference.md). For the full diagram and field-level detail, see [`backend/erd.md`](../../backend/erd.md).
