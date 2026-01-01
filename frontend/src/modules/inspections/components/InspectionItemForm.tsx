import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';

import { CreateInspectionItemDTO } from '../types/inspection.types';
import { riskCategoryService, riskService } from '@/modules/master-data';
import { RiskCategory, Risk } from '@/core/lib/types';
import { userService } from '@/modules/users';
import { User } from '@/core/lib/types';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/core/lib/types';
import uploadService, { FileCategory } from '@/modules/uploads/services/uploadService';

// Image upload interface
interface ImageUpload {
  id: string;
  url: string;
  caption: string;
  file?: File; // For new uploads
  isNew?: boolean; // Flag for new uploads
}

// Form schema for validation
const formSchema = z.object({
  riskCategoryId: z.string().min(1, 'Risk Category is required'),
  riskId: z.string().min(1, 'Risk is required'),
  assignedDepartmentId: z.string().min(1, 'Assigned Department is required'),
  assigneeId: z.string().optional(),
  followUpNotes: z.string().optional(),
  order: z.coerce.number().min(0, 'Order must be 0 or greater').default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface InspectionItemFormProps {
  inspectionId?: string;
  initialItem?: Partial<CreateInspectionItemDTO>;
  onSubmit?: (item: CreateInspectionItemDTO) => void;
  onCancel?: () => void;
  showCard?: boolean;
}

const InspectionItemForm = ({ inspectionId, initialItem, onSubmit, onCancel, showCard = true }: InspectionItemFormProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);
  
  // Image upload states
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [fileCategory, setFileCategory] = useState<FileCategory | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Convert data to ModalComboboxOption format
  const riskOptions: ModalComboboxOption[] = risks.map(risk => ({
    value: risk.id,
    label: `${risk.name}${risk.description ? ` - ${risk.description}` : ''}`
  }));

  const riskCategoryOptions: ModalComboboxOption[] = riskCategories.map(category => ({
    value: category.id,
    label: category.name
  }));

  const departmentOptions: ModalComboboxOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const userOptions: ModalComboboxOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskCategoryId: initialItem?.riskCategoryId || '',
      riskId: initialItem?.riskId || '',
      assignedDepartmentId: initialItem?.assignedDepartmentId || '',
      assigneeId: initialItem?.assigneeId || '',
      followUpNotes: initialItem?.followUpNotes || '',
      order: initialItem?.order || 0,
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [riskCategoriesResponse, risksResponse, departmentsResponse, usersResponse] = await Promise.all([
          riskCategoryService.getAll({ page: 1, limit: 1000, isActive: true }),
          riskService.getAll({ page: 1, limit: 1000, isActive: true }),
          departmentService.getDepartments({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: 'true' }
          }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);
        setRiskCategories(riskCategoriesResponse.data);
        setRisks(risksResponse.data);
        setDepartments(departmentsResponse.data);
        setUsers(usersResponse.data);
        
        // Load file category for inspection images
        const category = await uploadService.getCategoryByName('course-materials');
        if (category) {
          setFileCategory(category);
        }
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        toast.error('Failed to load reference data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter risks based on selected risk category
  const selectedRiskCategoryId = form.watch('riskCategoryId');
  const filteredRiskOptions = selectedRiskCategoryId
    ? riskOptions.filter(option => {
        const risk = risks.find(r => r.id === option.value);
        return risk?.riskCategoryId === selectedRiskCategoryId;
      })
    : riskOptions;

  // Handle image file selection
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

  // Remove image
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

  // Update image caption
  const handleCaptionChange = (imageId: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  // Upload images to server
  const uploadImages = async (): Promise<{ imageUrl: string; caption: string; order: number }[]> => {
    if (!fileCategory) {
      throw new Error('File category not loaded');
    }

    const uploadedImages: { imageUrl: string; caption: string; order: number }[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (image.isNew && image.file) {
        try {
          setIsUploadingImages(true);
          const response = await uploadService.uploadFile(
            image.file,
            fileCategory.id,
            true, // isPublic
          );
          
          const imageUrl = uploadService.getPublicFileUrl(response.id);
          uploadedImages.push({
            imageUrl,
            caption: image.caption || '',
            order: i,
          });
        } catch (error) {
          console.error(`Failed to upload image ${image.file.name}:`, error);
          throw new Error(`Failed to upload image ${image.file.name}`);
        }
      } else {
        // Existing image, keep the URL
        uploadedImages.push({
          imageUrl: image.url,
          caption: image.caption || '',
          order: i,
        });
      }
    }
    
    setIsUploadingImages(false);
    return uploadedImages;
  };

  const handleSubmit = async (data: FormValues) => {
    if (!onSubmit) return;

    try {
      setIsSubmitting(true);
      
      // Upload images first if any
      let uploadedImages: { imageUrl: string; caption: string; order: number }[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages();
      }
      
      const itemData: CreateInspectionItemDTO = {
        riskCategoryId: data.riskCategoryId,
        riskId: data.riskId,
        assignedDepartmentId: data.assignedDepartmentId,
        assigneeId: data.assigneeId || undefined,
        followUpNotes: data.followUpNotes || undefined,
        order: data.order,
        images: uploadedImages, // Add images to DTO
      };
      
      await onSubmit(itemData);
      
      // Clean up blob URLs
      images.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    } catch (error) {
      console.error('Failed to submit inspection item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit inspection item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="riskCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Risk Category <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={riskCategoryOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear risk when category changes
                      form.setValue('riskId', '');
                    }}
                    placeholder="Select risk category"
                    searchPlaceholder="Search risk category..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="riskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Risk <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={filteredRiskOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={selectedRiskCategoryId ? "Select risk" : "Select risk category first"}
                    searchPlaceholder="Search risk..."
                    emptyText={selectedRiskCategoryId ? "No risks found" : "Please select a risk category first"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="assignedDepartmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Assigned Department <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={departmentOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select department"
                    searchPlaceholder="Search department..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={userOptions}
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || undefined)}
                    placeholder="Select assignee (optional)"
                    searchPlaceholder="Search user..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="followUpNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Follow-up Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter follow-up notes (optional)"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <input
                  type="number"
                  min="0"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div>
            <FormLabel>Inspection Images</FormLabel>
            <p className="text-sm text-muted-foreground">Upload photos related to this inspection item (max 5MB per image)</p>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="inspection-image-upload"
              disabled={isSubmitting || isUploadingImages}
            />
            <label htmlFor="inspection-image-upload">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isUploadingImages}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploadingImages ? 'Uploading...' : 'Add Images'}
                </span>
              </Button>
            </label>
            {images.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {images.length} image{images.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
                  <div className="aspect-video relative">
                    <img
                      src={image.url}
                      alt={image.caption || 'Inspection image'}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => handleRemoveImage(image.id)}
                      disabled={isSubmitting || isUploadingImages}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {image.isNew && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Input
                      type="text"
                      placeholder="Add caption (optional)"
                      value={image.caption}
                      onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                      disabled={isSubmitting || isUploadingImages}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground">No images uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Images" to upload inspection photos</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isUploadingImages}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isUploadingImages}>
            {isSubmitting || isUploadingImages ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingImages ? 'Uploading Images...' : 'Submitting...'}
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{initialItem ? 'Edit' : 'Add'} Inspection Item</CardTitle>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
};

export default InspectionItemForm;

