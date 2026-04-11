// Upload module types following TRD patterns

export type StorageProviderKind = 'local' | 'aws-s3';

// Core entity types
export interface FileUpload {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  hash: string;
  storageProvider: StorageProviderKind;
  categoryId: string;
  uploadedBy: string;
  isPublic: boolean;
  accessToken: string;
  expiresAt?: Date;
  metadata?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed properties
  downloadUrl: string;
  fileExtension: string;
  isExpired: boolean;
  
  // Relations
  category?: FileCategory;
  uploader?: any;
}

export interface FileCategory {
  id: string;
  name: string;
  allowedTypes: string[];
  maxSize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTO types (matching backend)
export interface FileUploadDTO {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  hash: string;
  storageProvider: StorageProviderKind;
  categoryId: string;
  uploadedBy: string;
  isPublic: boolean;
  accessToken: string;
  expiresAt?: Date;
  metadata?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  downloadUrl: string;
  fileExtension: string;
  isExpired: boolean;
  category?: FileCategoryDTO;
  uploader?: any;
}

export interface FileCategoryDTO {
  id: string;
  name: string;
  allowedTypes: string[];
  maxSize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// CRUD operation types
export interface CreateFileUploadDTO {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  hash: string;
  storageProvider: StorageProviderKind;
  categoryId: string;
  isPublic: boolean;
  expiresAt?: Date;
  metadata?: any;
}

export interface UpdateFileUploadDTO {
  originalName?: string;
  isPublic?: boolean;
  expiresAt?: Date;
  metadata?: any;
  isActive?: boolean;
}

// Form and UI types
export interface FileUploadFormData {
  file: File;
  categoryId: string;
  isPublic: boolean;
  expiresAt?: Date;
  metadata?: any;
}

export interface FileUploadFilters {
  isActive?: boolean;
  isPublic?: boolean;
  storageProvider?: StorageProviderKind;
  categoryId?: string;
  uploadedBy?: string;
  mimeType?: string;
}

export interface FileUploadSearchParams extends PaginationParams {
  search?: string;
  filters?: FileUploadFilters;
}

// Common shared types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Upload component specific types
export interface ImageUploadProps {
  value?: string; // Current image URL or file ID
  onChange: (value: string | null) => void;
  categoryName?: string; // Default to course-materials
  isPublic?: boolean; // Default to true for course thumbnails
  maxSize?: number; // Override max size
  allowedTypes?: string[]; // Override allowed types
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}
