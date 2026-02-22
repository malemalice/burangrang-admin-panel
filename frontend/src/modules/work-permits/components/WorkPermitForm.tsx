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

  // Memoized options for SearchableSelect
  const areaOptions = useMemo(() => areas.map((a) => ({ value: a.id, label: a.name })), [areas]);
  const companyOptions = useMemo(() => companies.map((c) => ({ value: c.id, label: c.name })), [companies]);
  const guestOptions = useMemo(() => guests.map((g) => ({ value: g.id, label: g.name })), [guests]);
  const workerOptions = useMemo(
    () =>
      workerUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email ?? u.id,
      })),
    [workerUsers],
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

      await onSubmit(data as CreateWorkPermitDTO);
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
                  <FormLabel>Project Name *</FormLabel>
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
                    <FormLabel>Area *</FormLabel>
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
                    <FormLabel>Company *</FormLabel>
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
                    <FormLabel>Proposed Start Date *</FormLabel>
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
                    <FormLabel>Proposed End Date *</FormLabel>
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
                  <FormLabel>Work Stages Description *</FormLabel>
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
                  <FormLabel>Job Safety Analysis *</FormLabel>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Worker *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={workerOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select worker"
                            searchPlaceholder="Search worker..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                          <FormLabel>Health Declaration *</FormLabel>
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
    </Form>
  );
};

export default WorkPermitForm;
