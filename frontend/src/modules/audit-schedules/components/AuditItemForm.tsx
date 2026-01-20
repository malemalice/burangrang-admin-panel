import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Image as ImageIcon, ChevronRight } from 'lucide-react';
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
import { ModalMultiSelect, ModalMultiSelectOption } from '@/core/components/ui/modal-multi-select';
import { departmentService } from '@/modules/master-data';
import { userService } from '@/modules/users';
import { Department, User } from '@/core/lib/types';
import uploadService, { FileCategory } from '@/modules/uploads/services/uploadService';
import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';
import { roleService } from '@/modules/roles';
import { AuditSchedule } from '../types/audit-schedule.types';

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
  auditCriteriaDescription?: string | null;
  auditCriteriaCode?: string;
  auditScheduleCode?: string;
  auditClauseName?: string;
  auditElementName?: string;
  auditSchedule?: AuditSchedule | null;
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
  auditCriteriaDescription,
  auditCriteriaCode,
  auditScheduleCode,
  auditClauseName,
  auditElementName,
  auditSchedule,
  auditItem,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AuditItemFormProps) => {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [fileCategory, setFileCategory] = useState<FileCategory | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAuditor, setIsAuditor] = useState(false);
  const [canEditActionRealization, setCanEditActionRealization] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const departmentOptions: ModalMultiSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  const userOptions: ModalMultiSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));

  // Check user permissions and role
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser?.id) return;

      try {
        // Fetch user data to get role code
        const response = await api.get('/users/me');
        const userData = response.data;
        
        let roleCode: string | null = null;
        
        // Try to get role code from the role object in the response
        if (userData.role && typeof userData.role === 'object') {
          if ('code' in userData.role) {
            roleCode = userData.role.code;
          }
        }
        
        // If role code is not directly available, fetch it using roleId
        if (!roleCode && userData.roleId) {
          try {
            const role = await roleService.getRoleById(userData.roleId);
            roleCode = role.code;
          } catch (roleError) {
            console.error('Failed to fetch role by ID:', roleError);
          }
        }

        const isUserSuperAdmin = roleCode === 'SUPER_ADMIN';
        setIsSuperAdmin(isUserSuperAdmin);

        // Check if user is an auditor assigned to the audit schedule
        const userIsAuditor = auditSchedule?.auditors?.some(auditor => auditor.id === currentUser.id) || false;
        setIsAuditor(userIsAuditor);

        // Check if user is in assigned department or is an assigned user (for existing audit item)
        let userInAssignedDept = false;
        let userIsAssignedUser = false;

        if (auditItem) {
          // Check if user's department is in assigned departments
          if (userData.departmentId && auditItem.departmentIds) {
            userInAssignedDept = auditItem.departmentIds.includes(userData.departmentId);
          }

          // Check if user is in assigned users
          if (auditItem.userIds) {
            userIsAssignedUser = auditItem.userIds.includes(currentUser.id);
          }
        }

        const userCanEditActionRealization = userInAssignedDept || userIsAssignedUser;
        setCanEditActionRealization(userCanEditActionRealization);

        // Determine read-only state:
        // - Read-only if user is not SUPER_ADMIN and not an auditor and is assigned dept/user
        // - SUPER_ADMIN and auditors have full access
        const readOnly = !isUserSuperAdmin && !userIsAuditor && userCanEditActionRealization;
        setIsReadOnly(readOnly);

        // If user is not SUPER_ADMIN, not an auditor, and not assigned dept/user, they shouldn't be able to edit at all
        // This case should be handled at the parent component level to prevent form from opening
      } catch (error) {
        console.error('Failed to check user permissions:', error);
      }
    };

    checkPermissions();
  }, [currentUser, auditSchedule, auditItem]);

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

  // Helper function to convert ISO date string to datetime-local format (yyyy-MM-ddThh:mm)
  // datetime-local format expects local time, not UTC
  const convertToDateTimeLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Get local time components (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
        ? convertToDateTimeLocal(new Date(auditItem.dueDate).toISOString())
        : convertToDateTimeLocal(new Date().toISOString()),
    },
  });

  // Reset form when auditItem changes (important for reopening form with different data)
  useEffect(() => {
    form.reset({
      compliantStatus: auditItem?.compliantStatus as CompliantStatusEnum || undefined,
      departmentIds: auditItem?.departmentIds || [],
      userIds: auditItem?.userIds || [],
      evidence: auditItem?.evidence || '',
      recommendation: auditItem?.recommendation || '',
      actionRealization: auditItem?.actionRealization || '',
      dueDate: auditItem?.dueDate 
        ? convertToDateTimeLocal(new Date(auditItem.dueDate).toISOString())
        : convertToDateTimeLocal(new Date().toISOString()),
    });
  }, [auditItem, form]);

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
        {/* Header Section */}
        <div className="space-y-4 pb-6 border-b">
          {/* Compact Breadcrumb */}
          {(auditScheduleCode || auditClauseName || auditElementName || auditCriteriaCode) && (
            <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
              {auditScheduleCode && (
                <>
                  <span className="truncate max-w-[120px]" title={auditScheduleCode}>
                    {auditScheduleCode}
                  </span>
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                </>
              )}
              {auditClauseName && (
                <>
                  <span className="truncate max-w-[150px]" title={auditClauseName}>
                    {auditClauseName}
                  </span>
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                </>
              )}
              {auditElementName && (
                <>
                  <span className="truncate max-w-[150px]" title={auditElementName}>
                    {auditElementName}
                  </span>
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                </>
              )}
              {auditCriteriaCode && (
                <span className="text-foreground font-medium truncate max-w-[120px]" title={auditCriteriaCode}>
                  {auditCriteriaCode}
                </span>
              )}
            </nav>
          )}

          {/* Main Title Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold leading-tight break-words">
                {auditCriteriaName}
              </h2>
              {auditCriteriaCode && (
                <p className="text-sm text-muted-foreground font-mono">
                  {auditCriteriaCode}
                </p>
              )}
            </div>
            {auditCriteriaDescription && (
              <div className="bg-muted/50 rounded-md p-4 border">
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {auditCriteriaDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields Section */}
        <div className="space-y-6">
          {/* Status and Due Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={isReadOnly || isSubmitting}
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Due Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DateTimePicker
                      type="datetime-local"
                      value={field.value ? field.value : undefined}
                      onChange={(value) => {
                        // Ensure we store the value in datetime-local format (yyyy-MM-ddThh:mm)
                        const dateValue = typeof value === 'string' ? value : '';
                        field.onChange(dateValue);
                      }}
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="departmentIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Assigned Departments <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ModalMultiSelect
                      options={departmentOptions}
                      value={field.value || []}
                      onValueChange={(value) => {
                        if (!isReadOnly && !isSubmitting) {
                          field.onChange(value);
                        }
                      }}
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
                    <ModalMultiSelect
                      options={userOptions}
                      value={field.value || []}
                      onValueChange={(value) => {
                        if (!isReadOnly && !isSubmitting) {
                          field.onChange(value);
                        }
                      }}
                      placeholder="Select users (optional)"
                      searchPlaceholder="Search users..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                    disabled={isReadOnly || isSubmitting}
                    readOnly={isReadOnly}
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
                    disabled={isReadOnly || isSubmitting}
                    readOnly={isReadOnly}
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
                    disabled={(!canEditActionRealization && !isSuperAdmin && !isAuditor) || isSubmitting}
                    readOnly={!canEditActionRealization && !isSuperAdmin && !isAuditor}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-4 pt-2">
            <FormLabel>Images</FormLabel>
            <div className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="cursor-pointer"
                  disabled={isReadOnly || isSubmitting}
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
                      {!isReadOnly && (
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
                      )}
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Caption (optional)"
                          value={image.caption}
                          onChange={(e) => handleUpdateImageCaption(image.id, e.target.value)}
                          disabled={isReadOnly || isSubmitting}
                          readOnly={isReadOnly}
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {/* Show submit button based on permissions:
              - For new items: Only auditors or SUPER_ADMIN can add
              - For existing items: Auditors/SUPER_ADMIN can edit all, assigned dept/users can edit actionRealization */}
          {((isSuperAdmin || isAuditor) || (auditItem && canEditActionRealization)) && (
            <Button 
              type="submit" 
              disabled={isSubmitting || (isReadOnly && !canEditActionRealization)}
            >
              {isSubmitting ? 'Saving...' : auditItem ? 'Update' : 'Save'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
