# Stack & Architecture

## Stack summary

| Layer | Technology | Version |
|---|---|---|
| Backend framework | NestJS | 11.0.1 |
| Backend language | TypeScript | 5.7.3 |
| ORM | Prisma | 6.7.0 |
| Database | PostgreSQL | — (deployed) |
| Auth | Passport (JWT + Google OAuth) | passport-jwt 4.0.1 |
| Validation (BE) | class-validator + class-transformer | 0.14.1 / 0.5.1 |
| API docs | Swagger | @nestjs/swagger 11.1.6 |
| Email | nodemailer + @nestjs-modules/mailer | 8.0.7 / 2.0.2 |
| Scheduling | @nestjs/schedule | 6.0.1 |
| BE testing | Jest + Supertest | 29.7.0 / 7.0.0 |
| Frontend framework | React + Vite | 18.3.1 / 5.4.1 |
| FE language | TypeScript | 5.5.3 |
| Routing | react-router-dom | 6.26.2 |
| Data fetching | @tanstack/react-query | 5.56.2 |
| HTTP | axios | 1.9.0 |
| Forms | react-hook-form + @hookform/resolvers | 7.53.0 / 3.9.0 |
| Validation (FE) | zod | 3.23.8 |
| UI components | Radix UI + shadcn/ui | (14+ Radix primitives) |
| Styling | Tailwind CSS | 3.4.11 |
| Icons | lucide-react | 0.462.0 |
| Charts | recharts | 2.12.7 |
| Calendar | @fullcalendar/react | 6.1.15 |
| Editor | Tiptap | 2.12.0 |
| PDF / Export | react-to-pdf, xlsx, qrcode.react | 2.0.0 / 0.18.5 / 4.2.0 |
| Toasts | sonner | 1.5.0 |
| E2E | Playwright | (in `playwright/`) |

## Backend architecture (NestJS, modular)

- Entry: `backend/src/main.ts`
- App module: `backend/src/app.module.ts`
- **53 feature modules** under `backend/src/modules/<domain>/`
- Each module: `<domain>.module.ts`, `<domain>.controller.ts`, `<domain>.service.ts`, `dto/`, `entities/`
- Shared: `backend/src/shared/` (guards, interceptors, filters, base services)
- Core: `backend/src/core/config/` (Prisma client, env config)

**Read the relevant sub-file in [docs/trd/backend/](./backend/) before backend work:**
- [architecture.md](./backend/architecture.md) + [folder-structure.md](./backend/folder-structure.md) — module architecture
- [core-patterns.md](./backend/core-patterns.md) — Module / DTO / Controller patterns
- [security.md](./backend/security.md) — guards, decorators, data-level access, approval-assignee exception
- [error-handling.md](./backend/error-handling.md)
- [dto-mapping.md](./backend/dto-mapping.md)
- [database.md](./backend/database.md) — naming convention
- [modules/](./backend/modules/) — for upload / reminder / approval / mail modules

## Frontend architecture (React + Vite, feature-based)

- Entry: `frontend/src/main.tsx`
- **45 feature modules** under `frontend/src/modules/<domain>/`
- Each module: `routes/`, `pages/`, `components/`, `services/`, `hooks/`, `types/`
- Core: `frontend/src/core/` (components/ui — shadcn primitives, contexts, hooks, lib, pages, routes, types, utils)
- Shared: `frontend/src/shared/`

**Read the relevant sub-file in [docs/trd/frontend/](./frontend/) before frontend work:**
- [folder-structure.md](./frontend/folder-structure.md)
- [module-template.md](./frontend/module-template.md)
- [implementation-guidelines.md](./frontend/implementation-guidelines.md) — imports, routes, communication
- [module-interaction.md](./frontend/module-interaction.md) — API calls, tables, CRUD, forms, error handling
- [docs/design-system/principles.md](../design-system/principles.md) — UI/UX principles, layout, component patterns, workflow/status, form guidelines
- [docs/design-system/patterns.md](../design-system/patterns.md) — Design system reference: color, typography, spacing, theme

## Cross-cutting

- Both halves mirror domain boundaries (a `risk-assessment` module exists on both sides)
- Prisma schema: `backend/prisma/schema.prisma` (138 migrations under `backend/prisma/migrations/`)
- API contract: Swagger at `http://localhost:3000/api` in dev
- Auth: JWT in `Authorization: Bearer <token>` header
- Options bypass: list endpoints accept `?options=true` for dropdown fetches (skips permission check, JWT still required)
