# Playbook — Bug Fix Flow

For correcting unexpected behaviour.

## 0. Exec-plan gate

If the fix touches >3 files or >1 role: create an exec-plan in [docs/exec-plans/active/](../exec-plans/) first. Small single-file fixes do not need a plan file.

## 1. Reproduce

- Steps to confirm the bug is real and repeatable
- Capture: input, expected behaviour, actual behaviour
- Note: which user role / data scope / browser / env

## 2. Understand expected behaviour

- Backend: read the relevant sub-file in [docs/trd/backend/](../trd/backend/) and the per-domain PRD in `docs/prd-<domain>.md`
- Frontend: read the relevant section of [`frontend/TRD.md`](../../frontend/TRD.md) and the per-domain PRD
- Data: read [docs/erd/index.md](../erd/index.md) → `backend/erd.md` for the affected entity

## 3. Quality gate

Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) for the affected domain. If C or below: add a test for the affected path even if not strictly required.

## 4. Isolate

- Find the smallest change that reproduces the bug
- Confirm via debugger, logs, or a failing test before changing code

## 5. Fix

- Make the **minimal** change that resolves the bug
- Do not refactor adjacent code — that belongs in a separate task
- Do not add error handling for cases that cannot happen — trust internal callers ([principles §5](../../principles.md), §0 YAGNI)

## 6. Verify

- Run the test that exposed the bug — it must now pass
- Run the full module's tests: `npm run test -- <module>`
- Run E2E if user-facing: `npx playwright test <relevant-spec>`

## 7. Regression check

- `npm run test` (backend full)
- `npm run lint` (both halves)
- `npx playwright test` (if user-facing)
- Manually verify in browser if the bug was visual or interaction-related

## 8. Document if needed

- If the bug revealed a gap in [docs/trd/backend/](../trd/backend/), [docs/trd/frontend/](../trd/frontend/), or [docs/erd/notes.md](../erd/notes.md), update the relevant doc
- If the bug revealed a pattern others might hit, add a row to [docs/exec-plans/tech-debt-tracker.md](../exec-plans/tech-debt-tracker.md) for the broader fix

## 9. Definition of done

- [ ] Repro test exists and passes
- [ ] No regressions in the module's other tests
- [ ] Lint passes
- [ ] If user-facing: verified manually in browser
- [ ] PR opened with a clear root-cause explanation (in the description, not in code comments)
