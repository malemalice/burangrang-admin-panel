# External Library References

> Before calling any library API: check this index. If a reference file exists, read it first.
> Update when a library version changes.

## Libraries

| Library | Version | File | Last updated |
|---|---|---|---|
| Prisma | 6.7.0 | [prisma.md](./prisma.md) | 2026-05-24 (stub) |
| NestJS | 11.0.1 | [nestjs.md](./nestjs.md) | 2026-05-24 (stub) |
| TanStack React Query | 5.56.2 | [react-query.md](./react-query.md) | 2026-05-24 (stub) |
| Radix UI + shadcn/ui | (mixed) | [radix-shadcn.md](./radix-shadcn.md) | 2026-05-24 (stub) |
| Zod | 3.23.8 | [zod.md](./zod.md) | 2026-05-24 (stub) |
| React Hook Form | 7.53.0 | [react-hook-form.md](./react-hook-form.md) | 2026-05-24 (stub) |

## How to populate (post-bootstrap task)

For each stub:

1. Try fetching the library's llms.txt endpoint (e.g. `https://www.prisma.io/llms.txt`, `https://tanstack.com/query/latest/llms.txt`). Many libraries publish LLM-friendly summaries.
2. If unavailable, summarise from official docs into this file's template (Overview / Key APIs / Common patterns / Gotchas / Do not use).
3. Focus on:
   - The APIs **this project actually calls** (grep for the import in `backend/src/` or `frontend/src/`)
   - Common patterns used here
   - Gotchas — version-specific behaviour, things AI tends to get wrong
   - Deprecated APIs and patterns the team has rejected
4. Update "Last updated" in this index.

## When to update

- After a major version bump
- When a deprecation surprised someone
- When a new pattern becomes standard in the codebase
