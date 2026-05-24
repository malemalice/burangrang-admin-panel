> [← TRD Index](./index.md)
>
> *Environments (dev/prod/migrations/reset workflows), deployment artifacts (docker-compose, nginx, certs), health/migration rules, and frontend SPA deployment notes (nginx history fallback, subpath hosting, CORS).*

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

## Frontend SPA deployment (merged from `frontend/DEPLOYMENT.md` on 2026-05-24)

The frontend is a single-page app (React + Vite + React Router `BrowserRouter`). **Deep links, refresh, and opening routes in a new tab** all issue a full HTTP request for that path. The static host must serve `index.html` for those URLs so the bundle loads and the client router can render.

### Nginx: history fallback

Example server block (adjust `root` to your build output directory, usually `dist`):

```nginx
server {
    listen 443 ssl;
    server_name your-staging-domain.example;

    root /var/www/hse-dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Without `try_files ... /index.html`, paths such as `/health-screenings`, `/work-permits/workers/<id>`, or `/work-permits/new` may return **404 or an empty body**, which shows as a **blank page** while client-side navigation from `/` still works (as in local `vite` dev).

### Subpath hosting (`/app/` etc.)

If the site is served under a prefix (e.g. `https://domain.example/app/`):

1. Set Vite `base` to that prefix (e.g. `base: '/app/'` in `vite.config.ts`).
2. Pass the same value to `<BrowserRouter basename="/app">` in `App.tsx`.
3. Build again so asset URLs in `index.html` resolve correctly.

Mismatch between `base` / `basename` and where files are actually hosted commonly causes **white screens** because JS chunks fail to load.

### API URL and CORS (staging)

The browser build reads **`VITE_API_URL`** at build time (see `src/core/lib/api.ts`). Staging must point to the correct API origin.

The Nest API uses **`CORS_ORIGINS`** (see `backend/src/main.ts` / `app.config`). The staging **frontend origin must be listed exactly** (scheme + host + port), or the browser may block requests and surface generic network/CORS failures.

### Work permit create fails on staging but not locally

Check the failing **`POST /work-permits`** response in DevTools (Network tab):

- **4xx with message** — validation or business rules (e.g. applicant user, workers without declaration URL / linked health screening, inactive applicant). Compare staging data with local DB.
- **401 / 403** — auth or permission / data scope (`work-permit:create`, contractor vs internal applicant rules).
- **No response / CORS error** — fix `CORS_ORIGINS` and `VITE_API_URL`; confirm HTTPS vs HTTP is consistent with mixed-content rules.
