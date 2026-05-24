# Exec Plan: tidy-leftover-docs

> Status: [ ] Draft | [ ] In Progress | [ ] Blocked | [x] Complete
> Created: 2026-05-24
> Agent(s): Backend Developer, Frontend Developer (light); primarily a docs/repo-hygiene task
> Touches: `backend/{TRD.md,erd.md,erd-quick-reference.md,erd-pre.md,BRD-risk-assessment.md,jest-reminders.log}`, `frontend/{TRD.md,todo-refactor.md,prompt.md,DEPLOYMENT.md}`, `docs/trd/`, `docs/erd/`, `docs/design-system/`, `docs/prd-risk-management.md`, `.gitignore`

## Goal

Reorganise leftover docs in `backend/` and `frontend/` so AI agents (and humans) have one predictable location per concept. The biggest pain is the 70KB + 117KB monolithic TRDs — agents either load all 7000 lines or guess at section boundaries. Splitting them into ~300-line sub-files under `docs/trd/` (and `docs/design-system/` for the UI part) lets agents load only what they need.

## Scope

**In scope:**
- Split `backend/TRD.md` and `frontend/TRD.md` into sub-files under `docs/trd/backend/` and `docs/trd/frontend/`, plus migrate the design-system content into the existing `docs/design-system/*.md` files
- Replace the monoliths with one-line redirects pointing to their new index
- Move ERDs to `docs/erd/`, leave redirects at old paths, delete `erd-pre.md`
- Triage strays: delete logs, evaluate and move/delete TODO/prompt files, merge deployment notes
- Move `backend/BRD-risk-assessment.md` into the PRD layer
- Update every cross-reference in `docs/*`, `docs/agents/*`, `AGENTS.md`, `principles.md` to point at the new paths
- Update `.gitignore` to ignore future log artifacts

**Out of scope (explicit non-goals):**
- Rewriting TRD content. Pure mechanical split + re-link. If a section is wrong or stale, leave it (file a tech-debt row instead).
- Restructuring the 32 `docs/prd-*.md` files — they're already organised by domain
- Touching `backend/README.md` or `frontend/README.md` — those are human setup docs, different audience
- Touching `principles.md` — root-level is correct
- Touching `.specstory/` or `.cursor/plans/` — historical session logs, separate retention decision (see TD-005)

## Approach

**Principle 1 — Mechanical split, no rewrites.** Each top-level `## ` heading in the TRDs becomes one sub-file. Content copies verbatim. The only edit is fixing internal anchor links that now cross files.

**Principle 2 — Redirects, not deletes, for heavily-linked files.** `backend/TRD.md`, `frontend/TRD.md`, `backend/erd.md`, `backend/erd-quick-reference.md` are referenced from `.specstory`, old PRs, the existing CLAUDE memory, and our new agent files. Replacing them with one-line redirects preserves every external link while pointing readers to the new location.

**Principle 3 — Index page per new directory.** `docs/trd/backend/index.md` and `docs/trd/frontend/index.md` list the sub-files with one-line descriptions, mirroring the pattern in `docs/prd/index.md`. Existing `docs/trd/index.md` updates to point at these.

**Principle 4 — One commit per phase.** Each phase below is a self-contained commit so any revert is surgical.

## Steps

### Phase 0 — Pre-flight (read-only)

1. [ ] Spawn an Explore agent to confirm the section boundaries in both TRDs are clean `^## ` headings with no cross-section forward-references. Output: a list of `(heading, line range, proposed filename)` for each TRD.
2. [ ] Grep the entire repo for `backend/TRD.md`, `frontend/TRD.md`, `backend/erd.md`, `backend/erd-quick-reference.md`, `backend/erd-pre.md` references. Output: a mapping of every link that will need updating (incl. `.cursorrules` history, `.specstory`, agent files, `principles.md`, `docs/trd/index.md`).
3. [ ] Confirm `git status` is clean before starting.

### Phase 1 — Backend TRD split

1. [ ] Create `docs/trd/backend/` directory
2. [ ] Create `docs/trd/backend/index.md` (table of sub-files)
3. [ ] Create one sub-file per top-level section of `backend/TRD.md`:
   - `overview.md` (L1–41)
   - `architecture.md` (L42–145) — high-level + module architecture + folder structure
   - `module-pattern.md` (L146–202)
   - `dto-pattern.md` (L203–249)
   - `controller-pattern.md` (L250–313)
   - `api-design.md` (L314–400) — RESTful, pagination, query, response, options bypass
   - `security.md` (L401–504) — guards, decorators, layer, data-level access, approval-assignee exception
   - `error-handling.md` (L505–589)
   - `dto-mapping.md` (L590–646)
   - `database.md` (L647–end) — Prisma config, naming, service, migration/seeding
4. [ ] Fix any anchor links that now cross files (use relative `./other-file.md#anchor`)
5. [ ] Replace `backend/TRD.md` with a one-line redirect: `> See [docs/trd/backend/index.md](../docs/trd/backend/index.md) for the full backend technical reference.`
6. [ ] Update `docs/trd/index.md` to point at `docs/trd/backend/index.md` instead of the monolith
7. [ ] Update `docs/agents/developer-backend.md` Reference docs table — replace the `backend/TRD.md §X (L_)` row with specific sub-file links
8. [ ] Update `docs/trd/stack-architecture.md` "Read these sections" block to link to sub-files
9. [ ] Update `docs/trd/constraints-integrations.md` references
10. [ ] Update `AGENTS.md` if any direct references exist
11. [ ] Commit: `docs: split backend/TRD.md into docs/trd/backend/*`

### Phase 2 — Frontend TRD split (more complex because of UI/UX overlap)

1. [ ] Create `docs/trd/frontend/` directory
2. [ ] Create `docs/trd/frontend/index.md`
3. [ ] Split `frontend/TRD.md` into:
   - `overview.md` (L1–46) — exec summary, current state, target architecture
   - `folder-structure.md` (L73–125)
   - `module-template.md` (L126–155)
   - `implementation-guidelines.md` (L156–235) — imports, routes, communication, shared components
   - `layout-patterns.md` (L306–336) — master-detail, density, navigation, whitespace
   - `tables-filters-modals.md` (L337–385) — data tables, search/filter, modal vs page, breadcrumbs, status indicators
   - `workflow-status.md` (L386–685) — Document Workflow & Status Management (this is the biggest section, ~300 lines)
   - `empty-states.md` (L686–691)
   - `advanced-features.md` (L692–775) — multi-select, undo, audit, export, PDF, comparison, favorites
   - `form-guidelines.md` (L776–end)
4. [ ] Move `frontend/TRD.md` §UI/UX Principles (L236–305) content into the existing `docs/design-system/*.md` files where it fits (tokens / components / motion / accessibility / icons). Where content is genuinely new (e.g. specific design principles), add a new file `docs/design-system/principles.md`. Cross-reference from the split frontend TRD sub-files.
5. [ ] Fix cross-file anchor links
6. [ ] Replace `frontend/TRD.md` with one-line redirect
7. [ ] Update `docs/trd/index.md`
8. [ ] Update `docs/agents/developer-frontend.md` Reference docs table with specific sub-file links
9. [ ] Update `docs/agents/designer.md` Reference docs table
10. [ ] Update `docs/design-system/index.md` to reflect the new content sources
11. [ ] Commit: `docs: split frontend/TRD.md into docs/trd/frontend/* and absorb UI sections into docs/design-system/`

### Phase 3 — ERD move

1. [ ] `git mv backend/erd.md docs/erd/full.md`
2. [ ] `git mv backend/erd-quick-reference.md docs/erd/quick-reference.md`
3. [ ] `git rm backend/erd-pre.md` (resolves [tech-debt-tracker.md TD-001](../tech-debt-tracker.md))
4. [ ] Create one-line redirects at old paths:
   - `backend/erd.md` → `> See [docs/erd/full.md](../docs/erd/full.md)`
   - `backend/erd-quick-reference.md` → `> See [docs/erd/quick-reference.md](../docs/erd/quick-reference.md)`
5. [ ] Update `docs/erd/index.md` to point at the new local paths (drop `../../backend/...` prefixes)
6. [ ] Update `docs/erd/entities.md`, `docs/erd/relationships.md`, `docs/erd/notes.md` references
7. [ ] Update `docs/agents/developer-backend.md` Reference docs table
8. [ ] Update `AGENTS.md` "Critical rules" reference list
9. [ ] Update CLAUDE memory file note (informational — references will still resolve)
10. [ ] Commit: `docs: relocate backend/erd*.md under docs/erd/, retire erd-pre.md (TD-001)`

### Phase 4 — Stray triage

1. [ ] `git rm backend/jest-reminders.log` and add `*.log` to `backend/.gitignore` if not already covered
2. [ ] Read `frontend/todo-refactor.md` and `frontend/prompt.md`:
   - If still active work → `git mv` into `docs/exec-plans/active/<slug>.md` (rename for clarity) and convert to the exec-plan template structure
   - If dead → `git rm`
3. [ ] Read `backend/BRD-risk-assessment.md`:
   - If content is product-focused → merge into `docs/prd-risk-management.md` (append a "Business Requirements" section) and `git rm` the original
   - If clearly architectural → move to `docs/trd/backend/risk-assessment-design.md`
4. [ ] Merge `frontend/DEPLOYMENT.md` into `docs/trd/deployment.md` (deployment specifics for the frontend become a sub-section); leave a one-line redirect at `frontend/DEPLOYMENT.md`
5. [ ] Commit: `docs: triage stray backend/ and frontend/ docs`

### Phase 5 — Reconcile indexes and re-verify

1. [ ] Re-run the bootstrap verification suite (file presence, link integrity, agent header check)
2. [ ] Grep for any remaining `backend/TRD.md`, `frontend/TRD.md`, `backend/erd.md`, `backend/erd-quick-reference.md`, `backend/erd-pre.md` references that should have been updated; spot-check `.specstory/` (intentionally untouched but should still resolve through redirects)
3. [ ] Update `docs/QUALITY_SCORE.md` "Score history" with a note that doc structure changed
4. [ ] Update `docs/exec-plans/tech-debt-tracker.md`: mark TD-001 resolved, mark TD-004 resolved if both monoliths were fully split, update TD-002 if `trd-inspection-approval-legacy.md` was touched
5. [ ] Move this exec-plan to `docs/exec-plans/completed/2026-05-24-tidy-leftover-docs.md`
6. [ ] Commit: `docs: close tidy-leftover-docs exec-plan, resolve TD-001/TD-004`

## Success criteria

- [ ] `wc -l backend/TRD.md frontend/TRD.md backend/erd*.md` all return small numbers (≤2 lines — redirects only)
- [ ] No `docs/trd/backend/*.md` file exceeds ~500 lines
- [ ] Every link in `AGENTS.md`, `docs/agents/*.md`, `docs/index.md`, `docs/trd/index.md`, `docs/erd/index.md`, `docs/design-system/index.md` resolves (use `test -f` per link)
- [ ] `git grep -l "backend/TRD.md\|frontend/TRD.md"` returns only the redirect files themselves and historical `.specstory/` entries
- [ ] An AI agent answering "show me the controller pattern" loads `docs/trd/backend/controller-pattern.md` (~50 lines) instead of `backend/TRD.md` (7000 lines)
- [ ] `npm run lint` clean on both halves (split shouldn't affect code, but verify)
- [ ] No regressions: `npm run test` (backend) passes
- [ ] CLAUDE memory file in `~/.claude/projects/...` still works (links there resolve through redirects)

## Reference docs

- [docs/playbooks/refactor-flow.md](../../playbooks/refactor-flow.md) — this is a refactor, follow that playbook for incrementing/committing
- [docs/trd/index.md](../../trd/index.md) — current TRD navigation layer (will be heavily updated)
- [docs/agents/developer-backend.md](../../agents/developer-backend.md), [developer-frontend.md](../../agents/developer-frontend.md), [designer.md](../../agents/designer.md) — agent Reference doc tables need updating
- `backend/TRD.md` §TOC (L3) — authoritative section list for the split
- `frontend/TRD.md` §TOC — likewise

## Open questions

| Question | Owner | Deadline | Resolution |
|---|---|---|---|
| Is `backend/BRD-risk-assessment.md` product-focused (→ `docs/prd-risk-management.md`) or architectural (→ `docs/trd/backend/`)? Decide by reading the file in Phase 4. | executing agent | Phase 4 start | — |
| Are `frontend/todo-refactor.md` and `frontend/prompt.md` still relevant? Decide by reading + asking user. | executing agent | Phase 4 start | — |
| Should `principles.md` move into `docs/`? **Default no** — root-level is the established convention and it's heavily linked. Revisit only if it becomes a navigation problem. | — | — | No (default) |
| Do we need a `docs/brd/` directory for Business Requirements Docs, or merge BRDs into the existing PRD layer? Default to merge unless multiple BRDs exist. | executing agent | Phase 4 start | — |

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-24 | Use redirects (not deletes) for `backend/TRD.md`, `frontend/TRD.md`, `backend/erd.md`, `backend/erd-quick-reference.md`, `frontend/DEPLOYMENT.md` | Heavily linked externally (`.specstory`, CLAUDE memory, old PRs); preserves every external link while pointing at new location |
| 2026-05-24 | Delete `backend/erd-pre.md` outright (no redirect) | Legacy snapshot superseded by `erd.md`; no live external references expected; tracked as TD-001 |
| 2026-05-24 | Split TRDs by `^## ` boundary, no content rewrites | Mechanical changes are reviewable and revertable; content-quality improvements are separate work and would inflate the diff |
| 2026-05-24 | UI/UX section of `frontend/TRD.md` (L236–305) merges into existing `docs/design-system/*.md` rather than a new sub-file | Avoids duplication; design-system structure is already in place |
| 2026-05-24 | One commit per phase | Surgical revert if any phase regresses; clean history for the change |
| 2026-05-24 | Do **not** restructure the 32 `docs/prd-*.md` files | They are already organised by domain — reorganising is churn for no benefit |
| 2026-05-24 | **Phase 0 adjustment:** backend/TRD.md is 1955 lines (19 ## sections, not 10) and frontend/TRD.md is 2881 lines (22 ## sections). Adapted file structure below. | Actual sections discovered during Phase 0 Explore agent. Original plan's line ranges were approximations. |
| 2026-05-24 | Backend modules go to `docs/trd/backend/modules/{upload,reminder,approval,mail}.md` | User choice — clean separation from cross-cutting patterns |
| 2026-05-24 | Both UI/UX Principles (L236–914) AND Design System (L915–1443) from frontend/TRD.md absorb into `docs/design-system/` | User choice — avoids two sources of truth |
| 2026-05-24 | Frontend meta sections bundle into `guidance.md` + `reference.md` + `meta.md` instead of 13 tiny files | User choice — agent discoverability without clutter |

## Adapted file structure (post-Phase-0)

### `docs/trd/backend/` (15 files at top level + 5 in modules/)
- `index.md`
- `overview.md` (L1–41)
- `architecture.md` (L42–72)
- `folder-structure.md` (L73–145)
- `core-patterns.md` (L146–313) — module + DTO + controller patterns
- `api-design.md` (L314–400)
- `security.md` (L401–504)
- `error-handling.md` (L505–589)
- `dto-mapping.md` (L590–646)
- `database.md` (L647–749)
- `testing.md` (L750–834)
- `deployment.md` (L835–962)
- `checklist.md` (L963–991)
- `quality-guidelines.md` (L992–1145) — bundles Code Pattern Audit + Best Practices Summary + Module Compliance Scoring
- `modules/index.md`
- `modules/upload.md` (L1146–1322)
- `modules/reminder.md` (L1323–1529)
- `modules/approval.md` (L1530–1856)
- `modules/mail.md` (L1857–1955)

### `docs/trd/frontend/` (9 files)
- `index.md`
- `overview.md` (L1–72) — header + Architecture + Executive Summary + Current State + Target Architecture
- `folder-structure.md` (L73–125)
- `module-template.md` (L126–155)
- `implementation-guidelines.md` (L156–235)
- `module-interaction.md` (L1444–2314) — large but cohesive
- `guidance.md` — bundles anti-patterns (L2315–2361) + checklist (L2362–2417) + workflow (L2535–2565) + migration (L2619–2643)
- `reference.md` — bundles code-examples (L2418–2534) + appendix (L2690–2881)
- `meta.md` — bundles metrics (L2566–2586) + next-steps (L2587–2597) + success-metrics (L2598–2618) + benefits (L2644–2660) + references (L2661–2670) + history (L2671–2689)

### `docs/design-system/` absorbs frontend/TRD.md L236–1443
Both `## UI/UX Principles` (L236–914) and `## Design System` (L915–1443) content distributes across existing `tokens.md`, `components.md`, `motion.md`, `accessibility.md`, `icons.md` and new `principles.md` (broad UX principles), plus any new sub-files as content dictates (likely `forms.md`, `patterns.md`). Distribution decided per-subsection during Phase 2.

### Anchor-link fix
Backend TRD's TOC (L4–14) links to 11 sections via `(#anchor)` style. The new `docs/trd/backend/index.md` replaces the TOC with cross-file links; the redirect at the old path keeps external TOC references valid by pointing at the new index.

## Quality / tech-debt notes

- Resolves **TD-001** (`erd-pre.md` archival) and **TD-004** (monolithic TRDs) on completion. Update `tech-debt-tracker.md` in Phase 5.
- Surfaces a possible **TD-006** if `frontend/todo-refactor.md` or `frontend/prompt.md` contain real outstanding work that should be tracked — add a row in Phase 4 if so.
- No domains in `docs/QUALITY_SCORE.md` change health as a result of this work — code is unchanged. Note in "Score history" that doc structure changed on 2026-05-24.

## Estimated effort

- Phase 0: 30 min (exploration)
- Phase 1: 2–3 hours (backend TRD split + relink)
- Phase 2: 3–4 hours (frontend TRD split is bigger; workflow-status section is dense)
- Phase 3: 30 min (ERD move + redirects)
- Phase 4: 1 hour (depends on what the stray files contain)
- Phase 5: 30 min (verification + close-out)
- **Total: ~half a day to one full day**

## Rollback plan

Each phase is a single commit. If any phase causes problems:
1. `git revert <phase-commit>` for the offending phase only
2. Update this exec-plan's Status to "Blocked" with a note
3. The redirect-vs-delete strategy ensures no external link breaks — worst case the redirect file is missing and `backend/TRD.md` returns to its current monolithic form
