# Design System — Index

> Authoritative source is the **BurangrangDesign System** tokens used in the codebase plus the absorbed content in [principles.md](./principles.md) and [reference.md](./reference.md) (originally `frontend/TRD.md` L236–1443, split into the design system on 2026-05-24).
> The sub-files below summarise rules in scannable form.

## Sub-files

| File | Contents |
|---|---|
| [tokens.md](./tokens.md) | Semantic colors, 8px spacing grid, typography scale (quick reference) |
| [components.md](./components.md) | shadcn/ui inventory, DataTable, PageHeader, ModalCombobox, status badges, button hierarchy |
| [motion.md](./motion.md) | Transition durations and easing |
| [accessibility.md](./accessibility.md) | WCAG AA, focus, ARIA, keyboard |
| [icons.md](./icons.md) | Lucide React, 16/20/24px sizing |
| [principles.md](./principles.md) | UI/UX principles + layout & structure patterns (core principles, layout, whitespace strategy) |
| [component-patterns.md](./component-patterns.md) | Reusable UX patterns: data tables, search & filters (incl. list page state persistence), modal vs page decision, breadcrumbs, status indicators, empty states, bulk actions, undo, audit trails, exports, comparison views, favourites |
| [pdf-export.md](./pdf-export.md) | Client-side PDF generation: `react-to-pdf` template structure, hidden capture target, table-aware page breaks, digital "Verification and approval" section for Master-Approvals entities |
| [workflow-status.md](./workflow-status.md) | Status-based action visibility, button hierarchy, approval timeline (history vs allApprovalLines), dynamic Master-Approval-driven workflow guideline UI, status handlers, approval dialog |
| [form-layout.md](./form-layout.md) | Form page structure (PageHeader → max-w-4xl → Card), spacing standards, action buttons, loading/error state patterns, optimal viewport |
| [reference.md](./reference.md) | Design system reference: color system, typography scale, spacing, theme system, animations, component usage DO/DON'T |

## Implementation primitives

All UI primitives are in `frontend/src/core/components/ui/` (shadcn/ui wrappers over Radix). Use them — do not create one-off primitives when a design-system component exists.

## Theme

All UI must work in **light AND dark mode** via design tokens. If a component breaks when you toggle theme, it has hardcoded colors. Find them.
