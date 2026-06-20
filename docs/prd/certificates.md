# PRD: Certificate Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Certificate Management module covers certificate categories (master data with type: personnel license/certificate, equipment calibration/installation/operational permit), certificates (CRUD, linked to category and personnel/department), renewals (create renewal request, list renewals, update renewal status), and reminders (list for a certificate). Certificate list and single-record access are data-scoped (self/department/super). List endpoints support an `options` bypass where applicable.

**Scope:** Backend `certificates` module; frontend `certificates` module.

## Key Features

- **Certificate categories:** CRUD; list with pagination, isActive, search, certificateType filter (options bypass). Types: PERSONNEL_LICENSE, PERSONNEL_CERTIFICATE, EQUIPMENT_CALIBRATION, EQUIPMENT_INSTALLATION, EQUIPMENT_OPERATIONAL_PERMIT.
- **Certificates:** Create, list (paginated, filters; options bypass; data-scoped), read, update, soft delete. Certificate links to category, department, personnel (user), expiry, etc. Get renewals (GET :id/renewals), create renewal (POST :id/renewals), update renewal (PATCH renewals/:id). Get reminders (GET :id/reminders).
- **Renewals:** Renewal requests per certificate; list and update status (e.g. approved, rejected).
- **Reminders:** Reminder records per certificate (e.g. for expiry notifications); read-only list per certificate.

## User Roles & Permissions

- **certificate-category:create/list/read/update/delete** — categories CRUD (list has options bypass).
- **certificate:create/list/read/update/delete** — certificates CRUD (list has options bypass; list and single-record data-scoped).
- Permissions for renewals and reminders follow certificate read/update where applicable.

Access to certificate records is further restricted by DataScopeGuard (user sees only own, department’s, or all records depending on role data level).

## User Stories

- As an admin, I can manage certificate categories by type so that certificates are classified consistently.
- As a user, I can create and manage certificates (personnel or equipment, category, department, expiry) so that compliance is tracked.
- As a user, I can request a renewal for a certificate and see renewal history so that validity is extended and auditable.
- As a user, I can see reminders for a certificate so that I am alerted before expiry.
- As a user with data scope, I see only certificates I am allowed to access (self/department/all).

## Key Workflows

1. **Category setup:** Create certificate categories (name, code, certificateType) → use in certificate form (options list).
2. **Certificate lifecycle:** Create certificate (category, personnel/department, validity, etc.) → list/filter certificates (data-scoped) → when nearing expiry, create renewal (POST :id/renewals) → approver updates renewal status (PATCH renewals/:id). View reminders (GET :id/reminders).
3. **List certificates:** List filtered by category, department, expiry, etc.; results data-scoped by current user.

## Data Model Summary

- **CertificateCategory:** id, name, code, certificateType (enum), description?, isActive. Has many Certificate.
- **Certificate:** id, categoryId, departmentId?, personnelId? (user), validity/expiry fields, status?, createdBy?, etc. Relations: category, department, personnel (User). Has many CertificateRenewal, reminder records. Data-scoped by department/personnel/creator.
- **CertificateRenewal:** id, certificateId, status, requestedAt?, processedAt?, etc. Used for renewal workflow.
- **Certificate reminder:** Entity (or computed) for expiry reminders; returned by GET :id/reminders.

## API Endpoints Summary

| Area | Method | Path | Permission | Description |
|------|--------|------|------------|-------------|
| Categories | GET | /certificates/categories | certificate-category:list | List (options bypass) |
| Categories | GET | /certificates/categories/:id | certificate-category:read | Get one |
| Categories | POST | /certificates/categories | certificate-category:create | Create |
| Categories | PATCH | /certificates/categories/:id | certificate-category:update | Update |
| Categories | DELETE | /certificates/categories/:id | certificate-category:delete | Soft delete |
| Certificates | GET | /certificates | certificate:list | List (options bypass; data-scoped) |
| Certificates | GET | /certificates/:id | certificate:read | Get one (data-scoped) |
| Certificates | POST | /certificates | certificate:create | Create |
| Certificates | PATCH | /certificates/:id | certificate:update | Update |
| Certificates | DELETE | /certificates/:id | certificate:delete | Soft delete |
| Renewals | GET | /certificates/:id/renewals | certificate:read | List renewals |
| Renewals | POST | /certificates/:id/renewals | certificate:update | Create renewal |
| Renewals | PATCH | /certificates/renewals/:id | certificate:update | Update renewal status |
| Reminders | GET | /certificates/:id/reminders | certificate:read | List reminders |

## Frontend Pages & Components

- **Categories:** CertificateCategoriesPage, CreateCertificateCategoryPage, EditCertificateCategoryPage, CertificateCategoryForm.
- **Certificates:** CertificatesPage, CertificateDetailPage, CreateCertificatePage, EditCertificatePage, CertificateForm.
- **Hooks:** useCertificates.
- **Services:** certificateService, certificateCategoryService.

Routes: /certificates (list), /certificates/categories, create/edit/detail for categories and certificates.

## Dependencies

- **Backend:** Prisma (CertificateCategory, Certificate, CertificateRenewal, User, Department), DataScopeGuard for certificates, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, master-data for department/personnel options, core API. Data scope enforced by backend.

## Functional Requirements

- [FR-1] The system must support full CRUD for certificate categories, with `certificateType` enum (PERSONNEL_LICENSE, PERSONNEL_CERTIFICATE, EQUIPMENT_CALIBRATION, EQUIPMENT_INSTALLATION, EQUIPMENT_OPERATIONAL_PERMIT).
- [FR-2] The system must support full CRUD for certificates, each linked to a category, optional department, and optional personnel (user).
- [FR-3] Certificate list and single-record access must be data-scoped: users with SELF data level see only their own certificates; DEPARTMENT sees their department; SUPER sees all.
- [FR-4] The system must allow creating renewal requests per certificate and updating the renewal status (e.g. approved, rejected).
- [FR-5] The system must expose a read-only list of reminders per certificate for expiry notifications.
- [FR-6] Certificate soft-delete must set `isActive: false` and `deletedAt`; deleted certificates must be excluded from list responses.
- [FR-7] List endpoints for categories and certificates must support `options=true` bypass for dropdown use.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Soft-deleted and inactive certificates must be excluded from list and options responses.
- [NFR-3] All write operations must require a valid JWT and the corresponding `certificate*:*` permission.
- [NFR-4] Data-scope filtering must be enforced server-side via `DataScopeGuard`; the frontend must not filter locally.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Admin creates a certificate category with type EQUIPMENT_CALIBRATION | 201; category visible in list and accessible via options bypass |
| AC-2 | SELF-scoped user lists certificates | Only certificates where the user is the personnel or creator are returned |
| AC-3 | User creates a renewal request for a certificate | 201; renewal record linked to certificate; visible via `GET :id/renewals` |
| AC-4 | Admin updates renewal status to approved | 200; renewal status updated |
| AC-5 | User soft-deletes a certificate | `isActive: false` and `deletedAt` set; certificate excluded from list |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and data-scope enforcement
- [`approvals.md`](approvals.md) — master approval workflow system
