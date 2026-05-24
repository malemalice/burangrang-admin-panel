# Prisma Reference

> Version: 6.7.0 (`@prisma/client@6.7.0`, `prisma@6.7.0`)
> Source: https://www.prisma.io/docs
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

Prisma is the ORM for the HSE Dashboard backend. Schema at `backend/prisma/schema.prisma`; migrations under `backend/prisma/migrations/` (138 historical); client injected via `PrismaService` from `SharedModule`.

## Key APIs used in this project

<!-- TODO: populate with actual calls grep'd from backend/src/. Expected: findMany, findUnique, create, update, delete, $transaction. Note our soft-delete convention applies a `where: { deletedAt: null }` filter at the service layer. -->

## Common patterns

- Soft delete via `deletedAt` column — query helpers filter at service layer
- Partial unique indexes to enforce business uniqueness ignoring soft-deleted rows
- `$transaction` for multi-step writes (e.g. create entity + initial approval line)
- Naming: `m_*` (master), `t_*` (transactional), `_*` (junction)

## Gotchas

- **Never run `prisma migrate` or `prisma db seed` without explicit user approval** (project rule)
- Editing historical migration files is forbidden — generate a new migration instead
- `prisma generate` must run after schema changes for types to update

## Do not use

- Raw SQL (`$queryRaw`) without a clear reason; prefer the type-safe query builder
- Implicit many-to-many — junction tables are explicit (`_PermissionToRole` etc.) and may carry metadata
