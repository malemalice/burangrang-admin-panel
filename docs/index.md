# HSE Dashboard — Documentation Index

> Read this file to navigate the project's canonical knowledge base.
> Open only the sub-doc relevant to your current task. Do not read entire directories.

## Entry points

- [AGENTS.md](../AGENTS.md) — master orchestration (read first)
- [CLAUDE.md](../CLAUDE.md) — Claude Code redirect to AGENTS.md
- [principles.md](../principles.md) — stack-agnostic engineering principles (the *why* behind patterns)
- [README.md](../README.md) — setup, environment, local dev

## Canonical docs

| Type | Index | Purpose |
|---|---|---|
| Product Requirements | [prd/index.md](./prd/index.md) | Per-domain PRDs (32 files) + cross-cutting product context |
| Technical Requirements | [trd/index.md](./trd/index.md) | Stack, deployment, decisions, plus structured [trd/backend/](./trd/backend/) and [trd/frontend/](./trd/frontend/) |
| Entity Relationship | [erd/index.md](./erd/index.md) | Data models, relationships, naming. Anchors into `backend/erd.md` |
| Design System | [design-system/index.md](./design-system/index.md) | Tokens, components, motion, accessibility, icons |

## Agent roles & playbooks

| Type | Index | Purpose |
|---|---|---|
| Agent roles | [agents/](./agents/) | Role definitions (developer-backend, developer-frontend, designer, pm, qa) |
| Playbooks | [playbooks/](./playbooks/) | Step-by-step task execution (feature, bugfix, refactor) |

## Operations

| Type | Location | Purpose |
|---|---|---|
| Execution Plans | [exec-plans/](./exec-plans/) | Active and completed task plans (template in `active/_template.md`) |
| Tech Debt | [exec-plans/tech-debt-tracker.md](./exec-plans/tech-debt-tracker.md) | Running debt list |
| Quality Score | [QUALITY_SCORE.md](./QUALITY_SCORE.md) | Domain health and test coverage |

## External references

| Type | Index | Purpose |
|---|---|---|
| Library docs | [references/index.md](./references/index.md) | LLM-friendly summaries of Prisma, NestJS, React Query, Radix/shadcn, Zod, react-hook-form |

## Existing cross-cutting docs (referenced from indexes above)

These files are already authoritative — do not move or rename:

- `backend/TRD.md`, `frontend/TRD.md` — now redirects; structured content lives in [docs/trd/backend/](./trd/backend/) and [docs/trd/frontend/](./trd/frontend/)
- `backend/erd.md`, `backend/erd-quick-reference.md` — ERD
- `docs/trd-auth.md`, `docs/trd-authorization.md`, `docs/trd-authorization-data-scope-validation.md`, `docs/trd-sidebar-permission-lookup.md`, `docs/trd-soft-delete-inventory.md`, `docs/trd-soft-delete-rollout.md`, `docs/trd-inspection-approval.md`, `docs/trd-inspection-approval-legacy.md`, `docs/trd-investigation-report-schema.md`, `docs/trd-reminders-calendar.md`
- `docs/prd-*.md` (32 per-domain PRDs)
- `docs/CONTRIBUTING.md`, `docs/auth-data-level-qa-test-plan.md`, `docs/notification-qa-test-plan.md`, `docs/docs-compliance-gap-audit.md`, `docs/work-permit-gap-audit.md`, `docs/options-query-parameter-gap-audit.md`, `docs/notification-bugs.md`, `docs/investigation-report-accident.md`

## Navigation rules

1. Identify your task type (feature / bug / design / data / infra / scoping)
2. Open the relevant index above
3. From that index, open only the sub-file that covers your task
4. Open only the specific sub-file under [docs/trd/backend/](./trd/backend/) or [docs/trd/frontend/](./trd/frontend/) that covers your topic
