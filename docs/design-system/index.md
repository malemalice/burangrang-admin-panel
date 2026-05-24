# Design System — Index

> Authoritative source is **`frontend/TRD.md` §UI/UX Principles (line 236)** and the **BurangrangDesign System** tokens used in the codebase.
> Sub-files below summarise the rules in scannable form.

## Sub-files

| File | Contents |
|---|---|
| [tokens.md](./tokens.md) | Semantic colors, 8px spacing grid, typography scale |
| [components.md](./components.md) | shadcn/ui inventory, DataTable, PageHeader, ModalCombobox, status badges, button hierarchy |
| [motion.md](./motion.md) | Transition durations and easing |
| [accessibility.md](./accessibility.md) | WCAG AA, focus, ARIA, keyboard |
| [icons.md](./icons.md) | Lucide React, 16/20/24px sizing |

## Implementation primitives

All UI primitives are in `frontend/src/core/components/ui/` (shadcn/ui wrappers over Radix). Use them — do not create one-off primitives when a design-system component exists.

## Theme

All UI must work in **light AND dark mode** via design tokens. If a component breaks when you toggle theme, it has hardcoded colors. Find them.
