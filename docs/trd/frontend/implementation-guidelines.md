> [← Frontend TRD Index](./index.md)
>
> *Imports + tsconfig paths, route-level code splitting with `React.lazy` + `Suspense`, the edit-page-vs-form data-fetch principle, module communication, shared component strategy.*

## 🔧 Technical Implementation Guidelines

### 1. Import Path Management
- Use TypeScript path mapping in `tsconfig.json`
- Create barrel exports for cleaner imports
- Use IDE refactoring tools for automated updates

```typescript
// tsconfig.json paths
{
  "paths": {
    "@/core/*": ["./src/core/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/shared/*": ["./src/shared/*"]
  }
}
```

### 2. Route Registration Pattern

Central registration in [`core/routes/index.ts`](src/core/routes/index.ts) aggregates each module's route array. Modules export route configs from `modules/[name]/routes/*Routes.ts(x)`.

#### Principles — route-level code splitting

- **Lazy-load page components**: In module route files, register pages with `React.lazy(() => import('../pages/...'))` instead of static `import ... from` for every page. That way the bundler splits by route; navigating to a URL loads that route's chunk instead of pulling the entire module page tree up front.
- **Why it matters**: In Vite dev, many small JS requests are normal; without lazy routes, the dependency graph for *all* statically imported pages is evaluated together, which inflates initial work and confuses network debugging. In production, lazy routes map to separate async chunks and better caching.
- **Suspense**: The app root must wrap routed content in `<Suspense fallback={...}>` so lazy components can suspend (see `App.tsx`).
- **Keep route files thin**: Only `lazy`, `RouteConfig[]`, and path → component mapping—no business logic.

```typescript
// modules/[feature]/routes/[feature]Routes.ts
import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const FeatureListPage = lazy(() => import('../pages/FeatureListPage'));
const FeatureDetailPage = lazy(() => import('../pages/FeatureDetailPage'));

const featureRoutes: RouteConfig[] = [
  { path: '/features', component: FeatureListPage },
  { path: '/features/:id', component: FeatureDetailPage },
];

export default featureRoutes;
```

```typescript
// core/routes/index.ts (aggregate only; still imports route modules)
import userRoutes from '@/modules/users/routes/userRoutes';
import roleRoutes from '@/modules/roles/routes/roleRoutes';

const routes: RouteConfig[] = [
  ...coreRoutes.filter(/* ... */),
  ...userRoutes,
  ...roleRoutes,
  // ... other route arrays
];

export default routes;
```

#### Principles — edit page vs form data fetching

- **Single source of fetch for one entity**: If a form component already calls a hook that loads the record by id (e.g. `useCertificate(id)` in edit mode), the parent **edit page** should not call the same hook again or duplicate `useEffect` + `fetch`—that causes multiple identical API requests and races.
- **Thin edit shell**: Prefer an edit route page that only provides layout (e.g. `PageHeader`, back button) and renders `<EntityForm mode="edit" />`. Loading and "not found" handling live in the form (or a dedicated data boundary), unless the product explicitly needs a full-page loading state driven by the parent.
- **Shared id**: The form reads `id` from `useParams` or receives it via props; avoid fetching in both parent and child for the same id.

### 3. Module Communication Guidelines
- **Keep module state local** when possible
- Use React Context for cross-module state
- Consider Zustand for complex shared state
- Implement event bus for module communication if needed

### 4. Shared Component Strategy
- Keep truly shared components in `core/components/ui/`
- Create module-specific variants when needed
- Use composition over inheritance
- Document component usage and dependencies
