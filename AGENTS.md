# AGENTS.md — HSE Dashboard AI Orchestration

> **Read this file first.** Every AI agent (Claude, Cursor, Codex, sub-agents) must complete the read order below before touching any code.

## How to operate

1. Read this file completely before taking any action.
2. Identify your task type using the **Task Classification** table below.
3. Select your role using the **Agent table** below.
4. Read the referenced `docs/` files listed in your agent file. Do not skip this step.
5. Check `docs/exec-plans/active/` for an existing plan for this work. Create one (`docs/exec-plans/active/_template.md`) if the task touches >3 files or >1 role.
6. Read `docs/QUALITY_SCORE.md` before touching any domain. Domains graded C or below require extra caution.
7. Execute. Explore project files only for things not covered by the instruction system.
8. Follow the relevant playbook from `docs/playbooks/`.

## Agent table

| Agent file | Role | When to use |
|---|---|---|
| [docs/agents/developer-backend.md](./docs/agents/developer-backend.md) | Backend Developer | NestJS, Prisma, API, auth, guards, DTOs, modules under `backend/src/` |
| [docs/agents/developer-frontend.md](./docs/agents/developer-frontend.md) | Frontend Developer | React, services, hooks, routes, forms under `frontend/src/` |
| [docs/agents/designer.md](./docs/agents/designer.md) | Designer / UI-UX | Visual design, design system, component spec, styling, layout |
| [docs/agents/pm.md](./docs/agents/pm.md) | Product Manager | Scoping, acceptance criteria, prioritisation, PRD updates |
| [docs/agents/qa.md](./docs/agents/qa.md) | Test Engineer | Jest unit/integration, Playwright E2E, test plan reviews |

## Task Classification

| Task type | Signals | Primary agent | Supporting agents |
|---|---|---|---|
| New feature | "add", "build", "implement" | Backend or Frontend Developer | PM (scope), Designer (UI), QA (tests) |
| Bug fix | "broken", "error", "wrong", "not working", "403", "500" | Developer (matching layer) | QA |
| UI / design change | "style", "layout", "component", "design", "dark mode" | Designer | Frontend Developer |
| Refactor | "clean up", "restructure", "extract", "rename module" | Developer (matching layer) | QA |
| Data model change | "schema", "migration", "new field", "rename column" | Backend Developer | — |
| Workflow / approval | "approval line", "status", "WAITING_APPROVAL" | Backend Developer | Frontend Developer |
| Requirements / scope | "what should", "scope", "prioritise", "acceptance criteria" | PM | — |
| Testing | "test", "coverage", "regression", "QA plan" | QA | Developer |

## Sub-agent orchestration

Use sub-agents when a task has independent parallel concerns or requires sequential handoffs across roles.

**Use a single agent when:** the task is unambiguous, maps to one role, scope is small (< 3 files), and there are no cross-role dependencies.

**Use multiple agents when:** the task spans multiple roles, parallel subtasks exist without dependencies, or strict handoff order is required.

### Parallel execution

Run agents at the same time when their outputs do not depend on each other. Example for a new "Add custom field to Incident form" task:
- Agent A (PM): confirm field is in [docs/prd/incidents.md](./docs/prd/incidents.md) scope, write acceptance criteria
- Agent B (Backend): check [docs/erd/index.md](./docs/erd/index.md) for incidents schema, identify migration needed
- Agent C (Designer): check [docs/design-system/components.md](./docs/design-system/components.md) for the right form input

Start all three simultaneously. Merge outputs before implementation begins.

### Sequential execution

Run agents in order when later steps depend on earlier outputs. Standard feature order:
1. **PM agent** — confirms scope against `docs/prd/index.md`; outputs acceptance criteria
2. **Designer agent** — produces component spec from `docs/design-system/components.md` (if UI is involved)
3. **Backend Developer** — implements API, migration, guards from [docs/trd/backend/](./docs/trd/backend/) patterns
4. **Frontend Developer** — implements UI module mirror using `frontend/TRD.md` patterns
5. **QA agent** — writes Jest + Playwright tests covering acceptance criteria
6. (Deploy is automated via `.github/workflows/`; no DevOps agent today.)

### Handoff protocol

Each agent, when finished, must output:
- What was done (summary)
- What the next agent needs to know (inputs for the next step)
- Any open questions or blockers

### Conflict resolution

| Dimension | Owner | Overrides |
|---|---|---|
| Product scope | PM | All others |
| Visual design | Designer | Developer |
| Technical feasibility | Developer (matching layer) | PM, Designer |
| Test coverage | QA | Developer |
| Schema / migration | Backend Developer | All others (migrations are gated; never run without explicit user approval) |

## Reference doc routing

| Task type | Read first |
|---|---|
| Feature / bug (backend) | [docs/index.md](./docs/index.md) → [docs/trd/backend/index.md](./docs/trd/backend/index.md) → specific sub-file |
| Feature / bug (frontend) | [docs/index.md](./docs/index.md) → [docs/trd/index.md](./docs/trd/index.md) → `frontend/TRD.md` (specific section) |
| Data / schema | [docs/erd/index.md](./docs/erd/index.md) → [docs/erd/full.md](./docs/erd/full.md) / `backend/prisma/schema.prisma` |
| UI / styling | [docs/design-system/index.md](./docs/design-system/index.md) |
| Per-domain product context | [docs/prd/index.md](./docs/prd/index.md) → relevant `docs/prd/<domain>.md` |
| Cross-cutting TRDs (auth, soft-delete, etc.) | [docs/trd/index.md](./docs/trd/index.md) → relevant `docs/trd-<topic>.md` |
| Complex task (>3 files or >1 role) | [docs/exec-plans/active/_template.md](./docs/exec-plans/active/_template.md) — create plan first |
| Any domain graded C or below | [docs/QUALITY_SCORE.md](./docs/QUALITY_SCORE.md) — read before touching |
| External library call (Prisma, NestJS, etc.) | [docs/references/index.md](./docs/references/index.md) |

**Rule:** navigate via [docs/index.md](./docs/index.md). Do not read docs unrelated to your task. Open only the specific sub-file under [docs/trd/backend/](./docs/trd/backend/) or [docs/trd/frontend/](./docs/trd/frontend/) that covers your topic.

## Playbooks

| Task | Playbook |
|---|---|
| New feature | [docs/playbooks/feature-flow.md](./docs/playbooks/feature-flow.md) |
| Bug fix | [docs/playbooks/bugfix-flow.md](./docs/playbooks/bugfix-flow.md) |
| Refactor | [docs/playbooks/refactor-flow.md](./docs/playbooks/refactor-flow.md) |

## Core principle

Read the instruction system first. Explore the project second. Generate code last. Every decision must trace to a sub-file under `docs/prd/`, `docs/trd/`, `docs/erd/`, or `docs/design-system/`. For complex tasks, trace decisions to an exec-plan in `docs/exec-plans/active/`.

The "why" behind every pattern lives in [principles.md](./principles.md) — read it once; do not re-read per task.

## Critical rules (apply always)

- Never run database migrations or seed scripts without explicit user approval.
- Never hardcode secrets — use env vars (see `backend/.env.example`, `frontend/.env.example`).
- Never bypass the guard chain: `JwtAuthGuard → RolesGuard → PermissionsGuard → [DataScopeGuard]`.
- Never edit files under [docs/trd/](./docs/trd/), [docs/erd/](./docs/erd/), [docs/prd/](./docs/prd/), or `docs/trd-*.md` without flagging it in your exec-plan — these are authoritative and rarely change.
- Never use `bg-blue-500` or hex colors — only semantic tokens (see [docs/design-system/tokens.md](./docs/design-system/tokens.md)).
