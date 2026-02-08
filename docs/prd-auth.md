# PRD: Authentication & Authorization

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
