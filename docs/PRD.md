# Product Requirements Document (PRD)
## Burangrang Admin Panel

**Version**: 1.0
**Status**: Active
**Owner**: Development Team

---

## 1. Product Overview

The **Burangrang Admin Panel** is a full-stack internal web application that centralises management of an organisation's core operational data. It provides a role-gated interface for administrators to manage users, organisational structure, navigation, approval workflows, file assets, and system configuration.

**Stack**: NestJS (REST API, port 3000) + React/Vite (SPA, port 5173) + PostgreSQL + Prisma ORM.

---

## 2. Goals

| Goal | Success Metric |
|------|----------------|
| Single source of truth for user and role management | All user provisioning done through the panel |
| Enforce RBAC across all internal systems | Zero unauthorised access to guarded resources |
| Digitise approval chains | Approval workflows configurable without code changes |
| Audit-ready system | Every write operation traceable to an actor |

---

## 3. Users & Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full read/write access. Can manage roles, permissions, and system settings. |
| `ADMIN` | Broad read/write access. Cannot manage roles or system-level settings. |
| `MANAGER` | Read access to most resources; can create/approve within scope. |
| `USER` | Self-service only (view own profile, upload files). |

Roles are stored in `m_roles`. Permissions are stored in `m_permissions` and linked via `_PermissionToRole`.

---

## 4. Core Modules

### 4.1 Authentication

- JWT-based login with access + refresh token pair.
- Refresh tokens persisted in `t_refresh_tokens`.
- Forgot-password flow: generates reset token and sends email via Mail module.
- Protected routes: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` chain.
- Public routes decorated with `@Public()`.

### 4.2 User Management

Manages the `t_users` table.

| Field | Notes |
|-------|-------|
| email | Unique login identifier |
| firstName / lastName | Display name |
| roleId | Required; links to `m_roles` |
| officeId | Required; links to `m_offices` |
| departmentId | Optional; links to `m_departments` |
| jobPositionId | Optional; links to `m_job_positions` |
| isActive | Soft-delete mechanism |

Key endpoints: CRUD + `GET /users/me` (current user profile).

### 4.3 Role & Permission Management

- Roles (`m_roles`) group permissions and control menu visibility.
- Permissions (`m_permissions`) are fine-grained action gates (e.g., `user:create`).
- Many-to-many relationship via `_PermissionToRole`.
- Default permissions are configuration-driven (not hard-coded).

### 4.4 Navigation / Menu Management

- Menus (`m_menus`) support unlimited parent-child hierarchy.
- Each menu item carries: `name`, `path`, `icon`, `parentId?`, `order`.
- Role-menu access via `_MenuToRole` (many-to-many).
- `GET /menus/sidebar` returns menus filtered by the authenticated user's role.
- `GET /menus/stats` and `PUT /menus/order` available to admins.

### 4.5 Organisational Structure

Three master-data entities define the org chart:

| Entity | Table | Key Fields |
|--------|-------|------------|
| Office | `m_offices` | name, code, parentId (self-ref hierarchy) |
| Department | `m_departments` | name, code, description |
| Job Position | `m_job_positions` | name, code, level, description |

`GET /offices/hierarchy` returns a fully nested office tree.

### 4.6 Approval Workflow

Two-layer model:

- **MasterApproval** (`m_approval`): template per business entity (e.g., `LEAVE_REQUEST`). Contains ordered MasterApprovalItems.
- **MasterApprovalItem** (`m_approval_item`): a single step in the template, linked to a job position and department.
- **Approval** (`t_approvals`): runtime approval instance with status (`PENDING` / `APPROVED` / `REJECTED`) and audit fields (`createdBy`).

### 4.7 File Upload

- Upload endpoint: `POST /uploads/upload` (multipart form).
- Categories (`m_file_categories`) enforce MIME type + size limits.
- Public files: `GET /uploads/public/:id` (no auth).
- Private files: `GET /uploads/private/:accessToken` (token-based, no auth).
- Storage abstraction (`StorageService`) supports local now; cloud migration path defined.
- Access audit trail in `t_file_access_logs`.

### 4.8 Mail / Email Templates

- Transporter configured from `m_settings` DB keys with `.env` fallbacks.
- Templates (`m_email_templates`) store Handlebars subject + body; editable at runtime.
- Typed service methods: `sendVerificationEmail`, `sendPasswordResetEmail`, `sendTeamInvitationEmail`, `sendPasswordChangeNotification`.
- Generic: `sendTemplatedMail({ email, template, context })`.
- Email failures are logged but never block critical flows.

### 4.9 System Settings

- Key-value store in `m_settings`.
- Used for mail config, theme preferences, and other runtime tunables.
- Managed via `SettingsHelperService`.

---

## 5. Technical Constraints

| Constraint | Detail |
|------------|--------|
| Database naming | `m_` prefix for master data, `t_` prefix for transactional data |
| ORM | Prisma only — no raw SQL in feature modules |
| Auth flow | Always `JwtAuthGuard` + `RolesGuard` on controllers; `@Public()` opt-out |
| Error handling | `ErrorHandlingService` — no direct `NotFoundException` throws in services |
| DTO mapping | `DtoMapperService` — no manual `class-transformer` in services |
| API style | RESTful; paginated list responses with `{ data, meta }` envelope |
| Frontend forms | React Hook Form + Zod; no other form libraries |
| Frontend tables | Shared `DataTable` component — no module-specific table components |
| Frontend state | Module-local state preferred; Zustand for complex shared state |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Security | HTTPS in production; helmet; rate-limiting (100 req/15 min) |
| Accessibility | Radix UI primitives; ARIA labels; keyboard navigation |
| Performance | < 100 KB bundle per frontend module; no unnecessary re-renders |
| Theming | Light/Dark mode; user-selectable accent colour (6 options) |
| Responsiveness | Mobile-aware layouts using Tailwind responsive prefixes |
| Documentation | All API endpoints documented via Swagger at `/api` |

---

## 7. Out of Scope

- Multi-tenancy
- Real-time features (websockets, SSE)
- Mobile native applications
- Payment processing
- Public-facing customer portal

---

## 8. Reference Documents

| Document | Location |
|----------|----------|
| Backend TRD | `backend/docs/TRD.md` |
| Database ERD | `backend/docs/ERD.md` |
| ERD Quick Reference | `backend/docs/ERD-QUICK-REFERENCE.md` |
| Frontend TRD | `frontend/docs/TRD.md` |
| Database Schema | `backend/prisma/schema.prisma` |
| API Docs (live) | `http://localhost:3000/api` |
