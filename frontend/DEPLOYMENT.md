# Frontend deployment (SPA)

This app is a single-page application (React + Vite + React Router `BrowserRouter`). **Deep links, refresh, and opening routes in a new tab** all issue a full HTTP request for that path. The static host must serve `index.html` for those URLs so the bundle loads and the client router can render.

## Nginx: history fallback

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

## Subpath hosting (`/app/` etc.)

If the site is served under a prefix (e.g. `https://domain.example/app/`):

1. Set Vite `base` to that prefix (e.g. `base: '/app/'` in `vite.config.ts`).
2. Pass the same value to `<BrowserRouter basename="/app">` in `App.tsx`.
3. Build again so asset URLs in `index.html` resolve correctly.

Mismatch between `base` / `basename` and where files are actually hosted commonly causes **white screens** because JS chunks fail to load.

## API URL and CORS (staging)

The browser build reads **`VITE_API_URL`** at build time (see `src/core/lib/api.ts`). Staging must point to the correct API origin.

The Nest API uses **`CORS_ORIGINS`** (see `backend/src/main.ts` / `app.config`). The staging **frontend origin must be listed exactly** (scheme + host + port), or the browser may block requests and surface generic network/CORS failures.

## Work permit create fails on staging but not locally

Check the failing **`POST /work-permits`** response in DevTools (Network tab):

- **4xx with message** — validation or business rules (e.g. applicant user, workers without declaration URL / linked health screening, inactive applicant). Compare staging data with local DB.
- **401 / 403** — auth or permission / data scope (`work-permit:create`, contractor vs internal applicant rules).
- **No response / CORS error** — fix `CORS_ORIGINS` and `VITE_API_URL`; confirm HTTPS vs HTTP is consistent with mixed-content rules.
