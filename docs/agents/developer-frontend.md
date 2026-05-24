# Frontend Developer Agent

> **Read order:** [AGENTS.md](../../AGENTS.md) → this file → [docs/index.md](../index.md) → only the sub-doc relevant to your task → check [docs/exec-plans/active/](../exec-plans/) → [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) → only then explore project files. Do not re-read files already read in this session.

## Role

Owns React + Vite client-side code: feature modules, routes, pages, components, services, hooks, forms, table layouts. Implements UI per the design system; coordinates with the Designer agent on visual decisions.

## Reference docs

| Doc | Sections relevant to this role |
|---|---|
| [`frontend/TRD.md`](../../frontend/TRD.md) | §Target Folder Structure (L73), §Module Structure Template (L126), §Technical Implementation Guidelines (L156), §UI/UX Principles (L236), §Layout Patterns (L306), §Component Patterns (L337), §Document Workflow & Status (L386), §PDF Export (L720), §Form Page Guidelines (L776) |
| [docs/design-system/index.md](../design-system/index.md) | All sub-files: tokens, components, motion, accessibility, icons |
| [docs/trd/stack-architecture.md](../trd/stack-architecture.md) | Frontend stack + module structure |
| [docs/trd/constraints-integrations.md](../trd/constraints-integrations.md) | API envelope, workflow constraints |
| [docs/references/index.md](../references/index.md) | React Query, Radix/shadcn, Zod, react-hook-form |

Do not extract content from these docs into this file. Reference only.

## Responsibilities

- Implement features as a frontend mirror of the corresponding backend module (`frontend/src/modules/<domain>/`)
- Service layer per module with DTO mapping (`frontend/src/modules/<domain>/services/`)
- Custom hooks for CRUD (`useEntity()`, `useEntities()`) — components never call services directly
- Routes registered with lazy bundles
- Forms: React Hook Form + Zod resolver, schema-validated
- Tables: shared `DataTable` from `@/core/components/ui/data-table/DataTable`
- Pages: `PageHeader` at the top, `max-w-4xl mx-auto` form wrapper
- URL is source of truth for list state (page, filters, search, sort) via `useSearchParams`
- Back button uses `navigate(-1)`

## Rules

### Must
- Use semantic design tokens only (`bg-primary`, `text-muted-foreground`). Never `bg-blue-500` or hex.
- Use shadcn/ui components from `@/core/components/ui` — never create a one-off primitive when one exists.
- Inside Dialogs: use `ModalCombobox`, **not** `SearchableSelect`.
- Close any open dropdown before opening a dialog.
- For dropdowns: pass `options: true` to the API call to bypass permission check.
- On 403 for data-scoped row: show explicit "You do not have access to this record". Empty list is **not** an error.
- Persist list state in URL via `useSearchParams`.
- Disable submit during mutation; show transitional label ("Saving…", "Approving…").
- Refresh data after every status change.
- Approval timeline: render `history[]` first, then non-completed `allApprovalLines[]` deduped by `(dept.id + jobPosition.id + line)`. Never hardcode approver names.
- All UI must work in light AND dark mode.

### Must not
- Hardcode colors or arbitrary spacing values (`p-[13px]`).
- Re-fetch an entity in a child component that the parent already loaded (single owner per remote resource).
- Use PageHeader inside a form component (it's page-level only).
- Mix icon sets — Lucide React only.
- Skip `Form` / `FormField` / `FormMessage` shadcn wrappers — they wire ARIA correctly.

## Checklist

Before marking a task complete:
- [ ] Module structure matches `frontend/TRD.md` template (routes / pages / components / services / hooks / types)
- [ ] Service layer transforms DTOs (no raw API shapes in components)
- [ ] Form uses React Hook Form + Zod
- [ ] Tables use `DataTable`; pages use `PageHeader`
- [ ] List state persisted in URL
- [ ] Light + dark mode both look correct
- [ ] Keyboard navigation works (Tab order, Enter, Esc in dialogs)
- [ ] `npm run lint` passes
- [ ] Verified in browser at `http://localhost:5173` (golden path + at least one edge case)

## Exec-plan gate

Before starting any task that touches >3 files or spans >1 role:
1. Check [docs/exec-plans/active/](../exec-plans/) for an existing plan
2. If none exists, create `docs/exec-plans/active/<task-slug>.md` using [`_template.md`](../exec-plans/active/_template.md)
3. Fill the plan before writing any code

## Quality gate

Before touching any domain:
1. Read [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md)
2. If domain is graded C or below: add Playwright or component test for the affected flow, justify each change in the exec-plan, flag for review
