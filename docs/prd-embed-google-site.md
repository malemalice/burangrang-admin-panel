# PRD: Embed HSE Dashboard on Google Site

## Overview

Enable embedding the HSE dashboard in a Google Site iframe with seamless experience for both logged-in and non-logged-in users. The embed is authorized via a signed token in the URL (not bound to any user). Token validation ignores user existence in the system—no user lookup is performed. Embedding is restricted to Google Sites only; other sites cannot frame the dashboard.

**Scope:** Backend auth module (embed token service, endpoints); frontend auth flow, Settings UI; nginx CSP headers.

## Requirements

1. **Token applies to all** — Works for both logged-in and non-logged-in users; no user existence check.
2. **Seamless for logged-in users** — No extra login step when opening via Google Site embed.
3. **Fallback for non-users** — Users without an HSE account can open the embedded page and see the login form to log in or sign up.
4. **Token not bound to user** — The embed token authorizes the embed context only; it does not identify a user. User existence in the system is ignored.
5. **Restricted embedding** — The dashboard cannot be embedded from sites other than Google Sites (CSP `frame-ancestors`).
6. **No expiry** — Embed token does not expire; valid until secret rotation or revocation.

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
Dashboard  Login form (non-users can log in)
```

## Backend Implementation

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/embed/generate | JWT (admin) | Generate embed token and full URL |
| POST | /auth/embed/validate | Public | Validate embed token |

### DTOs

- **Generate response:** `{ embedUrl: string }`
- **Validate request:** `{ embedToken: string }`
- **Validate response:** `{ valid: boolean }`

### Service

- `EmbedTokenService`:
  - `generateToken(options?: { siteId?: string }): string`
  - `validateToken(token: string): { valid: boolean }`

### URL Generation

- `embedUrl = ${FRONTEND_URL}?embed_token=${token}`

## Frontend Implementation

### Auth Flow Changes

1. On mount, read `embed_token` from `window.location.search`.
2. If `embed_token` present:
   - Call `POST /auth/embed/validate` (no user lookup; token applies to both logged and non-logged users).
   - If valid: allow page load; do not redirect to login when no JWT (show login form for non-users).
   - If invalid: in iframe → show "Embed not authorized"; else → redirect to login.
3. If no `embed_token`: keep current behavior (require JWT or redirect to login).

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

- **Backend:** JWT_SECRET (existing), AuthController, AuthModule, EmbedTokenService.
- **Frontend:** AuthProvider, api.ts, SettingsPage.
- **Deployment:** nginx config (CSP frame-ancestors).
