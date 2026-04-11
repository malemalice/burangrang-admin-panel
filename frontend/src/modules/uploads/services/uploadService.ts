import api from '@/core/lib/api';
import { FileUpload, FileCategory, PaginatedResponse, PaginationParams } from '../types/upload.types';

// Data transformation functions
const mapFileUploadDtoToFileUpload = (fileUploadDto: any): FileUpload => ({
  id: fileUploadDto.id,
  originalName: fileUploadDto.originalName,
  storedName: fileUploadDto.storedName,
  mimeType: fileUploadDto.mimeType,
  size: fileUploadDto.size,
  hash: fileUploadDto.hash,
  storageProvider: fileUploadDto.storageProvider,
  categoryId: fileUploadDto.categoryId,
  uploadedBy: fileUploadDto.uploadedBy,
  isPublic: fileUploadDto.isPublic,
  accessToken: fileUploadDto.accessToken,
  expiresAt: fileUploadDto.expiresAt,
  metadata: fileUploadDto.metadata,
  isActive: fileUploadDto.isActive,
  createdAt: fileUploadDto.createdAt,
  updatedAt: fileUploadDto.updatedAt,
  downloadUrl: fileUploadDto.downloadUrl,
  fileExtension: fileUploadDto.fileExtension,
  isExpired: fileUploadDto.isExpired,
  category: fileUploadDto.category,
  uploader: fileUploadDto.uploader,
});

const mapFileCategoryDtoToFileCategory = (fileCategoryDto: any): FileCategory => ({
  id: fileCategoryDto.id,
  name: fileCategoryDto.name,
  allowedTypes: fileCategoryDto.allowedTypes,
  maxSize: fileCategoryDto.maxSize,
  isActive: fileCategoryDto.isActive,
  createdAt: fileCategoryDto.createdAt,
  updatedAt: fileCategoryDto.updatedAt,
});

const uploadService = {
  // GET all file uploads with pagination
  getFileUploads: async (params: PaginationParams): Promise<PaginatedResponse<FileUpload>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/uploads?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapFileUploadDtoToFileUpload),
      meta: response.data.meta
    };
  },

  // GET single file upload
  getFileUploadById: async (id: string): Promise<FileUpload> => {
    const response = await api.get(`/uploads/${id}`);
    return mapFileUploadDtoToFileUpload(response.data);
  },

  // GET file categories
  getFileCategories: async (): Promise<FileCategory[]> => {
    const response = await api.get('/uploads/categories');
    return response.data.map(mapFileCategoryDtoToFileCategory);
  },

  // GET category by name
  getCategoryByName: async (name: string): Promise<FileCategory | null> => {
    const categories = await uploadService.getFileCategories();
    return categories.find(cat => cat.name === name) || null;
  },

  // UPLOAD file
  uploadFile: async (
    file: File,
    categoryName: string,
    isPublic: boolean = true,
    expiresAt?: Date,
    metadata?: any
  ): Promise<FileUpload> => {
    // Get category by name to get the ID
    const category = await uploadService.getCategoryByName(categoryName);
    
    if (!category) {
      throw new Error(`Category '${categoryName}' not found`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', category.id);
    formData.append('isPublic', isPublic.toString());
    
    if (expiresAt) {
      formData.append('expiresAt', expiresAt.toISOString());
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await api.post('/uploads/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return mapFileUploadDtoToFileUpload(response.data);
  },

  // UPDATE file upload
  updateFileUpload: async (id: string, updateData: Partial<FileUpload>): Promise<FileUpload> => {
    const response = await api.patch(`/uploads/${id}`, updateData);
    return mapFileUploadDtoToFileUpload(response.data);
  },

  // DELETE file upload
  deleteFileUpload: async (id: string): Promise<void> => {
    await api.delete(`/uploads/${id}`);
  },

  // GET public file URL
  getPublicFileUrl: (fileId: string): string => {
    const mediaUrl = import.meta.env.VITE_MEDIA_URL || 'http://localhost:3000';
    return `${mediaUrl}/uploads/public/${fileId}`;
  },

  // GET private file URL
  getPrivateFileUrl: (accessToken: string): string => {
    const mediaUrl = import.meta.env.VITE_MEDIA_URL || 'http://localhost:3000';
    return `${mediaUrl}/uploads/private/${accessToken}`;
  },

  // Ensure URL is full URL (convert relative to absolute)
  ensureFullUrl: (url: string): string => {
    if (url.startsWith('http')) {
      return url;
    }
    const mediaUrl = import.meta.env.VITE_MEDIA_URL || 'http://localhost:3000';
    return `${mediaUrl}${url.startsWith('/') ? url : `/${url}`}`;
  },
};

export default uploadService;
