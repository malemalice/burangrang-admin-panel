# CLAUDE.md — BurangrangAdmin Panel

## Project

Full-stack admin panel — NestJS backend (port 3000) + React/Vite frontend (port 5173).

---

## Docs Structure

| Document | Path |
|----------|------|
| Product Requirements (PRD) | `docs/PRD.md` |
| Backend Technical Reference (TRD) | `backend/docs/TRD.md` |
| Database ERD | `backend/docs/ERD.md` |
| ERD Quick Reference | `backend/docs/ERD-QUICK-REFERENCE.md` |
| Frontend Technical Reference (TRD) | `frontend/docs/TRD.md` |
| Database Schema (source of truth) | `backend/prisma/schema.prisma` |

---

## Before Every Task

Read the relevant reference documents first. All implementation rules are defined there.

### Backend tasks

- `backend/docs/TRD.md` — all backend patterns, conventions, and implementation rules
- `backend/docs/ERD.md` — full entity relationship diagram
- `backend/docs/ERD-QUICK-REFERENCE.md` — quick entity and relation lookup
- `backend/prisma/schema.prisma` — current source of truth for the database schema

### Frontend tasks

- `frontend/docs/TRD.md` — all frontend patterns, design system, and implementation rules

### New to the project?

Start with `docs/PRD.md` to understand what this product is and what modules it covers.

---

## Workflow

1. Read the TRD for the layer you are working on
2. Check the ERD if the task involves the database
3. Verify `schema.prisma` for current model state before assuming any fields
4. Follow the implementation patterns defined in the TRD — no deviations
5. After any schema change: run `npx prisma migrate dev --name <name>` then `npx prisma generate` inside `backend/`
6. Register new backend modules in `backend/src/app.module.ts`
7. Add barrel exports for new frontend modules in their `index.ts`

---

## Getting Started

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env` if they do not exist.

API docs: `http://localhost:3000/api`
