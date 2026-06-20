> [← Frontend TRD Index](./index.md)
>
> *Navigation stub. The original 870-line module-interaction.md was split into 4 focused sub-files on 2026-05-24.*

## Module Interaction Patterns

This file used to hold all four sub-topics in one ~870-line document. Each topic now lives in its own file so agents only load what they need:

| File | Open when |
|---|---|
| [api-services.md](./api-services.md) | Implementing or modifying a module's service layer, inter-module API calls (`options: true`), DTO↔model transforms, or 403 / data-level error handling |
| [tables-dropdowns.md](./tables-dropdowns.md) | Building a list page with `DataTable`, wiring a row-action dropdown that opens a confirm dialog, or using a combobox inside a `Dialog` |
| [crud-hooks.md](./crud-hooks.md) | Adding the `use[Entities]` / `use[Entity]` custom hook for a module |
| [forms.md](./forms.md) | Creating a Create/Edit page, the form component itself, or loading cross-module dropdown options |

For visual / layout standards (page structure, spacing, state patterns), see [docs/design-system/form-layout.md](../../design-system/form-layout.md) (after Phase 2) and [docs/design-system/principles.md](../../design-system/principles.md).
