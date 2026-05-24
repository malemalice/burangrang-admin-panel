# PRD: Application Settings

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Application Settings module provides key-value or structured application configuration. It supports CRUD for settings (create, list, read, update, delete), app-specific endpoints (GET app for public app name; PATCH app-name for authenticated update), and optional key-based get/update. Settings keys are centralized in constants (e.g. SETTINGS_KEYS). List endpoint supports an `options` bypass where applicable. Used by frontend for app name (login page, branding).

**Scope:** Backend `settings` module; frontend `settings` module.

## Key Features

- Create, list (paginated, filter by key/search; options bypass), read by ID or by key, update by ID or by key (e.g. app.name), delete. App name: GET /settings/app (public) returns { name }; PATCH /settings/app-name (body: name) updates app.name. Used for branding (login, sidebar).
- Settings are key-value (or key + value + type). Keys like app.name, mail.*, etc. defined in constants.

## User Roles & Permissions

- **setting:create** — create setting.
- **setting:list** — list settings (options bypass).
- **setting:read** — get setting by ID or by key.
- **setting:update** — update setting (including app-name).
- **setting:delete** — delete setting.
- GET /settings/app is Public (no auth) for login page and public branding.

## User Stories

- As an admin, I can view and edit application settings (e.g. app name) so that branding and behavior are configurable.
- As the system, I expose app name publicly so that the login page and public footer can display it without authentication.

## Key Workflows

1. **Branding:** Admin opens Settings/Application → updates app name (PATCH app-name) → frontend (e.g. login page) loads GET /settings/app to show name.
2. **General settings:** Admin lists settings → create/update/delete key-value pairs as needed. Other modules (mail, features) may read settings by key at runtime.

## Data Model Summary

- **Setting (t_settings or m_settings):** id, key (unique), value (string or JSON), type?, description?, createdAt, updatedAt. Keys from SETTINGS_KEYS or similar.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /settings | setting:create | Create setting |
| GET | /settings | setting:list | List (options bypass) |
| GET | /settings/app | Public | Get app settings (e.g. name) |
| PATCH | /settings/app-name | setting:update | Update app name |
| GET | /settings/:id | setting:read | Get by ID |
| GET | /settings/key/:key | setting:read | Get by key (if implemented) |
| PATCH | /settings/:id | setting:update | Update by ID |
| DELETE | /settings/:id | setting:delete | Delete |

## Frontend Pages & Components

- **SettingsPage** — user-facing settings (e.g. profile, preferences).
- **SettingsManagementPage** — admin application settings (list, edit app name and other keys). Under /settings/application or similar.
- **useSettings / useAppName** — hooks to read app name (from GET /settings/app) for login page and layout.

Routes: /settings, /settings/application (admin).

## Dependencies

- **Backend:** Prisma (Setting), SETTINGS_KEYS constants, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass, Public decorator.
- **Frontend:** Auth, core API. Login page and layout use app name from settings.

## Functional Requirements

- [FR-1] The system must support full CRUD for settings as key-value records; keys must be unique.
- [FR-2] The system must provide a public endpoint (`GET /settings/app`) that returns the app name without authentication.
- [FR-3] The system must provide an authenticated endpoint (`PATCH /settings/app-name`) for updating the app name.
- [FR-4] The system must support reading a setting by key (`GET /settings/key/:key`) in addition to reading by ID.
- [FR-5] The list endpoint must support `options=true` bypass for dropdown use.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] All write operations (except `GET /settings/app`) must require a valid JWT and the corresponding `setting:*` permission.
- [NFR-3] `GET /settings/app` must be publicly accessible with no authentication required.
- [NFR-4] API responses must return within 2 seconds under normal load.
- [NFR-5] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Unauthenticated request to `GET /settings/app` | 200; returns `{ name: "..." }` with the current app name |
| AC-2 | Admin updates app name via `PATCH /settings/app-name` | 200; `GET /settings/app` returns the new name |
| AC-3 | Admin creates a new setting with a unique key | 201; setting readable by key via `GET /settings/key/:key` |
| AC-4 | Admin deletes a setting | 200; setting no longer returned in list |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
