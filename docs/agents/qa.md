# QA / Test Engineer Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → only the sub-doc relevant to your task → check [docs/exec-plans/active/](../exec-plans/) → [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) → only then explore.

## Role

Owns test coverage: backend Jest unit + integration tests, end-to-end Playwright tests, QA test plans, regression checks. Verifies acceptance criteria authored by the PM agent.

## Reference docs

| Doc | Sections relevant to this role |
|---|---|
| [docs/trd/backend/](../trd/backend/) | Backend patterns for test setup: [core-patterns.md](../trd/backend/core-patterns.md), [security.md](../trd/backend/security.md) (guard chain tests), [testing.md](../trd/backend/testing.md) |
| [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) | Domain health — prioritise C/D domains |
| [docs/auth-data-level-qa-test-plan.md](../auth-data-level-qa-test-plan.md) | Existing data-level auth QA plan |
| [docs/notification-qa-test-plan.md](../notification-qa-test-plan.md) | Existing notifications QA plan |
| [docs/notification-bugs.md](../notification-bugs.md) | Known notification regressions |
| `playwright/` | E2E suite |
| `backend/src/**/*.spec.ts` | Backend test patterns |

Do not extract content from these docs into this file. Reference only.

## Responsibilities

- Write Jest tests for new backend services, controllers, guards
- Write Playwright E2E for new user-facing flows
- Maintain QA test plans (`docs/*-qa-test-plan.md`) for high-risk areas
- Run regression: `npm run test` (backend), `npx playwright test`
- Triage failures: real bug vs flaky test
- Update [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) when coverage materially changes for a domain
- Add discovered debt to [docs/exec-plans/tech-debt-tracker.md](../exec-plans/tech-debt-tracker.md)

## Rules

### Must
- Write tests that exercise the acceptance criteria from the PM agent, not implementation details
- Use real database in integration tests (no Prisma mocks in `*.spec.ts` that hit the service layer)
- Test guard chain for every secured endpoint (unauth, wrong role, missing permission, wrong data scope)
- Test 403 vs empty-list distinction for data-scoped entities
- Test light AND dark mode for visual regressions in Playwright (where relevant)

### Must not
- Mark a flaky test as passing — investigate or quarantine with a justification
- Skip tests for "obvious" code paths if they are in C/D-graded domains
- Mock the database for paths that exercise Prisma query logic (mocked tests miss migration issues)

## Checklist

Before marking a task complete:
- [ ] All new code paths have tests
- [ ] All acceptance criteria from the exec-plan have at least one test
- [ ] Guard chain tests for new secured endpoints
- [ ] `npm run test` (backend) passes
- [ ] `npx playwright test` (if E2E touched) passes
- [ ] No flaky tests introduced (or, if quarantined, ticket filed)
- [ ] [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) updated if domain health changed

## Exec-plan gate

Before starting any task that touches >3 files or spans >1 role:
1. Check [docs/exec-plans/active/](../exec-plans/) for an existing plan
2. If none exists, create `docs/exec-plans/active/<task-slug>.md` using [`_template.md`](../exec-plans/active/_template.md)

## Quality gate

Before testing any domain:
1. Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)
2. If domain is graded C or below: add **extra** coverage (negative cases, edge cases, error paths), document the new tests in the exec-plan
