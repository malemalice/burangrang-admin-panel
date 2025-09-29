import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useImageUpload } from '../hooks/useUploads';
import { cn } from '@/core/lib/utils';
import uploadService from '../services/uploadService';

interface FileUploadProps {
  value?: string; // Current file URL
  onChange: (value: string | undefined) => void;
  categoryName?: string; // Default to documents
  isPublic?: boolean; // Default to true for public files
  maxSize?: number; // Override max size
  allowedTypes?: string[]; // Override allowed types
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  acceptedFileTypes?: string; // For file input accept attribute
  existingFileName?: string; // For editing existing files
}

const FilePreview = ({ 
  fileName, 
  fileSize, 
  fileUrl,
  onRemove, 
  showRemoveButton = true,
  className 
}: {
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  className?: string;
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-8 w-8 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-8 w-8 text-orange-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getFileIcon(fileName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName}
            </p>
            {fileSize && fileSize > 0 && (
              <p className="text-sm text-gray-500">
                {formatFileSize(fileSize)}
              </p>
            )}
            {fileUrl && (
              <p className="text-xs text-blue-600 truncate">
                {fileUrl}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {fileUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => window.open(fileUrl, '_blank')}
                title="Download/View file"
              >
                <FileText className="h-4 w-4" />
                <span className="sr-only">Download file</span>
              </Button>
            )}
            
            {showRemoveButton && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                onClick={onRemove}
                title="Remove file"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const FileUpload = ({
  value,
  onChange,
  categoryName = 'documents',
  isPublic = true,
  maxSize,
  allowedTypes = ['application/pdf'],
  placeholder = 'Click to upload or drag and drop',
  className,
  disabled = false,
  acceptedFileTypes = '.pdf',
  existingFileName,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProgress, uploadImage } = useImageUpload();


  // Sync uploaded file state with value prop
  useEffect(() => {
    if (value && value.trim() !== '') {
      // If we have a value but no uploadedFile, or if the URL changed
      if (!uploadedFile || uploadedFile.url !== value) {
        const fileName = existingFileName || value.split('/').pop() || 'Uploaded File';
        setUploadedFile({
          name: fileName,
          size: 0, // We don't know the size for existing files
          url: value
        });
      }
    } else if (!value && uploadedFile) {
      // If value is cleared, clear uploaded file info
      setUploadedFile(null);
    }
  }, [value, existingFileName, uploadedFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback((file: File) => {
    setError(null);

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes.map(type => type.split('/')[1]).join(', ');
      setError(`Invalid file type. Allowed types: ${allowedExtensions}`);
      return false;
    }

    // Check file size (default to 50MB for documents category)
    const maxSizeBytes = maxSize || 50 * 1024 * 1024; // 50MB default
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      setError(`File size too large. Maximum size: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  }, [allowedTypes, maxSize]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    try {
      setError(null);
      const result = await uploadImage(file, categoryName, isPublic);
      
      if (result && result.downloadUrl) {
        // Convert relative URL to full URL if needed
        const fullUrl = uploadService.ensureFullUrl(result.downloadUrl);
        
        // Set the uploaded file info first - this ensures immediate preview
        setUploadedFile({
          name: result.originalName || file.name,
          size: result.size || file.size,
          url: fullUrl
        });
        
        // Then update the form value with full URL
        onChange(fullUrl);
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setUploadedFile(null); // Clear uploaded file on error
    }
  }, [validateFile, uploadImage, categoryName, isPublic, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, handleFileUpload]);

  const handleRemove = useCallback(() => {
    onChange(undefined);
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  // If we have uploaded file info OR a value, show the uploaded file preview
  if (uploadedFile || (value && value.trim() !== '')) {
    const displayFileName = uploadedFile?.name || existingFileName || (value ? value.split('/').pop() : '') || 'Uploaded File';
    const displayFileSize = uploadedFile?.size || undefined;
    const displayUrl = uploadedFile?.url || value || '';
    
    console.log('RENDERING PREVIEW with:', { uploadedFile, value, displayFileName, displayFileSize, displayUrl });
    
    return (
      <div className={cn('space-y-2', className)}>
        <Label className="text-sm font-medium">Uploaded File</Label>
        <FilePreview
          fileName={displayFileName}
          fileSize={displayFileSize}
          fileUrl={displayUrl}
          onRemove={handleRemove}
          showRemoveButton={!disabled}
        />
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>File uploaded successfully</span>
        </div>
      </div>
    );
  }


  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">File Upload</Label>
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400',
          error ? 'border-red-300 bg-red-50' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading file...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: {acceptedFileTypes}
                </p>
                {maxSize && (
                  <p className="text-xs text-gray-500">
                    Max size: {Math.round(maxSize / (1024 * 1024))}MB
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
