# PRD: Embed HSE Dashboard on Google Site

## Overview

Enable embedding the HSE dashboard in a Google Site iframe with seamless experience for both logged-in and non-logged-in users. A valid embed token in the URL grants access without login—the frontend exchanges the embed token for a JWT session and renders the dashboard directly. The embed token is not bound to any user. Embedding is restricted to Google Sites only; other sites cannot frame the dashboard.

**Scope:** Backend auth module (embed token service, embed session endpoint); frontend auth flow, Settings UI; nginx CSP headers.

## Requirements

1. **Seamless for all** — Valid embed token grants access without login; no login form shown.
2. **Token applies to all** — Works for both logged-in and non-logged-in users; no user existence check.
3. **Token not bound to user** — The embed token authorizes the embed context only; it does not identify a user. Backend uses a special Embed Viewer system user for API auth.
4. **Restricted embedding** — The dashboard cannot be embedded from sites other than Google Sites (CSP `frame-ancestors`).
5. **No expiry** — Embed token does not expire; valid until secret rotation or revocation.
6. **Minimal layout** — When embed_token is present, render main content only (no sidebar, no top header/navigation, no footer).

## Token Design

- **Format:** `{base64url(payload)}.{base64url(signature)}`
- **Payload (no user, no expiry):** `{ siteId?: string }` — optional site identifier for tracking.
- **Signature:** HMAC-SHA256(payload, JWT_SECRET)
- **Secret:** Reuse existing `JWT_SECRET` (no new env var).

## Flow

```
Embed loads with ?embed_token=xxx
         │
         ▼
  POST /auth/embed/validate { embedToken }
         │
    ┌────┴────┐
    │         │
 Valid      Invalid
    │         │
    ▼         ▼
 Allow     In iframe? → Show "Embed not authorized"
 page      Else → Redirect to login
    │
    ▼
 Check JWT in localStorage
    │
  ┌─┴─┐
  │   │
 Yes  No
  │   │
  ▼   ▼
Dashboard  POST /auth/embed/session (embedToken)
           │
           ▼
     Get JWT, store, set user
           │
           ▼
     Render dashboard (no login form)
```

## Backend Implementation

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/embed/generate | JWT (admin) | Generate embed token and full URL |
| POST | /auth/embed/validate | Public | Validate embed token |
| POST | /auth/embed/session | Public | Exchange valid embed token for JWT (accessToken, refreshToken, user) |

### DTOs

- **Generate response:** `{ embedUrl: string }`
- **Validate request:** `{ embedToken: string }`
- **Validate response:** `{ valid: boolean }`
- **Embed session request:** `{ embedToken: string }`
- **Embed session response:** `{ accessToken, refreshToken, user }` (same as login)

### Service

- `EmbedTokenService`:
  - `generateToken(options?: { siteId?: string }): string`
  - `validateToken(token: string): { valid: boolean }`

### Embed Viewer Role and User

- **Role:** "Embed Viewer" with permissions: `incident:list`, `menu:read`, `setting:read`, `setting:update`, `user:read` (for hazard analytics and basic app shell).
- **User:** `embed-viewer@system` with role "Embed Viewer", seeded with a random password (never used for normal login). Used by `/auth/embed/session` to issue JWT.

### URL Generation

- `embedUrl = ${FRONTEND_URL}?embed_token=${token}`

## Frontend Implementation

### Auth Flow Changes

1. On mount, read `embed_token` from `window.location.search`.
2. If `embed_token` present:
   - Call `POST /auth/embed/validate`.
   - If invalid: in iframe → show "Embed not authorized"; else → redirect to login.
   - If valid: check JWT in localStorage.
   - If JWT exists: proceed to dashboard.
   - If no JWT: call `POST /auth/embed/session` with embed token, store accessToken/refreshToken, set user, proceed to dashboard (no login form).
3. If no `embed_token`: keep current behavior (require JWT or redirect to login).

### Layout (Embed Mode)

When `embed_token` is present in the URL, the app renders a minimal layout to maximize the embedded view:

- **Main content only** — No sidebar menu, no top header/navigation, no footer
- Full-width main content area
- Theme (light/dark) and content padding preserved

### Settings UI

- Add **Embed** section in Settings.
- **Generate embed URL** button → calls `POST /auth/embed/generate`.
- Display copyable URL and HTML snippet.

## Security (Nginx)

Update `X-Frame-Options` to use CSP `frame-ancestors`:

```
Content-Security-Policy: frame-ancestors 'self' https://sites.google.com https://*.google.com
```

Remove or override `X-Frame-Options: SAMEORIGIN` in:

- `frontend/nginx.conf`
- `deployment/nginx/conf.d/frontend.conf` (and related deployment configs)

## How to Generate URL/Token

1. Admin logs in to HSE dashboard.
2. Go to **Settings → Embed**.
3. Click **Generate embed URL**.
4. Copy the URL or HTML snippet.
5. In Google Site: **Insert → Embed** → choose URL or HTML → paste.

## Example Embed Code

### URL (for Google Sites "Embed by URL")

```
https://panel.soulyousee.com?embed_token=eyJzaXRlSWQiOiJoc2UtZ29vZ2xlLXNpdGUifQ.abc123...
```

### HTML (for Google Sites "Embed HTML")

```html
<iframe 
  src="https://panel.soulyousee.com?embed_token=eyJzaXRlSWQiOiJoc2UtZ29vZ2xlLXNpdGUifQ.abc123..." 
  width="100%" 
  height="900" 
  frameborder="0"
  allowfullscreen>
</iframe>
```

## Dependencies

- **Backend:** JWT_SECRET (existing), AuthController, AuthModule, EmbedTokenService, Embed Viewer role and user (seed).
- **Frontend:** AuthProvider, api.ts, SettingsPage, MainLayout (embed mode).
- **Deployment:** nginx config (CSP frame-ancestors).
- **Seed:** Run `npx prisma db seed` after implementation to create Embed Viewer role and user (user consent required).
