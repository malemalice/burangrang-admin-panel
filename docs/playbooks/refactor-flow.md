# Playbook — Refactor Flow

For restructuring code without changing behaviour. Refactors are higher-risk than features — pattern changes propagate.

## 0. Exec-plan gate

**Always** create an exec-plan in [docs/exec-plans/active/](../exec-plans/) — refactors touch >3 files by definition.

The plan must include:
- What changes (the new shape)
- What must NOT change (public interfaces, API contracts, route URLs, DTO shapes, DB schema)
- Why the refactor is worth it now (versus deferring)

## 1. Scope check

- Read [docs/trd/stack-architecture.md](../trd/stack-architecture.md) and [docs/trd/decisions.md](../trd/decisions.md) — confirm the refactor aligns with current architectural direction
- If the refactor changes architecture, the decisions doc must be updated as part of this work

## 2. Quality gate

Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md). Refactoring a C/D-graded domain without first **adding** tests for the existing behaviour is risky — add a safety net before changing code.

## 3. Read before writing

- Read every file that will change, end-to-end
- Read every caller of every changed function/type
- Read the relevant sub-file in [docs/trd/backend/](../trd/backend/) or [docs/trd/frontend/](../trd/frontend/)

## 4. Increment small

- Make changes in the smallest meaningful increments — one type, one file, one consumer at a time
- Commit (or stage) after each green increment
- Never combine unrelated refactors in one pass

## 5. Run tests after each increment

- `npm run test` (backend) and `npm run lint` after each increment
- If types changed: `tsc --noEmit` clean
- If exports/imports moved: every consumer compiles

## 6. Update docs

- If module structure changed: update [docs/trd/backend/folder-structure.md](../trd/backend/folder-structure.md) or the equivalent in [docs/trd/frontend/](../trd/frontend/)
- If decision changed: add a row to [docs/trd/decisions.md](../trd/decisions.md) (and mark the old decision superseded)
- If the refactor changes coverage or health: update [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)

## 7. Verify no regressions

- Full `npm run test` (backend)
- Full `npx playwright test` if user-facing surface area changed
- Lint clean
- TypeScript clean
- Manually exercise the affected flows in browser

## 8. Definition of done

- [ ] Public interfaces unchanged (or change documented + consumers migrated)
- [ ] Every test that passed before still passes
- [ ] No new lint or type errors
- [ ] Architecture docs updated if patterns changed
- [ ] Decisions log updated if a decision changed
- [ ] Quality score updated for affected domains
- [ ] Exec-plan moved to `docs/exec-plans/completed/`
