import { useState, useRef, useCallback } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../hooks/useUploads';
import { ImageUploadProps, ImagePreviewProps } from '../types/upload.types';
import { cn } from '@/core/lib/utils';
import uploadService from '../services/uploadService';

const ImagePreview = ({ src, alt = 'Preview', className, onRemove, showRemoveButton = true }: ImagePreviewProps) => {
  return (
    <div className={cn('relative group', className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-32 object-cover rounded-lg border"
      />
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

const ImageUpload = ({
  value,
  onChange,
  categoryName = 'course-materials',
  isPublic = true,
  maxSize,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  placeholder = 'Click to upload or drag and drop',
  className,
  disabled = false,
}: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProgress, uploadImage } = useImageUpload();

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size (default 5MB for images, or use provided maxSize)
    const maxFileSize = maxSize || 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    return null;
  }, [allowedTypes, maxSize]);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const result = await uploadImage(file, categoryName, isPublic);
      if (result) {
        // Use the public URL for the uploaded image
        const imageUrl = uploadService.getPublicFileUrl(result.id);
        onChange(imageUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
    }
  }, [validateFile, uploadImage, categoryName, isPublic, onChange]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label>Course Thumbnail</Label>
      
      {value ? (
        <ImagePreview
          src={value}
          alt="Course thumbnail"
          onRemove={handleRemove}
          showRemoveButton={!disabled}
        />
      ) : (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            dragActive && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            {isUploading ? (
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{placeholder}</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF, WEBP up to {Math.round((maxSize || 5 * 1024 * 1024) / 1024 / 1024)}MB
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
