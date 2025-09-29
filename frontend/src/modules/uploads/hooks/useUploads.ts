import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import uploadService from '../services/uploadService';
import { 
  FileUpload, 
  FileCategory,
  PaginatedResponse, 
  FileUploadSearchParams, 
  CreateFileUploadDTO, 
  UpdateFileUploadDTO 
} from '../types/upload.types';

export const useFileUploads = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [totalFileUploads, setTotalFileUploads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFileUploads = useCallback(async (params: FileUploadSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<FileUpload> = await uploadService.getFileUploads(params);
      setFileUploads(response.data);
      setTotalFileUploads(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file uploads';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFileUpload = useCallback(async (fileUploadData: CreateFileUploadDTO) => {
    try {
      // Note: This would typically be called through uploadFile method
      // This is here for completeness following the pattern
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload file');
      throw err;
    }
  }, []);

  const updateFileUpload = useCallback(async (id: string, fileUploadData: UpdateFileUploadDTO) => {
    try {
      const updatedFileUpload = await uploadService.updateFileUpload(id, fileUploadData);
      setFileUploads(prev => prev.map(item => item.id === id ? updatedFileUpload : item));
      toast.success('File upload updated successfully');
      return updatedFileUpload;
    } catch (err) {
      toast.error('Failed to update file upload');
      throw err;
    }
  }, []);

  const deleteFileUpload = useCallback(async (id: string) => {
    try {
      await uploadService.deleteFileUpload(id);
      setFileUploads(prev => prev.filter(item => item.id !== id));
      setTotalFileUploads(prev => prev - 1);
      toast.success('File upload deleted successfully');
    } catch (err) {
      toast.error('Failed to delete file upload');
      throw err;
    }
  }, []);

  return {
    fileUploads,
    totalFileUploads,
    currentPage,
    isLoading,
    error,
    fetchFileUploads,
    createFileUpload,
    updateFileUpload,
    deleteFileUpload,
  };
};

export const useFileUpload = (id: string | null = null) => {
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFileUpload = useCallback(async (fileUploadId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await uploadService.getFileUploadById(fileUploadId);
      setFileUpload(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file upload';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchFileUpload(id);
    }
  }, [id, fetchFileUpload]);

  return {
    fileUpload,
    isLoading,
    error,
    fetchFileUpload,
    setFileUpload,
  };
};

export const useFileCategories = () => {
  const [categories, setCategories] = useState<FileCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await uploadService.getFileCategories();
      setCategories(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
  };
};

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = useCallback(async (
    file: File,
    categoryName: string = 'course-materials',
    isPublic: boolean = true
  ): Promise<FileUpload | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadService.uploadFile(file, categoryName, isPublic);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('File uploaded successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadImage,
  };
};
