> [← Frontend TRD Index](./index.md)
>
> *Target frontend folder layout under `src/` — core, modules, shared.*

## 📁 Target Folder Structure

```
src/
├── core/                          # Core infrastructure & shared utilities
│   ├── components/                # Shared UI components
│   │   ├── layout/               # Layout components (MainLayout, Sidebar, etc.)
│   │   └── ui/                   # Reusable UI components (shadcn/ui)
│   ├── hooks/                    # Shared custom hooks
│   ├── lib/                      # Core utilities & configurations
│   │   ├── api.ts               # HTTP client & interceptors
│   │   ├── auth.tsx             # Authentication logic
│   │   ├── types.ts             # Global/shared types
│   │   ├── utils.ts             # Utility functions
│   │   └── theme/               # Theme configuration
│   ├── pages/                    # Core application pages
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── Index.tsx
│   └── routes/                   # Core routing configuration
│       ├── index.ts
│       ├── types.ts
│       └── renderRoutes.tsx
│
├── modules/                       # Feature modules
│   ├── users/                    # User management module
│   │   ├── components/           # User-specific components
│   │   ├── pages/               # User pages
│   │   ├── services/            # User business logic
│   │   ├── types/               # User-specific types
│   │   ├── hooks/               # User-specific hooks
│   │   ├── routes/              # User routing
│   │   └── index.ts             # Module exports
│   │
│   ├── roles/                   # Role management module
│   ├── master-data/             # Master data module (renamed from master)
│   ├── menus/                   # Menu management module
│   └── settings/                # Settings module
│
├── shared/                      # Cross-module shared resources
│   ├── constants/               # Application constants
│   ├── utils/                   # Helper utilities
│   ├── validators/              # Zod schemas
│   └── types/                   # Cross-module types
│
├── App.tsx                      # Root application component
├── main.tsx                     # Application entry point
└── index.css                    # Global styles
```
