> [← Design System Index](./index.md)
>
> *Transition durations (`--transition-fast`/`-normal`), Tailwind utilities, micro-interaction rules, and `prefers-reduced-motion` handling.*

# Motion

## Durations & easing

Use CSS variables from the design system; do not hardcode:

| Token | Use |
|---|---|
| `--transition-fast` | Hover, focus, simple state changes |
| `--transition-normal` | Modal open/close, drawer slide, accordion |

Tailwind utility: `transition-colors`, `transition-opacity`, `transition-transform`, `duration-150`, `duration-200`, `duration-300`.

## Rules

- **Subtle** micro-interactions only — hover, focus, light fade/scale
- **No heavy motion** — no full-screen transitions, no bounce, no parallax
- **Reduced motion** — respect `prefers-reduced-motion`; Tailwind `motion-safe:` / `motion-reduce:` variants
- **Loading skeletons** use a slow shimmer (`animate-pulse`) — built into shadcn `Skeleton`

## When to add motion

- State changes the user initiated (button press feedback, dialog open)
- Loading indication
- Drawing attention to a destination (gentle highlight after navigation)

## When NOT to add motion

- Decoration without purpose
- Long-running animations during data entry (distracting)
- Animated charts that delay information delivery
