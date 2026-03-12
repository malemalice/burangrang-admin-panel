import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { CreateWorkPermitDTO, UpdateWorkPermitDTO, WorkPermit, MasterDataOption, GuestOption } from '../types/work-permit.types';
import { toast } from 'sonner';
import uploadService from '@/modules/uploads/services/uploadService';
import { Loader2, Upload, X as XIcon } from 'lucide-react';
import workPermitService from '../services/workPermitService';
import { userService, type User } from '@/modules/users';
import { roleService } from '@/modules/roles';
import AddWorkerModal from './AddWorkerModal';
import { courseService, type Course } from '@/modules/courses';
import { safetyEquipmentService, type SafetyEquipment } from '@/modules/ppe';

// Form schema for validation
const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  areaId: z.string().min(1, 'Area is required'),
  companyId: z.string().min(1, 'Company is required'),
  proposedStartDate: z.string().min(1, 'Start date is required'),
  proposedEndDate: z.string().min(1, 'End date is required'),
  workStagesDescription: z.string().min(1, 'Work stages description is required'),
  jobSafetyAnalysis: z.string().min(1, 'Job safety analysis is required'),
  workRequirements: z.string().optional(),
  safetyGuideline: z.string().optional(),
  requireCourseVerification: z.boolean().default(false),
  classifications: z
    .array(
      z.object({
        workClassificationId: z.string().min(1, 'Work classification is required'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  employees: z
    .array(
      z.object({
        userId: z.string().optional(),
        employeeName: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  workers: z
    .array(
      z.object({
        userId: z.string().min(1, 'Worker is required'),
        idNumber: z.string().optional(),
        certificateUrl: z.string().optional(),
        healthDeclarationUrl: z.string().min(1, 'Health declaration is required'),
        order: z.number().min(0),
      }),
    )
    .min(1, 'At least one worker is required'),
  heavyEquipment: z
    .array(
      z.object({
        heavyEquipmentId: z.string().min(1, 'Heavy equipment is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  tools: z
    .array(
      z.object({
        toolId: z.string().min(1, 'Tool is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  materials: z
    .array(
      z.object({
        materialId: z.string().min(1, 'Material is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  machines: z
    .array(
      z.object({
        machineId: z.string().min(1, 'Machine is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  professions: z
    .array(
      z.object({
        professionId: z.string().min(1, 'Profession is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  requiredCourses: z
    .array(
      z.object({
        courseId: z.string().min(1, 'Course is required'),
        isRequired: z.boolean().default(true),
        order: z.number().min(0),
      }),
    )
    .optional(),
  hazards: z
    .array(
      z.object({
        hazardId: z.string().optional(),
        hazardName: z.string().min(1, 'Hazard name is required'),
        description: z.string().optional(),
        controlMeasure: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string().min(1, 'File URL is required'),
        fileName: z.string().min(1, 'File name is required'),
        fileType: z.string().optional(),
        description: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  supervisorIds: z.array(z.string()).optional(),
  hseOfficerIds: z.array(z.string()).optional(),
  safetyEquipmentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkPermitFormProps {
  workPermit?: WorkPermit;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateWorkPermitDTO | UpdateWorkPermitDTO) => Promise<void>;
}

const WorkPermitForm = ({ workPermit, mode, onSubmit }: WorkPermitFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areas, setAreas] = useState<MasterDataOption[]>([]);
  const [companies, setCompanies] = useState<MasterDataOption[]>([]);
  const [workClassifications, setWorkClassifications] = useState<MasterDataOption[]>([]);
  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [workerUsers, setWorkerUsers] = useState<User[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [heavyEquipment, setHeavyEquipment] = useState<MasterDataOption[]>([]);
  const [tools, setTools] = useState<MasterDataOption[]>([]);
  const [materials, setMaterials] = useState<MasterDataOption[]>([]);
  const [machines, setMachines] = useState<MasterDataOption[]>([]);
  const [professions, setProfessions] = useState<MasterDataOption[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [safetyEquipment, setSafetyEquipment] = useState<SafetyEquipment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [workPermitDocumentsCategoryId, setWorkPermitDocumentsCategoryId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [addWorkerForIndex, setAddWorkerForIndex] = useState<number | null>(null);
  const [addWorkerInitialName, setAddWorkerInitialName] = useState('');
  const [workerSearchQueries, setWorkerSearchQueries] = useState<Record<number, string>>({});

  // Memoized options for SearchableSelect
  const areaOptions = useMemo(() => areas.map((a) => ({ value: a.id, label: a.name })), [areas]);
  const companyOptions = useMemo(() => companies.map((c) => ({ value: c.id, label: c.name })), [companies]);
  const guestOptions = useMemo(() => guests.map((g) => ({ value: g.id, label: g.name })), [guests]);
  const workerOptions = useMemo(
    () =>
      workerUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || (u.email ?? u.id),
      })),
    [workerUsers],
  );

  const heavyEquipmentOptions = useMemo(
    () => heavyEquipment.map((e) => ({ value: e.id, label: `${e.name} (${e.code})` })),
    [heavyEquipment],
  );
  const toolOptions = useMemo(() => tools.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` })), [tools]);
  const materialOptions = useMemo(
    () => materials.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
    [materials],
  );
  const machineOptions = useMemo(
    () => machines.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
    [machines],
  );
  const professionOptions = useMemo(
    () => professions.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [professions],
  );
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title ?? c.slug ?? c.id })),
    [courses],
  );
  const supervisorOptions = useMemo(
    () => guests.map((g) => ({ value: g.id, label: g.name ?? g.email ?? g.id })),
    [guests],
  );
  const hseOfficerOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || (u.email ?? u.id),
      })),
    [users],
  );
  const safetyEquipmentOptions = useMemo(
    () => safetyEquipment.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
    [safetyEquipment],
  );
  const userOptionsForEmployee = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || (u.email ?? u.id),
      })),
    [users],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      areaId: '',
      companyId: '',
      proposedStartDate: '',
      proposedEndDate: '',
      workStagesDescription: '',
      jobSafetyAnalysis: '',
      workRequirements: '',
      safetyGuideline: '',
      requireCourseVerification: false,
      classifications: [],
      employees: [],
      workers: [
        {
          userId: '',
          idNumber: '',
          certificateUrl: '',
          healthDeclarationUrl: '',
          order: 0,
        },
      ],
      heavyEquipment: [],
      tools: [],
      materials: [],
      machines: [],
      professions: [],
      requiredCourses: [],
      hazards: [],
      attachments: [],
      supervisorIds: [],
      hseOfficerIds: [],
      safetyEquipmentIds: [],
    },
  });

  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({
    control: form.control,
    name: 'workers',
  });

  const {
    fields: classificationFields,
    append: appendClassification,
    remove: removeClassification,
  } = useFieldArray({
    control: form.control,
    name: 'classifications',
  });

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({
    control: form.control,
    name: 'employees',
  });

  const {
    fields: heavyEquipmentFields,
    append: appendHeavyEquipment,
    remove: removeHeavyEquipment,
  } = useFieldArray({
    control: form.control,
    name: 'heavyEquipment',
  });

  const {
    fields: toolFields,
    append: appendTool,
    remove: removeTool,
  } = useFieldArray({
    control: form.control,
    name: 'tools',
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const {
    fields: machineFields,
    append: appendMachine,
    remove: removeMachine,
  } = useFieldArray({
    control: form.control,
    name: 'machines',
  });

  const {
    fields: professionFields,
    append: appendProfession,
    remove: removeProfession,
  } = useFieldArray({
    control: form.control,
    name: 'professions',
  });

  const {
    fields: requiredCourseFields,
    append: appendRequiredCourse,
    remove: removeRequiredCourse,
  } = useFieldArray({
    control: form.control,
    name: 'requiredCourses',
  });

  const {
    fields: hazardFields,
    append: appendHazard,
    remove: removeHazard,
  } = useFieldArray({
    control: form.control,
    name: 'hazards',
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: 'attachments',
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch file category for work permit documents
        const category = await uploadService.getCategoryByName('work-permit-documents');
        if (category) {
          setWorkPermitDocumentsCategoryId(category.id);
        } else {
          toast.error('File category for work permit documents not found');
        }

        // Fetch master data from work permit service and other modules
        const [masterDataResponse, usersResponse, workerUsersResponse, coursesResponse, safetyEquipmentResponse] =
          await Promise.all([
            workPermitService.getMasterData().catch((error) => {
              console.error('Failed to fetch work permit master data:', error);
              return {
                areas: [],
                companies: [],
                workClassifications: [],
                guests: [],
                heavyEquipment: [],
                tools: [],
                materials: [],
                machines: [],
                professions: [],
              };
            }),
            userService.getUsers({ page: 1, limit: 100, options: true }).catch((error) => {
              console.error('Failed to fetch users:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
            (async () => {
              const roles = await roleService.getRoles({ page: 1, limit: 100, options: true }).catch(() => ({ data: [] }));
              const guestRole = roles.data?.find((r) => r.code === 'GUEST');
              if (!guestRole?.id) return { data: [] };
              return userService
                .getUsers({ page: 1, limit: 500, options: true, filters: { roleId: guestRole.id } })
                .catch((error) => {
                  console.error('Failed to fetch worker users (Guest role):', error);
                  return { data: [], meta: { total: 0, page: 1, limit: 500, pageCount: 0 } };
                });
            })(),
            courseService.getCourses({ page: 1, limit: 100, isActive: true }).catch((error) => {
              console.error('Failed to fetch courses:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
            safetyEquipmentService.getSafetyEquipments({ page: 1, limit: 100 }).catch((error) => {
              console.error('Failed to fetch safety equipment:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
          ]);

        // Set master data from work permit service
        setAreas(masterDataResponse.areas);
        setCompanies(masterDataResponse.companies);
        setWorkClassifications(masterDataResponse.workClassifications);
        setGuests(masterDataResponse.guests);
        setHeavyEquipment(masterDataResponse.heavyEquipment);
        setTools(masterDataResponse.tools);
        setMaterials(masterDataResponse.materials);
        setMachines(masterDataResponse.machines);
        setProfessions(masterDataResponse.professions);

        // Set data from other modules
        setUsers(usersResponse.data);
        setWorkerUsers(workerUsersResponse.data ?? []);
        setCourses(coursesResponse.data);
        setSafetyEquipment(safetyEquipmentResponse.data);
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (workPermit && mode === 'edit') {
      const workersData =
        workPermit.workers?.map((w) => ({
          userId: w.userId,
          idNumber: w.idNumber || '',
          certificateUrl: w.certificateUrl || '',
          healthDeclarationUrl: w.healthDeclarationUrl,
          order: w.order,
        })) || [
          {
            userId: '',
            idNumber: '',
            certificateUrl: '',
            healthDeclarationUrl: '',
            order: 0,
          },
        ];

      // Set uploaded file names for display
      const fileNames: Record<string, string> = {};
      workPermit.workers?.forEach((w, index) => {
        if (w.certificateUrl) {
          fileNames[`certificateUrl-${index}`] = 'Certificate file';
        }
        if (w.healthDeclarationUrl) {
          fileNames[`healthDeclarationUrl-${index}`] = 'Health declaration file';
        }
      });
      setUploadedFileNames(fileNames);

      form.reset({
        projectName: workPermit.projectName,
        areaId: workPermit.areaId,
        companyId: workPermit.companyId,
        proposedStartDate: workPermit.proposedStartDate.split('T')[0],
        proposedEndDate: workPermit.proposedEndDate.split('T')[0],
        workStagesDescription: workPermit.workStagesDescription,
        jobSafetyAnalysis: workPermit.jobSafetyAnalysis,
        workRequirements: workPermit.workRequirements || '',
        safetyGuideline: workPermit.safetyGuideline || '',
        requireCourseVerification: workPermit.requireCourseVerification,
        classifications:
          workPermit.classifications?.map((c) => ({
            workClassificationId: c.workClassificationId || c.id,
            order: c.order,
          })) || [],
        employees:
          workPermit.employees?.map((e) => ({
            userId: e.userId,
            employeeName: e.employeeName,
            order: e.order,
          })) || [],
        workers: workersData,
        heavyEquipment:
          workPermit.heavyEquipment?.map((e) => ({
            heavyEquipmentId: e.heavyEquipmentId,
            quantity: e.quantity,
            order: e.order,
          })) || [],
        tools:
          workPermit.tools?.map((t) => ({
            toolId: t.toolId,
            quantity: t.quantity,
            order: t.order,
          })) || [],
        materials:
          workPermit.materials?.map((m) => ({
            materialId: m.materialId,
            quantity: m.quantity,
            order: m.order,
          })) || [],
        machines:
          workPermit.machines?.map((m) => ({
            machineId: m.machineId,
            quantity: m.quantity,
            order: m.order,
          })) || [],
        professions:
          workPermit.professions?.map((p) => ({
            professionId: p.professionId,
            quantity: p.quantity,
            order: p.order,
          })) || [],
        requiredCourses:
          workPermit.requiredCourses?.map((c) => ({
            courseId: c.courseId,
            isRequired: c.isRequired,
            order: c.order,
          })) || [],
        hazards:
          workPermit.hazards?.map((h) => ({
            hazardId: h.hazardId,
            hazardName: h.hazardName,
            description: h.description || '',
            controlMeasure: h.controlMeasure || '',
            order: h.order,
          })) || [],
        attachments:
          workPermit.attachments?.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType || '',
            description: a.description || '',
            order: a.order,
          })) || [],
        supervisorIds: workPermit.supervisors?.map((s) => s.guestId) || [],
        hseOfficerIds: workPermit.hseOfficers?.map((h) => h.userId) || [],
        safetyEquipmentIds: workPermit.safetyEquipment?.map((s) => s.safetyEquipmentId) || [],
      });
    }
  }, [workPermit, mode, form]);

  const handleFileUpload = async (
    file: File,
    fieldName: 'certificateUrl' | 'healthDeclarationUrl',
    workerIndex: number,
  ) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    if (!workPermitDocumentsCategoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }

    const uploadKey = `${fieldName}-${workerIndex}`;
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const response = await uploadService.uploadFile(file, workPermitDocumentsCategoryId, false);

      // Get the file URL from response
      // Response from backend includes downloadUrl computed property
      const fileUrl = response.downloadUrl ||
        (response.isPublic
          ? uploadService.getPublicFileUrl(response.id)
          : uploadService.getPrivateFileUrl(response.accessToken || response.id));
      form.setValue(`workers.${workerIndex}.${fieldName}`, fileUrl);
      // Trigger validation to clear error message (WP-039)
      form.trigger(`workers.${workerIndex}.${fieldName}`);
      setUploadedFileNames((prev) => ({ ...prev, [uploadKey]: file.name }));
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleFileRemove = (fieldName: 'certificateUrl' | 'healthDeclarationUrl', workerIndex: number) => {
    const uploadKey = `${fieldName}-${workerIndex}`;
    form.setValue(`workers.${workerIndex}.${fieldName}`, '');
    setUploadedFileNames((prev) => {
      const newState = { ...prev };
      delete newState[uploadKey];
      return newState;
    });
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'certificateUrl' | 'healthDeclarationUrl',
    workerIndex: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, fieldName, workerIndex);
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!workPermitDocumentsCategoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }
    try {
      const response = await uploadService.uploadFile(file, workPermitDocumentsCategoryId, false);
      const fileUrl =
        response.downloadUrl ||
        (response.isPublic
          ? uploadService.getPublicFileUrl(response.id)
          : uploadService.getPrivateFileUrl(response.accessToken || response.id));
      appendAttachment({
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        description: '',
        order: attachmentFields.length,
      });
      toast.success('Attachment uploaded');
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    }
  };

  const sanitizeHazards = (hazards: FormValues['hazards']) => {
    if (!hazards?.length) {
      return [];
    }

    return hazards
      .map((hazard, index) => ({
        ...hazard,
        hazardId: hazard.hazardId?.trim() || undefined,
        hazardName: hazard.hazardName.trim(),
        description: hazard.description?.trim() || undefined,
        controlMeasure: hazard.controlMeasure?.trim() || undefined,
        order: index,
      }))
      .filter((hazard) => {
        const hasHazardName = hazard.hazardName.length > 0;
        const hasOtherValues = Boolean(hazard.description || hazard.controlMeasure || hazard.hazardId);

        return hasHazardName || hasOtherValues;
      });
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Validate dates
      const startDate = new Date(data.proposedStartDate);
      const endDate = new Date(data.proposedEndDate);

      if (endDate < startDate) {
        toast.error('End date must be on or after start date');
        setIsSubmitting(false);
        return;
      }

      const sanitizedData: FormValues = {
        ...data,
        hazards: sanitizeHazards(data.hazards),
      };

      await onSubmit(sanitizedData as CreateWorkPermitDTO);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Section 1: Permit Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Identity</CardTitle>
            <CardDescription>Basic permit information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <SearchableSelect
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
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={companyOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select company"
                        searchPlaceholder="Search company..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proposedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Start Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DateTimePicker mode="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed End Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DateTimePicker mode="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Project and Work */}
        <Card>
          <CardHeader>
            <CardTitle>Project and Work</CardTitle>
            <CardDescription>Project and work details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="workStagesDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Stages Description <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe work stages..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobSafetyAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Safety Analysis <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Job safety analysis..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Requirements</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Work requirements..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="safetyGuideline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safety Guideline</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Safety guidelines..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Work Classifications</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendClassification({ workClassificationId: '', order: classificationFields.length })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Classification
                </Button>
              </div>
              {classificationFields.map((field, index) => {
                // Get all classification values from form for reactive updates
                const allClassificationValues = form.watch('classifications') || [];

                // Get already selected classification IDs (excluding current field)
                const selectedIds = allClassificationValues
                  .filter((_, i) => i !== index)
                  .map((c) => c?.workClassificationId)
                  .filter(Boolean);

                return (
                  <div key={field.id} className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`classifications.${index}.workClassificationId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select classification" />
                              </SelectTrigger>
                              <SelectContent>
                                {workClassifications
                                  .filter((wc) => !selectedIds.includes(wc.id) || wc.id === field.value)
                                  .map((wc) => (
                                    <SelectItem key={wc.id} value={wc.id}>
                                      {wc.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeClassification(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Workers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Workers</CardTitle>
              <CardDescription>List of workers assigned to this permit</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendWorker({
                  userId: '',
                  idNumber: '',
                  certificateUrl: '',
                  healthDeclarationUrl: '',
                  order: workerFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Worker
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {workerFields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Worker {index + 1}</h4>
                    {workerFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeWorker(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name={`workers.${index}.userId`}
                    render={({ field }) => {
                      const searchQ = workerSearchQueries[index] ?? '';
                      const optionsFiltered =
                        searchQ.trim() === ''
                          ? workerOptions
                          : workerOptions.filter((o) =>
                            o.label.toLowerCase().includes(searchQ.toLowerCase()),
                          );
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Worker <span className="text-destructive">*</span></FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-sm"
                              onClick={() => {
                                setAddWorkerForIndex(index);
                                setAddWorkerInitialName('');
                                setAddWorkerModalOpen(true);
                              }}
                            >
                              Add new worker
                            </Button>
                          </div>
                          <FormControl>
                            <SearchableSelect
                              options={optionsFiltered}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select worker"
                              searchPlaceholder="Search worker..."
                              onSearch={(q) =>
                                setWorkerSearchQueries((prev) => ({ ...prev, [index]: q }))
                              }
                              onCreateNew={(query) => {
                                setAddWorkerForIndex(index);
                                setAddWorkerInitialName(query);
                                setAddWorkerModalOpen(true);
                              }}
                              createNewText="Add new worker"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name={`workers.${index}.idNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Worker ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`workers.${index}.certificateUrl`}
                    render={({ field }) => {
                      const uploadKey = `certificateUrl-${index}`;
                      const isUploading = uploadingFiles[uploadKey] || false;
                      const uploadedFileName = uploadedFileNames[uploadKey];
                      const hasFile = uploadedFileName || field.value;

                      return (
                        <FormItem>
                          <FormLabel>Certificate</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {hasFile ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                                  <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {uploadedFileName || 'Certificate file uploaded'}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileRemove('certificateUrl', index)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                                    disabled={isUploading}
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                                      input.onchange = (e) => {
                                        handleFileInputChange(
                                          e as any,
                                          'certificateUrl',
                                          index,
                                        );
                                      };
                                      input.click();
                                    }}
                                    disabled={isUploading || !workPermitDocumentsCategoryId}
                                    className="cursor-pointer"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose File
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                              <input type="hidden" {...field} />
                            </div>
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Upload PDF, DOC, DOCX, or image files (max 10MB)
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name={`workers.${index}.healthDeclarationUrl`}
                    render={({ field }) => {
                      const uploadKey = `healthDeclarationUrl-${index}`;
                      const isUploading = uploadingFiles[uploadKey] || false;
                      const uploadedFileName = uploadedFileNames[uploadKey];
                      const hasFile = uploadedFileName || field.value;

                      return (
                        <FormItem>
                          <FormLabel>Health Declaration <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {hasFile ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                                  <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {uploadedFileName || 'Health declaration file uploaded'}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileRemove('healthDeclarationUrl', index)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                                    disabled={isUploading}
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                                      input.onchange = (e) => {
                                        handleFileInputChange(
                                          e as any,
                                          'healthDeclarationUrl',
                                          index,
                                        );
                                      };
                                      input.click();
                                    }}
                                    disabled={isUploading || !workPermitDocumentsCategoryId}
                                    className="cursor-pointer"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose File
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                              <input type="hidden" {...field} />
                            </div>
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Upload PDF, DOC, DOCX, or image files (max 10MB)
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Section: Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Employees assigned to this permit</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendEmployee({
                  userId: '',
                  employeeName: '',
                  order: employeeFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`employees.${index}.userId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel>User</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptionsForEmployee}
                          value={f.value ?? ''}
                          onValueChange={f.onChange}
                          placeholder="Select user (optional)"
                          searchPlaceholder="Search user..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`employees.${index}.employeeName`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Employee Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name (if not from user)" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmployee(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 4: Course Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Course Verification</CardTitle>
            <CardDescription>Require course verification for workers</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="requireCourseVerification"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Require Course Verification</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Require workers/employees to complete required courses
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Heavy Equipment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Heavy Equipment</CardTitle>
              <CardDescription>Heavy equipment for this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendHeavyEquipment({
                  heavyEquipmentId: '',
                  quantity: 1,
                  order: heavyEquipmentFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {heavyEquipmentFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`heavyEquipment.${index}.heavyEquipmentId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={heavyEquipmentOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select heavy equipment"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`heavyEquipment.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...f}
                          onChange={(e) => f.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeHeavyEquipment(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>Tools required for this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendTool({
                  toolId: '',
                  quantity: 1,
                  order: toolFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {toolFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`tools.${index}.toolId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={toolOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select tool"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`tools.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...f}
                          onChange={(e) => f.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeTool(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Materials</CardTitle>
              <CardDescription>Materials required for this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendMaterial({
                  materialId: '',
                  quantity: 1,
                  order: materialFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {materialFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`materials.${index}.materialId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={materialOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select material"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`materials.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...f}
                          onChange={(e) => f.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Machines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Machines</CardTitle>
              <CardDescription>Machines required for this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendMachine({
                  machineId: '',
                  quantity: 1,
                  order: machineFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {machineFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`machines.${index}.machineId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={machineOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select machine"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`machines.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...f}
                          onChange={(e) => f.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMachine(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Professions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Professions</CardTitle>
              <CardDescription>Professions required for this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendProfession({
                  professionId: '',
                  quantity: 1,
                  order: professionFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {professionFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`professions.${index}.professionId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={professionOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select profession"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`professions.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...f}
                          onChange={(e) => f.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProfession(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Required Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Required Courses</CardTitle>
              <CardDescription>Courses required for workers on this project</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendRequiredCourse({
                  courseId: '',
                  isRequired: true,
                  order: requiredCourseFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredCourseFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`requiredCourses.${index}.courseId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <SearchableSelect
                          options={courseOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select course"
                          searchPlaceholder="Search..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`requiredCourses.${index}.isRequired`}
                  render={({ field: f }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={f.value} onCheckedChange={f.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Required</FormLabel>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRequiredCourse(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hazards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Hazards</CardTitle>
              <CardDescription>Identify hazards and control measures</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendHazard({
                  hazardId: '',
                  hazardName: '',
                  description: '',
                  controlMeasure: '',
                  order: hazardFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Hazard
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {hazardFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeHazard(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`hazards.${index}.hazardName`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Hazard Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Hazard name" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`hazards.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Description" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`hazards.${index}.controlMeasure`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Control Measure</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Control measure" rows={2} {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Attach documents for this work permit</CardDescription>
            </div>
            <div>
              <input
                type="file"
                id="attachment-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachmentUpload(file);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('attachment-upload')?.click()}
                disabled={!workPermitDocumentsCategoryId}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {attachmentFields.map((field, index) => (
              <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{form.watch(`attachments.${index}.fileName`)}</p>
                  <FormField
                    control={form.control}
                    name={`attachments.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Description (optional)" className="mt-1" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeAttachment(index)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supervisors */}
        <Card>
          <CardHeader>
            <CardTitle>Supervisors</CardTitle>
            <CardDescription>Select supervisors (guests) for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              {(form.watch('supervisorIds') ?? []).map((id) => {
                const guest = guests.find((g) => g.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {guest?.name ?? guest?.email ?? id}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        const current = form.getValues('supervisorIds') ?? [];
                        form.setValue(
                          'supervisorIds',
                          current.filter((x) => x !== id),
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              <div className="flex-1 min-w-[200px]">
                <SearchableSelect
                  options={supervisorOptions.filter(
                    (o) => !(form.watch('supervisorIds') ?? []).includes(o.value),
                  )}
                  value=""
                  onValueChange={(value) => {
                    if (!value) return;
                    const current = form.getValues('supervisorIds') ?? [];
                    if (!current.includes(value)) {
                      form.setValue('supervisorIds', [...current, value]);
                    }
                  }}
                  placeholder="Add supervisor..."
                  searchPlaceholder="Search guest..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HSE Officers */}
        <Card>
          <CardHeader>
            <CardTitle>HSE Officers</CardTitle>
            <CardDescription>Select HSE officers (users) for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              {(form.watch('hseOfficerIds') ?? []).map((id) => {
                const user = users.find((u) => u.id === id);
                const label = user
                  ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
                  : id;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {label}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        const current = form.getValues('hseOfficerIds') ?? [];
                        form.setValue(
                          'hseOfficerIds',
                          current.filter((x) => x !== id),
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              <div className="flex-1 min-w-[200px]">
                <SearchableSelect
                  options={hseOfficerOptions.filter(
                    (o) => !(form.watch('hseOfficerIds') ?? []).includes(o.value),
                  )}
                  value=""
                  onValueChange={(value) => {
                    if (!value) return;
                    const current = form.getValues('hseOfficerIds') ?? [];
                    if (!current.includes(value)) {
                      form.setValue('hseOfficerIds', [...current, value]);
                    }
                  }}
                  placeholder="Add HSE officer..."
                  searchPlaceholder="Search user..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Safety Equipment</CardTitle>
            <CardDescription>Select safety equipment required for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              {(form.watch('safetyEquipmentIds') ?? []).map((id) => {
                const eq = safetyEquipment.find((s) => s.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {eq ? `${eq.name} (${eq.code})` : id}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        const current = form.getValues('safetyEquipmentIds') ?? [];
                        form.setValue(
                          'safetyEquipmentIds',
                          current.filter((x) => x !== id),
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              <div className="flex-1 min-w-[200px]">
                <SearchableSelect
                  options={safetyEquipmentOptions.filter(
                    (o) => !(form.watch('safetyEquipmentIds') ?? []).includes(o.value),
                  )}
                  value=""
                  onValueChange={(value) => {
                    if (!value) return;
                    const current = form.getValues('safetyEquipmentIds') ?? [];
                    if (!current.includes(value)) {
                      form.setValue('safetyEquipmentIds', [...current, value]);
                    }
                  }}
                  placeholder="Add safety equipment..."
                  searchPlaceholder="Search..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Work Permit' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <AddWorkerModal
        open={addWorkerModalOpen}
        onOpenChange={(open) => {
          setAddWorkerModalOpen(open);
          if (!open) {
            setAddWorkerForIndex(null);
            setAddWorkerInitialName('');
          }
        }}
        initialName={addWorkerInitialName}
        onSuccess={(user: User) => {
          setWorkerUsers((prev) => [...prev, user]);
          if (addWorkerForIndex !== null) {
            form.setValue(`workers.${addWorkerForIndex}.userId`, user.id);
          }
          setAddWorkerForIndex(null);
          setAddWorkerInitialName('');
        }}
      />
    </Form>
  );
};

export default WorkPermitForm;
