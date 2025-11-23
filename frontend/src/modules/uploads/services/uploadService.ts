import api from '@/core/lib/api';

export interface FileCategory {
  id: string;
  name: string;
  allowedMimeTypes: string[];
  maxSize: number;
  isActive: boolean;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  categoryId: string;
  isPublic: boolean;
  createdAt: string;
}

const uploadService = {
  // Get all file categories
  getCategories: async (): Promise<FileCategory[]> => {
    const response = await api.get('/uploads/categories');
    return response.data;
  },

  // Get category by name
  getCategoryByName: async (name: string): Promise<FileCategory | null> => {
    const categories = await uploadService.getCategories();
    return categories.find(cat => cat.name === name) || null;
  },

  // Upload file with multipart form data
  uploadFile: async (
    file: File,
    categoryId: string,
    isPublic: boolean = false,
    expiresAt?: string,
    metadata?: any,
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    formData.append('isPublic', isPublic.toString());
    
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await api.post('/uploads/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get public file URL
  getPublicFileUrl: (fileId: string): string => {
    return `${api.defaults.baseURL}/uploads/public/${fileId}`;
  },

  // Get private file URL with access token
  getPrivateFileUrl: (accessToken: string): string => {
    return `${api.defaults.baseURL}/uploads/private/${accessToken}`;
  },
};

export default uploadService;

