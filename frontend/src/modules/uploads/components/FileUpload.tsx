import { useState, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import uploadService, { FileCategory } from '../services/uploadService';

interface FileUploadProps {
  value?: string;
  onChange: (value: string) => void;
  categoryName: string;
  isPublic?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  // If entityId is provided, upload immediately; otherwise, store file for later upload
  entityId?: string | null;
  // Callback when file is selected (for preview mode)
  onFileSelect?: (file: File | null) => void;
}

const FileUpload = ({
  value,
  onChange,
  categoryName,
  isPublic = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ],
  placeholder = 'Upload file',
  disabled = false,
  label,
  required = false,
  entityId,
  onFileSelect,
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load category on mount
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const cat = await uploadService.getCategoryByName(categoryName);
        setCategory(cat);
      } catch (error) {
        console.error('Failed to load file category:', error);
        toast.error('Failed to load file category');
      }
    };
    loadCategory();
  }, [categoryName]);

  // Update uploaded file name when value changes
  useEffect(() => {
    if (value) {
      // Extract filename from URL if possible, or use a default
      try {
        const url = new URL(value);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1] || 'Uploaded file';
        setUploadedFileName(fileName);
      } catch {
        // If not a valid URL, just show that a file is uploaded
        setUploadedFileName(value ? 'File uploaded' : null);
      }
    } else {
      setUploadedFileName(null);
    }
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setSelectedFile(file);

    // Upload file immediately if category is loaded
    if (category) {
      setIsUploading(true);
      try {
        const response = await uploadService.uploadFile(
          file,
          category.id,
          isPublic,
        );

        // Get the public URL
        const fileUrl = uploadService.getPublicFileUrl(response.id);
        setUploadedFileName(response.originalName || file.name);
        onChange(fileUrl);
        setSelectedFile(null);
        toast.success('File uploaded successfully');
      } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to upload file';
        toast.error(errorMessage);
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Category not loaded yet, store file for later
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadedFileName(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const handleViewFile = () => {
    if (value) {
      window.open(value, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {value && uploadedFileName ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{uploadedFileName}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleViewFile}
              disabled={disabled}
            >
              View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <Input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || isUploading || !category}
            className="hidden"
            id={`file-upload-${categoryName}`}
          />
          <label htmlFor={`file-upload-${categoryName}`}>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading || !category}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : placeholder}
              </span>
            </Button>
          </label>
          {selectedFile && !isUploading && (
            <p className="text-sm text-gray-500 mt-2">{selectedFile.name}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
