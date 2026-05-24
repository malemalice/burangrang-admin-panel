# Technical Debt Tracker

> Updated by any agent that discovers debt during a task. New items get an ID and a discovery date. Move resolved items to "Resolved" with the resolution.

## Open items

| ID | Area | Description | Severity (H/M/L) | Discovered | Owner |
|---|---|---|---|---|---|
| TD-001 | Docs | `backend/erd-pre.md` is a legacy ERD snapshot — archive or merge into `backend/erd.md` | L | 2026-05-24 | — |
| TD-002 | Docs | `docs/trd-inspection-approval-legacy.md` should be merged or removed after legacy path is fully retired | L | 2026-05-24 | — |
| TD-003 | Frontend | No unit-test infrastructure in `frontend/` (no Jest/Vitest setup). Coverage is E2E-only via Playwright | M | 2026-05-24 | — |
| TD-004 | Docs | `backend/TRD.md` (70KB) and `frontend/TRD.md` (117KB) are monolithic — consider breaking into section files under `docs/trd/` and `docs/design-system/` (currently the new sub-files only navigate, not replace) | M | 2026-05-24 | — |
| TD-005 | Docs | `.specstory/` and `.cursor/plans/` contain historical session logs — confirm retention policy or archive | L | 2026-05-24 | — |

## Resolved items

| ID | Area | Resolution | Resolved |
|---|---|---|---|
| _(none yet)_ | | | |

## How to add an item

1. Pick the next `TD-NNN` ID (zero-padded if you prefer).
2. Pick a severity:
   - **H** — actively causes bugs, security risk, or blocks work
   - **M** — meaningful drag on development; should be scheduled
   - **L** — cleanup; do when convenient
3. Reference this row from any exec-plan that triggers the discovery.
