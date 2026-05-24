# Architectural Decisions

> ADR-style log. One row per decision. Link to authoritative implementation docs.

| Date | Decision | Rationale | Reference |
|---|---|---|---|
| (historical) | Soft delete via `deletedAt` + `deletedBy` on most tables | Preserve audit history; partial unique indexes ignore deleted rows | [../trd-soft-delete-rollout.md](../trd-soft-delete-rollout.md), [../trd-soft-delete-inventory.md](../trd-soft-delete-inventory.md) |
| (historical) | Three-tier authorization: role / permission / data-scope as separate guards | Mixing them produces unmaintainable access logic ([principles §2](../../principles.md)) | [../trd-authorization.md](../trd-authorization.md), [../trd-authorization-data-scope-validation.md](../trd-authorization-data-scope-validation.md) |
| (historical) | Inspection approval migration to configurable workflow | Approval lines must be configurable per Master Approval config, never hardcoded | [../trd-inspection-approval.md](../trd-inspection-approval.md) (legacy in [../trd-inspection-approval-legacy.md](../trd-inspection-approval-legacy.md)) |
| (historical) | `?options=true` bypass for dropdown endpoints | Reference-data lookups should not require module-level read permission ([principles §2](../../principles.md)) | [docs/trd/backend/api-design.md §5](./backend/api-design.md) |
| (historical) | `m_` / `t_` / `_` table prefixes | Schema is self-documenting; tooling can reason about table class | [../erd/full.md](../erd/full.md) |
| 2026-05-24 | AI instruction system reorganised into `AGENTS.md` + `docs/agents/` + structured `docs/` indexes | Single navigable entry point across Claude / Cursor / Codex; avoid divergence | This file + [../../AGENTS.md](../../AGENTS.md) |

## How to add a decision

1. Date the decision (YYYY-MM-DD).
2. State the decision in one sentence.
3. State the rationale in one sentence.
4. Link to the authoritative implementation doc (a TRD sub-file, a per-domain PRD, or a code path).
5. If the decision supersedes another, add a "supersedes" note in the new row and append "(superseded by …)" to the old row.
