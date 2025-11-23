import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '@/core/lib/api';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  categoryName: string;
  isPublic?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const ImageUpload = ({
  value,
  onChange,
  categoryName,
  isPublic = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  placeholder = 'Upload image',
  disabled = false,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

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

    setIsUploading(true);
    try {
      // TODO: Implement actual file upload when uploads module is fully implemented
      // For now, create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result); // Using data URL as placeholder
      };
      reader.readAsDataURL(file);

      // TODO: Replace with actual API call
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('categoryId', categoryId);
      // formData.append('isPublic', isPublic.toString());
      // const response = await api.post('/uploads/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });
      // onChange(response.data.url);

      toast.success('Image uploaded successfully (stub implementation)');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <Input
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
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

