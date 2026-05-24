# Deployment

## Environments

| Env | Trigger | Workflow |
|---|---|---|
| Development | manual / push | `.github/workflows/deploy-development.yml` |
| Production (backend) | manual / tag | `.github/workflows/deploy-backend-production.yml` |
| Production (frontend) | manual / tag | `.github/workflows/deploy-frontend-production.yml` |
| Reset DB (dev) | manual | `.github/workflows/reset-database.yml` — destructive |
| DB migrations | manual | `.github/workflows/run-database-migrations.yml` — gated |

## Local & deployment artifacts

- `deployment/docker-compose.yml` — full-stack orchestration
- `deployment/nginx/` — reverse proxy config
- `deployment/certs/` — TLS certs (gitignored content)
- `deployment/env-example` — environment template
- `deployment/TRAEFIK_SETUP.md`, `WEBV2_DEPLOYMENT.md`, `WEBV2_PATH_FIX.md` — operational runbooks
- `deployment/README.md`, `README-github.md` — deployment overviews

## Dockerfiles

- `backend/Dockerfile` — NestJS service image
- `frontend/Dockerfile` — Vite build → nginx static serve

## Health & readiness

- Backend exposes standard NestJS health endpoints (see `backend/src/modules/health/` if present, else `/api`)
- Migrations: gated workflow (`run-database-migrations.yml`) — never run as a deploy side effect

## Rules

- Migrations and seeds run only via the gated workflow or local `npx prisma migrate dev` with explicit user approval.
- Secrets live in GitHub Actions secrets and deployment env files — never committed.
- Production deploys are manual-trigger only; no auto-deploy from `main`.
