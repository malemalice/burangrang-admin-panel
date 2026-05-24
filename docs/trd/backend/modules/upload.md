> [← Modules Index](./index.md) · [← Backend TRD Index](../index.md)
>
> *File upload with category-based MIME / size validation, public + private (token) access, storage abstraction (LocalStorageService now, cloud-ready), SHA256 dedup, audit trail.*

## Upload Module

### Overview

The Upload Module provides a comprehensive file management system for handling uploads of images, PDFs, and videos with support for public and private access control. It is designed with a storage abstraction layer to facilitate easy migration to cloud storage services.

### Key Features

1. **File Upload and Management**
   - Upload files via `POST /uploads/upload` with multipart form data
   - CRUD operations for file metadata
   - File deduplication using SHA256 hash

2. **Storage Abstraction**
   - `StorageService` interface for storage operations
   - `LocalStorageService` for local file system storage (current implementation)
   - `StorageFactoryService` for selecting storage providers
   - Ready for cloud storage integration (AWS S3, Google Cloud, Azure)

3. **Access Control**
   - Public files accessible via `GET /uploads/public/:id`
   - Private files accessible via `GET /uploads/private/:accessToken` with unique tokens
   - Role-based access to upload and management endpoints
   - Complete access logging for audit trail

4. **File Categories and Validation**
   - Predefined categories with specific MIME types and size limits:
     - `profile-images` (5MB max)
     - `documents` (50MB max)
     - `course-materials` (100MB max)
     - `system-assets` (10MB max)
     - `videos` (500MB max)
     - `audio` (50MB max)
   - File type and size validation based on category

### Database Schema

#### Master Data Tables
- `m_file_storage_providers` - Configuration for storage providers (local, AWS S3, etc.)
- `m_file_categories` - File category definitions with allowed MIME types and size limits

#### Transactional Data Tables
- `t_file_uploads` - Metadata for uploaded files including access control settings
- `t_file_access_logs` - Audit trail for file access with IP and user agent information

### Module Structure

```
backend/src/modules/uploads/
├── dto/
│   ├── file-upload.dto.ts
│   ├── create-file-upload.dto.ts
│   ├── update-file-upload.dto.ts
│   ├── find-file-uploads.dto.ts
│   ├── file-category.dto.ts
│   └── file-storage-provider.dto.ts
├── uploads.controller.ts
├── uploads.service.ts
└── uploads.module.ts
```

### Storage Services

```
backend/src/shared/services/
├── storage.service.ts (interface)
├── local-storage.service.ts
└── storage-factory.service.ts
```

### API Endpoints

#### File Upload
- `POST /uploads/upload` - Upload file with category and access control settings
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- **Parameters**: 
  - `file`: The file to upload (multipart form data)
  - `categoryId`: UUID of the file category
  - `isPublic`: Boolean indicating if the file is public (default: false)
  - `expiresAt`: Optional expiration date for the file access
  - `metadata`: Optional additional metadata as JSON

#### File Management
- `GET /uploads` - List files with pagination and filtering
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER
- `GET /uploads/:id` - Get file metadata by ID
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `PATCH /uploads/:id` - Update file metadata
- **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER
- `DELETE /uploads/:id` - Delete file
- **Required Roles**: SUPER_ADMIN

#### File Access
- `GET /uploads/public/:id` - Download public file by ID
- **Access**: Public (no authentication required)
- `GET /uploads/private/:accessToken` - Download private file by access token
- **Access**: Public (no authentication required, token-based)

#### Public Product Access
- `GET /products/public` - Get published products (public access)
- **Access**: Public (no authentication required)
- **Parameters**: Same as regular products endpoint but only returns PUBLISHED and ACTIVE products
- **Use Case**: Frontend applications that need to display products without authentication

### Usage Examples

#### Upload a File
```bash
curl -X POST http://localhost:3000/uploads/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "categoryId=CATEGORY_ID" \
  -F "isPublic=false"
```

#### Download Public File
```bash
curl http://localhost:3000/uploads/public/FILE_ID
```

#### Download Private File
```bash
curl http://localhost:3000/uploads/private/ACCESS_TOKEN
```

### Cloud Migration Strategy

1. **Phase 1: Local Storage (Current)**
   - Local file system storage
   - Basic URL generation for access

2. **Phase 2: Cloud Storage (Future)**
   - Implement AWS S3, Google Cloud Storage, Azure Blob Storage services
   - Update `StorageFactoryService` to support provider selection
   - Migrate existing files to cloud storage

3. **Phase 3: Advanced Features (Future)**
   - CDN integration for improved performance
   - Image processing and resizing
   - Video streaming and transcoding capabilities
   - File versioning for change tracking

### Security Features

- **File Validation**: MIME type and size validation based on category
- **Access Control**: Role-based permissions for upload and management; token-based access for private files
- **Audit Trail**: Comprehensive logging of file access with user, IP, and user agent information
- **Deduplication**: SHA256 hash to prevent duplicate file storage

### Configuration

#### Environment Variables
```env
# Upload Configuration
UPLOAD_DIR=./uploads
PUBLIC_URL=http://localhost:3000

# AWS S3 (for future use)
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google Cloud (for future use)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET=your-bucket-name
GOOGLE_CLOUD_KEY_FILE=path/to/keyfile.json
```

### TRD Compliance

- **Module Structure**: Follows standard directory structure with DTOs, controller, service, and module files
- **Controller Pattern**: Uses required decorators (`@ApiTags`, `@ApiBearerAuth`, `@UseGuards`) and Swagger documentation
- **Service Pattern**: Injects necessary services (`PrismaService`, `ErrorHandlingService`, `DtoMapperService`) and uses standardized error handling and DTO mapping
- **DTO Pattern**: Implements proper validation, serialization, and documentation decorators
- **Security**: Implements role-based access control and public/private file access with token system
