import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/core/lib/auth';
import approvalService from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import { ApprovalStatus } from '@/core/lib/types';
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
import { Checkbox } from '@/core/components/ui/checkbox';
import { Badge } from '@/core/components/ui/badge';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Plus, Trash2, FileText, Users, ShieldCheck, AlertTriangle, Eye, Package, Image, Paperclip, X, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import incidentsService from '../services/incidentsService';
import uploadService, { FileCategory } from '@/modules/uploads/services/uploadService';
import safetyEquipmentService from '@/modules/ppe/services/safetyEquipmentService';
import api from '@/core/lib/api';
import {
  CreateIncidentDTO,
  UpdateIncidentDTO,
  Incident,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  IncidentActivitiesEnum,
  PriorityEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  SourceEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
  CreateIncidentInjuredPersonDTO,
  CreateIncidentWitnessDTO,
  CreateIncidentThirdPartyDTO,
  CreateIncidentAssetDTO,
  CreateIncidentImageDTO,
  CreateIncidentAttachmentDTO,
  EquipmentEntityEnum,
} from '../types/incident.types';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { ROLE_CODES } from '@/shared/constants/role-codes.constants';
import areaService from '@/modules/master-data/services/areaService';
import { riskCategoryService, departmentService, roomService } from '@/modules/master-data';
import userService from '@/modules/users/services/userService';
import roleService from '@/modules/roles/services/roleService';
import { AreaDTO, RoomDTO } from '@/modules/master-data/types/master-data.types';
import { RiskCategory, Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

// Generate incident code: ICD + YYMMDDHHmmss
// Includes seconds to reduce collision probability
const generateIncidentCode = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `ICD${year}${month}${date}${hour}${minute}${second}`;
};

// Schema for injured person - gender allows blank (empty string) to match create behavior
const injuredPersonSchema = z.object({
  injuredPersonName: z.string().optional(),
  gender: z.union([z.nativeEnum(GenderEnum), z.literal(''), z.null(), z.undefined()]).optional().transform((val) => (val === '' || val === null ? undefined : val)),
  levelOfInjury: z.nativeEnum(LevelOfInjuryEnum).default(LevelOfInjuryEnum.NOT_SPECIFIED),
  injuredBodyPart: z.nativeEnum(InjuredBodyPartEnum).default(InjuredBodyPartEnum.NOT_SPECIFIED),
  typeOfInjury: z.nativeEnum(TypeOfInjuryEnum).default(TypeOfInjuryEnum.NOT_SPECIFIED),
  mechanismOfInjury: z.nativeEnum(MechanismOfInjuryEnum).default(MechanismOfInjuryEnum.NOT_SPECIFIED),
  position: z.string().optional(),
  departmentId: z.string().optional(),
});

// Schema for witness - gender allows blank (empty string) to match create behavior
const witnessSchema = z.object({
  witnessName: z.string().optional(),
  gender: z.union([z.nativeEnum(GenderEnum), z.literal(''), z.null(), z.undefined()]).optional().transform((val) => (val === '' || val === null ? undefined : val)),
  position: z.string().optional(),
  departmentId: z.string().optional(),
});

// Schema for third party - external persons involved (contractors, visitors)
const thirdPartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.union([z.nativeEnum(GenderEnum), z.literal(''), z.null(), z.undefined()]).optional().transform((val) => (val === '' || val === null ? undefined : val)),
  company: z.string().optional(),
  position: z.string().optional(),
});

// Schema for asset - quantity allows blank (empty string) to match create behavior
const assetSchema = z.object({
  entity: z.nativeEnum(EquipmentEntityEnum),
  entityId: z.string().min(1, 'Asset selection is required'),
  assetName: z.string().min(1, 'Asset name is required'),
  assetCode: z.string().optional(),
  brand: z.string().optional(),
  quantity: z.union([
    z.number().int().positive(),
    z.string(),
    z.null(),
    z.undefined(),
  ]).optional().transform((val) => {
    if (val === '' || val === undefined || val === null) return undefined;
    const num = typeof val === 'number' ? val : Number(val);
    return isNaN(num) || num < 1 ? undefined : Math.floor(num);
  }),
});

// Main form schema
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  subject: z.string().min(1, 'Subject is required'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  roomId: z.string().optional(),
  areaId: z.string().min(1, 'Area is required'),
  incidentType: z.nativeEnum(IncidentTypeEnum),
  incidentClassification: z.nativeEnum(IncidentClassificationEnum),
  requesterId: z.string().min(1, 'Requester is required'),
  reportedBy: z.string().min(1, 'Reporter is required'),
  technicianId: z.string().optional(),
  priority: z.nativeEnum(PriorityEnum).default(PriorityEnum.NORMAL),
  riskCategoryId: z.string().min(1, 'Type of hazard is required'),
  description: z.string().optional(),
  controlMeasure: z.string().optional(),
  dueDate: z.string().optional(),
  expectedOutcome: z.string().optional(),
  needToStopActivity: z.nativeEnum(StopActivityEnum).default(StopActivityEnum.NOT_SPECIFIED),
  stopLocally: z.boolean().default(false),
  stopWholeSchool: z.boolean().default(false),
  treatment: z.nativeEnum(TreatmentEnum).default(TreatmentEnum.NOT_SPECIFIED),
  treatmentDescription: z.string().optional(),
  absence: z.nativeEnum(AbsenceEnum).default(AbsenceEnum.NOT_SPECIFIED),
  resolution: z.string().optional(),
  needFurtherInvestigation: z.boolean().default(false),
  assignedDepartmentId: z.string().min(1, 'Assigned department is required'),
  assigneeId: z.string().optional(),
  status: z.nativeEnum(GeneralStatusEnum),
  source: z.nativeEnum(SourceEnum).default(SourceEnum.SYSTEM),
  isActive: z.boolean().default(true),
  injuredPersons: z.array(injuredPersonSchema).optional(),
  witnesses: z.array(witnessSchema).optional(),
  thirdParties: z.array(thirdPartySchema).optional(),
  assets: z.array(assetSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type IncidentFormMode = 'creator' | 'investigator' | 'approver';

interface IncidentFormProps {
  incident?: Incident;
  mode: 'create' | 'edit';
  entryMode?: IncidentFormMode;
}

const IncidentForm = ({ incident, mode, entryMode }: IncidentFormProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [resolvedMode, setResolvedMode] = useState<IncidentFormMode>('creator');
  const [canApprove, setCanApprove] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approverActivities, setApproverActivities] = useState<IncidentActivitiesEnum>(IncidentActivitiesEnum.WORK);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [roleFetched, setRoleFetched] = useState(false);

  // Reference data
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  
  // Equipment data
  const [assets, setAssets] = useState<Array<{ id: string; name: string; code: string; brand?: string }>>([]);
  const [heavyEquipments, setHeavyEquipments] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [safetyEquipments, setSafetyEquipments] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: mode === 'create' ? generateIncidentCode() : '',
      subject: '',
      incidentDate: new Date().toISOString().split('T')[0],
      roomId: '',
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
      stopLocally: false,
      stopWholeSchool: false,
      treatment: TreatmentEnum.NOT_SPECIFIED,
      treatmentDescription: '',
      absence: AbsenceEnum.NOT_SPECIFIED,
      resolution: '',
      needFurtherInvestigation: false,
      assignedDepartmentId: '',
      assigneeId: '',
      status: GeneralStatusEnum.DRAFT,
      source: SourceEnum.SYSTEM,
      isActive: true,
      injuredPersons: [],
      witnesses: [],
      thirdParties: [],
      assets: [],
    },
  });

  // Fetch current user role: only SUPER_ADMIN can create/update status to any value; others only OPEN or CLOSE
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        let roleCode: string | null = null;
        if (userData.role && typeof userData.role === 'object' && 'code' in userData.role) {
          roleCode = userData.role.code;
        }
        if (!roleCode && userData.roleId) {
          const role = await roleService.getRoleById(userData.roleId);
          roleCode = role.code;
        }
        setIsSuperUser(roleCode === ROLE_CODES.SUPER_ADMIN);
      } catch {
        setIsSuperUser(false);
      } finally {
        setRoleFetched(true);
      }
    };
    fetchUserRole();
  }, [currentUser?.id]);

  // Non-super-user can only create with OPEN or CLOSE; default create to OPEN
  useEffect(() => {
    if (roleFetched && !isSuperUser && mode === 'create') {
      form.setValue('status', GeneralStatusEnum.OPEN);
    }
  }, [roleFetched, isSuperUser, mode, form]);

  // Image/attachment upload state (drag-and-drop, multi-file like InspectionItemForm)
  interface ImageUploadItem {
    id: string;
    url: string;
    caption: string;
    file?: File;
    isNew?: boolean;
  }
  interface AttachmentUploadItem {
    id: string;
    url: string;
    file?: File;
    isNew?: boolean;
    name?: string;
  }
  const [imageUploads, setImageUploads] = useState<ImageUploadItem[]>([]);
  const [attachmentUploads, setAttachmentUploads] = useState<AttachmentUploadItem[]>([]);
  const [fileCategory, setFileCategory] = useState<FileCategory | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [imageDropActive, setImageDropActive] = useState(false);
  const [attachmentDropActive, setAttachmentDropActive] = useState(false);

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
    fields: thirdPartyFields,
    append: appendThirdParty,
    remove: removeThirdParty,
  } = useFieldArray({
    control: form.control,
    name: 'thirdParties',
  });

  const {
    fields: assetFields,
    append: appendAsset,
    remove: removeAsset,
  } = useFieldArray({
    control: form.control,
    name: 'assets',
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // First, fetch roles to find TECHNICIAN role (handle 403 gracefully)
        let technicianRole = null;
        try {
          const rolesRes = await roleService.getRoles({ page: 1, limit: 100, options: true });
          technicianRole = rolesRes.data.find(role => role.code === 'TECHNICIAN');
        } catch (error) {
          console.warn('Failed to fetch roles (may not have permission):', error);
          // Continue without technician role filtering
        }
        
        // Fetch users, technicians, and equipment data in parallel
        const [areasRes, riskCategoriesRes, departmentsRes, usersRes, techniciansRes, safetyEquipmentsRes, workPermitsMasterDataRes, assetsRes] = await Promise.all([
          areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true }, options: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
          departmentService.getDepartments({ page: 1, limit: 100, options: true }),
          userService.getUsers({ page: 1, limit: 100, options: true }),
          // Fetch technicians: users with TECHNICIAN role and job position
          technicianRole 
            ? userService.getUsers({ 
                page: 1, 
                limit: 100, 
                filters: { roleId: technicianRole.id },
                options: true
              })
            : Promise.resolve({ data: [], meta: { total: 0 } }),
          // Fetch safety equipments
          safetyEquipmentService.getSafetyEquipments({ page: 1, limit: 100, filters: { isActive: true } }),
          // Fetch work permits master data for heavy equipment
          api.get('/work-permits/master-data').catch(() => ({ data: { heavyEquipment: [] } })),
          // Fetch master assets
          api.get('/assets?page=1&limit=100&isActive=true').catch(() => ({ data: { data: [], meta: { total: 0 } } })),
        ]);

        setAreas(areasRes.data);
        setRiskCategories(riskCategoriesRes.data);
        setDepartments(departmentsRes.data);
        setUsers(usersRes.data);
        
        // Filter technicians to only those with job position
        const techniciansWithJob = techniciansRes.data.filter(user => user.jobPositionId);
        setTechnicians(techniciansWithJob);
        
        // Set equipment data
        setSafetyEquipments(safetyEquipmentsRes.data.map((eq: any) => ({
          id: eq.id,
          name: eq.name,
          code: eq.code,
        })));
        setHeavyEquipments(workPermitsMasterDataRes.data?.heavyEquipment?.map((eq: any) => ({
          id: eq.id,
          name: eq.name,
          code: eq.code,
        })) || []);
        // Set master assets
        setAssets(assetsRes.data?.data?.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          code: asset.code,
          brand: asset.brand,
        })) || []);

        // If editing, populate form with incident data
        if (incident && mode === 'edit') {
          form.reset({
            code: incident.code,
            subject: incident.subject,
            incidentDate: new Date(incident.incidentDate).toISOString().split('T')[0],
            roomId: incident.roomId || '',
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
            stopLocally: incident.stopLocally ?? false,
            stopWholeSchool: incident.stopWholeSchool ?? false,
            treatment: incident.treatment,
            treatmentDescription: incident.treatmentDescription || '',
            absence: incident.absence,
            resolution: incident.resolution || '',
            needFurtherInvestigation: incident.needFurtherInvestigation ?? false,
            assignedDepartmentId: incident.assignedDepartmentId,
            assigneeId: incident.assigneeId || '',
            status: incident.status,
            source: incident.source,
            isActive: incident.isActive,
            injuredPersons:
              incident.injuredPersons?.map((p, index) => ({
                injuredPersonName: p.injuredPersonName || '',
                gender: p.gender ?? undefined,
                levelOfInjury: p.levelOfInjury,
                injuredBodyPart: p.injuredBodyPart,
                typeOfInjury: p.typeOfInjury,
                mechanismOfInjury: p.mechanismOfInjury,
                position: p.position || '',
                departmentId: p.departmentId || '',
              })) || [],
            witnesses:
              incident.witnesses?.map((w) => ({
                witnessName: w.witnessName || '',
                gender: w.gender ?? undefined,
                position: w.position || '',
                departmentId: w.departmentId || '',
              })) || [],
            thirdParties:
              incident.thirdParties?.map((tp) => ({
                name: tp.name || '',
                gender: tp.gender ?? undefined,
                company: tp.company || '',
                position: tp.position || '',
              })) || [],
            assets:
              incident.assets?.map((a, index) => {
                // Derive entityId from relation when present; otherwise use placeholder so dropdown can show prefilled label (API may return entity/entityId null for old data)
                const resolvedEntityId =
                  a.entityId ||
                  (a as { asset?: { id: string }; heavyEquipment?: { id: string }; safetyEquipment?: { id: string } }).asset?.id ||
                  (a as { heavyEquipment?: { id: string } }).heavyEquipment?.id ||
                  (a as { safetyEquipment?: { id: string } }).safetyEquipment?.id;
                const entityId = resolvedEntityId || `__prefilled_${index}`;
                return {
                  entity: a.entity || EquipmentEntityEnum.ASSET,
                  entityId,
                  assetName: a.assetName,
                  assetCode: a.assetCode || '',
                  brand: a.brand || '',
                  quantity: a.quantity ?? undefined,
                };
              }) || [],
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

  // Load file category for uploads
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const cat = await uploadService.getCategoryByName('course-materials');
        if (cat) setFileCategory(cat);
      } catch (e) {
        console.warn('Could not load upload category:', e);
      }
    };
    loadCategory();
  }, []);

  // Set resolvedMode immediately when entryMode is provided (before data is ready)
  useEffect(() => {
    if (entryMode) {
      setResolvedMode(entryMode);
    }
  }, [entryMode]);

  // Check user permissions and resolve form mode (creator / investigator / approver)
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser?.id) return;

      try {
        // If explicit entryMode is provided, use it
        if (entryMode) {
          setResolvedMode(entryMode);
          if (entryMode === 'approver' && incident) {
            try {
              const approvalResponse = await incidentsService.checkApprovalRights(incident.id);
              setCanApprove(approvalResponse.canApprove);
            } catch (error) {
              console.error('Failed to check approval rights:', error);
              setCanApprove(false);
            }
          }
          return;
        }

        // Auto-resolve mode based on incident status and user role
        if (incident) {
          // Check if user is the creator
          const isCreator = incident.createdBy === currentUser.id;

          // Check if user is in HSE department (for investigator mode)
          let userInHSEDept = false;

          try {
            const response = await api.get('/users/me');
            const userData = response.data;

            // Check if user's department code is 'HSE'
            if (userData.departmentId && departments.length > 0) {
              const userDepartment = departments.find(dept => dept.id === userData.departmentId);
              if (userDepartment && userDepartment.code === 'HSE') {
                userInHSEDept = true;
              }
            }

            // Check approval rights if item is waiting for approval
            let hasApprovalRights = false;
            if (incident.status === GeneralStatusEnum.WAITING_APPROVAL) {
              try {
                const approvalResponse = await incidentsService.checkApprovalRights(incident.id);
                hasApprovalRights = approvalResponse.canApprove;
                setCanApprove(hasApprovalRights);
              } catch (error) {
                console.error('Failed to check approval rights:', error);
                setCanApprove(false);
              }
            }

            // Resolve mode:
            // 1) Approval mode if waiting approval and user has approval rights
            if (incident.status === GeneralStatusEnum.WAITING_APPROVAL && hasApprovalRights) {
              setResolvedMode('approver');
            }
            // 2) Investigator mode for HSE department users (status is OPEN or REJECTED)
            else if (
              userInHSEDept &&
              (incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED)
            ) {
              setResolvedMode('investigator');
            }
            // 3) Creator mode for creator (status is DRAFT, OPEN, or REJECTED)
            else if (isCreator && (incident.status === GeneralStatusEnum.DRAFT || incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED)) {
              setResolvedMode('creator');
            }
            // Default to creator if no match
            else {
              setResolvedMode('creator');
            }
          } catch (error) {
            console.error('Failed to check user permissions:', error);
          }
        } else {
          // Create mode: always creator
          setResolvedMode('creator');
        }
      } catch (error) {
        console.error('Failed to check user permissions:', error);
      }
    };

    if (dataReady) {
      checkPermissions();
    }
  }, [currentUser, incident, entryMode, dataReady, departments]);

  // Prefill approver activities when in approver mode and incident is loaded
  useEffect(() => {
    if (incident && resolvedMode === 'approver') {
      setApproverActivities(incident.activities ?? IncidentActivitiesEnum.WORK);
    }
  }, [incident, resolvedMode]);

  // Populate image/attachment uploads when editing
  useEffect(() => {
    if (incident && mode === 'edit' && dataReady) {
      setImageUploads(
        (incident.images ?? []).map((i) => ({
          id: `img-${i.id ?? i.imageUrl}-${Date.now()}-${Math.random()}`,
          url: i.imageUrl,
          caption: i.caption ?? '',
          isNew: false,
        }))
      );
      setAttachmentUploads(
        (incident.attachments ?? []).map((a) => ({
          id: `att-${a.id ?? a.attachmentUrl}-${Date.now()}-${Math.random()}`,
          url: a.attachmentUrl,
          isNew: false,
          name: a.attachmentUrl.split('/').pop() ?? undefined,
        }))
      );
    } else if (!incident && mode === 'create') {
      setImageUploads([]);
      setAttachmentUploads([]);
    }
  }, [incident, mode, dataReady]);

  // Fetch rooms when area changes
  const areaId = form.watch('areaId');
  useEffect(() => {
    const fetchRooms = async () => {
      if (areaId) {
        try {
          const roomsRes = await roomService.getRooms({ 
            page: 1, 
            limit: 100, 
            areaId,
            isActive: true,
            options: true
          });
          setRooms(roomsRes.data);
        } catch (error) {
          console.error('Error fetching rooms:', error);
          setRooms([]);
        }
      } else {
        setRooms([]);
      }
    };
    fetchRooms();
  }, [areaId]);

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

  const technicianOptions: SearchableSelectOption[] = technicians.map((technician) => ({
    value: technician.id,
    label: technician.name || `${technician.email}`,
  }));

  const roomOptions: SearchableSelectOption[] = rooms.map((room) => ({
    value: room.id,
    label: room.name,
  }));

  // Images: image files only (JPEG, PNG, GIF, WebP)
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  // Attachments: PDF and ZIP only
  const ATTACHMENT_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next: ImageUploadItem[] = [];
    Array.from(files).forEach((file) => {
      if (!IMAGE_TYPES.includes(file.type)) {
        toast.error(`Invalid type for ${file.name}. Use JPEG, PNG, GIF, or WebP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      next.push({
        id: `img-${Date.now()}-${Math.random()}`,
        url: previewUrl,
        caption: '',
        file,
        isNew: true,
      });
    });
    if (next.length) {
      setImageUploads((prev) => [...prev, ...next]);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, []);

  const handleAttachmentFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next: AttachmentUploadItem[] = [];
    Array.from(files).forEach((file) => {
      if (!ATTACHMENT_TYPES.includes(file.type)) {
        toast.error(`Invalid type for ${file.name}. Use PDF or ZIP only.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB`);
        return;
      }
      next.push({
        id: `att-${Date.now()}-${Math.random()}`,
        url: file.name,
        file,
        isNew: true,
        name: file.name,
      });
    });
    if (next.length) {
      setAttachmentUploads((prev) => [...prev, ...next]);
    }
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }, []);

  const removeImage = useCallback((id: string) => {
    setImageUploads((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachmentUploads((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const updateImageCaption = useCallback((id: string, caption: string) => {
    setImageUploads((prev) => prev.map((i) => (i.id === id ? { ...i, caption } : i)));
  }, []);

  const uploadImagesAndAttachments = useCallback(async () => {
    const hasNewImages = imageUploads.some((i) => i.isNew && i.file);
    const hasNewAttachments = attachmentUploads.some((a) => a.isNew && a.file);
    if ((hasNewImages || hasNewAttachments) && !fileCategory) {
      throw new Error('Upload category not loaded. Please try again.');
    }
    const imagePayload: { imageUrl: string; caption: string; order: number }[] = [];
    const attachmentPayload: { attachmentUrl: string; order: number }[] = [];
    let order = 0;
    for (const img of imageUploads) {
      if (img.isNew && img.file && fileCategory) {
        setIsUploadingFiles(true);
        const res = await uploadService.uploadFile(img.file, fileCategory.id, true);
        imagePayload.push({ imageUrl: uploadService.getPublicFileUrl(res.id), caption: img.caption || '', order: order++ });
      } else if (!img.isNew) {
        imagePayload.push({ imageUrl: img.url, caption: img.caption || '', order: order++ });
      }
    }
    order = 0;
    for (const att of attachmentUploads) {
      if (att.isNew && att.file && fileCategory) {
        setIsUploadingFiles(true);
        const res = await uploadService.uploadFile(att.file, fileCategory.id, true);
        attachmentPayload.push({ attachmentUrl: uploadService.getPublicFileUrl(res.id), order: order++ });
      } else if (!att.isNew) {
        attachmentPayload.push({ attachmentUrl: att.url, order: order++ });
      }
    }
    setIsUploadingFiles(false);
    return { images: imagePayload, attachments: attachmentPayload };
  }, [fileCategory, imageUploads, attachmentUploads]);

  // Determine if field should be disabled based on mode
  const isFieldDisabled = (fieldName: string): boolean => {
    if (isLoading || isApproving) return true;
    
    if (resolvedMode === 'creator') {
      // Creator: cannot fill investigation-outcome fields (Section B sub-fields filled by investigator)
      // needToStopActivity, stopLocally, stopWholeSchool, controlMeasure are filled by creator (BSJ Section B1/B3)
      const investigatorOnlyFields = [
        'dueDate',
        'expectedOutcome',
        'treatment',
        'treatmentDescription',
        'absence',
        'resolution',
      ];
      return investigatorOnlyFields.includes(fieldName);
    }

    if (resolvedMode === 'investigator') {
      // Investigator: can only update investigation-outcome fields
      const investigatorOnlyFields = [
        'dueDate',
        'expectedOutcome',
        'treatment',
        'treatmentDescription',
        'absence',
        'resolution',
      ];
      return !investigatorOnlyFields.includes(fieldName);
    }

    // Approver: can edit all fields; save before approve/reject
    return false;
  };

  // Determine if field should be hidden based on mode
  const isFieldHidden = (fieldName: string): boolean => {
    // All fields are visible in all modes (investigator sees all sections as read-only)
    return false;
  };

  const buildUpdateDtoFromFormData = (
    data: FormValues,
    options: { statusOverride?: GeneralStatusEnum; images?: CreateIncidentImageDTO[]; attachments?: CreateIncidentAttachmentDTO[] },
  ): UpdateIncidentDTO => {
    const { statusOverride, images, attachments } = options;
    return {
      code: data.code,
      subject: data.subject,
      incidentDate: new Date(data.incidentDate),
      roomId: data.roomId || undefined,
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
      stopLocally: data.stopLocally ?? false,
      stopWholeSchool: data.stopWholeSchool ?? false,
      treatment: data.treatment,
      treatmentDescription: data.treatmentDescription || undefined,
      absence: data.absence,
      resolution: data.resolution || undefined,
      needFurtherInvestigation: data.needFurtherInvestigation ?? false,
      assignedDepartmentId: data.assignedDepartmentId,
      assigneeId: data.assigneeId || undefined,
      status: statusOverride ?? data.status,
      source: data.source,
      isActive: data.isActive,
      injuredPersons:
        data.injuredPersons?.map((p, index) => ({
          injuredPersonName: p.injuredPersonName || undefined,
          gender: p.gender,
          levelOfInjury: p.levelOfInjury,
          injuredBodyPart: p.injuredBodyPart,
          typeOfInjury: p.typeOfInjury,
          mechanismOfInjury: p.mechanismOfInjury,
          position: p.position || undefined,
          departmentId: p.departmentId || undefined,
          order: index,
        })) || undefined,
      witnesses:
        data.witnesses?.map((w, index) => ({
          witnessName: w.witnessName || undefined,
          gender: w.gender,
          position: w.position || undefined,
          departmentId: w.departmentId || undefined,
          order: index,
        })) || undefined,
      thirdParties:
        data.thirdParties?.map((tp, index) => ({
          name: tp.name,
          gender: tp.gender,
          company: tp.company || undefined,
          position: tp.position || undefined,
          order: index,
        })) || undefined,
      assets:
        data.assets?.map((a, index) => {
          let entityId = a.entityId || undefined;
          let entity = a.entity;
          if (entityId?.startsWith('__prefilled_') && a.assetCode) {
            const byCode = a.assetCode.trim();
            const assetMatch = assets.find((x) => x.code === byCode);
            const heavyMatch = heavyEquipments.find((x) => x.code === byCode);
            const safetyMatch = safetyEquipments.find((x) => x.code === byCode);
            if (assetMatch) {
              entityId = assetMatch.id;
              entity = EquipmentEntityEnum.ASSET;
            } else if (heavyMatch) {
              entityId = heavyMatch.id;
              entity = EquipmentEntityEnum.HEAVY_EQUIPMENT;
            } else if (safetyMatch) {
              entityId = safetyMatch.id;
              entity = EquipmentEntityEnum.SAFETY_EQUIPMENT;
            }
          }
          return {
            entity,
            entityId: entityId || undefined,
            assetName: a.assetName,
            assetCode: a.assetCode || undefined,
            brand: (a as any).brand || undefined,
            quantity: a.quantity || undefined,
            order: index,
          };
        }) || undefined,
      images,
      attachments,
    };
  };

  const handleApprove = async (
    status: ApprovalStatus,
    notes: string,
    activities: IncidentActivitiesEnum,
  ) => {
    if (!incident) return;

    try {
      setIsApproving(true);

      // Save form data (including Control Measures & Outcomes) before approve/reject
      const valid = await form.trigger();
      if (!valid) {
        toast.error('Please fix form errors before submitting approval.');
        return;
      }
      const data = form.getValues();
      const updateDto = buildUpdateDtoFromFormData(data, {
        images: undefined,
        attachments: undefined,
      });
      // Omit status so backend does not run status guard; approve/reject APIs set final status
      delete (updateDto as { status?: GeneralStatusEnum }).status;
      await incidentsService.update(incident.id, updateDto);

      if (status === ApprovalStatus.APPROVED) {
        await incidentsService.approve(incident.id, notes, activities);
        toast.success('Incident approved successfully');
      } else {
        await incidentsService.reject(incident.id, notes);
        toast.success('Incident rejected successfully');
      }

      navigate('/incidents');
    } catch (error: any) {
      console.error('Failed to submit approval:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit approval');
    } finally {
      setIsApproving(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { images, attachments } = await uploadImagesAndAttachments();
      [...imageUploads, ...attachmentUploads].forEach((x) => {
        if ('url' in x && x.url.startsWith('blob:')) URL.revokeObjectURL(x.url);
      });

      // Non-super-user can only set status to OPEN or CLOSE
      if (!isSuperUser && data.status !== GeneralStatusEnum.OPEN && data.status !== GeneralStatusEnum.CLOSE && data.status !== GeneralStatusEnum.REJECTED) {
        toast.error('Only Open, Close, or Rejected status is allowed for your role.');
        return;
      }
      // Determine status based on mode and role: only SUPER_ADMIN can set any status; others only OPEN or CLOSE
      let statusToSet = data.status;
      if (isSuperUser) {
        if (resolvedMode === 'investigator') {
          // Investigator: keep OPEN in update; submit API will move to WAITING_APPROVAL after save
          statusToSet = GeneralStatusEnum.OPEN;
        } else if (resolvedMode === 'approver') {
          return;
        }
        // Creator: keep user's selected status (statusToSet already = data.status)
      } else if (resolvedMode === 'investigator') {
        // Investigator (non-super_admin): cannot change status; keep current incident status
        statusToSet = incident?.status ?? GeneralStatusEnum.OPEN;
      }
      // Non-super-user (creator): statusToSet stays data.status (only OPEN or CLOSE allowed by UI and backend)

      const dto: CreateIncidentDTO | UpdateIncidentDTO = {
        code: data.code,
        subject: data.subject,
        incidentDate: new Date(data.incidentDate),
        roomId: data.roomId || undefined,
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
        stopLocally: data.stopLocally ?? false,
        stopWholeSchool: data.stopWholeSchool ?? false,
        treatment: data.treatment,
        treatmentDescription: data.treatmentDescription || undefined,
        absence: data.absence,
        resolution: data.resolution || undefined,
        needFurtherInvestigation: data.needFurtherInvestigation ?? false,
        assignedDepartmentId: data.assignedDepartmentId,
        assigneeId: data.assigneeId || undefined,
        status: statusToSet,
        source: data.source,
        isActive: data.isActive,
        injuredPersons:
          data.injuredPersons?.map((p, index) => ({
            injuredPersonName: p.injuredPersonName || undefined,
            gender: p.gender,
            levelOfInjury: p.levelOfInjury,
            injuredBodyPart: p.injuredBodyPart,
            typeOfInjury: p.typeOfInjury,
            mechanismOfInjury: p.mechanismOfInjury,
            position: p.position || undefined,
            departmentId: p.departmentId || undefined,
            order: index,
          })) || undefined,
        witnesses:
          data.witnesses?.map((w, index) => ({
            witnessName: w.witnessName || undefined,
            gender: w.gender,
            position: w.position || undefined,
            departmentId: w.departmentId || undefined,
            order: index,
          })) || undefined,
        thirdParties:
          data.thirdParties?.map((tp, index) => ({
            name: tp.name,
            gender: tp.gender,
            company: tp.company || undefined,
            position: tp.position || undefined,
            order: index,
          })) || undefined,
        assets:
          data.assets?.map((a, index) => {
            // Resolve placeholder entityId (__prefilled_N) by looking up assetCode in master lists (for old incident data where API returned null)
            let entityId = a.entityId || undefined;
            let entity = a.entity;
            if (entityId?.startsWith('__prefilled_') && a.assetCode) {
              const byCode = a.assetCode.trim();
              const assetMatch = assets.find((x) => x.code === byCode);
              const heavyMatch = heavyEquipments.find((x) => x.code === byCode);
              const safetyMatch = safetyEquipments.find((x) => x.code === byCode);
              if (assetMatch) {
                entityId = assetMatch.id;
                entity = EquipmentEntityEnum.ASSET;
              } else if (heavyMatch) {
                entityId = heavyMatch.id;
                entity = EquipmentEntityEnum.HEAVY_EQUIPMENT;
              } else if (safetyMatch) {
                entityId = safetyMatch.id;
                entity = EquipmentEntityEnum.SAFETY_EQUIPMENT;
              }
            }
            return {
              entity,
              entityId: entityId || undefined,
              assetName: a.assetName,
              assetCode: a.assetCode || undefined,
              quantity: a.quantity || undefined,
              order: index,
            };
          }) || undefined,
        images: images.length ? images : undefined,
        attachments: attachments.length ? attachments : undefined,
      };

      if (mode === 'create') {
        await incidentsService.create(dto as CreateIncidentDTO);
        toast.success('Incident created successfully');
      } else if (incident) {
        await incidentsService.update(incident.id, dto as UpdateIncidentDTO);
        if (resolvedMode === 'investigator') {
          await incidentsService.submit(incident.id);
          toast.success('Incident submitted for approval');
        } else {
          toast.success('Incident updated successfully');
        }
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
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Incident Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter incident code" 
                          {...field} 
                          disabled={isFieldDisabled('code')}
                          readOnly={isFieldDisabled('code')}
                        />
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
                      <FormLabel>Subject <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter incident subject" 
                          {...field} 
                          disabled={isFieldDisabled('subject')}
                          readOnly={isFieldDisabled('subject')}
                        />
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
                      <FormLabel>Incident Date <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
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
                      <FormLabel>Area <span className="text-red-500">*</span></FormLabel>
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
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={roomOptions}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="location/room"
                          disabled={!areaId || rooms.length === 0}
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
                      <FormLabel>Type of Hazard <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={riskCategoryOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select type of hazard"
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
                      <FormLabel>Incident Type <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Classification <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={resolvedMode === 'approver' || (resolvedMode === 'investigator' && !isSuperUser)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSuperUser ? (
                            <>
                              <SelectItem value={GeneralStatusEnum.DRAFT}>Draft</SelectItem>
                              <SelectItem value={GeneralStatusEnum.OPEN}>Open</SelectItem>
                              <SelectItem value={GeneralStatusEnum.SCHEDULED}>Scheduled</SelectItem>
                              <SelectItem value={GeneralStatusEnum.WAITING_APPROVAL}>Waiting Verification</SelectItem>
                              <SelectItem value={GeneralStatusEnum.DONE}>Done</SelectItem>
                              <SelectItem value={GeneralStatusEnum.REJECTED}>Rejected</SelectItem>
                              <SelectItem value={GeneralStatusEnum.CLOSE}>Close</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value={GeneralStatusEnum.OPEN}>Open</SelectItem>
                              <SelectItem value={GeneralStatusEnum.CLOSE}>Close</SelectItem>
                              {mode === 'edit' && incident?.status && incident.status !== GeneralStatusEnum.OPEN && incident.status !== GeneralStatusEnum.CLOSE && (
                                <SelectItem value={incident.status}>
                                  {GENERAL_STATUS_OPTIONS.find((o) => o.value === incident.status)?.label ?? incident.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                </SelectItem>
                              )}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter incident description"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isFieldDisabled('description')}
                          readOnly={isFieldDisabled('description')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </CardContent>
            </Card>

            {/* People Involved */}
            <Card className="border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  People Involved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="requesterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Reported By <span className="text-red-500">*</span></FormLabel>
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
                          options={technicianOptions}
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
                      <FormLabel>Assigned Department <span className="text-red-500">*</span></FormLabel>
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
              </CardContent>
            </Card>

            {/* Injured Persons */}
            <Card className="border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Injured Persons
                    </CardTitle>
                    {injuredPersonFields.length > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {injuredPersonFields.length} {injuredPersonFields.length === 1 ? 'person' : 'people'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() =>
                      appendInjuredPerson({
                        injuredPersonName: '',
                        gender: undefined,
                        levelOfInjury: LevelOfInjuryEnum.NOT_SPECIFIED,
                        injuredBodyPart: InjuredBodyPartEnum.NOT_SPECIFIED,
                        typeOfInjury: TypeOfInjuryEnum.NOT_SPECIFIED,
                        mechanismOfInjury: MechanismOfInjuryEnum.NOT_SPECIFIED,
                        position: '',
                        departmentId: '',
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Injured Person
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You can add multiple injured persons. Click the button above to add your first or additional person.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
              {injuredPersonFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No injured persons added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Injured Person" above to get started</p>
                </div>
              ) : (
                <>
                  {injuredPersonFields.map((field, index) => (
                    <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Injured Person {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeInjuredPerson(index)}
                        className="h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name={`injuredPersons.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Engineer, Operator" {...field} />
                            </FormControl>
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
                                <SelectItem value={TypeOfInjuryEnum.DERMATITIS}>Dermatitis</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.PARALYSIS}>Paralysis</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.AMPUTATION}>Amputation</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.CRUSH}>Crush</SelectItem>
                                <SelectItem value={TypeOfInjuryEnum.ABRASION}>Abrasion</SelectItem>
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
                                <SelectItem value={MechanismOfInjuryEnum.SHARP_OBJECTS}>Sharp Objects</SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.HEAT_COLD}>Heat / Cold</SelectItem>
                                <SelectItem value={MechanismOfInjuryEnum.MANUAL_HANDLING}>Manual Handling</SelectItem>
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
                </>
              )}
              </CardContent>
            </Card>

            {/* Third Parties */}
            <Card className="border-l-4 border-l-violet-500 bg-violet-50/30 dark:bg-violet-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Third Parties
                    </CardTitle>
                    {thirdPartyFields.length > 0 && (
                      <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                        {thirdPartyFields.length} {thirdPartyFields.length === 1 ? 'person' : 'persons'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() =>
                      appendThirdParty({
                        name: '',
                        gender: undefined,
                        company: '',
                        position: '',
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Third Party
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  External persons involved (contractors, visitors). Click the button above to add.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
              {thirdPartyFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-lg bg-violet-50/50 dark:bg-violet-950/20">
                  <Users className="h-8 w-8 text-violet-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No third parties added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Third Party" above to get started</p>
                </div>
              ) : (
                <>
                  {thirdPartyFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Third Party {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeThirdParty(index)}
                        className="h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`thirdParties.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`thirdParties.${index}.gender`}
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
                        name={`thirdParties.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company / Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. PT. OCS, Contractor Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`thirdParties.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Cleaner SPV, Project Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                    </Card>
                  ))}
                </>
              )}
              </CardContent>
            </Card>

            {/* Witnesses */}
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      Witnesses
                    </CardTitle>
                    {witnessFields.length > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {witnessFields.length} {witnessFields.length === 1 ? 'witness' : 'witnesses'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() =>
                      appendWitness({
                        witnessName: '',
                        gender: undefined,
                        position: '',
                        departmentId: '',
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Witness
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You can add multiple witnesses. Click the button above to add your first or additional witness.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
              {witnessFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                  <Eye className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No witnesses added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Witness" above to get started</p>
                </div>
              ) : (
                <>
                  {witnessFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Witness {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWitness(index)}
                        className="h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name={`witnesses.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Engineer, Operator" {...field} />
                            </FormControl>
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
                </>
              )}
              </CardContent>
            </Card>

            {/* Assets */}
            <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Assets
                    </CardTitle>
                    {assetFields.length > 0 && (
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {assetFields.length} {assetFields.length === 1 ? 'asset' : 'assets'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() =>
                      appendAsset({
                        entity: EquipmentEntityEnum.ASSET, // Default, will be overwritten when asset is selected
                        entityId: '',
                        assetName: '',
                        assetCode: '',
                        brand: '',
                        quantity: undefined,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You can add multiple assets. Click the button above to add your first or additional asset.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
              {assetFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20">
                  <Package className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No assets added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Asset" above to get started</p>
                </div>
              ) : (
                <>
                  {assetFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Asset {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAsset(index)}
                        className="h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`assets.${index}.entityId`}
                        render={({ field }) => {
                          // Combined asset options with entity type information
                          const currentEntity = form.watch(`assets.${index}.entity`) || EquipmentEntityEnum.ASSET;
                          const currentEntityId = field.value || '';
                          const currentAssetName = form.watch(`assets.${index}.assetName`) || '';
                          const currentAssetCode = form.watch(`assets.${index}.assetCode`) || '';

                          // Build combined options from master lists
                          const combinedAssetOptions: Array<{
                            value: string;
                            label: string;
                            entity: EquipmentEntityEnum;
                            entityId: string;
                            name: string;
                            code: string;
                          }> = [
                            ...assets.map(asset => ({
                              value: `${EquipmentEntityEnum.ASSET}:${asset.id}`,
                              label: `${asset.name} (${asset.code})${asset.brand ? ` - ${asset.brand}` : ''}`,
                              entity: EquipmentEntityEnum.ASSET,
                              entityId: asset.id,
                              name: asset.name,
                              code: asset.code,
                            })),
                            ...heavyEquipments.map(eq => ({
                              value: `${EquipmentEntityEnum.HEAVY_EQUIPMENT}:${eq.id}`,
                              label: `${eq.name} (${eq.code})`,
                              entity: EquipmentEntityEnum.HEAVY_EQUIPMENT,
                              entityId: eq.id,
                              name: eq.name,
                              code: eq.code,
                            })),
                            ...safetyEquipments.map(eq => ({
                              value: `${EquipmentEntityEnum.SAFETY_EQUIPMENT}:${eq.id}`,
                              label: `${eq.name} (${eq.code})`,
                              entity: EquipmentEntityEnum.SAFETY_EQUIPMENT,
                              entityId: eq.id,
                              name: eq.name,
                              code: eq.code,
                            })),
                          ];

                          // Include prefilled row in options so edit mode shows the selected asset (placeholder __prefilled_N, deactivated, or not in first page)
                          if (currentEntityId && currentAssetName) {
                            const existingOption = combinedAssetOptions.find(opt => opt.entityId === currentEntityId && opt.entity === currentEntity);
                            if (!existingOption) {
                              combinedAssetOptions.unshift({
                                value: `${currentEntity}:${currentEntityId}`,
                                label: `${currentAssetName}${currentAssetCode ? ` (${currentAssetCode})` : ''}`,
                                entity: currentEntity,
                                entityId: currentEntityId,
                                name: currentAssetName,
                                code: currentAssetCode,
                              });
                            }
                          }

                          // Get current value and find the matching option
                          const currentOption = combinedAssetOptions.find(opt =>
                            opt.entityId === currentEntityId && opt.entity === currentEntity
                          );
                          const selectValue = currentOption ? currentOption.value : '';

                          return (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Select Asset <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={combinedAssetOptions.map(opt => ({
                                    value: opt.value,
                                    label: opt.label,
                                  }))}
                                  value={selectValue}
                                  onValueChange={(value) => {
                                    const selectedOption = combinedAssetOptions.find(opt => opt.value === value);
                                    if (selectedOption) {
                                      // Auto-fill all fields from selected asset
                                      form.setValue(`assets.${index}.entity`, selectedOption.entity);
                                      form.setValue(`assets.${index}.entityId`, selectedOption.entityId);
                                      form.setValue(`assets.${index}.assetName`, selectedOption.name);
                                      form.setValue(`assets.${index}.assetCode`, selectedOption.code);
                                      field.onChange(selectedOption.entityId);
                                    }
                                  }}
                                  placeholder="Search and select asset by name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`assets.${index}.brand` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter brand name" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`assets.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1"
                                placeholder="Enter quantity" 
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : parseInt(value, 10));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Hidden fields for entity, assetName, and assetCode - auto-filled when asset is selected */}
                    <FormField
                      control={form.control}
                      name={`assets.${index}.entity`}
                      render={({ field }) => (
                        <input type="hidden" {...field} />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`assets.${index}.assetName`}
                      render={({ field }) => (
                        <input type="hidden" {...field} />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`assets.${index}.assetCode`}
                      render={({ field }) => (
                        <input type="hidden" {...field} />
                      )}
                    />
                  </CardContent>
                    </Card>
                  ))}
                </>
              )}
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="border-l-4 border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Image className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Images
                  </CardTitle>
                  {imageUploads.length > 0 && (
                    <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                      {imageUploads.length} {imageUploads.length === 1 ? 'image' : 'images'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Images only: JPEG, PNG, GIF, or WebP. Max 5MB each.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                  disabled={isLoading || isUploadingFiles}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={(e) => { e.preventDefault(); setImageDropActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setImageDropActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDropActive(false);
                    handleImageFiles(e.dataTransfer.files);
                  }}
                  onClick={() => imageInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all ${imageDropActive ? 'border-teal-500 ring-2 ring-teal-500 bg-teal-100/50 dark:bg-teal-900/20' : 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20'}`}
                >
                  <Image className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Drop images here or click to select</p>
                </div>
                {imageUploads.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {imageUploads.map((img) => (
                      <div key={img.id} className="relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <div className="aspect-video relative">
                          <img src={img.url} alt={img.caption || 'Incident'} className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                            disabled={isLoading || isUploadingFiles}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {img.isNew && (
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">New</span>
                          )}
                        </div>
                        <div className="p-3">
                          <Input
                            placeholder="Caption (optional)"
                            value={img.caption}
                            onChange={(e) => updateImageCaption(img.id, e.target.value)}
                            disabled={isLoading || isUploadingFiles}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="border-l-4 border-l-slate-500 bg-slate-50/30 dark:bg-slate-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Attachments
                  </CardTitle>
                  {attachmentUploads.length > 0 && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                      {attachmentUploads.length} {attachmentUploads.length === 1 ? 'attachment' : 'attachments'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Attachments only: PDF or ZIP. Max 5MB each.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="application/pdf,application/zip,.pdf,.zip"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAttachmentFiles(e.target.files)}
                  disabled={isLoading || isUploadingFiles}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={(e) => { e.preventDefault(); setAttachmentDropActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setAttachmentDropActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAttachmentDropActive(false);
                    handleAttachmentFiles(e.dataTransfer.files);
                  }}
                  onClick={() => attachmentInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && attachmentInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all ${attachmentDropActive ? 'border-slate-500 ring-2 ring-slate-500 bg-slate-100/50 dark:bg-slate-900/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'}`}
                >
                  <Paperclip className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Drop files here or click to select</p>
                </div>
                {attachmentUploads.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachmentUploads.map((att) => (
                      <div key={att.id} className="relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <div className="aspect-video relative flex items-center justify-center min-h-[120px]">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-10 w-10" />
                            <span className="text-xs truncate max-w-full px-2">{att.name ?? 'File'}</span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }}
                            disabled={isLoading || isUploadingFiles}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {att.isNew && (
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">New</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Control Measures & Outcomes */}
            <Card className="border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Control Measures & Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} disabled={isFieldDisabled('dueDate')} />
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={isFieldDisabled('needToStopActivity')}>
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={isFieldDisabled('treatment')}>
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
                          <SelectItem value={TreatmentEnum.SELF}>Self</SelectItem>
                          <SelectItem value={TreatmentEnum.HEALTH_SERVICES}>Health Services (Outpatient)</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={isFieldDisabled('absence')}>
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

                <FormField
                  control={form.control}
                  name="controlMeasure"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Control Measure</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter control measures"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isFieldDisabled('controlMeasure')}
                          readOnly={isFieldDisabled('controlMeasure')}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Expected Outcome</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter expected outcome"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isFieldDisabled('expectedOutcome')}
                          readOnly={isFieldDisabled('expectedOutcome')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('needToStopActivity') === StopActivityEnum.YES && (
                  <div className="md:col-span-2 space-y-3 pl-6 border-l-2 border-muted">
                    <p className="text-sm font-medium">If Yes (Jika Ya):</p>
                    <FormField
                      control={form.control}
                      name="stopLocally"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isFieldDisabled('stopLocally')}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Stop activity locally related to the accident/incident/nearmiss
                            <span className="block text-xs text-muted-foreground">
                              Hentikan aktivitas terkait kecelakaan/insiden/nearmiss
                            </span>
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stopWholeSchool"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isFieldDisabled('stopWholeSchool')}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Stop the whole school activities
                            <span className="block text-xs text-muted-foreground">
                              Hentikan seluruh kegiatan sekolah
                            </span>
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="treatmentDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Treatment Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter treatment description"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isFieldDisabled('treatmentDescription')}
                          readOnly={isFieldDisabled('treatmentDescription')}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Resolution</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter resolution"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isFieldDisabled('resolution')}
                          readOnly={isFieldDisabled('resolution')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needFurtherInvestigation"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex flex-row items-start gap-3 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isFieldDisabled('resolution')}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium cursor-pointer">
                          Need further investigation
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Tick to allow HSE to create a formal Investigation Report (BSJ/F/H-3-3.5C) for this incident.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </CardContent>
            </Card>

            {/* Activities (only in approver mode) - work related vs study related */}
            {resolvedMode === 'approver' && (
              <Card className="border-l-4 border-l-slate-500 bg-slate-50/30 dark:bg-slate-950/10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Activities
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Define whether this incident is work related or study related.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Activity type <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={approverActivities}
                          onValueChange={(value) =>
                            setApproverActivities(value as IncidentActivitiesEnum)
                          }
                          className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                          disabled={isApproving}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={IncidentActivitiesEnum.WORK}
                              id="activities-work"
                            />
                            <Label htmlFor="activities-work" className="font-normal cursor-pointer">
                              Work related
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={IncidentActivitiesEnum.STUDY}
                              id="activities-study"
                            />
                            <Label htmlFor="activities-study" className="font-normal cursor-pointer">
                              Study related
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Notes (only in approver mode) */}
            {resolvedMode === 'approver' && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Approval Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormItem>
                    <FormLabel>
                      Approval Notes <span className="text-red-500">* (required for rejection)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your approval notes (optional for approve, required for reject)..."
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="min-h-[100px]"
                        disabled={isApproving}
                      />
                    </FormControl>
                  </FormItem>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/incidents')}
                disabled={isLoading || isUploadingFiles || isApproving}
              >
                Cancel
              </Button>
              
              {resolvedMode === 'approver' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      setApprovalStatus(ApprovalStatus.REJECTED);
                      await handleApprove(
                        ApprovalStatus.REJECTED,
                        approvalNotes,
                        approverActivities,
                      );
                    }}
                    disabled={
                      isApproving ||
                      !approvalNotes.trim() ||
                      !approverActivities
                    }
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {isApproving ? 'Submitting...' : 'Reject'}
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      setApprovalStatus(ApprovalStatus.APPROVED);
                      await handleApprove(
                        ApprovalStatus.APPROVED,
                        approvalNotes,
                        approverActivities,
                      );
                    }}
                    disabled={
                      isApproving ||
                      !approverActivities
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isApproving ? 'Submitting...' : 'Approve'}
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={isLoading || isUploadingFiles}>
                  {isLoading 
                    ? 'Saving...' 
                    : isUploadingFiles 
                    ? 'Uploading...' 
                    : resolvedMode === 'investigator'
                    ? 'Submit'
                    : mode === 'create' 
                    ? 'Create Incident Report'
                    : 'Update Incident Report'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default IncidentForm;
