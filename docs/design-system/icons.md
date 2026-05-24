# Icons

## Library

**Lucide React (`lucide-react@0.462.0`) only.** Do not mix icon sets.

Import individually for tree-shaking:

```tsx
import { Check, X, ChevronRight } from "lucide-react"
```

## Sizes

| Size | Use | Class / prop |
|---|---|---|
| 16px | Inline with body text, badges | `size={16}` or `className="h-4 w-4"` |
| 20px | Buttons, form fields | `size={20}` or `className="h-5 w-5"` |
| 24px | Card headers, page headers | `size={24}` or `className="h-6 w-6"` |

Do not use other sizes without a reason.

## Wrapper

Use `Icon` from `@/core/components/ui/icon` when consistent sizing/color is needed:

```tsx
<Icon name="Check" size={20} />
```

## Color

Inherit from text color (`currentColor`). Use semantic tokens via parent text class:

```tsx
<button className="text-muted-foreground hover:text-foreground">
  <Check className="h-4 w-4" />
</button>
```

Never set fixed colors on icons (`text-blue-500`).

## Common semantic mapping

| Concept | Icon |
|---|---|
| Approve | `Check` / `CheckCircle` |
| Reject | `X` / `XCircle` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| View | `Eye` |
| More actions | `MoreVertical` |
| Search | `Search` |
| Filter | `Filter` |
| Sort | `ArrowUpDown` |
| Add | `Plus` |
| Loading | `Loader2` (with `animate-spin`) |
| Warning | `AlertTriangle` |
| Info | `Info` |
| Success | `CheckCircle2` |
| Error | `AlertCircle` |
