# PRD: Authentication & Authorization

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Authentication & Authorization module provides secure access to the HSE Dashboard. It supports email/password login, Google OAuth, JWT-based session management with refresh tokens, and password reset via email. Authorization is enforced via JWT validation and role-based access (RBAC) with optional permission checks on protected routes.

**Scope:** Backend `auth` module; frontend core auth (login, reset-password, auth context, protected routes).

## Key Features

- Email/password login with bcrypt validation
- Google OAuth (initiate and callback with redirect to frontend and tokens in query)
- JWT access token (1 hour) and refresh token (stored in DB, used for session extension)
- Logout (invalidates refresh token; requires `auth:logout` permission)
- Signup (public registration)
- Forgot password (sends reset link via mail service)
- Reset password (token-based, public)
- Auth context on frontend with login/logout and token persistence (localStorage)
- Automatic token refresh and redirect to last visited URL after login
- Protected routes: unauthenticated users redirect to `/login`

## User Roles & Permissions

- **Public (unauthenticated):** Can access `/login`, `/reset-password`, and call `POST /auth/login`, `POST /auth/refresh`, `POST /auth/signup`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/google`, `GET /auth/google/callback`.
- **Authenticated:** All other routes require valid JWT. `POST /auth/logout` requires permission `auth:logout`.
- **Inactive users:** Login is rejected with "Account is inactive" message.

## User Stories

- As a user, I can log in with email and password so that I can access the dashboard.
- As a user, I can log in with Google so that I can use SSO.
- As a user, I can request a password reset so that I can regain access if I forget my password.
- As a user, I can reset my password using the link in the email so that I can set a new password.
- As a user, I can log out so that my session is invalidated.
- As an authenticated user, I am redirected to my last visited URL after login when applicable.

## Key Workflows

1. **Login (email/password):** User submits email and password → backend validates user (exists, active, password match) → returns accessToken, refreshToken, user (id, email, firstName, lastName, role, permissions) → frontend stores tokens and user, redirects to last visited URL or dashboard.
2. **Google OAuth:** User clicks Google login → `GET /auth/google` redirects to Google → after consent, `GET /auth/google/callback` receives user → backend generates JWT pair → redirects to frontend `/auth/callback?accessToken=...&refreshToken=...` → frontend stores tokens and user.
3. **Token refresh:** Frontend checks token validity; when needed, calls `POST /auth/refresh` with refreshToken → backend validates refresh token in DB and issues new access token (and optionally new refresh token) → frontend updates stored tokens.
4. **Forgot password:** User enters email → `POST /auth/forgot-password` → backend generates reset token, stores hash, sends email with link → user sees success message.
5. **Reset password:** User opens link with token, enters new password → `POST /auth/reset-password` with token and new password → backend validates token and updates password → user can log in with new password.
6. **Logout:** User clicks logout → `POST /auth/logout` (with JWT) → backend deletes refresh token for user → frontend clears tokens and user, redirects to login.

## Data Model Summary

- **User** (from Prisma): id, email, password (nullable for OAuth), firstName, lastName, isActive, roleId, etc. Linked to Role.
- **Role:** id, name, code, description, isActive; has many Permissions (many-to-many) and Users.
- **RefreshToken:** id, userId, token (hashed), expiresAt; used to validate refresh requests and invalidate on logout.
- **Password reset:** Token generated and stored (e.g. in user or dedicated table) with expiry; used once for reset.

## API Endpoints Summary

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /auth/login | Public | Login with email/password; returns tokens and user |
| POST | /auth/refresh | Public | Exchange refreshToken for new access token |
| POST | /auth/logout | JWT + auth:logout | Invalidate refresh token for current user |
| GET | /auth/google | Public | Initiate Google OAuth |
| GET | /auth/google/callback | Public | OAuth callback; redirects to frontend with tokens |
| POST | /auth/signup | Public | Register new user; returns tokens and user |
| POST | /auth/forgot-password | Public | Request password reset email |
| POST | /auth/reset-password | Public | Reset password with token |

## Frontend Pages & Components

- **Login** (`core/pages/Login.tsx`): Email/password form, "Forgot password" flow, optional Google login link, app name from settings.
- **ResetPassword** (`core/pages/ResetPassword.tsx`): Form to enter new password (token from URL).
- **Auth callback:** Handles `/auth/callback` (e.g. from Google redirect); reads tokens from query, stores in localStorage, sets user, redirects to app.
- **AuthProvider** (`core/lib/auth.tsx`): Context providing login, logout, user, isAuthenticated, isLoading; token persistence and refresh logic; last-visited-URL save/restore.
- **ProtectedRoute** (`core/lib/auth.tsx`): Wraps protected routes; redirects to `/login` if not authenticated.

## Dependencies

- **Backend:** Mail module (for forgot-password and verification emails), Prisma (User, Role, RefreshToken), JwtModule, Passport (JWT and Google strategies).
- **Frontend:** Settings module (useAppName for login page), core API client (auth endpoints, token attachment for protected requests).

## Functional Requirements

- [FR-1] The system must support email/password login and return a JWT access token (1 hour) and a refresh token stored in the database.
- [FR-2] The system must support Google OAuth login; after consent, the backend must redirect the frontend to `/auth/callback` with tokens in query parameters.
- [FR-3] The system must provide a public signup endpoint for self-registration.
- [FR-4] The system must support forgot-password: accept an email, generate a reset token, and send a reset link via email.
- [FR-5] The system must support reset-password: validate the reset token and update the user's password.
- [FR-6] The system must support logout: validate JWT and invalidate the corresponding refresh token in the database.
- [FR-7] The system must support token refresh: accept a valid refresh token and return a new access token.
- [FR-8] Inactive users must be rejected at login with a clear error message.
- [FR-9] All protected routes must require a valid JWT; unauthenticated requests must return 401.

## Non-Functional Requirements

- [NFR-1] Access tokens must expire in 1 hour; refresh tokens must have a defined expiry.
- [NFR-2] Passwords must be stored as bcrypt hashes; plaintext passwords must never be stored or logged.
- [NFR-3] Reset tokens must be single-use and expire after a defined period.
- [NFR-4] All auth endpoints must be rate-limited to mitigate brute-force attacks.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User logs in with valid email and password | 200; `accessToken`, `refreshToken`, and user object returned |
| AC-2 | User logs in with wrong password | 401; error message returned; no tokens issued |
| AC-3 | Inactive user attempts login | 401; "Account is inactive" message |
| AC-4 | User initiates Google OAuth | Redirect to Google consent; on success, redirect to `/auth/callback?accessToken=...` |
| AC-5 | User calls forgot-password with valid email | 200; reset email sent; token stored |
| AC-6 | User resets password with valid token | 200; new password accepted; token invalidated |
| AC-7 | User calls `POST /auth/refresh` with valid refresh token | 200; new access token returned |
| AC-8 | User calls `POST /auth/logout` | 200; refresh token deleted; subsequent refresh attempts fail |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`prd-authorization.md`](prd-authorization.md) — business requirements for the authorization model
