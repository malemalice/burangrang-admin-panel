# Accessibility

## Standards

- **WCAG AA contrast** for all text and interactive states
- **Semantic HTML first**; ARIA only to fill gaps (`<button>` beats `<div role="button">`)
- **Keyboard-only must work everywhere**: Tab order is logical; Enter and Esc behave correctly in dialogs
- **Color is never the only signal** — pair it with text, icon, or shape (especially for status badges)
- **Touch targets ≥ 44px** on touch devices

## Focus

- Visible focus ring on all interactive elements (use shadcn defaults — they include `focus-visible:ring-2 focus-visible:ring-ring`)
- Never remove `:focus-visible` outline without replacing it
- Modal/dialog traps focus inside; Esc closes; focus returns to the trigger

## Forms

- Every input has a `<Label>` associated via `htmlFor` / `id`
- Required fields marked visually AND via `aria-required`
- Error messages connected via `aria-describedby` and `aria-invalid`
- Use shadcn `Form` + `FormField` + `FormMessage` — they wire ARIA automatically

## Dialog + dropdown gotchas

- Close any open dropdown **before** opening a dialog (prevents focus trap conflicts)
- Use `ModalCombobox` (no portal) inside dialogs — portaled comboboxes fight the dialog's aria-hidden
- See [components.md](./components.md) "Dialog rules"

## Tables

- `DataTable` provides sortable headers as buttons (`<button>` in `<th>`)
- Row actions in dropdown — keyboard accessible via the menu's built-in nav
- Selection checkboxes have `aria-label="Select row"` and a "Select all" master

## Status & feedback

- Toasts via Sonner are announced (`role="status"`, `aria-live="polite"`)
- Loading states announced via `aria-busy="true"` on the container

## Testing

- Manual keyboard pass on every new page (Tab through, Shift+Tab back, Enter to activate, Esc to close)
- Run Lighthouse a11y audit on key pages (target ≥ 95)
