# Design System — Index

> Authoritative source is the **BurangrangDesign System** tokens used in the codebase plus the absorbed content in [principles.md](./principles.md) and [patterns.md](./patterns.md) (originally `frontend/TRD.md` L236–1443, split into the design system on 2026-05-24).
> The sub-files below summarise rules in scannable form.

## Sub-files

| File | Contents |
|---|---|
| [tokens.md](./tokens.md) | Semantic colors, 8px spacing grid, typography scale (quick reference) |
| [components.md](./components.md) | shadcn/ui inventory, DataTable, PageHeader, ModalCombobox, status badges, button hierarchy |
| [motion.md](./motion.md) | Transition durations and easing |
| [accessibility.md](./accessibility.md) | WCAG AA, focus, ARIA, keyboard |
| [icons.md](./icons.md) | Lucide React, 16/20/24px sizing |
| [principles.md](./principles.md) | UI/UX principles for back-office systems, layout patterns, component patterns, status/workflow rendering, form guidelines (deep / from frontend/TRD.md L236–914) |
| [patterns.md](./patterns.md) | Design system reference: color system, typography scale, spacing, theme system, animations, component usage DO/DON'T (deep / from frontend/TRD.md L915–1443) |

## Implementation primitives

All UI primitives are in `frontend/src/core/components/ui/` (shadcn/ui wrappers over Radix). Use them — do not create one-off primitives when a design-system component exists.

## Theme

All UI must work in **light AND dark mode** via design tokens. If a component breaks when you toggle theme, it has hardcoded colors. Find them.
