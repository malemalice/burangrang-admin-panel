import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type FieldError,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardDescription } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { MultiSelectSearchable, SearchableSelect } from '@/core/components/ui/searchable-select';
import {
  CreateWorkPermitDTO,
  UpdateWorkPermitDTO,
  WorkPermit,
  MasterDataOption,
  WorkClassificationMasterOption,
  GuestOption,
  CompanyOption,
} from '../types/work-permit.types';
import { riskService } from '@/modules/master-data';
import { WorkPermitSafetyGuidelineSection, type SafetyGuidanceBlock } from './WorkPermitSafetyGuidelineSection';
import {
  createHeavyEquipmentFromQuery,
  createMachineFromQuery,
  createMaterialFromQuery,
  createToolFromQuery,
} from '../utils/equipmentHelpers';
import { toast } from 'sonner';
import uploadService from '@/modules/uploads/services/uploadService';
import workPermitService from '../services/workPermitService';
import workPermitWorkerService from '../services/workPermitWorkerService';
import { userService, type User } from '@/modules/users';
import AddWorkerModal from './AddWorkerModal';
import AddCompanyModal from './AddCompanyModal';
import AddApplicantWithCompanyModal from './AddApplicantWithCompanyModal';
import { WORK_PERMIT_WORKER_ROLE_CODE } from '../services/workPermitWorkerService';
import { useAuth } from '@/core/lib/auth';
import { usePermissions } from '@/core/hooks/usePermissions';
import { WorkPermitSection, WorkPermitSubsectionTitle } from './WorkPermitSection';
import { courseService, type Course } from '@/modules/courses';
import { safetyEquipmentService, type SafetyEquipment } from '@/modules/ppe';
import {
  WORK_PERMIT_SECTIONS,
  WORK_PERMIT_SECTION_A_SUB,
  WORK_PERMIT_SECTION_B_SUB,
  WORK_PERMIT_SECTION_C_SUB,
  WORK_PERMIT_SECTION_D_SUB,
  WORK_PERMIT_SECTION_E_SUB,
  WORK_PERMIT_SECTION_F_SUB,
} from '../constants/workPermitSections';
import { WORK_CLASSIFICATION_OTHER_CODE } from '../constants/workClassification';
import { useWorkPermitClassificationContentEnabled } from '../hooks/useWorkPermitClassificationContentEnabled';
import healthScreeningService from '@/modules/health-screenings/services/healthScreeningService';
import type { HealthScreeningListItem } from '@/modules/health-screenings/types/healthScreening.types';
import { isHealthScreeningListItemEligible } from '../utils/healthScreeningEligibility';
import type { CompanyDTO } from '@/modules/master-data/types/master-data.types';

const workerRowSchema = z.object({
  userId: z.string().min(1, 'Worker is required'),
  healthScreeningId: z.string().optional(),
  order: z.number().min(0),
});

function selectionIncludesOthers(
  classifications: { workClassificationId: string }[] | undefined,
  masters: MasterDataOption[],
): boolean {
  const ids = classifications?.map((c) => c.workClassificationId).filter(Boolean) ?? [];
  return ids.some((id) => masters.find((w) => w.id === id)?.code === WORK_CLASSIFICATION_OTHER_CODE);
}

// Form schema for validation
const formSchema = z.object({
  applicantUserId: z.string().optional(),
  projectName: z.string().min(1, 'Project name is required'),
  areaId: z.string().min(1, 'Area is required'),
  companyId: z.string().min(1, 'Company is required'),
  proposedStartDate: z.string().min(1, 'Start date is required'),
  proposedEndDate: z.string().min(1, 'End date is required'),
  workStagesDescription: z.string().min(1, 'Work stages description is required'),
  workClassificationOtherDetail: z.string().max(2000).optional(),
  requireCourseVerification: z.boolean().default(false),
  classifications: z
    .array(
      z.object({
        workClassificationId: z.string().min(1, 'Work classification is required'),
        order: z.number().min(0),
      }),
    )
    .min(1, 'At least one work classification is required'),
  employees: z
    .array(
      z.object({
        userId: z.string().optional(),
        employeeName: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  workers: z.array(workerRowSchema).min(1, 'At least one worker is required'),
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
        activity: z.string().optional(),
        mitigation: z.string().optional(),
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

/** Profession and ID number are read-only from the selected worker user profile. */
function WorkerProfileFromUser({
  control,
  index,
  workerUsers,
  permitWorkers,
}: {
  control: Control<FormValues>;
  index: number;
  workerUsers: User[];
  permitWorkers?: WorkPermit['workers'];
}) {
  const userId = useWatch({ control, name: `workers.${index}.userId` });
  const profile = workerUsers.find((u) => u.id === userId);
  const permitRow = permitWorkers?.find((w) => w.userId === userId);

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground">Select a worker to see profession and ID number.</p>
    );
  }

  const professionLabel =
    profile?.profession?.trim() ||
    (permitRow?.profession
      ? `${permitRow.profession.name} (${permitRow.profession.code})`
      : '') ||
    '—';

  const idLabel =
    profile?.idNumber?.trim() ||
    permitRow?.idNumber?.trim() ||
    '—';

  const missingProfession =
    !profile?.professionId &&
    !profile?.profession?.trim() &&
    !permitRow?.professionId &&
    !permitRow?.profession;

  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
      <div>
        <p className="text-muted-foreground">Profession</p>
        <p className="font-medium">{professionLabel}</p>
      </div>
      <div>
        <p className="text-muted-foreground">ID number</p>
        <p className="font-medium">{idLabel}</p>
      </div>
      {missingProfession && (
        <p className="text-xs text-destructive">
          Set profession on the worker profile (Workers module) before submitting this permit.
        </p>
      )}
    </div>
  );
}

/** Certificate URL is managed on the worker profile; this block is read-only. */
function WorkerCertificateReadonly({
  control,
  index,
}: {
  control: Control<FormValues>;
  index: number;
}) {
  const userId = useWatch({ control, name: `workers.${index}.userId` });
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId?.trim()) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await workPermitWorkerService.getWorkPermitWorkerProfile(userId.trim());
        const cert =
          res.workerDocuments?.certificateUrl ??
          res.assignments[0]?.certificateUrl ??
          null;
        if (!cancelled) setUrl(cert);
      } catch {
        if (!cancelled) setUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a worker to show certificate (from worker profile).
      </p>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading certificate…
      </div>
    );
  }
  if (!url?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        No certificate on file. Upload it from the{' '}
        <Link
          to={`/work-permits/workers/${userId}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          worker profile
        </Link>
        .
      </p>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      Open certificate
    </a>
  );
}

/** Resolves the latest available (DONE, not yet consumed) screening for the selected worker and keeps `healthScreeningId` in sync (read-only UI). In edit mode, also accepts a screening already consumed by this permit. */
function WorkerAutoLinkedHealthScreening({
  control,
  index,
  setValue,
  workPermitId,
}: {
  control: Control<FormValues>;
  index: number;
  setValue: UseFormSetValue<FormValues>;
  workPermitId?: string;
}) {
  const userId = useWatch({ control, name: `workers.${index}.userId` });
  const linkedId = useWatch({ control, name: `workers.${index}.healthScreeningId` });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<HealthScreeningListItem | null>(null);

  useEffect(() => {
    if (!linkedId) setPreview(null);
  }, [linkedId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId?.trim()) {
        setValue(`workers.${index}.healthScreeningId`, '');
        setPreview(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setValue(`workers.${index}.healthScreeningId`, '');
      setPreview(null);
      try {
        const res = await healthScreeningService.list({
          userId: userId.trim(),
          page: 1,
          limit: 20,
        });
        if (cancelled) return;
        const pick = res.data.find(
          (s) =>
            isHealthScreeningListItemEligible(s) ||
            (workPermitId && s.consumedByWorkPermitId === workPermitId && s.status === 'DONE'),
        );
        if (pick) {
          setValue(`workers.${index}.healthScreeningId`, pick.id);
          setPreview(pick);
        } else {
          setValue(`workers.${index}.healthScreeningId`, '');
          setPreview(null);
        }
      } catch {
        if (!cancelled) {
          setValue(`workers.${index}.healthScreeningId`, '');
          setPreview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, index, setValue, workPermitId]);

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium leading-none">
          Linked health screening{' '}
          <span className="text-muted-foreground font-normal">(automatic from latest valid declaration)</span>
        </p>
        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
          {!userId?.trim() ? (
            <p className="text-muted-foreground">Select a worker to show the linked declaration.</p>
          ) : loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : preview ? (
            <div className="space-y-1">
              <p className="font-medium">
                <Link
                  to={`/health-screenings/${preview.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {preview.quiz?.title ?? 'Health screening'}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">Status: {preview.status}</p>
              <p className="text-xs text-muted-foreground">
                Available declaration from {new Date(preview.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No available declaration for this worker. Each work permit requires a fresh declaration —
              if a declaration file is stored on the{' '}
              <Link
                to={userId?.trim() ? `/work-permits/workers/${userId}` : '/work-permits/workers'}
                className="text-primary underline-offset-4 hover:underline"
              >
                worker profile
              </Link>
              , the permit can still be validated. Otherwise start a new{' '}
              <Link to="/health-screenings" className="text-primary underline" target="_blank" rel="noreferrer">
                health declaration
              </Link>{' '}
              for this worker.
            </p>
          )}
        </div>
      </div>
      <FormField
        control={control}
        name={`workers.${index}.healthScreeningId`}
        render={({ field }) => <input type="hidden" {...field} />}
      />
    </>
  );
}

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS: Array<{ id: WizardStep; title: string; description: string }> = [
  { id: 1, title: 'Classification & Scope', description: 'Section A and project scope details' },
  { id: 2, title: 'Equipment', description: 'Section C tools, machines, materials, heavy equipment' },
  { id: 3, title: 'Hazards & Safety', description: 'Sections D, E, and G safety guideline' },
  { id: 4, title: 'Courses & Attachments', description: 'Section F and final review before submit' },
];

function getFirstFieldErrorDetail(
  errors: Record<string, unknown>,
  pathPrefix: string[] = [],
): { message: string; path: string[] } | undefined {
  for (const [key, value] of Object.entries(errors)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && value !== null && 'message' in value) {
      const m = (value as FieldError).message;
      if (typeof m === 'string' && m) {
        return { message: m, path: [...pathPrefix, key] };
      }
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item && typeof item === 'object') {
          const nested = getFirstFieldErrorDetail(item as Record<string, unknown>, [...pathPrefix, key, String(i)]);
          if (nested) return nested;
        }
      }
      continue;
    }

    if (value && typeof value === 'object') {
      const nested = getFirstFieldErrorDetail(value as Record<string, unknown>, [...pathPrefix, key]);
      if (nested) return nested;
    }
  }
  return undefined;
}

function wizardStepForRootField(field: string): WizardStep | undefined {
  const step1 = new Set([
    'classifications',
    'workClassificationOtherDetail',
    'projectName',
    'areaId',
    'companyId',
    'proposedStartDate',
    'proposedEndDate',
    'workStagesDescription',
    'workers',
    'employees',
  ]);
  const step2 = new Set(['tools', 'materials', 'machines', 'heavyEquipment']);
  const step3 = new Set(['hazards']);
  const step4 = new Set(['requiredCourses', 'attachments', 'requireCourseVerification']);
  if (step1.has(field)) return 1;
  if (step2.has(field)) return 2;
  if (step3.has(field)) return 3;
  if (step4.has(field)) return 4;
  return undefined;
}

interface WorkPermitFormProps {
  workPermit?: WorkPermit;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateWorkPermitDTO | UpdateWorkPermitDTO) => Promise<void>;
}

const WorkPermitForm = ({ workPermit, mode, onSubmit }: WorkPermitFormProps) => {
  const { hasPermission } = usePermissions();
  const { user: authUser } = useAuth();
  const currentRoleCode = useMemo(() => {
    const r = authUser?.role as any;
    const code = typeof r === 'object' && r ? r.code : undefined;
    return String(code ?? '').toUpperCase();
  }, [authUser?.role]);
  const isContractor = currentRoleCode === 'CONTRACTOR';
  const isSuperAdmin = useMemo(() => {
    const r = authUser?.role;
    const name = typeof r === 'string' ? r : r?.name;
    return name === 'Super Admin';
  }, [authUser?.role]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enabled: classificationContentEnabled } = useWorkPermitClassificationContentEnabled();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [areas, setAreas] = useState<MasterDataOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [professions, setProfessions] = useState<MasterDataOption[]>([]);
  const [workClassifications, setWorkClassifications] = useState<WorkClassificationMasterOption[]>([]);
  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [workerUsers, setWorkerUsers] = useState<User[]>([]);
  const [applicants, setApplicants] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId?: string | null;
  }>>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [heavyEquipment, setHeavyEquipment] = useState<MasterDataOption[]>([]);
  const [tools, setTools] = useState<MasterDataOption[]>([]);
  const [materials, setMaterials] = useState<MasterDataOption[]>([]);
  const [machines, setMachines] = useState<MasterDataOption[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [safetyEquipment, setSafetyEquipment] = useState<SafetyEquipment[]>([]);
  const [risks, setRisks] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [guidanceBlocks, setGuidanceBlocks] = useState<SafetyGuidanceBlock[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [workPermitDocumentsCategoryId, setWorkPermitDocumentsCategoryId] = useState<string | null>(null);
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [addWorkerForIndex, setAddWorkerForIndex] = useState<number | null>(null);
  const [addWorkerInitialName, setAddWorkerInitialName] = useState('');
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [addCompanyInitialName, setAddCompanyInitialName] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [applicantSearchQuery, setApplicantSearchQuery] = useState('');
  const [addApplicantModalOpen, setAddApplicantModalOpen] = useState(false);
  const [addApplicantInitialName, setAddApplicantInitialName] = useState('');
  const [workerSearchQueries, setWorkerSearchQueries] = useState<Record<number, string>>({});

  const [toolSearchQueries, setToolSearchQueries] = useState<Record<number, string>>({});
  const [materialSearchQueries, setMaterialSearchQueries] = useState<Record<number, string>>({});
  const [machineSearchQueries, setMachineSearchQueries] = useState<Record<number, string>>({});
  const [heavyEquipmentSearchQueries, setHeavyEquipmentSearchQueries] = useState<Record<number, string>>({});

  // Memoized options for SearchableSelect
  const areaOptions = useMemo(() => areas.map((a) => ({ value: a.id, label: a.name })), [areas]);
  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.phone ? `${c.name} · ${c.phone}` : c.name,
      })),
    [companies],
  );
  const companyOptionsFiltered = useMemo(() => {
    const q = companySearchQuery.trim();
    if (q === '') {
      return companyOptions;
    }
    const lower = q.toLowerCase();
    return companyOptions.filter((o) => o.label.toLowerCase().includes(lower));
  }, [companyOptions, companySearchQuery]);
  const guestOptions = useMemo(() => guests.map((g) => ({ value: g.id, label: g.name })), [guests]);
  const workerOptions = useMemo(
    () =>
      workerUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || (u.email ?? u.id),
      })),
    [workerUsers],
  );
  const applicantOptions = useMemo(
    () =>
      applicants.map((u) => ({
        value: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || u.id,
      })),
    [applicants],
  );
  const applicantOptionsFiltered = useMemo(() => {
    const q = applicantSearchQuery.trim();
    if (q === '') {
      return applicantOptions;
    }
    const lower = q.toLowerCase();
    return applicantOptions.filter((o) => o.label.toLowerCase().includes(lower));
  }, [applicantOptions, applicantSearchQuery]);

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
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title ?? c.slug ?? c.id })),
    [courses],
  );
  const supervisorOptions = useMemo(
    () =>
      guests.map((g) => {
        const base = g.name ?? g.email ?? g.id;
        return { value: g.id, label: g.phone ? `${base} · ${g.phone}` : base };
      }),
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
      applicantUserId: '',
      projectName: '',
      areaId: '',
      companyId: '',
      proposedStartDate: '',
      proposedEndDate: '',
      workStagesDescription: '',
      workClassificationOtherDetail: '',
      requireCourseVerification: false,
      classifications: [{ workClassificationId: '', order: 0 }],
      employees: [],
      workers: [
        {
          userId: '',
          healthScreeningId: '',
          order: 0,
        },
      ],
      heavyEquipment: [],
      tools: [],
      materials: [],
      machines: [],
      requiredCourses: [],
      hazards: [],
      attachments: [],
      supervisorIds: [],
      hseOfficerIds: [],
      safetyEquipmentIds: [],
    },
  });

  const watchedCompanyId = useWatch({ control: form.control, name: 'companyId' });
  const requireCourseVerificationEnabled = useWatch({
    control: form.control,
    name: 'requireCourseVerification',
  });

  const isHseReviewPhase = useMemo(
    () => workPermit?.status === 'IN_REVIEW_HSE',
    [workPermit?.status],
  );

  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({
    control: form.control,
    name: 'workers',
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

  // useWatch (not form.watch + useMemo): nested field changes must re-render this block so
  // "Others" detail shows as soon as OTHERS is selected — watch() can miss array item updates.
  const watchedClassifications = useWatch({ control: form.control, name: 'classifications' });
  const showOthersDetailField = selectionIncludesOthers(watchedClassifications, workClassifications);

  const wizardSteps = useMemo(() => {
    if (classificationContentEnabled) {
      return WIZARD_STEPS;
    }
    return WIZARD_STEPS.map((step) => {
      if (step.id === 3) {
        return {
          ...step,
          description: 'Sections D and E — hazards and safety equipment',
        };
      }
      if (step.id === 4) {
        return {
          ...step,
          title: 'Courses & final review',
          description: 'Section F courses and final review before submit',
        };
      }
      return step;
    });
  }, [classificationContentEnabled]);

  useEffect(() => {
    if (isLoadingData || !workClassifications.length) return;
    if (!selectionIncludesOthers(watchedClassifications, workClassifications)) {
      form.setValue('workClassificationOtherDetail', '');
    }
  }, [watchedClassifications, workClassifications, form, isLoadingData]);

  // Safety guidance per classification (G): sync from master or permit when rows change
  useEffect(() => {
    if (isLoadingData || !workClassifications.length) return;
    const rows = watchedClassifications ?? [];
    if (!rows.some((r) => r.workClassificationId)) {
      setGuidanceBlocks([]);
      return;
    }
    setGuidanceBlocks((prev) => {
      const result: SafetyGuidanceBlock[] = [];
      for (const row of rows) {
        const wcId = row.workClassificationId;
        const { order } = row;
        if (!wcId) continue;
        const master = workClassifications.find((w) => w.id === wcId);
        if (!master) continue;
        const existing = prev.find((p) => p.workClassificationId === wcId && p.order === order);
        if (existing) {
          result.push(existing);
          continue;
        }
        const link =
          mode === 'edit'
            ? workPermit?.classifications?.find((c) => c.workClassificationId === wcId && c.order === order)
            : undefined;
        if (link?.safetyGuidanceRows && link.safetyGuidanceRows.length > 0) {
          result.push({
            workPermitClassificationId: link.id,
            workClassificationId: wcId,
            order,
            safetyGuidelineSnapshot: link.safetyGuidelineSnapshot ?? null,
            rows: link.safetyGuidanceRows.map((r) => ({
              riskId: r.riskId,
              safetyEquipmentId: r.safetyEquipmentId,
              notes: r.notes ?? undefined,
              order: r.order,
            })),
          });
        } else {
          result.push({
            workPermitClassificationId: link?.id,
            workClassificationId: wcId,
            order,
            safetyGuidelineSnapshot: master.safetyGuideline ?? null,
            rows: (master.riskEquipmentRows ?? []).map((r, idx) => ({
              riskId: r.riskId,
              safetyEquipmentId: r.safetyEquipmentId,
              notes: r.notes ?? undefined,
              order: r.order ?? idx,
            })),
          });
        }
      }
      return result;
    });
  }, [watchedClassifications, workClassifications, mode, workPermit, isLoadingData]);

  useEffect(() => {
    // Workers uploads depend on this category; do not gate it behind the
    // classification-content feature flag.
    const loadCategory = async () => {
      try {
        const category = await uploadService.getCategoryByName('work-permit-documents');
        if (category) {
          setWorkPermitDocumentsCategoryId(category.id);
        } else {
          toast.error('File category for work permit documents not found');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to resolve upload category');
      }
    };
    void loadCategory();
  }, []);

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch master data from work permit service and other modules
        const [
          masterDataResponse,
          usersResponse,
          workerUsersResponse,
          coursesResponse,
          safetyEquipmentResponse,
          risksResponse,
        ] = await Promise.all([
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
                applicants: [],
              };
            }),
            userService.getUsers({ page: 1, limit: 100, options: true }).catch((error) => {
              console.error('Failed to fetch users:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
            userService
              .getUsers({
                page: 1,
                limit: 500,
                options: true,
                filters: { roleCode: WORK_PERMIT_WORKER_ROLE_CODE },
              })
              .catch((error) => {
                console.error('Failed to fetch contractor workers:', error);
                return { data: [], meta: { total: 0, page: 1, limit: 500, pageCount: 0 } };
              }),
            courseService.getCourses({ page: 1, limit: 100, isActive: true }).catch((error) => {
              console.error('Failed to fetch courses:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
            safetyEquipmentService.getSafetyEquipments({ page: 1, limit: 100 }).catch((error) => {
              console.error('Failed to fetch safety equipment:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 100, pageCount: 0 } };
            }),
            riskService.getAll({ page: 1, limit: 500, isActive: true, options: true }).catch((error) => {
              console.error('Failed to fetch risks:', error);
              return { data: [], meta: { total: 0, page: 1, limit: 500 } };
            }),
          ]);

        // Set master data from work permit service
        setAreas(masterDataResponse.areas);
        setCompanies(masterDataResponse.companies);
        setProfessions(masterDataResponse.professions ?? []);
        setWorkClassifications(masterDataResponse.workClassifications);
        setGuests(masterDataResponse.guests);
        setHeavyEquipment(masterDataResponse.heavyEquipment);
        setTools(masterDataResponse.tools);
        setMaterials(masterDataResponse.materials);
        setMachines(masterDataResponse.machines);
        setApplicants(masterDataResponse.applicants ?? []);

        // Set data from other modules
        setUsers(usersResponse.data);
        setWorkerUsers(workerUsersResponse.data ?? []);
        setCourses(coursesResponse.data);
        setSafetyEquipment(safetyEquipmentResponse.data);
        setRisks(
          (risksResponse.data ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
          })),
        );
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
      const str = (v: string | null | undefined) => v ?? '';
      const qty = (v: number | null | undefined) =>
        v != null && !Number.isNaN(Number(v)) ? Number(v) : 1;

      const workersData =
        workPermit.workers?.map((w) => ({
          userId: str(w.userId),
          healthScreeningId: str(w.healthScreening?.id),
          order: w.order,
        })) || [
          {
            userId: '',
            healthScreeningId: '',
            order: 0,
          },
        ];

      form.reset({
        applicantUserId: str(workPermit.applicantUserId),
        projectName: str(workPermit.projectName),
        areaId: str(workPermit.areaId),
        companyId: str(workPermit.companyId),
        proposedStartDate: str(workPermit.proposedStartDate?.split('T')[0]),
        proposedEndDate: str(workPermit.proposedEndDate?.split('T')[0]),
        workStagesDescription: str(workPermit.workStagesDescription),
        workClassificationOtherDetail: str(workPermit.workClassificationOtherDetail),
        requireCourseVerification: workPermit.requireCourseVerification ?? false,
        classifications:
          workPermit.classifications?.length ?
            workPermit.classifications.map((c) => ({
              workClassificationId: str(c.workClassificationId || c.id),
              order: c.order,
            }))
          : [{ workClassificationId: '', order: 0 }],
        employees:
          workPermit.employees?.map((e) => ({
            userId: str(e.userId),
            employeeName: str(e.employeeName),
            order: e.order,
          })) || [],
        workers: workersData,
        heavyEquipment:
          workPermit.heavyEquipment?.map((e) => ({
            heavyEquipmentId: str(e.heavyEquipmentId),
            quantity: qty(e.quantity),
            order: e.order,
          })) || [],
        tools:
          workPermit.tools?.map((t) => ({
            toolId: str(t.toolId),
            quantity: qty(t.quantity),
            order: t.order,
          })) || [],
        materials:
          workPermit.materials?.map((m) => ({
            materialId: str(m.materialId),
            quantity: qty(m.quantity),
            order: m.order,
          })) || [],
        machines:
          workPermit.machines?.map((m) => ({
            machineId: str(m.machineId),
            quantity: qty(m.quantity),
            order: m.order,
          })) || [],
        requiredCourses:
          workPermit.requiredCourses?.map((c) => ({
            courseId: str(c.courseId),
            isRequired: c.isRequired ?? true,
            order: c.order,
          })) || [],
        hazards:
          workPermit.hazards?.map((h) => ({
            hazardId: str(h.hazardId),
            hazardName: str(h.hazardName),
            activity: str(h.activity),
            mitigation: str(h.mitigation),
            order: h.order,
          })) || [],
        attachments:
          workPermit.attachments?.map((a) => ({
            fileUrl: str(a.fileUrl),
            fileName: str(a.fileName),
            fileType: str(a.fileType),
            description: str(a.description),
            order: a.order,
          })) || [],
        supervisorIds: (workPermit.supervisors ?? [])
          .map((s) => str(s.guestId))
          .filter((id) => id.length > 0),
        hseOfficerIds: (workPermit.hseOfficers ?? [])
          .map((h) => str(h.userId))
          .filter((id) => id.length > 0),
        safetyEquipmentIds: (workPermit.safetyEquipment ?? [])
          .map((s) => str(s.safetyEquipmentId))
          .filter((id) => id.length > 0),
      });
    }
  }, [workPermit, mode, form]);

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
    } catch (error: unknown) {
      console.error('Error uploading attachment:', error);
      const maybeAxiosError = error as { response?: { data?: { message?: string } } };
      toast.error(maybeAxiosError.response?.data?.message || 'Failed to upload file');
    }
  };

  const sanitizeEmployees = (employees: FormValues['employees']) => {
    if (!employees?.length) return [];
    return employees
      .map((e, index) => ({
        ...e,
        userId: e.userId?.trim() || undefined,
        employeeName: e.employeeName?.trim() || undefined,
        order: index,
      }))
      .filter((e) => e.userId || e.employeeName);
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
        activity: hazard.activity?.trim() || undefined,
        mitigation: hazard.mitigation?.trim() || undefined,
        order: index,
      }))
      .filter((hazard) => {
        const hasHazardName = hazard.hazardName.length > 0;
        const hasOtherValues = Boolean(hazard.activity || hazard.mitigation || hazard.hazardId);

        return hasHazardName || hasOtherValues;
      });
  };

  const handleSubmitInvalid = useCallback(
    (errors: FieldErrors<FormValues>) => {
      const detail = getFirstFieldErrorDetail(errors as Record<string, unknown>);
      const message = detail?.message ?? 'Please complete all required fields.';
      const rootField = detail?.path[0];
      const targetStep = rootField ? wizardStepForRootField(rootField) : undefined;

      if (targetStep !== undefined && targetStep !== currentStep) {
        setCurrentStep(targetStep);
        const stepMeta = WIZARD_STEPS.find((s) => s.id === targetStep);
        toast.error(message, {
          description: `Switched to step ${targetStep}${stepMeta ? ` — ${stepMeta.title}` : ''}. Complete the fields there, then return to submit.`,
        });
        return;
      }

      toast.error(message, {
        description:
          targetStep === undefined
            ? 'Check earlier steps for missing required fields.'
            : 'Review the highlighted fields before submitting.',
      });
    },
    [currentStep],
  );

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
        employees: sanitizeEmployees(data.employees),
      };

      const dataForApi: FormValues = classificationContentEnabled
        ? sanitizedData
        : (() => {
            const { attachments: _attachments, ...rest } = sanitizedData;
            return rest as FormValues;
          })();

      if (
        selectionIncludesOthers(dataForApi.classifications, workClassifications) &&
        !String(dataForApi.workClassificationOtherDetail ?? '').trim()
      ) {
        toast.error('Please describe the work type when "Lainnya / Others" is selected.');
        form.setError('workClassificationOtherDetail', {
          type: 'manual',
          message: 'Required when Others is selected',
        });
        setIsSubmitting(false);
        return;
      }

      const normClass = (r: { workClassificationId: string; order: number }[]) =>
        [...r]
          .filter((x) => x.workClassificationId)
          .sort((a, b) => a.order - b.order)
          .map((x) => `${x.workClassificationId}:${x.order}`)
          .join('|');
      const classificationsChanged =
        mode === 'edit' &&
        workPermit &&
        normClass(dataForApi.classifications) !==
          normClass(
            (workPermit.classifications ?? []).map((c) => ({
              workClassificationId: c.workClassificationId,
              order: c.order,
            })),
          );

      const normalizeWorkers = (
        workers: FormValues['workers'],
      ): CreateWorkPermitDTO['workers'] =>
        workers.map((w) => ({
          userId: w.userId,
          order: w.order,
          healthScreeningId: w.healthScreeningId?.trim() || undefined,
        }));

      for (const w of dataForApi.workers) {
        const profile = workerUsers.find((u) => u.id === w.userId);
        const fromPermit =
          mode === 'edit' ? workPermit?.workers?.find((x) => x.order === w.order) : undefined;
        const hasProfession =
          (profile?.professionId && String(profile.professionId).length > 0) ||
          (profile?.profession && String(profile.profession).trim().length > 0) ||
          (fromPermit?.professionId && String(fromPermit.professionId).length > 0) ||
          !!fromPermit?.profession;
        if (!hasProfession) {
          toast.error(
            'Each worker must have a profession on their profile. Update the worker in Workers or edit their user profile.',
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (mode === 'create') {
        if (!isContractor && !String(dataForApi.applicantUserId ?? '').trim()) {
          toast.error('Applicant (Contractor) is required.');
          form.setError('applicantUserId', { type: 'manual', message: 'Applicant is required' });
          setIsSubmitting(false);
          return;
        }
        await onSubmit({
          ...dataForApi,
          workers: normalizeWorkers(dataForApi.workers),
          ...(classificationContentEnabled
            ? {
                classificationSafetyGuidance: guidanceBlocks.map((b) => ({
                  workClassificationId: b.workClassificationId,
                  order: b.order,
                  safetyGuidelineSnapshot: b.safetyGuidelineSnapshot,
                  rows: b.rows.map((r, i) => ({ ...r, order: r.order ?? i })),
                })),
              }
            : {}),
        } as CreateWorkPermitDTO);
      } else {
        await onSubmit({
          ...dataForApi,
          workers: normalizeWorkers(dataForApi.workers),
          ...(classificationContentEnabled && !classificationsChanged
            ? {
                classificationSafetyGuidance: guidanceBlocks
                  .filter((b) => b.workPermitClassificationId)
                  .map((b) => ({
                    workPermitClassificationId: b.workPermitClassificationId!,
                    safetyGuidelineSnapshot: b.safetyGuidelineSnapshot,
                    rows: b.rows.map((r, i) => ({ ...r, order: r.order ?? i })),
                  })),
              }
            : {}),
        } as UpdateWorkPermitDTO);
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const maybeAxiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage = maybeAxiosError.response?.data?.message ?? maybeAxiosError.message;
      toast.error(apiMessage || 'Failed to save work permit');
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

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 4;

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(4, prev + 1) as WizardStep);
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleSubmitInvalid)} className="space-y-6">
        {mode === 'create' && !isContractor && (
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>Applicant</WorkPermitSubsectionTitle>
              <CardDescription>Select the contractor applicant for this permit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="applicantUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Applicant (Contractor) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={applicantOptionsFiltered}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder="Select applicant"
                        searchPlaceholder="Search contractor..."
                        onSearch={(q) => setApplicantSearchQuery(q)}
                        onCreateNew={(query) => {
                          setAddApplicantInitialName(query);
                          setAddApplicantModalOpen(true);
                        }}
                        createNewText="Add new applicant"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <WorkPermitSubsectionTitle>Form Progress</WorkPermitSubsectionTitle>
            <CardDescription>Complete all steps before submitting the work permit.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {wizardSteps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : isCompleted
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-border bg-background'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <p className="text-xs font-medium text-muted-foreground">Step {step.id}</p>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Section A — PRD */}
        {currentStep === 1 && (
        <WorkPermitSection
          id="work-permit-section-a"
          title={WORK_PERMIT_SECTIONS.A}
          description="Select at least one work classification for this permit (required)"
        >
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>
                {WORK_PERMIT_SECTION_A_SUB.classifications}{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </WorkPermitSubsectionTitle>
              <CardDescription>Select one or more classifications (required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="classifications"
                render={({ field }) => {
                  const rows =
                    (Array.isArray(field.value) ? field.value : [])
                      .filter((r) => r?.workClassificationId)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ?? [];
                  const selectedIds = rows.map((r) => r.workClassificationId);
                  const options = workClassifications.map((wc) => ({ value: wc.id, label: wc.name }));

                  return (
                    <FormItem>
                      <FormLabel>
                        Classification <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <MultiSelectSearchable
                          options={options}
                          value={selectedIds}
                          onValueChange={(ids) => {
                            field.onChange(ids.map((id, idx) => ({ workClassificationId: id, order: idx })));
                          }}
                          placeholder="Select classifications"
                          searchPlaceholder="Search classification..."
                          maxDisplay={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {showOthersDetailField && (
                <FormField
                  control={form.control}
                  name="workClassificationOtherDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Others (write the work classification name) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="write the other type of work name"
                          className="min-h-[88px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </WorkPermitSection>
        )}

        {/* Section B — PRD */}
        {currentStep === 1 && (
        <WorkPermitSection id="work-permit-section-b" title={WORK_PERMIT_SECTIONS.B}>
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.projectSchedule}</WorkPermitSubsectionTitle>
            <CardDescription>Project, area, company, and proposed dates</CardDescription>
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
                        options={companyOptionsFiltered}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select company"
                        searchPlaceholder="Search company..."
                        onSearch={(q) => setCompanySearchQuery(q)}
                        {...(hasPermission('company:create')
                          ? {
                              onCreateNew: (query: string) => {
                                setAddCompanyInitialName(query);
                                setAddCompanyModalOpen(true);
                              },
                              createNewText: 'Add new company',
                            }
                          : {})}
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

        <Card>
          <CardHeader>
            <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.workDescription}</WorkPermitSubsectionTitle>
            <CardDescription>Describe the work stages for this permit</CardDescription>
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
          </CardContent>
        </Card>

        {/* Workers — Section B */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.workers}</WorkPermitSubsectionTitle>
              <CardDescription>
                Select each worker; profession and ID number come from their profile (Workers module).
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendWorker({
                  userId: '',
                  healthScreeningId: '',
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
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none">
                      Profession &amp; ID number{' '}
                      <span className="text-muted-foreground font-normal">(from worker profile)</span>
                    </p>
                    <WorkerProfileFromUser
                      control={form.control}
                      index={index}
                      workerUsers={workerUsers}
                      permitWorkers={workPermit?.workers}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none">
                      Certificate{' '}
                      <span className="text-muted-foreground font-normal">(from worker profile)</span>
                    </p>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <WorkerCertificateReadonly control={form.control} index={index} />
                    </div>
                  </div>
                  <WorkerAutoLinkedHealthScreening
                    control={form.control}
                    index={index}
                    setValue={form.setValue}
                    workPermitId={workPermit?.id}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.employees}</WorkPermitSubsectionTitle>
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

        <Card>
          <CardHeader>
            <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.supervisors}</WorkPermitSubsectionTitle>
            <CardDescription>Select supervisors (guests) for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              {(form.watch('supervisorIds') ?? []).map((id) => {
                const guest = guests.find((g) => g.id === id);
                const supLabel = guest?.name ?? guest?.email ?? id;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {guest?.phone ? `${supLabel} · ${guest.phone}` : supLabel}
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

        <Card>
          <CardHeader>
            <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.hseOfficers}</WorkPermitSubsectionTitle>
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
        </WorkPermitSection>
        )}

        {/* Section C — PRD (Tools → Machines → Materials → Heavy Equipment) */}
        {currentStep === 2 && (
        <WorkPermitSection id="work-permit-section-c" title={WORK_PERMIT_SECTIONS.C}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.tools}</WorkPermitSubsectionTitle>
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
                      <FormLabel>Tool</FormLabel>
                      <FormControl>
                        {(() => {
                          const q = (toolSearchQueries[index] ?? '').toString();
                          const options = q.trim() === '' ? toolOptions : toolOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
                          return (
                        <SearchableSelect
                          options={options}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select tool"
                          searchPlaceholder="Search..."
                          debounceMs={0}
                          onSearch={(query) => setToolSearchQueries((prev) => ({ ...prev, [index]: query }))}
                          onCreateNew={(query) =>
                            createToolFromQuery(query, (newTool) => {
                              setTools((prev) => [newTool, ...prev]);
                            })
                          }
                          createNewText="Create new tool"
                        />
                          );
                        })()}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`tools.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-36 shrink-0">
                      <FormLabel>Quantity</FormLabel>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.machines}</WorkPermitSubsectionTitle>
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
                      <FormLabel>Machine</FormLabel>
                      <FormControl>
                        {(() => {
                          const q = (machineSearchQueries[index] ?? '').toString();
                          const options =
                            q.trim() === '' ? machineOptions : machineOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
                          return (
                        <SearchableSelect
                          options={options}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select machine"
                          searchPlaceholder="Search..."
                          debounceMs={0}
                          onSearch={(query) => setMachineSearchQueries((prev) => ({ ...prev, [index]: query }))}
                          onCreateNew={(query) =>
                            createMachineFromQuery(query, (newMachine) => {
                              setMachines((prev) => [newMachine, ...prev]);
                            })
                          }
                          createNewText="Create new machine"
                        />
                          );
                        })()}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`machines.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-36 shrink-0">
                      <FormLabel>Quantity</FormLabel>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.materials}</WorkPermitSubsectionTitle>
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
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        {(() => {
                          const q = (materialSearchQueries[index] ?? '').toString();
                          const options =
                            q.trim() === '' ? materialOptions : materialOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
                          return (
                        <SearchableSelect
                          options={options}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select material"
                          searchPlaceholder="Search..."
                          debounceMs={0}
                          onSearch={(query) => setMaterialSearchQueries((prev) => ({ ...prev, [index]: query }))}
                          onCreateNew={(query) =>
                            createMaterialFromQuery(query, (newMaterial) => {
                              setMaterials((prev) => [newMaterial, ...prev]);
                            })
                          }
                          createNewText="Create new material"
                        />
                          );
                        })()}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`materials.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-36 shrink-0">
                      <FormLabel>Quantity</FormLabel>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.heavyEquipment}</WorkPermitSubsectionTitle>
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
                      <FormLabel>Heavy equipment</FormLabel>
                      <FormControl>
                        {(() => {
                          const q = (heavyEquipmentSearchQueries[index] ?? '').toString();
                          const options =
                            q.trim() === ''
                              ? heavyEquipmentOptions
                              : heavyEquipmentOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
                          return (
                        <SearchableSelect
                          options={options}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select heavy equipment"
                          searchPlaceholder="Search..."
                          debounceMs={0}
                          onSearch={(query) => setHeavyEquipmentSearchQueries((prev) => ({ ...prev, [index]: query }))}
                          onCreateNew={(query) =>
                            createHeavyEquipmentFromQuery(query, (newHeavyEquipment) => {
                              setHeavyEquipment((prev) => [newHeavyEquipment, ...prev]);
                            })
                          }
                          createNewText="Create new heavy equipment"
                        />
                          );
                        })()}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`heavyEquipment.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="w-36 shrink-0">
                      <FormLabel>Quantity</FormLabel>
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
        </WorkPermitSection>
        )}

        {/* Section D — PRD */}
        {currentStep === 3 && (
        <WorkPermitSection
          id="work-permit-section-d"
          title={WORK_PERMIT_SECTIONS.D}
          description="Identify hazards and control measures for this work"
        >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_D_SUB.hazards}</WorkPermitSubsectionTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendHazard({
                  hazardId: '',
                  hazardName: '',
                  activity: '',
                  mitigation: '',
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
                  name={`hazards.${index}.activity`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Activity</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Activity" rows={4} className="min-h-[120px] resize-y" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`hazards.${index}.mitigation`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Mitigation</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Mitigation" rows={3} className="resize-y" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        </WorkPermitSection>
        )}

        {/* Section E — PRD */}
        {currentStep === 3 && (
        <WorkPermitSection
          id="work-permit-section-e"
          title={WORK_PERMIT_SECTIONS.E}
          description="Select safety equipment required for this project"
        >
        <Card>
          <CardHeader>
            <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_E_SUB.selectedEquipment}</WorkPermitSubsectionTitle>
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
        </WorkPermitSection>
        )}

        {currentStep === 3 && classificationContentEnabled && (
          <WorkPermitSafetyGuidelineSection
            blocks={guidanceBlocks}
            onChange={setGuidanceBlocks}
            workClassifications={workClassifications}
            risks={risks}
            safetyEquipment={safetyEquipment}
          />
        )}

        {/* Section F — PRD (HSE review phase only) */}
        {currentStep === 4 && isHseReviewPhase && (
        <WorkPermitSection id="work-permit-section-f" title={WORK_PERMIT_SECTIONS.F}>
            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.courseVerification}</WorkPermitSubsectionTitle>
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

            {requireCourseVerificationEnabled && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.requiredCourses}</WorkPermitSubsectionTitle>
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
            )}

            {classificationContentEnabled && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.attachments}</WorkPermitSubsectionTitle>
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
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
        </WorkPermitSection>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isFirstStep}>
              Back
            </Button>
            <Button type="button" variant="outline" onClick={goToNextStep} disabled={isLastStep}>
              Next
            </Button>
          </div>
          <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isLastStep}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Work Permit' : 'Save Changes'}
          </Button>
          </div>
        </div>
      </form>

      <AddCompanyModal
        open={addCompanyModalOpen}
        onOpenChange={(open) => {
          setAddCompanyModalOpen(open);
          if (!open) {
            setAddCompanyInitialName('');
          }
        }}
        initialName={addCompanyInitialName}
        onSuccess={(company: CompanyDTO) => {
          const row: CompanyOption = {
            id: company.id,
            name: company.name,
            code: company.code,
            phone: company.phone ?? null,
          };
          setCompanies((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
          form.setValue('companyId', company.id);
          void form.trigger('companyId');
          setAddCompanyInitialName('');
        }}
      />

      <AddWorkerModal
        open={addWorkerModalOpen}
        createMode="contractor"
        permitCompanyId={watchedCompanyId}
        isSuperAdmin={isSuperAdmin}
        professions={professions}
        onProfessionCreated={(p) => setProfessions((prev) => [p, ...prev])}
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

      <AddApplicantWithCompanyModal
        open={addApplicantModalOpen}
        onOpenChange={(open) => {
          setAddApplicantModalOpen(open);
          if (!open) {
            setAddApplicantInitialName('');
          }
        }}
        initialName={addApplicantInitialName}
        isSuperAdmin={isSuperAdmin}
        companies={companies}
        permitCompanyId={watchedCompanyId ?? ''}
        canCreateCompany={hasPermission('company:create')}
        professions={professions}
        onProfessionCreated={(p) => setProfessions((prev) => [p, ...prev])}
        onCompanyCreated={(company: CompanyDTO) => {
          const row: CompanyOption = {
            id: company.id,
            name: company.name,
            code: company.code,
            phone: company.phone ?? null,
          };
          setCompanies((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
        }}
        onSuccess={(user: User) => {
          setApplicants((prev) => [
            ...prev,
            {
              id: user.id,
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
              email: user.email ?? '',
              companyId: user.companyId ?? null,
            },
          ]);
          form.setValue('applicantUserId', user.id);
          void form.trigger('applicantUserId');
          setAddApplicantInitialName('');
        }}
      />
    </Form>
  );
};

export default WorkPermitForm;
