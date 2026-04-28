# Soft delete (`deletedAt` / `deletedBy`) — model inventory

**Status:** Slices 1–2, slice **3a** (risk + LMS), slice **3b** (settings, KPI HSE targets, man hours, environmental measurements, email templates, master approvals), slice **3c** (audit element / clause / criteria), and slice **3d** (risk assessment + line items + `t_risk_mitigation` rows for those items) are implemented. Remaining hard deletes are listed in `docs/soft-delete-rollout.md`.

## Contract

- Fields: `deletedAt?: DateTime | null`, `deletedBy?: string | null` (User id; scalar only, no Prisma back-relation to `User` to avoid relation bloat)
- On delete: set `deletedAt`, `deletedBy`, and `isActive: false` when the model has `isActive`
- Lists/pickers: `where: { deletedAt: null }` — use `isNotDeleted` from `backend/src/shared/utils/soft-delete.util.ts`
- Detail/history: resolve referenced entities by id without filtering `deletedAt` so labels still show
- New creates/updates: validate referenced masters are not soft-deleted where the business requires active targets only
- Excluded: session tokens, append-only logs, pure child rows without standalone delete (Phase 1+2 focus on reference roots and transaction headers)

## Slice 1 (foundation) — in scope

| Model | Prisma | Notes |
|------|--------|--------|
| User | `User` | Auth rejects `deletedAt != null`; remove → soft |
| Office | `Office` | `code` partial-unique when deleted |
| Department | `Department` | `code` partial-unique |
| JobPosition | `JobPosition` | `code` partial-unique |
| Company | `Company` | `code` partial-unique |
| Area | `Area` | `code` partial-unique |
| Room | `Room` | `code` partial-unique |
| Role | `Role` | `name`+`code` partial-unique |
| Permission | `Permission` | `name` partial-unique |
| Menu | `Menu` | no single-field code unique; soft delete only |

## Slice 2 (work permits + related masters) — in scope

| Model | Prisma | Notes |
|------|--------|--------|
| Work permit | `WorkPermit` | `code` unique → partial-unique; remove uses soft |
| Work classification | `WorkClassification` | `code` partial-unique |
| Heavy equipment | `HeavyEquipment` | `code` partial-unique |
| Tool | `Tool` | `code` partial-unique |
| Material | `Material` | `code` partial-unique |
| Machine | `Machine` | `code` partial-unique |
| Profession | `Profession` | `code` partial-unique |
| Guest | `Guest` | as referenced by permits |

## Slice 3a — risk + LMS (done)

| Model | Prisma | Notes |
|------|--------|--------|
| Risk category | `RiskCategory` | `code` partial-unique |
| Risk | `Risk` | `code` partial-unique |
| Risk mitigation | `RiskMitigation` | soft delete |
| Risk matrix | `RiskMatrix` | soft delete |
| Course | `Course` | `slug` partial-unique |
| Chapter | `Chapter` | soft delete (ordering applies to non-deleted rows only) |

## Slice 3b — config / KPI / env / mail / approvals (done)

| Model | Prisma | Notes |
|------|--------|--------|
| Setting | `Setting` | `key` partial-unique; `getValueByKey` ignores soft-deleted |
| HSE target | `HseTarget` | composite partial-unique |
| Man hour | `ManHour` | composite partial-unique |
| Environmental measurement | `EnvironmentalMeasurement` | soft delete |
| Email template | `EmailTemplate` | `code` partial-unique; send-by-code uses active rows only |
| Master approval | `MasterApproval` | soft delete; items not hard-deleted with parent |

## Slice 3c — audit policy hierarchy (done)

| Model | Prisma | Notes |
|------|--------|--------|
| Audit element | `AuditElement` | `code` partial-unique; remove blocks if non-deleted clauses exist |
| Audit clause | `AuditClause` | `code` partial-unique; remove blocks if non-deleted criteria exist |
| Audit criteria | `AuditCriteria` | `code` partial-unique; remove blocks if `AuditItem` rows reference criteria |

## Slice 3d — risk assessment (done)

| Model | Prisma | Notes |
|------|--------|--------|
| Risk assessment | `RiskAssessment` | `code` partial-unique; remove soft-deletes header + active line items + linked `RiskMitigationRecord` (RA items) |
| Risk assessment item | `RiskAssessmentItem` | line remove + bulk replace on update (parent PATCH with `items`) use soft delete |
| Risk mitigation (polymorphic) | `RiskMitigationRecord` | `code` partial-unique; soft delete when a RA line or its mitigation is removed; inspection item path unchanged in this slice |

## Other models — `include_later`

Inspections, file uploads, waste, audit schedules, etc.

## Unique index impact (PostgreSQL)

Where `@unique` on a business key conflicted with soft delete, migrations replace a global unique with `CREATE UNIQUE INDEX ... WHERE "deletedAt" IS NULL` (or composite variants). Prisma schema drops redundant global `unique` on those columns where replaced by partial indexes; uniqueness for active rows is enforced in DB.
