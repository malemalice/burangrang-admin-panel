import { useState, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import uploadService, { FileCategory } from '../services/uploadService';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  categoryName: string;
  isPublic?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
  // If entityId is provided, upload immediately; otherwise, use base64 preview
  entityId?: string | null;
  // Callback when file is selected (for preview mode)
  onFileSelect?: (file: File | null) => void;
  // Media type for existing files (stored from previous upload)
  mediaType?: string;
  // Unique ID for the file input (required when multiple instances exist on same page)
  id?: string;
}

const ImageUpload = ({
  value,
  onChange,
  categoryName,
  isPublic = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/mp3'],
  placeholder = 'Upload file',
  disabled = false,
  entityId,
  onFileSelect,
  mediaType,
  id,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load category on mount
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const cat = await uploadService.getCategoryByName(categoryName);
        setCategory(cat);
      } catch (error) {
        console.error('Failed to load file category:', error);
      }
    };
    loadCategory();
  }, [categoryName]);

  // Update preview when value changes (from external source)
  useEffect(() => {
    if (value && !value.startsWith('data:')) {
      // It's a URL, not base64
      setPreview(value);
    } else if (value && value.startsWith('data:')) {
      // It's base64
      setPreview(value);
    } else {
      setPreview(null);
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

    // If entityId exists, upload immediately
    if (entityId && category) {
      setIsUploading(true);
      try {
        const response = await uploadService.uploadFile(
          file,
          category.id,
          isPublic,
        );

        // Get the public URL
        const fileUrl = uploadService.getPublicFileUrl(response.id);
        setPreview(fileUrl);
        onChange(fileUrl);
        setSelectedFile(null); // Clear selected file after successful upload
        toast.success('File uploaded successfully');
      } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to upload file';
        toast.error(errorMessage);
        setSelectedFile(null); // Clear on error too
      } finally {
        setIsUploading(false);
      }
    } else {
      // For new data (no entityId), create base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        // Store base64 for preview, but don't call onChange yet
        // onChange will be called when form is submitted
        if (onFileSelect) {
          onFileSelect(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative">
          {/* Determine media type based on URL, file extension, or mediaType prop */}
          {(() => {
            const isDataUrl = preview.startsWith('data:');
            const dataMimeType = isDataUrl ? preview.split(';')[0].split(':')[1] : '';

            const isVideo = mediaType?.startsWith('video/') ||
              (isDataUrl && dataMimeType.startsWith('video/')) ||
              (!isDataUrl && preview.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) ||
              selectedFile?.type.startsWith('video/');

            const isAudio = mediaType?.startsWith('audio/') ||
              (isDataUrl && dataMimeType.startsWith('audio/')) ||
              (!isDataUrl && preview.match(/\.(mp3|wav|ogg|aac|mpeg)($|\?)/i)) ||
              selectedFile?.type.startsWith('audio/');

            const isPdf = mediaType === 'application/pdf' ||
              (isDataUrl && dataMimeType === 'application/pdf') ||
              (!isDataUrl && preview.match(/\.pdf($|\?)/i)) ||
              selectedFile?.type === 'application/pdf';

            if (isVideo) {
              return (
                <video
                  src={preview}
                  controls
                  className="w-full h-48 object-cover rounded-lg border bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              );
            } else if (isAudio) {
              return (
                <div className="w-full h-48 flex items-center justify-center rounded-lg border bg-gray-100 flex-col gap-2">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <audio src={preview} controls className="w-full px-4 max-w-md">
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              );
            } else if (isPdf) {
              return (
                <div className="w-full h-48 flex items-center justify-center rounded-lg border bg-gray-100">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">PDF Document</p>
                    <a 
                      href={preview} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                    >
                      View PDF
                    </a>
                  </div>
                </div>
              );
            } else {
              return (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              );
            }
          })()}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
          {!entityId && selectedFile && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Preview (will upload on save)
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <Input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
            id={id || `file-upload-${categoryName}`}
          />
          <label htmlFor={id || `file-upload-${categoryName}`}>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : placeholder}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

