# Playbook — Feature Flow

For new features end-to-end. Adapt for the NestJS + React monorepo.

## 0. Exec-plan gate

If the feature touches >3 files or >1 role: create `docs/exec-plans/active/<feature-slug>.md` from [`_template.md`](../exec-plans/active/_template.md) **before** writing code.

## 1. Scope (PM)

- Identify the relevant per-domain PRD in [docs/prd/index.md](../prd/index.md)
- Confirm the feature is in scope; if unclear, add to [docs/prd/open-questions.md](../prd/open-questions.md)
- Write acceptance criteria (Given/When/Then or numbered)

## 2. Schema impact (Backend)

- Read [docs/erd/index.md](../erd/index.md) → search [`backend/erd.md`](../../backend/erd.md) for the affected entity
- If a schema change is needed:
  - Edit `backend/prisma/schema.prisma`
  - Generate migration (`npx prisma migrate dev --create-only`)
  - **Do not apply** — flag for user approval
  - Update `backend/erd.md`

## 3. Component reuse (Designer / Frontend)

- Check [docs/design-system/components.md](../design-system/components.md) for existing components
- Check `frontend/src/core/components/ui/` for shadcn primitives
- Check the mirror frontend module for existing pages/services

## 4. Backend implementation (Backend Developer)

- Read [docs/agents/developer-backend.md](../agents/developer-backend.md) reference docs
- Implement module: `backend/src/modules/<domain>/`
  - `<domain>.module.ts` (import `SharedModule`)
  - `<domain>.controller.ts` (guards in order, `@ApiTags`, `@ApiBearerAuth`)
  - `<domain>.service.ts` (inject `PrismaService`, `ErrorHandlingService`, `DtoMapperService`)
  - `dto/<entity>.{create,update,response}.ts`
- If data-scoped: `@DataScoped()` + `DataScopeGuard`
- If list serves dropdowns: `@AllowOptionsBypass()`
- Swagger docs render at `/api`

## 5. Frontend implementation (Frontend Developer)

- Read [docs/agents/developer-frontend.md](../agents/developer-frontend.md) reference docs
- Mirror the backend module under `frontend/src/modules/<domain>/`
  - `routes/` (lazy-loaded), `pages/`, `components/`, `services/`, `hooks/`, `types/`
- Service layer transforms DTOs
- Custom hooks (`useEntity()`, `useEntities()`) — components never call services directly
- Page uses `PageHeader` + `max-w-4xl mx-auto` form wrapper
- Tables use `DataTable`
- Forms use React Hook Form + Zod
- List state persisted in URL via `useSearchParams`
- For dropdowns: `options: true` to bypass permission check
- 403 on data-scoped row: explicit message; empty list is not an error

## 6. Tests (QA)

- Backend: Jest for service + controller + guards (`*.spec.ts`)
- E2E: Playwright covering the acceptance criteria
- Cover guard chain: unauth, wrong role, missing permission, wrong data scope
- Run: `npm run test` (backend), `npx playwright test`

## 7. Definition of done

- [ ] Acceptance criteria all verified by tests
- [ ] `npm run lint` passes (backend + frontend)
- [ ] `npm run test` passes (backend)
- [ ] `npx playwright test` passes (if E2E touched)
- [ ] TypeScript compiles with no errors
- [ ] If schema changed: migration generated; `backend/erd.md` updated
- [ ] Verified manually in browser at `http://localhost:5173` — golden path + at least one edge case
- [ ] Light AND dark mode both look correct
- [ ] Keyboard navigation works
- [ ] PR opened against `main` with reference to the exec-plan

## 8. Quality score update

If the feature changes coverage or health of any domain, update [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) (add a row to "Score history").

## 9. Close exec-plan

Move `docs/exec-plans/active/<feature-slug>.md` to `docs/exec-plans/completed/` once the PR is merged.
