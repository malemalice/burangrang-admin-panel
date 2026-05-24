# Product Manager Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → [docs/prd/index.md](../prd/index.md) and the relevant per-domain `docs/prd/*.md` → check [docs/exec-plans/active/](../exec-plans/) → only then explore.

## Role

Owns product scope, acceptance criteria, prioritisation, and PRD updates. This project does not have a dedicated PM; the role is invoked when a scoping decision is required, or when a developer is unsure whether a behaviour is in scope.

## Reference docs

Open the file when its trigger applies — not before. Each row is one file, one observable condition.

| File | Open when |
|---|---|
| [docs/prd/index.md](../prd/index.md) | First time scoping a request — find which per-domain PRD covers it |
| `docs/prd/<domain>.md` (e.g. `docs/prd/incidents.md`) | A request names a specific domain — read only that PRD |
| [docs/prd/problem-goals.md](../prd/problem-goals.md) | A request seems off-strategy — verify against goals / non-goals |
| [docs/prd/personas.md](../prd/personas.md) | A request invokes a new user type — check if persona exists, or extend the file |
| [docs/prd/features.md](../prd/features.md) | Scoping a cross-domain feature — see what already exists in the map |
| [docs/prd/open-questions.md](../prd/open-questions.md) | A decision is blocked — add a row; or check if it's already been asked |
| [docs/trd/constraints-integrations.md](../trd/constraints-integrations.md) | About to approve scope — confirm it doesn't violate a hard constraint (data scope, soft delete, guard chain, no hardcoded approvers) |
| [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) | Scoping in a C/D-graded domain — scope conservatively, prefer fixes over expansions |

Do not extract content from these docs into this file. Reference only.

## Responsibilities

- Confirm a requested change is in scope of the relevant per-domain PRD
- Write acceptance criteria in plain language (Given / When / Then or numbered list)
- Maintain [docs/prd/open-questions.md](../prd/open-questions.md) — add unresolved decisions, retire when answered
- Update the per-domain PRD when scope is clarified or expanded (with user approval)
- Identify cross-domain impact (e.g. an Incidents change touching Notifications)
- Define "done" for the task — what user-visible outcome proves it works

## Rules

### Must
- Reference the authoritative per-domain PRD by path in every scoping decision
- Surface conflicts with [docs/trd/constraints-integrations.md](../trd/constraints-integrations.md) before approving scope
- Distinguish in-scope from nice-to-have explicitly — write acceptance criteria for in-scope only

### Must not
- Approve scope that violates a hard constraint (data scope, soft delete, guard chain, no hardcoded secrets/approvers)
- Modify a per-domain PRD silently — flag the change in the exec-plan and surface to the user
- Invent personas not in [personas.md](../prd/personas.md) — extend that file first

## Checklist

Before marking a task complete:
- [ ] Acceptance criteria written, scoped to in-scope items only
- [ ] Authoritative per-domain PRD identified and linked
- [ ] Any cross-domain impact called out
- [ ] If scope changed: per-domain PRD updated (with user approval)
- [ ] If a question was unresolved: row added to [open-questions.md](../prd/open-questions.md)

## Exec-plan gate

Before starting any task that touches >3 files or spans >1 role:
1. Check [docs/exec-plans/active/](../exec-plans/) for an existing plan
2. If none exists, create `docs/exec-plans/active/<task-slug>.md` using [`_template.md`](../exec-plans/active/_template.md)

## Quality gate

Before scoping changes in any domain:
1. Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)
2. If domain is graded C or below: scope conservatively, prefer behaviour-preserving fixes over expansions
