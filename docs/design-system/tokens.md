> [← Design System Index](./index.md)
>
> *Semantic colour tokens (no hex/palette), status colour pairings, 8px spacing grid, typography scale, border radius and shadow.*

# Design Tokens

## Colors — semantic tokens only

Use semantic tokens from the BurangrangDesign System. **Never** hard-code hex/rgb, and **never** raw Tailwind palette classes like `bg-blue-500`.

| Token category | Examples |
|---|---|
| Surface | `bg-background`, `bg-card`, `bg-popover`, `bg-muted` |
| Text | `text-foreground`, `text-muted-foreground`, `text-card-foreground` |
| Border | `border-border`, `border-input`, `border-ring` |
| Primary action | `bg-primary text-primary-foreground` |
| Secondary | `bg-secondary text-secondary-foreground` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Accent | `bg-accent text-accent-foreground` |

### Status colors (paired with text/icon, not color alone)

| Status | Background | Text |
|---|---|---|
| Active / Success | `bg-green-100` | `text-green-800` |
| Pending / Warning | `bg-yellow-100` or `bg-amber-100` | `text-yellow-800` / `text-amber-800` |
| Inactive / Draft | `bg-gray-100` | `text-gray-800` |
| Error / Rejected | `bg-red-100` | `text-red-800` |
| Info | `bg-blue-100` | `text-blue-800` |

Always pair color with a label or icon for color-blind users.

## Spacing — 8px grid

Use Tailwind spacing scale on the 8px grid only:

- `space-2` (8px), `space-4` (16px), `space-6` (24px), `space-8` (32px)
- `gap-2`, `gap-4`, `gap-6`
- `p-2`, `p-4`, `p-6`, `p-8`

**Never** arbitrary values like `p-[13px]` or `m-[7px]`.

## Typography scale

| Use | Class |
|---|---|
| H1 (page title) | `text-2xl font-bold` |
| H2 (section header) | `text-lg font-semibold` |
| Body | `text-sm` |
| Label | `text-sm font-medium` |
| Secondary / hint | `text-sm text-muted-foreground` |
| Caption | `text-xs text-muted-foreground` |

No ad-hoc font sizes (`text-[15px]`).

## Border radius & shadow

Use shadcn defaults (`rounded-md`, `rounded-lg`, `shadow-sm`, `shadow-md`). Do not invent new scales.
