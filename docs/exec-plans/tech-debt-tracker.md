# Technical Debt Tracker

> Updated by any agent that discovers debt during a task. New items get an ID and a discovery date. Move resolved items to "Resolved" with the resolution.

## Open items

| ID | Area | Description | Severity (H/M/L) | Discovered | Owner |
|---|---|---|---|---|---|
| TD-002 | Docs | `docs/trd-inspection-approval-legacy.md` should be merged or removed after legacy path is fully retired | L | 2026-05-24 | — |
| TD-003 | Frontend | No unit-test infrastructure in `frontend/` (no Jest/Vitest setup). Coverage is E2E-only via Playwright. *Update 2026-05-24: `frontend/vitest.config.ts` exists — investigate state.* | M | 2026-05-24 | — |
| TD-005 | Docs | `.specstory/` and `.cursor/plans/` contain historical session logs — confirm retention policy or archive | L | 2026-05-24 | — |
| TD-006 | Docs | 32 `docs/prd-*.md` files and 11 `docs/trd-*.md` cross-cutting files still reference old `backend/TRD.md` / `frontend/TRD.md` section names. Redirects resolve, but readers land at the new index rather than the specific section. Sweep and update on next docs maintenance pass. | L | 2026-05-24 | — |

## Resolved items

| ID | Area | Resolution | Resolved |
|---|---|---|---|
| TD-001 | Docs | `git rm backend/erd-pre.md` — legacy ERD snapshot removed; `backend/erd.md` (now `docs/erd/full.md`) is the single source | 2026-05-24 |
| TD-004 | Docs | Split `backend/TRD.md` (1955 lines) into `docs/trd/backend/*` (19 sub-files) and `frontend/TRD.md` (2881 lines) into `docs/trd/frontend/*` (9 sub-files) + `docs/design-system/{principles,patterns}.md`. Monoliths replaced with redirects. | 2026-05-24 |

## How to add an item

1. Pick the next `TD-NNN` ID (zero-padded if you prefer).
2. Pick a severity:
   - **H** — actively causes bugs, security risk, or blocks work
   - **M** — meaningful drag on development; should be scheduled
   - **L** — cleanup; do when convenient
3. Reference this row from any exec-plan that triggers the discovery.
