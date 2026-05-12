# PRD: Embed HSE Dashboard on Google Site

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

Enable embedding the HSE dashboard in a Google Site iframe with seamless experience for both logged-in and non-logged-in users. A valid embed token in the URL grants access without login—the frontend exchanges the embed token for a JWT session and renders the dashboard directly. The embed token is not bound to any user. Embedding is restricted to Google Sites only; other sites cannot frame the dashboard.

**Scope:** Backend auth module (embed token service, embed session endpoint); frontend auth flow, Settings UI; nginx CSP headers.

## Key Features

- **Embed token generation:** Admin generates a signed embed token (HMAC-SHA256, no expiry) and copies the embed URL or HTML snippet from Settings.
- **Token validation:** Frontend validates embed token on load; invalid token shows error in-iframe or redirects to login.
- **Embed session:** Valid token exchanges for a JWT issued to the Embed Viewer system user; no login form shown.
- **Minimal layout:** When `embed_token` is in the URL, sidebar/header/footer are hidden; full-width main content only.
- **CSP restriction:** nginx `frame-ancestors` restricts embedding to Google Sites only.
- **Embed Viewer role:** Dedicated seeded role with limited permissions for the embedded context.

## User Roles & Permissions

- **Admin (JWT required):** Can call `POST /auth/embed/generate` to generate embed token and URL.
- **Embed Viewer (system user):** Holds `incident:list`, `menu:read`, `setting:read`, `setting:update`, `user:read` permissions. Issued to embedded sessions; not used for normal login.
- **Public (no JWT):** `POST /auth/embed/validate` and `POST /auth/embed/session` are public endpoints; security relies on token signature verification.

## User Stories

- As an admin, I can generate an embed URL from Settings so that I can embed the dashboard in a Google Site.
- As an admin, I can copy the HTML snippet from Settings so that I can paste it directly into Google Sites.
- As a Google Site viewer, I can see the dashboard in an iframe without logging in so that I have seamless access via the embed token.
- As a Google Site viewer, if the embed token is invalid, I see an "Embed not authorized" message so that I understand why the dashboard is not loading.
- As an already-logged-in user, my existing JWT session is preserved when opening the embed URL so that I am not logged out.

## Functional Requirements

- [FR-1] The system must expose a JWT-protected `POST /auth/embed/generate` endpoint that returns a signed embed URL.
- [FR-2] The embed token format must be `{base64url(payload)}.{base64url(signature)}` using HMAC-SHA256 with the existing `JWT_SECRET`; no new secret is required.
- [FR-3] The embed token must not expire; it must remain valid until the secret is rotated or the token is revoked.
- [FR-4] The system must expose a public `POST /auth/embed/validate` endpoint that returns `{ valid: boolean }`.
- [FR-5] The system must expose a public `POST /auth/embed/session` endpoint that, given a valid embed token, issues an `accessToken`, `refreshToken`, and the Embed Viewer user object — identical in shape to the login response.
- [FR-6] The frontend must detect `embed_token` in the URL query string on mount and, if present, follow the embed auth flow (validate → session or skip if JWT exists) before rendering the app.
- [FR-7] When in embed mode, the frontend must render a minimal layout (no sidebar, no top header, no footer); full-width main content only.
- [FR-8] The Settings page must include an Embed section with a "Generate embed URL" button that calls the generate endpoint and displays the copyable URL and HTML snippet.
- [FR-9] The nginx configuration must set `Content-Security-Policy: frame-ancestors 'self' https://sites.google.com https://*.google.com` and must not set `X-Frame-Options: SAMEORIGIN`.

## Non-Functional Requirements

- [NFR-1] The embed token must be signed with HMAC-SHA256; unsigned or tampered tokens must be rejected with 401/403.
- [NFR-2] The Embed Viewer system user and role must be created via the seed script; they must not be hardcoded in application logic.
- [NFR-3] Embedding from origins other than Google Sites must be blocked by the `frame-ancestors` CSP directive.
- [NFR-4] The embed flow must not break the normal auth flow for non-embed users; the `embed_token` check must be a no-op when the parameter is absent.
- [NFR-5] `JWT_SECRET` must remain in environment variables; it must never be hardcoded.

## Key Workflows

### Embed Auth Flow

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

## Data Model Summary

- **Embed token payload:** `{ siteId?: string }` — optional site identifier for tracking. No user binding, no expiry.
- **Embed Viewer User:** `embed-viewer@system`; seeded with random password (never used for login). Linked to Embed Viewer role.
- **Embed Viewer Role:** Seeded with permissions: `incident:list`, `menu:read`, `setting:read`, `setting:update`, `user:read`.

## API Endpoints Summary

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /auth/embed/generate | JWT (admin) | Generate embed token; returns `{ embedUrl: string }` |
| POST | /auth/embed/validate | Public | Validate embed token; returns `{ valid: boolean }` |
| POST | /auth/embed/session | Public | Exchange valid embed token for `{ accessToken, refreshToken, user }` |

## Frontend Pages & Components

- **Settings → Embed section:** "Generate embed URL" button; copyable URL and HTML snippet display.
- **AuthProvider:** Detects `embed_token` on mount; runs embed auth flow; no changes to normal login path.
- **MainLayout (embed mode):** Minimal layout — no sidebar, no header, no footer; full-width main content when `embed_token` is present.

## Token Design

- **Format:** `{base64url(payload)}.{base64url(signature)}`
- **Payload (no user, no expiry):** `{ siteId?: string }` — optional site identifier for tracking.
- **Signature:** HMAC-SHA256(payload, JWT_SECRET)
- **Secret:** Reuse existing `JWT_SECRET` (no new env var).

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

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Admin clicks "Generate embed URL" in Settings | Signed embed URL returned and displayed with copyable HTML snippet |
| AC-2 | Google Site loads embed URL with valid embed token | Dashboard renders in minimal layout (no sidebar/header/footer); no login form shown |
| AC-3 | Embed URL loaded with invalid or tampered token | In-iframe: "Embed not authorized" message shown; outside iframe: redirect to login |
| AC-4 | Already-logged-in user opens embed URL | Existing JWT session used; no new session created; dashboard renders normally |
| AC-5 | Dashboard loaded from a non-Google Site origin | Browser blocks iframe due to `frame-ancestors` CSP; dashboard not embedded |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`prd-settings.md`](prd-settings.md) — Settings module where the Embed section is surfaced
- [`prd-auth.md`](prd-auth.md) — Core auth module extended by embed endpoints
