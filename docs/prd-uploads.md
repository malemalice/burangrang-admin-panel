# PRD: File Upload Management

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Upload module provides file upload (multipart), storage, and optional metadata (category, isPublic, expiresAt, metadata). Uploaded files are associated with a file category and optionally with an uploader (userId). List and get endpoints support filtering and optional public access for signed URLs. Used by other modules (incidents, inspections, certificates, work permits, etc.) to attach images and documents. Frontend provides ImageUpload component and uploadService.

**Scope:** Backend `uploads` module; frontend `uploads` module (services and ImageUpload component).

## Key Features

- **Upload:** POST upload (multipart/form-data: file, categoryId, isPublic?, expiresAt?, metadata?). Returns file record and URL. Storage provider configurable (local, S3, etc.).
- **List:** GET uploads with pagination, filter by categoryId, isPublic, uploadedBy, search (options bypass where implemented). Used by admins or for "my uploads" views.
- **Get one:** GET :id — return file metadata and/or redirect/signed URL for download. Public files may be served without auth per policy.
- **Update/Delete:** PATCH :id (metadata, isPublic, expiresAt), DELETE :id. Permissions: upload:update, upload:delete.

## User Roles & Permissions

- **upload:create** — upload file.
- **upload:list** — list file uploads (options bypass where implemented).
- **upload:read** — get file metadata and access URL.
- **upload:update** — update file metadata.
- **upload:delete** — delete file and record.

Public access: some endpoints or signed URLs may allow unauthenticated access for isPublic files (documented per endpoint).

## User Stories

- As a user, I can upload a file (image or document) with a category and optional metadata so that it can be attached to incidents, inspections, or other entities.
- As an admin, I can list and manage uploads (update metadata, delete) so that storage is controlled.
- As the system, I store files in a configurable provider (local/S3) and return stable URLs so that other modules can reference attachments.

## Key Workflows

1. **Upload from form:** User selects file in Incident/Inspection/Work permit form → frontend calls POST /uploads/upload with file and categoryId → backend stores file, returns record (id, url) → frontend saves url or id in entity (e.g. incident image URL).
2. **Display:** Entity detail page shows image/attachment URLs from upload service; GET /uploads/:id or direct URL used for display/download.
3. **List/manage:** Admin or user lists uploads (filter by category, user) → view/update/delete as needed.

## Data Model Summary

- **FileUpload (t_file_uploads or equivalent):** id, categoryId, fileUrl (or storage path), fileName, fileType?, isPublic, expiresAt?, metadata (JSON?), uploadedBy?, createdAt, updatedAt. Relation: FileCategory, User. File categories (m_file_categories or similar) define categoryId options. Storage provider (local, S3) configured in env; actual file stored in bucket or disk.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /uploads/upload | upload:create | Upload file (multipart: file, categoryId, isPublic, expiresAt, metadata) |
| GET | /uploads | upload:list | List (page, limit, categoryId, isPublic, uploadedBy, search; options bypass) |
| GET | /uploads/:id | upload:read | Get file record (and/or redirect to file URL) |
| PATCH | /uploads/:id | upload:update | Update metadata |
| DELETE | /uploads/:id | upload:delete | Delete file and record |

Optional: GET /uploads/categories for file category list (if exposed).

## Frontend Pages & Components

- **ImageUpload** — reusable component for selecting and uploading images (used in incident form, inspection form, etc.). Calls uploadService.uploadFile and returns URL to parent form.
- **uploadService** — uploadFile(file, categoryId, ...), getFileUrl(id), list, delete. No standalone "Uploads page" required for PRD; uploads are consumed by other modules. Optional admin page: list uploads, filter, delete.

## Dependencies

- **Backend:** Prisma (FileUpload, FileCategory), storage provider (local/S3), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass. Multer/FileInterceptor for multipart.
- **Frontend:** Core API, form components that need file attach (incidents, inspections, work permits, certificates). CategoryId must be known per context (e.g. incident-image, inspection-image).

## Functional Requirements

- [FR-1] The system must accept multipart file uploads with `file`, `categoryId`, optional `isPublic`, `expiresAt`, and `metadata` fields and return the created file record including a stable URL.
- [FR-2] The storage provider must be configurable via environment variables (local filesystem or S3-compatible).
- [FR-3] The system must support listing uploaded files with pagination and filters: `categoryId`, `isPublic`, `uploadedBy`, and search.
- [FR-4] The system must allow retrieving a single file record by ID, including its URL or a redirect to the stored file.
- [FR-5] The system must allow updating file metadata (`isPublic`, `expiresAt`, `metadata`) for files the user has permission to modify.
- [FR-6] The system must allow deleting a file record and its associated stored file.
- [FR-7] Public files (`isPublic: true`) must be accessible without authentication where the endpoint policy allows.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] All write operations must require a valid JWT and the corresponding `upload:*` permission.
- [NFR-3] The maximum accepted file size must be defined and enforced at the API level.
- [NFR-4] API responses must return within 2 seconds under normal load; file storage I/O may add additional latency for large files.
- [NFR-5] All UI components must support light and dark mode via semantic design tokens.
- [NFR-6] File URLs returned by the API must remain stable (not expire unless `expiresAt` is explicitly set).

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User uploads a JPEG with a valid categoryId | 201; file record returned with stable URL; file accessible at URL |
| AC-2 | User lists uploads filtered by `categoryId` | 200; only uploads in that category returned; pagination present |
| AC-3 | User marks a file `isPublic: true` and accesses its URL without a token | File content served without authentication |
| AC-4 | User deletes an upload | 200; file record removed; file no longer accessible via URL |
| AC-5 | Upload exceeds max file size | 413 or configured error; file not stored |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
