import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Textarea } from '@/core/components/ui/textarea';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { MultiSelectSearchable, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { departmentService } from '@/modules/master-data';
import { userService } from '@/modules/users';
import { Department, User } from '@/core/lib/types';
import uploadService, { FileCategory } from '@/modules/uploads/services/uploadService';

enum CompliantStatusEnum {
  COMPLY = 'COMPLY',
  NOT_COMPLY_MAJOR = 'NOT_COMPLY_MAJOR',
  NOT_COMPLY_MINOR = 'NOT_COMPLY_MINOR',
}

const formSchema = z.object({
  compliantStatus: z.nativeEnum(CompliantStatusEnum, {
    required_error: 'Compliant status is required',
  }),
  departmentIds: z.array(z.string()).min(1, 'At least one department is required'),
  userIds: z.array(z.string()).optional(),
  evidence: z.string().optional(),
  recommendation: z.string().optional(),
  actionRealization: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ImageUpload {
  id: string;
  url: string;
  caption: string;
  file?: File;
  isNew?: boolean;
}

interface AuditItemFormProps {
  auditCriteriaId: string;
  auditCriteriaName: string;
  auditItem?: {
    id: string;
    compliantStatus: string;
    departmentIds?: string[];
    userIds?: string[];
    evidence?: string;
    recommendation?: string;
    actionRealization?: string;
    dueDate: Date;
    images?: Array<{
      id: string;
      imageUrl: string;
      caption?: string;
      order: number;
    }>;
  };
  onSubmit: (data: FormValues & { images: ImageUpload[] }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AuditItemForm = ({
  auditCriteriaId,
  auditCriteriaName,
  auditItem,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AuditItemFormProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [fileCategory, setFileCategory] = useState<FileCategory | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  const userOptions: SearchableSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [deptsResponse, usersResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 1000 }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);
        setDepartments(deptsResponse.data);
        setUsers(usersResponse.data);

        // Load file category for audit images
        const category = await uploadService.getCategoryByName('course-materials');
        if (category) {
          setFileCategory(category);
        }
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        toast.error('Failed to load reference data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Initialize images from auditItem
  useEffect(() => {
    if (auditItem?.images && auditItem.images.length > 0) {
      const sortedImages = [...auditItem.images].sort((a, b) => a.order - b.order);
      setImages(sortedImages.map((img) => ({
        id: img.id,
        url: img.imageUrl,
        caption: img.caption || '',
        isNew: false,
      })));
    } else {
      setImages([]);
    }
  }, [auditItem]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      compliantStatus: auditItem?.compliantStatus as CompliantStatusEnum || undefined,
      departmentIds: auditItem?.departmentIds || [],
      userIds: auditItem?.userIds || [],
      evidence: auditItem?.evidence || '',
      recommendation: auditItem?.recommendation || '',
      actionRealization: auditItem?.actionRealization || '',
      dueDate: auditItem?.dueDate 
        ? new Date(auditItem.dueDate).toISOString()
        : new Date().toISOString(),
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageUpload[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type for ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds maximum size of 5MB`);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        id: `temp-${Date.now()}-${Math.random()}`,
        url: previewUrl,
        caption: '',
        file: file,
        isNew: true,
      });
    });

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId);
      // Revoke object URL to free memory
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handleUpdateImageCaption = (imageId: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  const handleSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, images });
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Audit Criteria</label>
            <p className="text-sm font-medium mt-1">{auditCriteriaName}</p>
          </div>

          <FormField
            control={form.control}
            name="compliantStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Compliant Status <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select compliant status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CompliantStatusEnum.COMPLY}>Comply</SelectItem>
                    <SelectItem value={CompliantStatusEnum.NOT_COMPLY_MAJOR}>
                      Not Comply - Major
                    </SelectItem>
                    <SelectItem value={CompliantStatusEnum.NOT_COMPLY_MINOR}>
                      Not Comply - Minor
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Assigned Departments <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <MultiSelectSearchable
                    options={departmentOptions}
                    value={field.value || []}
                    onValueChange={field.onChange}
                    placeholder="Select departments"
                    searchPlaceholder="Search departments..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Users</FormLabel>
                <FormControl>
                  <MultiSelectSearchable
                    options={userOptions}
                    value={field.value || []}
                    onValueChange={field.onChange}
                    placeholder="Select users (optional)"
                    searchPlaceholder="Search users..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Due Date <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => {
                      field.onChange(date ? date.toISOString() : '');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="evidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evidence</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter evidence..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recommendation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recommendation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter recommendation..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actionRealization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action Realization</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter action realization..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-4">
            <FormLabel>Images</FormLabel>
            <div className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload multiple images (JPEG, PNG, GIF, WebP, max 5MB each)
                </p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(image.id)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Caption (optional)"
                          value={image.caption}
                          onChange={(e) => handleUpdateImageCaption(image.id, e.target.value)}
                          disabled={isSubmitting}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : auditItem ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
