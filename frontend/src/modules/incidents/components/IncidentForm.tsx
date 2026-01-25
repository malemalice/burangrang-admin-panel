import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { Plus, Trash2 } from 'lucide-react';
import incidentsService from '../services/incidentsService';
import {
  CreateIncidentDTO,
  UpdateIncidentDTO,
  Incident,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  PriorityEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  SourceEnum,
  HasInjuredPersonEnum,
  HasWitnessEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
  CreateIncidentInjuredPersonDTO,
  CreateIncidentWitnessDTO,
  CreateIncidentAssetDTO,
  CreateIncidentImageDTO,
  CreateIncidentAttachmentDTO,
} from '../types/incident.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import areaService from '@/modules/master-data/services/areaService';
import { riskCategoryService, departmentService } from '@/modules/master-data';
import userService from '@/modules/users/services/userService';
import { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { RiskCategory, Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

// Schema for injured person
const injuredPersonSchema = z.object({
  hasInjuredPerson: z.nativeEnum(HasInjuredPersonEnum),
  injuredPersonName: z.string().optional(),
  gender: z.nativeEnum(GenderEnum).optional(),
  levelOfInjury: z.nativeEnum(LevelOfInjuryEnum).default(LevelOfInjuryEnum.NOT_SPECIFIED),
  injuredBodyPart: z.nativeEnum(InjuredBodyPartEnum).default(InjuredBodyPartEnum.NOT_SPECIFIED),
  typeOfInjury: z.nativeEnum(TypeOfInjuryEnum).default(TypeOfInjuryEnum.NOT_SPECIFIED),
  mechanismOfInjury: z.nativeEnum(MechanismOfInjuryEnum).default(MechanismOfInjuryEnum.NOT_SPECIFIED),
  departmentId: z.string().optional(),
});

// Schema for witness
const witnessSchema = z.object({
  hasWitness: z.nativeEnum(HasWitnessEnum),
  witnessName: z.string().optional(),
  gender: z.nativeEnum(GenderEnum).optional(),
  departmentId: z.string().optional(),
});

// Schema for asset
const assetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required'),
  assetCode: z.string().optional(),
});

// Schema for image
const imageSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL is required'),
  caption: z.string().optional(),
});

// Schema for attachment
const attachmentSchema = z.object({
  attachmentUrl: z.string().min(1, 'Attachment URL is required'),
});

// Main form schema
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  subject: z.string().min(1, 'Subject is required'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentLocation: z.string().min(1, 'Incident location is required'),
  areaId: z.string().min(1, 'Area is required'),
  incidentType: z.nativeEnum(IncidentTypeEnum),
  incidentClassification: z.nativeEnum(IncidentClassificationEnum),
  requesterId: z.string().min(1, 'Requester is required'),
  reportedBy: z.string().min(1, 'Reporter is required'),
  technicianId: z.string().optional(),
  priority: z.nativeEnum(PriorityEnum).default(PriorityEnum.NORMAL),
  riskCategoryId: z.string().min(1, 'Risk category is required'),
  description: z.string().optional(),
  controlMeasure: z.string().optional(),
  dueDate: z.string().optional(),
  expectedOutcome: z.string().optional(),
  needToStopActivity: z.nativeEnum(StopActivityEnum).default(StopActivityEnum.NOT_SPECIFIED),
  stopActivityDescription: z.string().optional(),
  treatment: z.nativeEnum(TreatmentEnum).default(TreatmentEnum.NOT_SPECIFIED),
  treatmentDescription: z.string().optional(),
  absence: z.nativeEnum(AbsenceEnum).default(AbsenceEnum.NOT_SPECIFIED),
  resolution: z.string().optional(),
  assignedDepartmentId: z.string().min(1, 'Assigned department is required'),
  assigneeId: z.string().optional(),
  status: z.nativeEnum(GeneralStatusEnum),
  source: z.nativeEnum(SourceEnum).default(SourceEnum.SYSTEM),
  isActive: z.boolean().default(true),
  injuredPersons: z.array(injuredPersonSchema).optional(),
  witnesses: z.array(witnessSchema).optional(),
  assets: z.array(assetSchema).optional(),
  images: z.array(imageSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IncidentFormProps {
  incident?: Incident;
  mode: 'create' | 'edit';
}

const IncidentForm = ({ incident, mode }: IncidentFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Reference data
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      subject: '',
      incidentDate: new Date().toISOString().split('T')[0],
      incidentLocation: '',
      areaId: '',
      incidentType: IncidentTypeEnum.NEAR_MISS,
      incidentClassification: IncidentClassificationEnum.MINOR,
      requesterId: '',
      reportedBy: '',
      technicianId: '',
      priority: PriorityEnum.NORMAL,
      riskCategoryId: '',
      description: '',
      controlMeasure: '',
      dueDate: '',
      expectedOutcome: '',
      needToStopActivity: StopActivityEnum.NOT_SPECIFIED,
      stopActivityDescription: '',
      treatment: TreatmentEnum.NOT_SPECIFIED,
      treatmentDescription: '',
      absence: AbsenceEnum.NOT_SPECIFIED,
      resolution: '',
      assignedDepartmentId: '',
      assigneeId: '',
      status: GeneralStatusEnum.DRAFT,
      source: SourceEnum.SYSTEM,
      isActive: true,
      injuredPersons: [],
      witnesses: [],
      assets: [],
      images: [],
      attachments: [],
    },
  });

  // Field arrays for nested data
  const {
    fields: injuredPersonFields,
    append: appendInjuredPerson,
    remove: removeInjuredPerson,
  } = useFieldArray({
    control: form.control,
    name: 'injuredPersons',
  });

  const {
    fields: witnessFields,
    append: appendWitness,
    remove: removeWitness,
  } = useFieldArray({
    control: form.control,
    name: 'witnesses',
  });

  const {
    fields: assetFields,
    append: appendAsset,
    remove: removeAsset,
  } = useFieldArray({
    control: form.control,
    name: 'assets',
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: 'images',
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
        const [areasRes, riskCategoriesRes, departmentsRes, usersRes] = await Promise.all([
          areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true } }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          userService.getUsers({ page: 1, limit: 100 }),
        ]);

        setAreas(areasRes.data);
        setRiskCategories(riskCategoriesRes.data);
        setDepartments(departmentsRes.data);
        setUsers(usersRes.data);

        // If editing, populate form with incident data
        if (incident && mode === 'edit') {
          form.reset({
            code: incident.code,
            subject: incident.subject,
            incidentDate: new Date(incident.incidentDate).toISOString().split('T')[0],
            incidentLocation: incident.incidentLocation,
            areaId: incident.areaId,
            incidentType: incident.incidentType,
            incidentClassification: incident.incidentClassification,
            requesterId: incident.requesterId,
            reportedBy: incident.reportedBy,
            technicianId: incident.technicianId || '',
            priority: incident.priority,
            riskCategoryId: incident.riskCategoryId,
            description: incident.description || '',
            controlMeasure: incident.controlMeasure || '',
            dueDate: incident.dueDate
              ? new Date(incident.dueDate).toISOString().split('T')[0]
              : '',
            expectedOutcome: incident.expectedOutcome || '',
            needToStopActivity: incident.needToStopActivity,
            stopActivityDescription: incident.stopActivityDescription || '',
            treatment: incident.treatment,
            treatmentDescription: incident.treatmentDescription || '',
            absence: incident.absence,
            resolution: incident.resolution || '',
            assignedDepartmentId: incident.assignedDepartmentId,
            assigneeId: incident.assigneeId || '',
            status: incident.status,
            source: incident.source,
            isActive: incident.isActive,
            injuredPersons:
              incident.injuredPersons?.map((p, index) => ({
                hasInjuredPerson: p.hasInjuredPerson,
                injuredPersonName: p.injuredPersonName || '',
                gender: p.gender,
                levelOfInjury: p.levelOfInjury,
                injuredBodyPart: p.injuredBodyPart,
                typeOfInjury: p.typeOfInjury,
                mechanismOfInjury: p.mechanismOfInjury,
                departmentId: p.departmentId || '',
              })) || [],
            witnesses:
              incident.witnesses?.map((w) => ({
                hasWitness: w.hasWitness,
                witnessName: w.witnessName || '',
                gender: w.gender,
                departmentId: w.departmentId || '',
              })) || [],
            assets:
              incident.assets?.map((a) => ({
                assetName: a.assetName,
                assetCode: a.assetCode || '',
              })) || [],
            images:
              incident.images?.map((i) => ({
                imageUrl: i.imageUrl,
                caption: i.caption || '',
              })) || [],
            attachments:
              incident.attachments?.map((a) => ({
                attachmentUrl: a.attachmentUrl,
              })) || [],
          });
        }

        setDataReady(true);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [incident, mode, form]);

  // Convert to SearchableSelectOption format
  const areaOptions: SearchableSelectOption[] = areas.map((area) => ({
    value: area.id,
    label: area.name,
  }));

  const riskCategoryOptions: SearchableSelectOption[] = riskCategories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const departmentOptions: SearchableSelectOption[] = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  const userOptions: SearchableSelectOption[] = users.map((user) => ({
    value: user.id,
    label: user.name || `${user.email}`,
  }));

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Transform form data to DTO
      const dto: CreateIncidentDTO | UpdateIncidentDTO = {
        code: data.code,
        subject: data.subject,
        incidentDate: new Date(data.incidentDate),
        incidentLocation: data.incidentLocation,
        areaId: data.areaId,
        incidentType: data.incidentType,
        incidentClassification: data.incidentClassification,
        requesterId: data.requesterId,
        reportedBy: data.reportedBy,
        technicianId: data.technicianId || undefined,
        priority: data.priority,
        riskCategoryId: data.riskCategoryId,
        description: data.description || undefined,
        controlMeasure: data.controlMeasure || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        expectedOutcome: data.expectedOutcome || undefined,
        needToStopActivity: data.needToStopActivity,
        stopActivityDescription: data.stopActivityDescription || undefined,
        treatment: data.treatment,
        treatmentDescription: data.treatmentDescription || undefined,
        absence: data.absence,
        resolution: data.resolution || undefined,
        assignedDepartmentId: data.assignedDepartmentId,
        assigneeId: data.assigneeId || undefined,
        status: data.status,
        source: data.source,
        isActive: data.isActive,
        injuredPersons:
          data.injuredPersons?.map((p, index) => ({
            hasInjuredPerson: p.hasInjuredPerson,
            injuredPersonName: p.injuredPersonName || undefined,
            gender: p.gender,
            levelOfInjury: p.levelOfInjury,
            injuredBodyPart: p.injuredBodyPart,
            typeOfInjury: p.typeOfInjury,
            mechanismOfInjury: p.mechanismOfInjury,
            departmentId: p.departmentId || undefined,
            order: index,
          })) || undefined,
        witnesses:
          data.witnesses?.map((w, index) => ({
            hasWitness: w.hasWitness,
            witnessName: w.witnessName || undefined,
            gender: w.gender,
            departmentId: w.departmentId || undefined,
            order: index,
          })) || undefined,
        assets:
          data.assets?.map((a, index) => ({
            assetName: a.assetName,
            assetCode: a.assetCode || undefined,
            order: index,
          })) || undefined,
        images:
          data.images?.map((i, index) => ({
            imageUrl: i.imageUrl,
            caption: i.caption || undefined,
            order: index,
          })) || undefined,
        attachments:
          data.attachments?.map((a, index) => ({
            attachmentUrl: a.attachmentUrl,
            order: index,
          })) || undefined,
      };

      if (mode === 'create') {
        await incidentsService.create(dto as CreateIncidentDTO);
        toast.success('Incident created successfully');
      } else if (incident) {
        await incidentsService.update(incident.id, dto as UpdateIncidentDTO);
        toast.success('Incident updated successfully');
      }
      navigate('/incidents');
    } catch (error: any) {
      console.error('Error saving incident:', error);
      const message = error.response?.data?.message || `Failed to ${mode} incident`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData && !dataReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Incident</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter incident code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter incident subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter incident location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Category *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={riskCategoryOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select risk category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select incident type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={IncidentTypeEnum.NEAR_MISS}>Near Miss</SelectItem>
                          <SelectItem value={IncidentTypeEnum.ACCIDENT}>Accident</SelectItem>
                          <SelectItem value={IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE}>
                            Dangerous or Hazardous Occurrence
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentClassification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select classification" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={IncidentClassificationEnum.MINOR}>Minor</SelectItem>
                          <SelectItem value={IncidentClassificationEnum.MAJOR}>Major</SelectItem>
                          <SelectItem value={IncidentClassificationEnum.FATALITY}>Fatality</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PriorityEnum.NOT_SPECIFIED}>Not Specified</SelectItem>
                          <SelectItem value={PriorityEnum.NORMAL}>Normal</SelectItem>
                          <SelectItem value={PriorityEnum.HIGH}>High</SelectItem>
                          <SelectItem value={PriorityEnum.VENDOR}>Vendor</SelectItem>
                          <SelectItem value={PriorityEnum.LONGER_TERM}>Longer Term</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={GeneralStatusEnum.DRAFT}>Draft</SelectItem>
                          <SelectItem value={GeneralStatusEnum.OPEN}>Open</SelectItem>
                          <SelectItem value={GeneralStatusEnum.SCHEDULED}>Scheduled</SelectItem>
                          <SelectItem value={GeneralStatusEnum.WAITING_APPROVAL}>Waiting Approval</SelectItem>
                          <SelectItem value={GeneralStatusEnum.DONE}>Done</SelectItem>
                          <SelectItem value={GeneralStatusEnum.REJECTED}>Rejected</SelectItem>
                          <SelectItem value={GeneralStatusEnum.CLOSE}>Close</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter incident description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* People Involved */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">People Involved</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="requesterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select requester"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reported By *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select reporter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptions}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="Select technician"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedDepartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Department *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={departmentOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select department"
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
                        <SearchableSelect
                          options={userOptions}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="Select assignee"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Control Measures & Outcomes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Control Measures & Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needToStopActivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Need to Stop Activity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={StopActivityEnum.NOT_SPECIFIED}>Not Specified</SelectItem>
                          <SelectItem value={StopActivityEnum.YES}>Yes</SelectItem>
                          <SelectItem value={StopActivityEnum.NO}>No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="treatment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select treatment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TreatmentEnum.NOT_SPECIFIED}>Not Specified</SelectItem>
                          <SelectItem value={TreatmentEnum.FIRST_AID}>First Aid</SelectItem>
                          <SelectItem value={TreatmentEnum.MEDICAL_TREATMENT}>Medical Treatment</SelectItem>
                          <SelectItem value={TreatmentEnum.HOSPITALIZATION}>Hospitalization</SelectItem>
                          <SelectItem value={TreatmentEnum.NO_TREATMENT}>No Treatment</SelectItem>
                          <SelectItem value={TreatmentEnum.OTHER}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="absence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Absence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select absence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AbsenceEnum.NOT_SPECIFIED}>Not Specified</SelectItem>
                          <SelectItem value={AbsenceEnum.NOT_YET_KNOWN}>Not Yet Known</SelectItem>
                          <SelectItem value={AbsenceEnum.RETURNED_AFTER_TREATMENT}>
                            Returned After Treatment
                          </SelectItem>
                          <SelectItem value={AbsenceEnum.MORE_THAN_THREE_DAYS}>
                            More Than Three Days
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="controlMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Control Measure</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter control measures"
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
                name="expectedOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Outcome</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter expected outcome"
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
                name="stopActivityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Activity Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter stop activity description"
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
                name="treatmentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter treatment description"
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
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter resolution"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Injured Persons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Injured Persons</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendInjuredPerson({
                      hasInjuredPerson: HasInjuredPersonEnum.YES,
                      injuredPersonName: '',
                      gender: undefined,
                      levelOfInjury: LevelOfInjuryEnum.NOT_SPECIFIED,
                      injuredBodyPart: InjuredBodyPartEnum.NOT_SPECIFIED,
                      typeOfInjury: TypeOfInjuryEnum.NOT_SPECIFIED,
                      mechanismOfInjury: MechanismOfInjuryEnum.NOT_SPECIFIED,
                      departmentId: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Injured Person
                </Button>
              </div>

              {injuredPersonFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Injured Person {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInjuredPerson(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.hasInjuredPerson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Has Injured Person</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={HasInjuredPersonEnum.YES}>Yes</SelectItem>
                                <SelectItem value={HasInjuredPersonEnum.NO}>No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.injuredPersonName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={GenderEnum.MALE}>Male</SelectItem>
                                <SelectItem value={GenderEnum.FEMALE}>Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.departmentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <SearchableSelect
                                options={departmentOptions}
                                value={field.value || ''}
                                onValueChange={field.onChange}
                                placeholder="Select department"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.levelOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level of Injury</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={LevelOfInjuryEnum.NOT_SPECIFIED}>
                                  Not Specified
                                </SelectItem>
                                <SelectItem value={LevelOfInjuryEnum.MINOR}>Minor</SelectItem>
                                <SelectItem value={LevelOfInjuryEnum.MODERATE}>Moderate</SelectItem>
                                <SelectItem value={LevelOfInjuryEnum.SEVERE}>Severe</SelectItem>
                                <SelectItem value={LevelOfInjuryEnum.FATAL}>Fatal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.injuredBodyPart`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Injured Body Part</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={InjuredBodyPartEnum.NOT_SPECIFIED}>
                                  Not Specified
                                </SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.HEAD}>Head</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.NECK}>Neck</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.ABDOMENT}>Abdomen</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.ARM}>Arm</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.FEET}>Feet</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.SHOULDER}>Shoulder</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.HAND}>Hand</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.LEG}>Leg</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.BACK}>Back</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.SKIN}>Skin</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.CHEST}>Chest</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.EYE}>Eye</SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.INTERNAL_ORGAN}>
                                  Internal Organ
                                </SelectItem>
                                <SelectItem value={InjuredBodyPartEnum.OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.typeOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Injury</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TypeOfInjuryEnum.NOT_SPECIFIED}>
                                  Not Specified
                                </SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.CUT}>Cut</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.BRUISE}>Bruise</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.FRACTURE}>Fracture</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.BURN}>Burn</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.SPRAIN}>Sprain</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.STRAIN}>Strain</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.LACERATION}>
                                  Laceration
                                </SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.CONCUSSION}>
                                  Concussion
                                </SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.mechanismOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mechanism of Injury</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={MechanismOfInjuryEnum.NOT_SPECIFIED}>
                                  Not Specified
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.STRUCK_BY}>
                                  Struck By
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.FAILING_OBJECT}>
                                  Failing Object
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.TRIP}>Trip</SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.SLIP}>Slip</SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.FALL}>Fall</SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.CHEMICAL}>
                                  Chemical
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.VEHICLES}>
                                  Vehicles
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.MECHINARY}>
                                  Machinery
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.ELECTRICITY}>
                                  Electricity
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.HAND_TOOLS}>
                                  Hand Tools
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.FALL_FROM_HEIGHT}>
                                  Fall From Height
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.FLYING_OBJECT}>
                                  Flying Object
                                </SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Witnesses</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendWitness({
                      hasWitness: HasWitnessEnum.YES,
                      witnessName: '',
                      gender: undefined,
                      departmentId: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Witness
                </Button>
              </div>

              {witnessFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Witness {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWitness(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.hasWitness`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Has Witness</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={HasWitnessEnum.YES}>Yes</SelectItem>
                                <SelectItem value={HasWitnessEnum.NO}>No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.witnessName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter witness name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={GenderEnum.MALE}>Male</SelectItem>
                                <SelectItem value={GenderEnum.FEMALE}>Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.departmentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <SearchableSelect
                                options={departmentOptions}
                                value={field.value || ''}
                                onValueChange={field.onChange}
                                placeholder="Select department"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Assets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Assets</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendAsset({
                      assetName: '',
                      assetCode: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </div>

              {assetFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Asset {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAsset(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`assets.${index}.assetName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter asset name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`assets.${index}.assetCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter asset code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Images</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendImage({
                      imageUrl: '',
                      caption: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
              </div>

              {imageFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Image {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`images.${index}.imageUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter image URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`images.${index}.caption`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caption</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter caption" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Attachments</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendAttachment({
                      attachmentUrl: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>

              {attachmentFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Attachment {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name={`attachments.${index}.attachmentUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attachment URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter attachment URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/incidents')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Incident' : 'Update Incident'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default IncidentForm;
