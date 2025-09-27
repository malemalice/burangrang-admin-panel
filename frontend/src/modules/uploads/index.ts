/**
 * Upload module barrel exports
 * Following the TRD.md module structure template
 */

// Components
export * from './components';

// Services
export { default as uploadService } from './services/uploadService';

// Types
export type {
  // Core entity types
  FileUpload,
  FileCategory,
  FileUploadDTO,
  FileCategoryDTO,

  // CRUD operation types
  CreateFileUploadDTO,
  UpdateFileUploadDTO,

  // Form and UI types
  FileUploadFormData,
  FileUploadFilters,
  FileUploadSearchParams,
  ImageUploadProps,
  ImagePreviewProps,

  // Common shared types
  PaginatedResponse,
  PaginationParams,
} from './types/upload.types';

// Hooks
export {
  useFileUploads,
  useFileUpload,
  useFileCategories,
  useImageUpload,
} from './hooks/useUploads';
