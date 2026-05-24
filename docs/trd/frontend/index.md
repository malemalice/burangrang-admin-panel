# Frontend Technical Reference Document — Index

> Read only the sub-file relevant to your task. Do not load all sub-files.
> Authoritative source for frontend (React + Vite) patterns at HSE Dashboard. Content split from the original `frontend/TRD.md` on 2026-05-24. The UI/UX Principles and Design System sections were absorbed into [docs/design-system/](../../design-system/) — see [principles.md](../../design-system/principles.md) and [reference.md](../../design-system/reference.md) there.

## Cross-cutting

| File | Section |
|---|---|
| [overview.md](./overview.md) | Document info, executive summary, current state, target architecture |
| [folder-structure.md](./folder-structure.md) | Target folder structure under `frontend/src/` |
| [module-template.md](./module-template.md) | Per-module folder structure + barrel export pattern |
| [implementation-guidelines.md](./implementation-guidelines.md) | Imports, route-level code splitting, edit-page vs form data fetching, module communication, shared component strategy |
| [api-services.md](./api-services.md) | Service layer, inter-module API calls, DTO↔model transforms, error handling, data-level 403 |
| [tables-dropdowns.md](./tables-dropdowns.md) | DataTable, Dropdown+Dialog focus-trap pattern, ModalCombobox-inside-Dialog, filter fields |
| [crud-hooks.md](./crud-hooks.md) | `use[Entities]` / `use[Entity]` custom hook patterns |
| [forms.md](./forms.md) | React Hook Form + Zod page/component patterns, cross-module options loading |
| [module-interaction.md](./module-interaction.md) | Navigation stub linking to the 4 files above (kept for backward-compat) |
| [guidance.md](./guidance.md) | Anti-patterns, implementation checklist, development workflow, migration strategy |
| [reference.md](./reference.md) | Code examples library + barrel export appendix |
| [meta.md](./meta.md) | Module development metrics, success metrics, next steps, benefits, references, history |

## Design system content

The UI/UX Principles and Design System sections from the original `frontend/TRD.md` were absorbed into [docs/design-system/](../../design-system/):

| Original section | Now at |
|---|---|
| 🎨 UI/UX Principles (L236–914) | [docs/design-system/principles.md](../../design-system/principles.md) |
| 🎨 Design System (L915–1443) | [docs/design-system/reference.md](../../design-system/reference.md) |

Existing [docs/design-system/](../../design-system/) sub-files (tokens, components, motion, accessibility, icons) reference these as authoritative sources.

## Related references

- Master orchestration: [AGENTS.md](../../../AGENTS.md)
- Frontend agent rules: [docs/agents/developer-frontend.md](../../agents/developer-frontend.md)
- Designer agent: [docs/agents/designer.md](../../agents/designer.md)
- Backend mirror: [docs/trd/backend/index.md](../backend/index.md)
