import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/core/components/ui/separator';

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

import { CreateInspectionItemDTO, InspectionImageTypeEnum } from '../types/inspection.types';
import { riskCategoryService, riskService } from '@/modules/master-data';
import { RiskCategory, Risk } from '@/core/lib/types';
import { userService } from '@/modules/users';
import { User } from '@/core/lib/types';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/core/lib/types';
import areaService from '@/modules/master-data/services/areaService';
import { AreaDTO } from '@/modules/master-data/types/master-data.types';
import uploadService, { FileCategory } from '@/modules/uploads/services/uploadService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import riskMitigationService, { type RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';

// Inspection item status options (only OPEN and DONE/CLOSE)
const INSPECTION_ITEM_STATUS_OPTIONS = [
  { value: GeneralStatusEnum.OPEN, label: 'Open' },
  { value: GeneralStatusEnum.DONE, label: 'Close' },
] as const;

// Image upload interface
interface ImageUpload {
  id: string;
  url: string;
  caption: string;
  type: InspectionImageTypeEnum;
  file?: File; // For new uploads
  isNew?: boolean; // Flag for new uploads
}

// Mitigation schema for validation
const mitigationSchema = z.object({
  eliminate: z.string().optional(),
  transfer: z.string().optional(),
  reduce: z.string().optional(),
  accept: z.string().optional(),
  legalAspect: z.string().optional(),
});

// Form schema for validation
const formSchema = z.object({
  areaId: z.string().min(1, 'Area is required'),
  status: z.nativeEnum(GeneralStatusEnum),
  riskCategoryId: z.string().min(1, 'Risk Category is required'),
  riskId: z.string().min(1, 'Risk is required'),
  assignedDepartmentId: z.string().min(1, 'Assigned Department is required'),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  followUpNotes: z.string().optional(),
  findings: z.string().optional(),
  dueDateAt: z.string().optional(),
  mitigation: mitigationSchema.optional(),
}).superRefine((data, ctx) => {
  // Status validation: inspection items can only be OPEN or DONE (Close)
  if (data.status !== GeneralStatusEnum.OPEN && data.status !== GeneralStatusEnum.DONE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Status must be either Open or Close',
      path: ['status'],
    });
  }
  
  // If a risk is selected, at least one mitigation field must be filled
  if (data.riskId && data.mitigation) {
    const hasMitigation = !!(
      (data.mitigation.eliminate && data.mitigation.eliminate.trim()) ||
      (data.mitigation.transfer && data.mitigation.transfer.trim()) ||
      (data.mitigation.reduce && data.mitigation.reduce.trim()) ||
      (data.mitigation.accept && data.mitigation.accept.trim())
    );
    
    if (!hasMitigation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one risk mitigation field must be filled',
        path: ['mitigation'],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

type FormMode = 'creator' | 'updater' | 'verifier';

type FieldPermission = 'editable' | 'readonly' | 'hidden';

// Field permissions configuration - centralized control over field visibility and editability
const FIELD_PERMISSIONS: Record<FormMode, Record<string, FieldPermission>> = {
  creator: {
    areaId: 'editable',
    status: 'hidden',
    riskCategoryId: 'editable',
    riskId: 'editable',
    assignedDepartmentId: 'hidden',
    assigneeId: 'hidden',
    description: 'editable',
    findings: 'editable',
    dueDateAt: 'editable',
    mitigation: 'editable',
    followUpNotes: 'hidden',
    afterImages: 'hidden',
    beforeImages: 'hidden',
  },
  updater: {
    areaId: 'readonly',
    status: 'hidden',
    riskCategoryId: 'readonly',
    riskId: 'readonly',
    assignedDepartmentId: 'readonly',
    assigneeId: 'readonly',
    description: 'readonly',
    findings: 'readonly',
    dueDateAt: 'readonly',
    mitigation: 'readonly',
    followUpNotes: 'editable',
    afterImages: 'editable',
    beforeImages: 'hidden',
  },
  verifier: {
    areaId: 'editable',
    status: 'editable',
    riskCategoryId: 'editable',
    riskId: 'editable',
    assignedDepartmentId: 'editable',
    assigneeId: 'editable',
    description: 'editable',
    findings: 'editable',
    dueDateAt: 'editable',
    mitigation: 'editable',
    followUpNotes: 'editable',
    afterImages: 'editable',
    beforeImages: 'editable',
  },
};

interface InspectionItemFormProps {
  inspectionId?: string;
  initialItem?: Partial<CreateInspectionItemDTO>;
  onSubmit?: (item: CreateInspectionItemDTO) => void;
  onCancel?: () => void;
  showCard?: boolean;
  inspectionStatus?: GeneralStatusEnum;
  formMode?: FormMode; // 'creator' | 'updater' | 'verifier'
}

// Read-only field display component
interface ReadOnlyFieldProps {
  label: string;
  value: string | number | null | undefined;
  format?: (value: string | number | null | undefined) => string;
  required?: boolean;
  multiline?: boolean;
}

const ReadOnlyField = ({ label, value, format, required, multiline }: ReadOnlyFieldProps) => {
  const displayValue = format ? format(value) : value || 'N/A';
  const hasContent = value && String(value).trim() !== '';
  
  return (
    <div className="space-y-1.5">
      <FormLabel>
        {label} {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <div 
        className={`px-3 py-2 bg-muted rounded-md text-sm ${multiline ? 'min-h-[120px] whitespace-pre-wrap' : 'min-h-[40px] flex items-center'}`}
      >
        {hasContent ? displayValue : 'N/A'}
      </div>
    </div>
  );
};

// Conditional field wrapper component
interface ConditionalFieldProps {
  fieldName: string;
  formMode: FormMode;
  children: React.ReactNode;
  readOnlyComponent?: React.ReactNode;
}

const ConditionalField = ({ fieldName, formMode, children, readOnlyComponent }: ConditionalFieldProps) => {
  const permission = FIELD_PERMISSIONS[formMode]?.[fieldName] || 'hidden';

  if (permission === 'hidden') return null;
  if (permission === 'readonly' && readOnlyComponent) return <>{readOnlyComponent}</>;
  return <>{children}</>;
};

const InspectionItemForm = ({ 
  inspectionId, 
  initialItem, 
  onSubmit, 
  onCancel, 
  showCard = true,
  inspectionStatus,
  formMode = 'creator',
}: InspectionItemFormProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);
  const [isLoadingRiskMitigations, setIsLoadingRiskMitigations] = useState(false);
  const [riskMitigations, setRiskMitigations] = useState<RiskMitigation[]>([]);
  const isInitialMount = useRef(true);
  
  // Image upload states - separate before and after images
  const [beforeImages, setBeforeImages] = useState<ImageUpload[]>([]);
  const [afterImages, setAfterImages] = useState<ImageUpload[]>([]);
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

  const areaOptions: ModalComboboxOption[] = areas.map(area => ({
    value: area.id,
    label: `${area.name} (${area.code})`
  }));

  const userOptions: ModalComboboxOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      areaId: initialItem?.areaId || '',
      status: initialItem?.status || GeneralStatusEnum.OPEN,
      riskCategoryId: initialItem?.riskCategoryId || '',
      riskId: initialItem?.riskId || '',
      assignedDepartmentId: initialItem?.assignedDepartmentId || '',
      assigneeId: initialItem?.assigneeId || '',
      description: initialItem?.description || '',
      followUpNotes: initialItem?.followUpNotes || '',
      findings: initialItem?.findings || '',
      dueDateAt: initialItem?.dueDateAt ? new Date(initialItem.dueDateAt).toISOString().split('T')[0] : '',
      mitigation: initialItem?.mitigation || {
        eliminate: '',
        transfer: '',
        reduce: '',
        accept: '',
        legalAspect: '',
      },
    },
  });

  // Watch selected risk ID
  const selectedRiskId = form.watch('riskId');

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [riskCategoriesResponse, risksResponse, departmentsResponse, areasResponse, usersResponse] = await Promise.all([
          riskCategoryService.getAll({ page: 1, limit: 1000, isActive: true }),
          riskService.getAll({ page: 1, limit: 1000, isActive: true }),
          departmentService.getDepartments({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: 'true' }
          }),
          areaService.getAreas({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: true }
          }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);
        setRiskCategories(riskCategoriesResponse.data);
        setRisks(risksResponse.data);
        setDepartments(departmentsResponse.data);
        setAreas(areasResponse.data);
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

  // Initialize images from initialItem when editing
  useEffect(() => {
    if (initialItem?.images && initialItem.images.length > 0) {
      // Sort images by order to preserve sequence
      const sortedImages = [...initialItem.images].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Separate images by type
      const beforeImgs: ImageUpload[] = [];
      const afterImgs: ImageUpload[] = [];
      
      sortedImages.forEach((img) => {
        const imageUpload: ImageUpload = {
          id: `existing-${img.imageUrl}-${Date.now()}-${Math.random()}`,
          url: img.imageUrl,
          caption: img.caption || '',
          type: img.type || InspectionImageTypeEnum.GENERAL,
          isNew: false,
        };
        
        if (img.type === InspectionImageTypeEnum.BEFORE) {
          beforeImgs.push(imageUpload);
        } else if (img.type === InspectionImageTypeEnum.AFTER) {
          afterImgs.push(imageUpload);
        } else {
          // For GENERAL or undefined, treat as BEFORE (current condition)
          beforeImgs.push({ ...imageUpload, type: InspectionImageTypeEnum.BEFORE });
        }
      });
      
      setBeforeImages(beforeImgs);
      setAfterImages(afterImgs);
    } else if (initialItem && (!initialItem.images || initialItem.images.length === 0)) {
      // Clear images when editing an item without images
      setBeforeImages([]);
      setAfterImages([]);
    }
  }, [initialItem]);

  // Filter risks based on selected risk category
  const selectedRiskCategoryId = form.watch('riskCategoryId');
  const filteredRiskOptions = selectedRiskCategoryId
    ? riskOptions.filter(option => {
        const risk = risks.find(r => r.id === option.value);
        return risk?.riskCategoryId === selectedRiskCategoryId;
      })
    : riskOptions;

  // Fetch risk mitigations when risk is selected and populate form fields for new items
  useEffect(() => {
    const fetchRiskMitigations = async () => {
      if (!selectedRiskId) {
        setRiskMitigations([]);
        return;
      }

      setIsLoadingRiskMitigations(true);
      try {
        const mitigations = await riskMitigationService.getByRiskId(selectedRiskId);
        setRiskMitigations(mitigations);
        
        // When creating new items (no initialItem.mitigation), pre-populate form with default mitigations
        // Only do this if the risk has changed (not on initial load with existing data)
        const hasExistingMitigation = initialItem?.mitigation && (
          initialItem.mitigation.eliminate ||
          initialItem.mitigation.transfer ||
          initialItem.mitigation.reduce ||
          initialItem.mitigation.accept
        );
        
        if (!hasExistingMitigation && mitigations.length > 0 && !isInitialMount.current) {
          // Combine all mitigations into a single object (in case there are multiple)
          const combinedMitigation = {
            eliminate: mitigations.map(m => m.eliminate).filter(Boolean).join('\n') || '',
            transfer: mitigations.map(m => m.transfer).filter(Boolean).join('\n') || '',
            reduce: mitigations.map(m => m.reduce).filter(Boolean).join('\n') || '',
            accept: mitigations.map(m => m.accept).filter(Boolean).join('\n') || '',
          };
          
          form.setValue('mitigation', combinedMitigation);
        }
      } catch (error) {
        console.error('Failed to fetch risk mitigations:', error);
        toast.error('Failed to load risk mitigation options');
        setRiskMitigations([]);
      } finally {
        setIsLoadingRiskMitigations(false);
      }
    };

    fetchRiskMitigations();
  }, [selectedRiskId, initialItem?.mitigation, form]);

  // Mark initial mount as complete after initial data is loaded
  useEffect(() => {
    if (!isLoading && risks.length > 0 && riskCategories.length > 0) {
      isInitialMount.current = false;
    }
  }, [isLoading, risks.length, riskCategories.length]);


  // Handle image file selection for before images
  const handleBeforeImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        type: InspectionImageTypeEnum.BEFORE,
        file: file,
        isNew: true,
      });
    });

    if (newImages.length > 0) {
      setBeforeImages(prev => [...prev, ...newImages]);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle image file selection for after images
  const handleAfterImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        type: InspectionImageTypeEnum.AFTER,
        file: file,
        isNew: true,
      });
    });

    if (newImages.length > 0) {
      setAfterImages(prev => [...prev, ...newImages]);
      // Reset file input
      event.target.value = '';
    }
  };

  // Remove before image
  const handleRemoveBeforeImage = (imageId: string) => {
    setBeforeImages(prev => {
      const image = prev.find(img => img.id === imageId);
      // Revoke object URL to free memory
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Remove after image
  const handleRemoveAfterImage = (imageId: string) => {
    setAfterImages(prev => {
      const image = prev.find(img => img.id === imageId);
      // Revoke object URL to free memory
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Update before image caption
  const handleBeforeCaptionChange = (imageId: string, caption: string) => {
    setBeforeImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  // Update after image caption
  const handleAfterCaptionChange = (imageId: string, caption: string) => {
    setAfterImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  // Upload images to server
  const uploadImages = async (): Promise<{ imageUrl: string; caption: string; type: InspectionImageTypeEnum; order: number }[]> => {
    if (!fileCategory) {
      throw new Error('File category not loaded');
    }

    const uploadedImages: { imageUrl: string; caption: string; type: InspectionImageTypeEnum; order: number }[] = [];
    let orderCounter = 0;
    
    // Upload before images first
    for (let i = 0; i < beforeImages.length; i++) {
      const image = beforeImages[i];
      
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
            type: InspectionImageTypeEnum.BEFORE,
            order: orderCounter++,
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
          type: InspectionImageTypeEnum.BEFORE,
          order: orderCounter++,
        });
      }
    }
    
    // Upload after images
    for (let i = 0; i < afterImages.length; i++) {
      const image = afterImages[i];
      
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
            type: InspectionImageTypeEnum.AFTER,
            order: orderCounter++,
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
          type: InspectionImageTypeEnum.AFTER,
          order: orderCounter++,
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
      let uploadedImages: { imageUrl: string; caption: string; type: InspectionImageTypeEnum; order: number }[] = [];
      if (beforeImages.length > 0 || afterImages.length > 0) {
        uploadedImages = await uploadImages();
      }
      
      const followUpNotes = data.followUpNotes || undefined;

      // Only include mitigation if at least one field has content
      const hasMitigation = data.mitigation && (
        data.mitigation.eliminate ||
        data.mitigation.transfer ||
        data.mitigation.reduce ||
        data.mitigation.accept ||
        data.mitigation.legalAspect
      );

      const itemData: CreateInspectionItemDTO = {
        areaId: data.areaId,
        status: data.status,
        riskCategoryId: data.riskCategoryId,
        riskId: data.riskId,
        assignedDepartmentId: data.assignedDepartmentId,
        assigneeId: data.assigneeId || undefined,
        description: data.description || undefined,
        followUpNotes: followUpNotes,
        findings: data.findings || undefined,
        dueDateAt: data.dueDateAt || undefined,
        images: uploadedImages, // Add images to DTO
        mitigation: hasMitigation ? {
          eliminate: data.mitigation?.eliminate || undefined,
          transfer: data.mitigation?.transfer || undefined,
          reduce: data.mitigation?.reduce || undefined,
          accept: data.mitigation?.accept || undefined,
          legalAspect: data.mitigation?.legalAspect || undefined,
        } : undefined,
      };
      
      await onSubmit(itemData);
      
      // Clean up blob URLs
      [...beforeImages, ...afterImages].forEach(img => {
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

  // Determine which sections to show based on formMode
  const showCreatorSection = formMode === 'creator' || formMode === 'updater' || formMode === 'verifier';
  const showUpdaterSection = formMode === 'updater' || formMode === 'verifier';
  const showVerifierSection = formMode === 'verifier';
  
  // Helper to get field permission
  const getFieldPermission = (fieldName: string): FieldPermission => {
    return FIELD_PERMISSIONS[formMode]?.[fieldName] || 'hidden';
  };

  // Helper to get display values for read-only fields
  const getDisplayValue = useCallback((fieldName: string, fieldValue: string | null | undefined) => {
    switch (fieldName) {
      case 'areaId':
        return areaOptions.find(opt => opt.value === fieldValue)?.label || fieldValue || 'N/A';
      case 'riskCategoryId':
        return riskCategoryOptions.find(opt => opt.value === fieldValue)?.label || fieldValue || 'N/A';
      case 'riskId':
        return riskOptions.find(opt => opt.value === fieldValue)?.label || fieldValue || 'N/A';
      case 'assignedDepartmentId':
        return departmentOptions.find(opt => opt.value === fieldValue)?.label || fieldValue || 'N/A';
      case 'assigneeId':
        return userOptions.find(opt => opt.value === fieldValue)?.label || fieldValue || 'N/A';
      case 'dueDateAt':
        return fieldValue ? new Date(fieldValue).toLocaleDateString() : 'N/A';
      default:
        return fieldValue || 'N/A';
    }
  }, [areaOptions, riskCategoryOptions, riskOptions, departmentOptions, userOptions]);

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
        {/* Section 1: Creator Section - Area, Risk, Risk Category, Findings, Description, Due Date, Risk Mitigation */}
        {showCreatorSection && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {formMode === 'verifier' ? 'Section 1: Creator Information' : formMode === 'updater' ? 'Section 1: Inspection Item Details (Read Only)' : 'Inspection Item Details'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formMode === 'creator' && 'Fill in the inspection item details'}
                  {formMode === 'updater' && 'Inspection item details (read-only)'}
                  {formMode === 'verifier' && 'Information filled by the creator'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConditionalField
                  fieldName="areaId"
                  formMode={formMode}
                  readOnlyComponent={
                    <ReadOnlyField
                      label="Area"
                      value={getDisplayValue('areaId', form.watch('areaId'))}
                      required
                    />
                  }
                >
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Area <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={areaOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select area"
                            searchPlaceholder="Search area..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ConditionalField>

                {showVerifierSection && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={INSPECTION_ITEM_STATUS_OPTIONS.map(opt => ({
                              value: opt.value,
                              label: opt.label
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select status"
                            searchPlaceholder="Search status..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConditionalField
                  fieldName="riskCategoryId"
                  formMode={formMode}
                  readOnlyComponent={
                    <ReadOnlyField
                      label="Risk Category"
                      value={getDisplayValue('riskCategoryId', form.watch('riskCategoryId'))}
                      required
                    />
                  }
                >
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
                </ConditionalField>

                <ConditionalField
                  fieldName="riskId"
                  formMode={formMode}
                  readOnlyComponent={
                    <ReadOnlyField
                      label="Risk"
                      value={getDisplayValue('riskId', form.watch('riskId'))}
                      required
                    />
                  }
                >
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
                </ConditionalField>
              </div>

              {(showVerifierSection || formMode === 'updater') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ConditionalField
                    fieldName="assignedDepartmentId"
                    formMode={formMode}
                    readOnlyComponent={
                      <ReadOnlyField
                        label="Assigned Department"
                        value={getDisplayValue('assignedDepartmentId', form.watch('assignedDepartmentId'))}
                        required
                      />
                    }
                  >
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
                  </ConditionalField>

                  <ConditionalField
                    fieldName="assigneeId"
                    formMode={formMode}
                    readOnlyComponent={
                      <ReadOnlyField
                        label="Assignee"
                        value={getDisplayValue('assigneeId', form.watch('assigneeId'))}
                      />
                    }
                  >
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
                  </ConditionalField>
                </div>
              )}

              <ConditionalField
                fieldName="description"
                formMode={formMode}
                readOnlyComponent={
                  <ReadOnlyField
                    label="Description"
                    value={form.watch('description')}
                    multiline
                  />
                }
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter inspection item description (optional)"
                          rows={3}
                          {...field}
                          disabled={formMode === 'verifier' && !showVerifierSection}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ConditionalField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConditionalField
                  fieldName="findings"
                  formMode={formMode}
                  readOnlyComponent={
                    <ReadOnlyField
                      label="Findings"
                      value={form.watch('findings')}
                      multiline
                    />
                  }
                >
                  <FormField
                    control={form.control}
                    name="findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter findings from the inspection (optional)"
                            rows={4}
                            {...field}
                            disabled={formMode === 'verifier' && !showVerifierSection}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ConditionalField>

                <ConditionalField
                  fieldName="dueDateAt"
                  formMode={formMode}
                  readOnlyComponent={
                    <ReadOnlyField
                      label="Due Date"
                      value={getDisplayValue('dueDateAt', form.watch('dueDateAt'))}
                    />
                  }
                >
                  <FormField
                    control={form.control}
                    name="dueDateAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                            disabled={formMode === 'verifier' && !showVerifierSection}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ConditionalField>
              </div>

              <Separator />

              {/* Risk Mitigation Section - only for creator and verifier */}
              <div>
                <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
                {form.formState.errors.mitigation && (
                  <p className="text-sm font-medium text-destructive mb-4">
                    {(() => {
                      const error = form.formState.errors.mitigation;
                      const message = error && typeof error === 'object' && 'message' in error 
                        ? String(error.message) 
                        : null;
                      return message && message !== 'undefined' && message.trim() 
                        ? message 
                        : 'At least one risk mitigation field must be filled';
                    })()}
                  </p>
                )}
                {isLoadingRiskMitigations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading risk mitigation template...</span>
                    </div>
                  </div>
                ) : selectedRiskId ? (
                  <div className="space-y-4">
                    <ConditionalField
                      fieldName="mitigation"
                      formMode={formMode}
                      readOnlyComponent={
                        <div className="space-y-4">
                          <ReadOnlyField
                            label="Eliminate"
                            value={form.watch('mitigation.eliminate')}
                            multiline
                          />
                          <ReadOnlyField
                            label="Transfer"
                            value={form.watch('mitigation.transfer')}
                            multiline
                          />
                          <ReadOnlyField
                            label="Reduce"
                            value={form.watch('mitigation.reduce')}
                            multiline
                          />
                          <ReadOnlyField
                            label="Accept"
                            value={form.watch('mitigation.accept')}
                            multiline
                          />
                          <ReadOnlyField
                            label="Legal Aspect"
                            value={form.watch('mitigation.legalAspect')}
                            multiline
                          />
                        </div>
                      }
                    >
                      <>
                        <FormField
                          control={form.control}
                          name="mitigation.eliminate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Eliminate</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe elimination strategy..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={formMode === 'verifier' && !showVerifierSection}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mitigation.transfer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Transfer</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe transfer strategy..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={formMode === 'verifier' && !showVerifierSection}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mitigation.reduce"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Reduce</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe reduction strategy..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={formMode === 'verifier' && !showVerifierSection}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mitigation.accept"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Accept</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe acceptance strategy..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={formMode === 'verifier' && !showVerifierSection}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mitigation.legalAspect"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Legal Aspect</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter legal aspect (filled by approver)..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={formMode === 'verifier' && !showVerifierSection}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    </ConditionalField>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Please select a risk to enter mitigation strategies.
                  </div>
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Section 2: Updater Section - Image After and Follow-up Notes */}
        {showUpdaterSection && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {formMode === 'verifier' ? 'Section 2: Action Item Updates' : 'Update Action Item'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formMode === 'updater' && 'Update the action item with progress and images'}
                  {formMode === 'verifier' && 'Information filled by the action item updater'}
                </p>
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
                        disabled={isSubmitting || isUploadingImages || (formMode === 'verifier' && !showVerifierSection)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* After Images Section */}
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-base font-medium">After (After Fix/Action Plan)</FormLabel>
                  <p className="text-sm text-muted-foreground">Upload images showing the condition after fix/action plan has been implemented</p>
                </div>

                {/* Upload Button for After Images */}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleAfterImageSelect}
                    className="hidden"
                    id="inspection-after-image-upload"
                    disabled={isSubmitting || isUploadingImages || (formMode === 'verifier' && !showVerifierSection)}
                  />
                  <label htmlFor="inspection-after-image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting || isUploadingImages || (formMode === 'verifier' && !showVerifierSection)}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploadingImages ? 'Uploading...' : 'Add After Images'}
                      </span>
                    </Button>
                  </label>
                  {afterImages.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {afterImages.length} image{afterImages.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                {/* After Image Preview Grid */}
                {afterImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {afterImages.map((image) => (
                      <div key={image.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
                        <div className="aspect-video relative">
                          <img
                            src={image.url}
                            alt={image.caption || 'After inspection image'}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleRemoveAfterImage(image.id)}
                            disabled={isSubmitting || isUploadingImages || (formMode === 'verifier' && !showVerifierSection)}
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
                            onChange={(e) => handleAfterCaptionChange(image.id, e.target.value)}
                            disabled={isSubmitting || isUploadingImages || (formMode === 'verifier' && !showVerifierSection)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {afterImages.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                    <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">No after images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Section 3: Verifier Section - All fields editable */}
        {showVerifierSection && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Section 3: Verification</h3>
                <p className="text-sm text-muted-foreground">Verifier can adjust all fields</p>
              </div>

              {/* Before Images Section - only visible to verifier */}
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-base font-medium">Before (Current Condition)</FormLabel>
                  <p className="text-sm text-muted-foreground">Upload images showing the current condition before any fix/action plan</p>
                </div>

                {/* Upload Button for Before Images */}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleBeforeImageSelect}
                    className="hidden"
                    id="inspection-before-image-upload"
                    disabled={isSubmitting || isUploadingImages}
                  />
                  <label htmlFor="inspection-before-image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting || isUploadingImages}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploadingImages ? 'Uploading...' : 'Add Before Images'}
                      </span>
                    </Button>
                  </label>
                  {beforeImages.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {beforeImages.length} image{beforeImages.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                {/* Before Image Preview Grid */}
                {beforeImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {beforeImages.map((image) => (
                      <div key={image.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
                        <div className="aspect-video relative">
                          <img
                            src={image.url}
                            alt={image.caption || 'Before inspection image'}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleRemoveBeforeImage(image.id)}
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
                            onChange={(e) => handleBeforeCaptionChange(image.id, e.target.value)}
                            disabled={isSubmitting || isUploadingImages}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {beforeImages.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                    <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">No before images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Submit Buttons */}
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

