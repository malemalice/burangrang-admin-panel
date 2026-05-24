# Radix UI + shadcn/ui Reference

> Versions: 14+ Radix primitives; shadcn/ui components copy-pasted into `frontend/src/core/components/ui/`
> Sources: https://www.radix-ui.com/primitives/docs, https://ui.shadcn.com/docs
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

Radix provides unstyled, accessible primitives. shadcn/ui wraps them with Tailwind styling and copies the source into the project (no npm package). All primitives live at `frontend/src/core/components/ui/`.

## Key components used in this project

Button, Card, Input, Textarea, Select, Checkbox, Switch, Dialog, Sheet, Popover, Tooltip, Badge, Avatar, Tabs, Accordion, Table, Toast (Sonner), Form, Label, Separator, Skeleton, ScrollArea, Calendar, DropdownMenu, Command.

Project-specific wrappers: `DataTable`, `PageHeader`, `ModalCombobox`, `SearchableSelect`, `Icon`.

## Common patterns

- Use the existing primitive — never duplicate a button/dialog
- Compose with `cn()` utility for Tailwind class merging
- Use `Form` + `FormField` + `FormMessage` for inputs — wires ARIA correctly
- Variants via `class-variance-authority` (`cva`)

## Gotchas

- **`Dialog` + portaled combobox = focus trap conflict.** Inside dialogs, use `ModalCombobox` (no portal). Never `SearchableSelect` in a dialog.
- **Dropdown opening a dialog:** close the dropdown first or focus is trapped
- shadcn components are **copied source** — modifications stay local. If you change one, document why.
- Radix `Dialog` controls focus return — do not manually `.focus()` an element after close

## Do not use

- One-off custom primitives when a shadcn equivalent exists
- Headless UI / Mantine / other component libraries — Radix + shadcn only
