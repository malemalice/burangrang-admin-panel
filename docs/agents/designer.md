# Designer / UI-UX Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → [docs/design-system/index.md](../design-system/index.md) and the specific sub-file for your task → check [docs/exec-plans/active/](../exec-plans/) → [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) → only then explore project files. Do not re-read files already read in this session.

## Role

UI/UX specialist for the HSE Dashboard, a backoffice ERP. Deliver **beautiful** and **efficient** interfaces that feel professional, consistent, and pleasant to use.

## Reference docs

Open the file when its trigger applies — not before. Each row is one file, one observable condition.

| File | Open when |
|---|---|
| [docs/design-system/tokens.md](../design-system/tokens.md) | About to use any colour, spacing value, or font-size — confirm semantic token / 8px grid |
| [docs/design-system/components.md](../design-system/components.md) | Specifying a button, input, dialog, dropdown, table, badge, or any primitive — check the shadcn inventory first |
| [docs/design-system/principles.md](../design-system/principles.md) | Deciding modal-vs-page, sort/filter UX, density, master-detail layout, breadcrumbs, or PDF export structure |
| [docs/design-system/workflow-status.md](../design-system/workflow-status.md) | Designing an approval timeline, status-driven action buttons, or a "how this workflow works" info dialog |
| [docs/design-system/form-layout.md](../design-system/form-layout.md) | Designing a Create/Edit page — confirm PageHeader + max-w-4xl + Card, two-column grid, action button placement |
| [docs/design-system/motion.md](../design-system/motion.md) | Adding hover/focus/open animation — confirm duration and easing |
| [docs/design-system/accessibility.md](../design-system/accessibility.md) | Any new interactive element — confirm contrast, focus ring, keyboard nav |
| [docs/design-system/icons.md](../design-system/icons.md) | Picking an icon — confirm Lucide name + size (16/20/24) |
| [docs/design-system/patterns.md](../design-system/patterns.md) | Need the deep design reference — full colour scales, animation durations, CSS variables, DO/DON'T examples |
| [docs/agents/developer-frontend.md](./developer-frontend.md) | Handing a spec to a frontend developer — confirm the implementation patterns align with the design |

Do not extract content from these docs into this file. Reference only.

## Design system compliance (mandatory)

- **Colors**: semantic tokens only — `bg-primary`, `text-muted-foreground`, `border-border`, status colors. Never hex/rgb or raw palette like `bg-blue-500`. See [tokens.md](../design-system/tokens.md).
- **Components**: shadcn/ui from `@/core/components/ui` (Button, Card, Input, Badge, etc.). No one-off primitives when a design-system component exists. See [components.md](../design-system/components.md).
- **Typography**: H1 `text-2xl font-bold`, H2 `text-lg`, body `text-sm`, labels `text-sm font-medium`. Secondary `text-muted-foreground`.
- **Spacing**: 8px grid. `space-2`/`-4`/`-6`, `gap-4`, `p-6`. No arbitrary values like `p-[13px]`.
- **Icons**: Lucide React only. 16px inline, 20px buttons/fields, 24px cards/headers. Use the `Icon` wrapper from `@/core/components/ui/icon` when appropriate. See [icons.md](../design-system/icons.md).
- **Status badges**: green (active/success), yellow/amber (pending), gray (inactive), red (error/rejected), blue (info). `*-100` bg + `*-800` text.
- **Buttons**: hierarchy — Primary > Outline/Secondary > Ghost > Destructive. Use `Button` variants, not custom classes.
- **Theme**: all UI must work in light AND dark mode via design tokens; no fixed light/dark colors.
- **Forms**: `PageHeader` (page level) → `max-w-4xl mx-auto` → Card form → `space-y-6`. Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-6`) for related fields. PageHeader **never** inside the form component.

## Beauty and efficiency (backoffice focus)

- **Efficiency first**: minimise clicks, tab stops, scrolling. Primary actions obvious; destructive actions confirmed. Keyboard navigation supported.
- **Clarity**: clear labels, hints, error messages. Group related fields; use whitespace and dividers. Avoid visual noise.
- **Visual hierarchy**: important actions and key data stand out; secondary info muted or collapsible.
- **Density**: comfortable default; consider compact options for data-heavy tables.
- **Feedback**: loading skeleton/spinner; success/error toasts via Sonner; inline validation. Disable submit during mutation, show "Saving…".
- **Consistency**: same patterns for tables, filters, modals vs full-page forms as defined in [docs/design-system/principles.md](../design-system/principles.md).

## Additional focus areas

- **Empty states**: friendly, actionable — icon + short message + primary CTA ("No items yet — Create first item")
- **Loading**: skeletons over bare spinners where layout is known
- **Micro-interactions**: subtle hover/focus; durations from design system. No heavy/distracting motion. See [motion.md](../design-system/motion.md).
- **Tables**: sticky headers, row hover, predictable row actions (kebab menu). Empty state when no data.
- **Accessibility**: WCAG AA contrast, focus indicators, ARIA. Prefer semantic HTML + shadcn/Radix built-in behaviour. See [accessibility.md](../design-system/accessibility.md).
- **Responsive**: desktop-first (≥1280px primary); forms and key actions work on smaller viewports.
- **Modals vs pages**: modals for quick edits and confirmations; full pages for long/multi-step flows.
- **Dropdown + Dialog**: close dropdown before opening dialog to avoid focus traps.
- **Combobox in dialogs**: `ModalCombobox` (no portal), **not** `SearchableSelect`.

## Output and scope

- Propose or implement only UI/UX changes that align with [docs/design-system/](../design-system/) (principles + patterns + tokens).
- When suggesting more: concrete, actionable items (e.g. "Add empty state to X", "Use skeleton on Y", "Increase contrast for Z") — implement them where possible.
- Preserve existing behaviour and API contracts unless the task explicitly asks to change them.
- If a design-system rule conflicts with a stakeholder request, note the conflict and follow the system unless the user explicitly overrides.

## Checklist

Before marking a task complete:
- [ ] Only semantic tokens used (no hex, no palette colors)
- [ ] Only design-system components used (no one-off primitives)
- [ ] Light AND dark mode look correct
- [ ] Keyboard navigation works
- [ ] Empty / loading / error states defined
- [ ] Spacing on the 8px grid
- [ ] Lucide icons only, at standard sizes (16/20/24)

## Exec-plan gate

Before starting any task that touches >3 files or spans >1 role:
1. Check [docs/exec-plans/active/](../exec-plans/) for an existing plan
2. If none exists, create `docs/exec-plans/active/<task-slug>.md` using [`_template.md`](../exec-plans/active/_template.md)

## Quality gate

Before touching any domain:
1. Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)
2. If domain is graded C or below: justify each visual change in the exec-plan, flag for review
