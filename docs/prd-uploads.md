# PRD: File Upload Management

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
