import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/core/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash2, Save, CheckCircle2, Upload, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Editor } from '@/core/components/ui/editor';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { IncidentSectionA } from './incident-readonly';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import uploadService from '@/modules/uploads/services/uploadService';
import incidentsService from '@/modules/incidents/services/incidentsService';
import departmentService from '@/modules/master-data/services/departmentService';
import investigationReportsService from '../services/investigationReportsService';
import type { Incident } from '@/modules/incidents/types/incident.types';
import {
  TreatmentEnum,
  AbsenceEnum,
  StopActivityEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
  IncidentClassificationEnum,
} from '@/modules/incidents/types/incident.types';
import {
  FIXED_SIGNATORY_SLOTS,
  SIGNATORY_ROLE_LABELS,
  InvestigationSignatoryRoleEnum,
  InvestigationStatusEnum,
  type InvestigationReport,
} from '../types/investigation-report.types';
import hfacsNodeService from '@/modules/master-data/services/hfacsNodeService';
import type { HfacsNodeDTO } from '@/modules/master-data/types/master-data.types';
import type { SearchableSelectOption } from '@/core/components/ui/searchable-select';
import BodyDiagramCanvas from './BodyDiagramCanvas';

// ── Enum label maps ────────────────────────────────────────────────────────────

const TREATMENT_OPTIONS: { value: TreatmentEnum; label: string }[] = [
  { value: TreatmentEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: TreatmentEnum.NO_TREATMENT, label: 'None / Tidak ada' },
  { value: TreatmentEnum.SELF, label: 'Self / Sendiri' },
  { value: TreatmentEnum.FIRST_AID, label: 'First Aider / P3K' },
  { value: TreatmentEnum.MEDICAL_TREATMENT, label: 'Medical Treatment / Pengobatan medis' },
  { value: TreatmentEnum.HEALTH_SERVICES, label: 'Health Services (outpatient) / Pelayanan Kesehatan' },
  { value: TreatmentEnum.HOSPITALIZATION, label: 'Hospital (inpatient) / Rawat Inap' },
  { value: TreatmentEnum.OTHER, label: 'Others / Lainnya' },
];

const ABSENCE_OPTIONS: { value: AbsenceEnum; label: string }[] = [
  { value: AbsenceEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: AbsenceEnum.RETURNED_AFTER_TREATMENT, label: 'Returned to work/studies / Kembali bekerja setelah diberi tindakan' },
  { value: AbsenceEnum.MORE_THAN_THREE_DAYS, label: 'Likely more than 3 days / Lebih dari 3 hari' },
  { value: AbsenceEnum.NOT_YET_KNOWN, label: 'Not yet known / Belum diketahui' },
];

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
  { value: GenderEnum.MALE, label: 'Male / Laki-laki' },
  { value: GenderEnum.FEMALE, label: 'Female / Perempuan' },
];

const LEVEL_OF_INJURY_OPTIONS: { value: LevelOfInjuryEnum; label: string }[] = [
  { value: LevelOfInjuryEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: LevelOfInjuryEnum.MINOR, label: 'Minor' },
  { value: LevelOfInjuryEnum.MODERATE, label: 'Moderate' },
  { value: LevelOfInjuryEnum.SEVERE, label: 'Severe' },
  { value: LevelOfInjuryEnum.FATAL, label: 'Fatal' },
];

const BODY_PART_OPTIONS: { value: InjuredBodyPartEnum; label: string }[] = [
  { value: InjuredBodyPartEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: InjuredBodyPartEnum.HEAD, label: 'Head / Kepala' },
  { value: InjuredBodyPartEnum.NECK, label: 'Neck / Leher' },
  { value: InjuredBodyPartEnum.ARM, label: 'Arms / Lengan' },
  { value: InjuredBodyPartEnum.HAND, label: 'Hands / Tangan' },
  { value: InjuredBodyPartEnum.BACK, label: 'Back / Punggung' },
  { value: InjuredBodyPartEnum.CHEST, label: 'Chest / Dada' },
  { value: InjuredBodyPartEnum.ABDOMENT, label: 'Abdomen / Perut' },
  { value: InjuredBodyPartEnum.FEET, label: 'Feet / Telapak kaki' },
  { value: InjuredBodyPartEnum.LEG, label: 'Legs / Kaki' },
  { value: InjuredBodyPartEnum.SKIN, label: 'Skin / Kulit' },
  { value: InjuredBodyPartEnum.EYE, label: 'Eyes / Mata' },
  { value: InjuredBodyPartEnum.INTERNAL_ORGAN, label: 'Internal Organs / Organ dalam' },
  { value: InjuredBodyPartEnum.SHOULDER, label: 'Shoulder / Pundak' },
  { value: InjuredBodyPartEnum.OTHER, label: 'Other / Lainnya' },
];

const TYPE_OF_INJURY_OPTIONS: { value: TypeOfInjuryEnum; label: string }[] = [
  { value: TypeOfInjuryEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: TypeOfInjuryEnum.DERMATITIS, label: 'Dermatitis / Peradangan kulit' },
  { value: TypeOfInjuryEnum.PARALYSIS, label: 'Paralysis / Kelumpuhan' },
  { value: TypeOfInjuryEnum.AMPUTATION, label: 'Amputation / Terpotongnya anggota tubuh' },
  { value: TypeOfInjuryEnum.CRUSH, label: 'Crush / Remuk' },
  { value: TypeOfInjuryEnum.BURN, label: 'Burn / Luka Bakar' },
  { value: TypeOfInjuryEnum.CONCUSSION, label: 'Concussion / Gegar' },
  { value: TypeOfInjuryEnum.FRACTURE, label: 'Fracture / Patah tulang' },
  { value: TypeOfInjuryEnum.LACERATION, label: 'Laceration / Luka sobek' },
  { value: TypeOfInjuryEnum.SPRAIN, label: 'Sprain / Strain / Keseleo' },
  { value: TypeOfInjuryEnum.BRUISE, label: 'Bruising / Memar' },
  { value: TypeOfInjuryEnum.ABRASION, label: 'Abrasion / Luka lecet' },
  { value: TypeOfInjuryEnum.CUT, label: 'Cut / Luka potong' },
  { value: TypeOfInjuryEnum.OTHER, label: 'Other / Lainnya' },
];

const MECHANISM_OPTIONS: { value: MechanismOfInjuryEnum; label: string }[] = [
  { value: MechanismOfInjuryEnum.NOT_SPECIFIED, label: 'Not Specified' },
  { value: MechanismOfInjuryEnum.STRUCK_BY, label: 'Struck by / Ditabrak' },
  { value: MechanismOfInjuryEnum.CHEMICAL, label: 'Chemicals / Bahan Kimia' },
  { value: MechanismOfInjuryEnum.ELECTRICITY, label: 'Electricity / Listrik' },
  { value: MechanismOfInjuryEnum.FLYING_OBJECT, label: 'Flying object / Objek berterbangan' },
  { value: MechanismOfInjuryEnum.SHARP_OBJECTS, label: 'Sharp objects / Benda Tajam' },
  { value: MechanismOfInjuryEnum.FAILING_OBJECT, label: 'Falling Object / Objek jatuh' },
  { value: MechanismOfInjuryEnum.VEHICLES, label: 'Vehicles / Kendaraan' },
  { value: MechanismOfInjuryEnum.HAND_TOOLS, label: 'Hand Tools / Perkakas tangan' },
  { value: MechanismOfInjuryEnum.HEAT_COLD, label: 'Heat / Cold / Panas / Dingin' },
  { value: MechanismOfInjuryEnum.TRIP, label: 'Trip / Slip / Fall / Tersandung/Tergelincir/Terjatuh' },
  { value: MechanismOfInjuryEnum.MECHINARY, label: 'Machinery / Mesin' },
  { value: MechanismOfInjuryEnum.FALL_FROM_HEIGHT, label: 'Fall from Height / Jatuh dari ketinggian' },
  { value: MechanismOfInjuryEnum.MANUAL_HANDLING, label: 'Manual Handling / Pengangkatan manual' },
  { value: MechanismOfInjuryEnum.OTHER, label: 'Other / Lainnya' },
];

// ── Zod schema ─────────────────────────────────────────────────────────────────

const causeSchema = z.object({
  hfacsNodeId: z.string(),
  causeKey: z.string().optional(),
  isSelected: z.boolean(),
  customNotes: z.string().optional(),
});

const actionPlanSchema = z.object({
  actionPlan: z.string().min(1, 'Action plan is required'),
  responsiblePerson: z.string().optional(),
  targetDate: z.string().optional(),
  targetDateNotes: z.string().optional(),
  verificationDate: z.string().optional(),
});

const signatorySchema = z.object({
  signatoryRole: z.string().optional(),
  roleName: z.string().optional(),
  name: z.string().optional(),
  signedAt: z.string().optional(),
});

const injuredPersonSchema = z.object({
  injuredPersonName: z.string().optional(),
  gender: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
  levelOfInjury: z.string().optional(),
  injuredBodyPart: z.string().optional(),
  typeOfInjury: z.string().optional(),
  mechanismOfInjury: z.string().optional(),
});

const witnessSchema = z.object({
  witnessName: z.string().optional(),
  gender: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
});

const imageSchema = z.object({
  imageUrl: z.string(),
  caption: z.string().optional(),
});

const formSchema = z.object({
  // Section A — editable incident fields
  incidentDescription: z.string().optional(),
  images: z.array(imageSchema).default([]),

  // Section B — injury classification + summary selections
  incidentClassification: z.string().optional(),
  bodyPartsSummary: z.array(z.string()).default([]),
  injuryTypesSummary: z.array(z.string()).default([]),
  mechanismsSummary: z.array(z.string()).default([]),
  bodyDiagramUrl: z.string().nullable().optional(),

  // Section A1/A2 — investigation-specific
  taskBeingPerformed: z.string().optional(),
  equipmentUsed: z.string().optional(),

  // Section C — injured persons
  injuredPersons: z.array(injuredPersonSchema).default([]),

  // Section D — action following incident
  treatment: z.string().optional(),
  absence: z.string().optional(),
  treatmentDescription: z.string().optional(),

  // Section E — stop activity
  needToStopActivity: z.string().optional(),
  stopLocally: z.boolean().default(false),
  stopWholeSchool: z.boolean().default(false),

  // Section F — witnesses
  witnesses: z.array(witnessSchema).default([]),

  // Section G — cost
  costMedical: z.string().optional(),
  costLostTime: z.string().optional(),
  costDamage: z.string().optional(),
  costRepair: z.string().optional(),
  costCompensation: z.string().optional(),
  costOther: z.string().optional(),
  costNotYetKnown: z.boolean().default(false),

  causes: z.array(causeSchema),
  actionPlans: z.array(actionPlanSchema),
  signatories: z.array(signatorySchema),

  hsComments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Utilities ──────────────────────────────────────────────────────────────────

const parseNumber = (s?: string): number | undefined => {
  if (!s || s.trim() === '') return undefined;
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

const sumCost = (vals: FormValues): number =>
  [
    parseNumber(vals.costMedical),
    parseNumber(vals.costLostTime),
    parseNumber(vals.costDamage),
    parseNumber(vals.costRepair),
    parseNumber(vals.costCompensation),
    parseNumber(vals.costOther),
  ].reduce<number>((acc, v) => acc + (v ?? 0), 0);

const formatRupiah = (n: number) =>
  `Rp. ${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  incident: Incident;
  report?: InvestigationReport;
  mode: 'create' | 'edit';
}

const InvestigationReportForm = ({ incident, report, mode }: Props) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadCategoryId, setUploadCategoryId] = useState<string | null>(null);
  const [hfacsTree, setHfacsTree] = useState<HfacsNodeDTO[]>([]);
  const [hfacsLoading, setHfacsLoading] = useState(true);
  const [departments, setDepartments] = useState<SearchableSelectOption[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const latentTier1s = useMemo(
    () => hfacsTree.filter((n) => n.section === 'LATENT_FAILURE'),
    [hfacsTree],
  );
  const activeTier1s = useMemo(
    () => hfacsTree.filter((n) => n.section === 'ACTIVE_FAILURE'),
    [hfacsTree],
  );

  const leafItems = useMemo(() => {
    const leaves: HfacsNodeDTO[] = [];
    for (const t1 of hfacsTree) {
      for (const t2 of t1.children ?? []) {
        for (const item of t2.children ?? []) {
          leaves.push(item);
        }
      }
    }
    return leaves;
  }, [hfacsTree]);

  const initialCauses = useMemo(() => {
    const existingByNode = new Map(
      (report?.causes ?? [])
        .filter((c) => !!c.hfacsNodeId)
        .map((c) => [c.hfacsNodeId as string, c]),
    );
    const existingByKey = new Map(
      (report?.causes ?? []).map((c) => [c.causeKey, c]),
    );
    return leafItems.map((leaf) => {
      const existing =
        existingByNode.get(leaf.id) ??
        (leaf.code ? existingByKey.get(leaf.code) : undefined);
      return {
        hfacsNodeId: leaf.id,
        causeKey: leaf.code ?? '',
        isSelected: existing?.isSelected ?? false,
        customNotes: existing?.customNotes ?? '',
      };
    });
  }, [leafItems, report]);

  const initialSignatories = useMemo(() => {
    return FIXED_SIGNATORY_SLOTS.map((role) => {
      const existing = report?.signatories?.find((s) => s.signatoryRole === role);
      return {
        signatoryRole: role,
        roleName: existing?.roleName ?? '',
        name: existing?.name ?? '',
        signedAt: existing?.signedAt ? format(new Date(existing.signedAt), 'yyyy-MM-dd') : '',
      };
    });
  }, [report]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Section A — editable incident fields
      incidentDescription: incident.description ?? '',
      images: incident.images?.map((img) => ({
        imageUrl: img.imageUrl,
        caption: img.caption ?? '',
      })) ?? [],

      // Section B
      incidentClassification: incident.incidentClassification ?? '',
      bodyPartsSummary: report?.bodyPartsSummary ?? [],
      injuryTypesSummary: report?.injuryTypesSummary ?? [],
      mechanismsSummary: report?.mechanismsSummary ?? [],
      bodyDiagramUrl: report?.bodyDiagramUrl ?? null,

      // Section A1/A2
      taskBeingPerformed: report?.taskBeingPerformed ?? '',
      equipmentUsed: report?.equipmentUsed ?? '',

      // Section C — injured persons
      injuredPersons: incident.injuredPersons?.map((p) => ({
        injuredPersonName: p.injuredPersonName ?? '',
        gender: p.gender ?? '',
        position: p.position ?? '',
        departmentId: p.departmentId ?? '',
        levelOfInjury: p.levelOfInjury ?? '',
        injuredBodyPart: p.injuredBodyPart ?? '',
        typeOfInjury: p.typeOfInjury ?? '',
        mechanismOfInjury: p.mechanismOfInjury ?? '',
      })) ?? [],

      // Section D
      treatment: incident.treatment ?? '',
      absence: incident.absence ?? '',
      treatmentDescription: incident.treatmentDescription ?? '',

      // Section E
      needToStopActivity: incident.needToStopActivity ?? '',
      stopLocally: incident.stopLocally ?? false,
      stopWholeSchool: incident.stopWholeSchool ?? false,

      // Section F — witnesses
      witnesses: incident.witnesses?.map((w) => ({
        witnessName: w.witnessName ?? '',
        gender: w.gender ?? '',
        position: w.position ?? '',
        departmentId: w.departmentId ?? '',
      })) ?? [],

      // Section G — cost
      costMedical: report?.cost?.medicalCost?.toString() ?? '',
      costLostTime: report?.cost?.lostTimeCost?.toString() ?? '',
      costDamage: report?.cost?.damageCost?.toString() ?? '',
      costRepair: report?.cost?.repairCost?.toString() ?? '',
      costCompensation: report?.cost?.compensationCost?.toString() ?? '',
      costOther: report?.cost?.otherCost?.toString() ?? '',
      costNotYetKnown: report?.cost?.isNotYetKnown ?? false,

      causes: initialCauses,
      actionPlans:
        report?.actionPlans?.map((a) => ({
          actionPlan: a.actionPlan,
          responsiblePerson: a.responsiblePerson ?? '',
          targetDate: a.targetDate
            ? format(new Date(a.targetDate), 'yyyy-MM-dd')
            : '',
          targetDateNotes: a.targetDateNotes ?? '',
          verificationDate: a.verificationDate
            ? format(new Date(a.verificationDate), 'yyyy-MM-dd')
            : '',
        })) ?? [],
      signatories: initialSignatories,

      hsComments: report?.hsComments ?? '',
    },
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } =
    useFieldArray({ control: form.control, name: 'actionPlans' });

  const { fields: injuredPersonFields, append: appendInjuredPerson, remove: removeInjuredPerson } =
    useFieldArray({ control: form.control, name: 'injuredPersons' });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } =
    useFieldArray({ control: form.control, name: 'witnesses' });

  const { fields: imageFields, append: appendImage, remove: removeImage } =
    useFieldArray({ control: form.control, name: 'images' });

  const { fields: signatoryFields } =
    useFieldArray({ control: form.control, name: 'signatories' });

  useEffect(() => {
    let cancelled = false;
    uploadService
      .getCategoryByName('course-materials')
      .then((cat) => {
        if (!cancelled && cat) setUploadCategoryId(cat.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    departmentService
      .getDepartments({ page: 1, limit: 500, options: true })
      .then((res) => {
        if (!cancelled) {
          setDepartments(res.data.map((d) => ({ value: d.id, label: d.name })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setHfacsLoading(true);
    hfacsNodeService
      .getTree()
      .then((tree) => {
        if (!cancelled) setHfacsTree(tree);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load HFACS catalogue');
      })
      .finally(() => {
        if (!cancelled) setHfacsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (leafItems.length === 0) return;
    form.setValue('causes', initialCauses, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafItems, report?.id]);

  const watched = form.watch();
  const total = sumCost(watched);
  const stopActivityValue = form.watch('needToStopActivity');

  const handleImageUpload = async (file: File) => {
    if (!uploadCategoryId) {
      toast.error('Upload not ready, please retry');
      return;
    }
    setImageUploading(true);
    try {
      const res = await uploadService.uploadFile(file, uploadCategoryId, true);
      appendImage({ imageUrl: uploadService.getPublicFileUrl(res.id), caption: '' });
      toast.success('Image uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = async (
    data: FormValues,
    statusOverride?: InvestigationStatusEnum,
  ) => {
    setIsSubmitting(true);
    try {
      const causes = data.causes
        .filter((c) => c.isSelected || (c.customNotes && c.customNotes.trim() !== ''))
        .map((c) => ({
          hfacsNodeId: c.hfacsNodeId,
          isSelected: c.isSelected,
          customNotes:
            c.customNotes && c.customNotes.trim() !== '' ? c.customNotes : undefined,
          order: 0,
        }));

      const payload = {
        taskBeingPerformed: data.taskBeingPerformed || undefined,
        equipmentUsed: data.equipmentUsed || undefined,
        ...(statusOverride ? { status: statusOverride } : {}),
        bodyPartsSummary: data.bodyPartsSummary,
        injuryTypesSummary: data.injuryTypesSummary,
        mechanismsSummary: data.mechanismsSummary,
        bodyDiagramUrl: data.bodyDiagramUrl ?? null,
        cost: {
          medicalCost: parseNumber(data.costMedical),
          lostTimeCost: parseNumber(data.costLostTime),
          damageCost: parseNumber(data.costDamage),
          repairCost: parseNumber(data.costRepair),
          compensationCost: parseNumber(data.costCompensation),
          otherCost: parseNumber(data.costOther),
          isNotYetKnown: data.costNotYetKnown,
        },
        causes,
        actionPlans: data.actionPlans.map((a, i) => ({
          actionPlan: a.actionPlan,
          responsiblePerson: a.responsiblePerson || undefined,
          targetDate: a.targetDate ? new Date(a.targetDate).toISOString() : undefined,
          targetDateNotes: a.targetDateNotes || undefined,
          verificationDate: a.verificationDate
            ? new Date(a.verificationDate).toISOString()
            : undefined,
          order: i,
        })),
        signatories: data.signatories.map((s, i) => ({
          signatoryRole: (s.signatoryRole as InvestigationSignatoryRoleEnum) || undefined,
          roleName: s.roleName || undefined,
          name: s.name || undefined,
          signedAt: s.signedAt ? new Date(s.signedAt).toISOString() : undefined,
          order: i,
        })),
        hsComments: data.hsComments || undefined,
      };

      const saved =
        mode === 'create'
          ? await investigationReportsService.create({ incidentId: incident.id, ...payload })
          : await investigationReportsService.update(report!.id, payload);

      // Update incident-level fields in parallel
      await incidentsService.update(incident.id, {
        description: data.incidentDescription || undefined,
        incidentClassification: (data.incidentClassification as IncidentClassificationEnum) || undefined,
        treatment: (data.treatment as TreatmentEnum) || undefined,
        absence: (data.absence as AbsenceEnum) || undefined,
        treatmentDescription: data.treatmentDescription || undefined,
        needToStopActivity: (data.needToStopActivity as StopActivityEnum) || undefined,
        stopLocally: data.stopLocally,
        stopWholeSchool: data.stopWholeSchool,
        images: data.images.map((img, i) => ({
          imageUrl: img.imageUrl,
          caption: img.caption || undefined,
          order: i,
        })),
        injuredPersons: data.injuredPersons.map((p, i) => ({
          injuredPersonName: p.injuredPersonName || undefined,
          gender: (p.gender as GenderEnum) || undefined,
          position: p.position || undefined,
          departmentId: p.departmentId || undefined,
          levelOfInjury: (p.levelOfInjury as LevelOfInjuryEnum) || LevelOfInjuryEnum.NOT_SPECIFIED,
          injuredBodyPart: (p.injuredBodyPart as InjuredBodyPartEnum) || InjuredBodyPartEnum.NOT_SPECIFIED,
          typeOfInjury: (p.typeOfInjury as TypeOfInjuryEnum) || TypeOfInjuryEnum.NOT_SPECIFIED,
          mechanismOfInjury: (p.mechanismOfInjury as MechanismOfInjuryEnum) || MechanismOfInjuryEnum.NOT_SPECIFIED,
          order: i,
        })),
        witnesses: data.witnesses.map((w, i) => ({
          witnessName: w.witnessName || undefined,
          gender: (w.gender as GenderEnum) || undefined,
          position: w.position || undefined,
          departmentId: w.departmentId || undefined,
          order: i,
        })),
      });

      toast.success(
        statusOverride === InvestigationStatusEnum.COMPLETE
          ? 'Investigation report marked as complete'
          : `Investigation report ${mode === 'create' ? 'created' : 'updated'}`,
      );
      navigate(`/investigation-reports/${saved.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save investigation report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHfacsTier = (tiers: HfacsNodeDTO[]) => {
    if (hfacsLoading) {
      return (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Loading HFACS catalogue…
        </p>
      );
    }
    if (tiers.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No HFACS entries configured for this section. Admins can add them under
          Master Data → HFACS Catalogue.
        </p>
      );
    }
    return (
      <div className="space-y-6">
        {tiers.map((t1) => (
          <div key={t1.id} className="space-y-4">
            <div className="rounded-md bg-muted px-4 py-2">
              <h3 className="text-base font-semibold">{t1.labelEn}</h3>
              <p className="text-xs text-muted-foreground">{t1.labelId}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(t1.children ?? []).map((t2) => (
                <div key={t2.id} className="rounded-md border p-4 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{t2.labelEn}</p>
                    <p className="text-xs text-muted-foreground">{t2.labelId}</p>
                  </div>
                  <div className="space-y-1.5">
                    {(t2.children ?? []).map((item) => {
                      const allCauses = form.getValues('causes');
                      const causeIndex = allCauses.findIndex(
                        (c) => c.hfacsNodeId === item.id,
                      );
                      if (causeIndex < 0) return null;
                      const isSelected = form.watch(`causes.${causeIndex}.isSelected`);
                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-start gap-2 rounded px-2 py-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(v) =>
                                form.setValue(
                                  `causes.${causeIndex}.isSelected`,
                                  Boolean(v),
                                  { shouldDirty: true },
                                )
                              }
                              className="mt-0.5"
                            />
                            <Label className="text-sm font-normal cursor-pointer leading-snug">
                              <span>{item.labelEn}</span>
                              <span className="text-muted-foreground"> — {item.labelId}</span>
                            </Label>
                          </div>
                          {item.isOther && isSelected && (
                            <Input
                              placeholder="Specify..."
                              className="ml-6 h-8 text-sm"
                              {...form.register(`causes.${causeIndex}.customNotes`)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => onSubmit(d))}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Section A — Accident Details (read-only header from incident) */}
        <IncidentSectionA incident={incident} reportNumber={report?.reportNumber ?? null} />

        {/* Section A — Editable: Description of Incident */}
        <Card>
          <CardHeader>
            <CardTitle>A. Description of Incident / Deskripsi Kejadian</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of Incident (Deskripsi Kejadian)</FormLabel>
                  <FormControl>
                    <Editor value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* A1/A2 — Task & Equipment (always visible, editable) */}
        <Card>
          <CardHeader>
            <CardTitle>A1/A2 — Task &amp; Equipment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="taskBeingPerformed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A1. Task Being Performed (Pekerjaan apa yang sedang dilakukan)</FormLabel>
                  <FormControl>
                    <Editor value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipmentUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A2. Equipment, Tools and Materials (Peralatan atau material apa yang sedang di gunakan)</FormLabel>
                  <FormControl>
                    <Editor value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* A4 — Images / Sketch */}
        <Card>
          <CardHeader>
            <CardTitle>A4. Images / Sketch (Gambar/Sketsa kejadian)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imageFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="relative rounded-md border overflow-hidden bg-muted">
                    <img
                      src={form.watch(`images.${index}.imageUrl`)}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="px-2 py-1 space-y-1">
                      <Input
                        placeholder="Caption (optional)"
                        className="h-7 text-xs"
                        {...form.register(`images.${index}.caption`)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  for (const f of files) {
                    await handleImageUpload(f);
                  }
                  e.target.value = '';
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button type="button" variant="outline" size="sm" asChild disabled={imageUploading}>
                  <span>
                    <Upload className="mr-1 h-4 w-4" />
                    {imageUploading ? 'Uploading…' : 'Upload Image(s)'}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section B — Injury Details (reactive from Section C + editable B4) */}
        <SectionBEditable form={form} uploadCategoryId={uploadCategoryId} />

        {/* Section C — Injured Persons (editable) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>C. Injured Person Details / Rincian Korban</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  appendInjuredPerson({
                    injuredPersonName: '',
                    gender: '',
                    position: '',
                    departmentId: '',
                    levelOfInjury: '',
                    injuredBodyPart: '',
                    typeOfInjury: '',
                    mechanismOfInjury: '',
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Person
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {injuredPersonFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No injured person during this incident. / Tidak ada korban dalam insiden ini.
              </p>
            ) : (
              injuredPersonFields.map((field, index) => (
                <Card key={field.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">No. {index + 1}</Label>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeInjuredPerson(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.injuredPersonName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name / Nama</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Full name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender / Jenis Kelamin</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Jabatan</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Job title / position" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.departmentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department / Bagian</FormLabel>
                            <SearchableSelect
                              options={departments}
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              placeholder="Select department"
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.levelOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level of Injury / Tingkat Cedera</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LEVEL_OF_INJURY_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.injuredBodyPart`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Body Part Injured / Bagian tubuh yang cidera</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select body part" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BODY_PART_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.typeOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Injury / Tipe Cidera</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TYPE_OF_INJURY_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`injuredPersons.${index}.mechanismOfInjury`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mechanism of Injury / Mekanisme Cidera</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select mechanism" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MECHANISM_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section D — Action Following Incident (editable) */}
        <Card>
          <CardHeader>
            <CardTitle>D. Action Following Incident / Tindakan yang dilakukan terhadap Kejadian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>D1. Treatment / Penanganan</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TREATMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="absence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>D2. Absence / Absen</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select absence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ABSENCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="treatmentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>D3. Describe the treatment taken / Jelaskan penanganan yang dilakukan</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section E — Need to Stop Activity (editable) */}
        <Card>
          <CardHeader>
            <CardTitle>E. Need to Stop Activity / Perlu menghentikan aktivitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="needToStopActivity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need to Stop Activity</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={StopActivityEnum.YES} id="stop-yes" />
                        <Label htmlFor="stop-yes" className="font-normal cursor-pointer">Yes / Ya</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={StopActivityEnum.NO} id="stop-no" />
                        <Label htmlFor="stop-no" className="font-normal cursor-pointer">No / Tidak</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {stopActivityValue === StopActivityEnum.YES && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm text-muted-foreground">If Yes / Jika Ya</Label>
                <FormField
                  control={form.control}
                  name="stopLocally"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                      </FormControl>
                      <Label className="font-normal cursor-pointer leading-snug">
                        Stop activity locally related to the accident/incident/nearmiss
                        <span className="block text-xs text-muted-foreground">
                          Hentikan aktivitas terkait kecelakaan/insiden/nearmiss
                        </span>
                      </Label>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stopWholeSchool"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                      </FormControl>
                      <Label className="font-normal cursor-pointer leading-snug">
                        Stop the whole school activities
                        <span className="block text-xs text-muted-foreground">
                          Hentikan seluruh kegiatan sekolah
                        </span>
                      </Label>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section F — Witnesses (editable) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>F. Witnesses / Saksi</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  appendWitness({
                    witnessName: '',
                    gender: '',
                    position: '',
                    departmentId: '',
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Witness
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {witnessFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No witness recorded. / Tidak ada saksi yang tercatat.
              </p>
            ) : (
              witnessFields.map((field, index) => (
                <Card key={field.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">No. {index + 1}</Label>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeWitness(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.witnessName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name / Nama</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Full name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender / Jenis Kelamin</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Jabatan</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Job title / position" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.departmentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department / Bagian</FormLabel>
                            <SearchableSelect
                              options={departments}
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              placeholder="Select department"
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section G — Cost */}
        <Card>
          <CardHeader>
            <CardTitle>G. Estimation Cost / Estimasi Kerugian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostInput name="costMedical" label="Medical Cost" idLabel="Biaya Pengobatan" form={form} />
              <CostInput name="costLostTime" label="Lost Time Cost" idLabel="Biaya Kehilangan Jam Kerja" form={form} />
              <CostInput name="costDamage" label="Damage Cost" idLabel="Biaya Kerusakan/Kehilangan" form={form} />
              <CostInput name="costRepair" label="Repair Cost" idLabel="Biaya Perbaikan/Penggantian" form={form} />
              <CostInput name="costCompensation" label="Compensation Cost" idLabel="Biaya Kompensasi" form={form} />
              <CostInput name="costOther" label="Other Cost" idLabel="Biaya Lain-lain" form={form} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="costNotYetKnown"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <Label className="font-normal cursor-pointer">
                        Not Yet Known (Belum diketahui)
                      </Label>
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-right">
                <Label className="text-muted-foreground">TOTAL</Label>
                <div className="text-lg font-semibold">
                  {watched.costNotYetKnown
                    ? 'Rp. Not Yet Known (Belum diketahui)'
                    : formatRupiah(total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section H — Latent Failure */}
        <Card>
          <CardHeader>
            <CardTitle>H. Latent Failure / Kegagalan Terpendam (Indirect Cause)</CardTitle>
          </CardHeader>
          <CardContent>{renderHfacsTier(latentTier1s)}</CardContent>
        </Card>

        {/* Section I — Active Failure */}
        <Card>
          <CardHeader>
            <CardTitle>I. Active Failure / Kegagalan Aktif (Direct Cause)</CardTitle>
          </CardHeader>
          <CardContent>{renderHfacsTier(activeTier1s)}</CardContent>
        </Card>

        {/* Section J — Action Plans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>J. Remedial Action Plan / Rencana Tindakan Perbaikan</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  appendAction({
                    actionPlan: '',
                    responsiblePerson: '',
                    targetDate: '',
                    targetDateNotes: '',
                    verificationDate: '',
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Action
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action plans yet.</p>
            ) : (
              actionFields.map((field, index) => (
                <Card key={field.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">No. {index + 1}</Label>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAction(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`actionPlans.${index}.actionPlan`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Plan / Tindakan Perbaikan</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[60px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`actionPlans.${index}.responsiblePerson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsible Person</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Name(s)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actionPlans.${index}.targetDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actionPlans.${index}.targetDateNotes`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Target Date Notes (when TBD)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. Will be discussed further with responsible person"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actionPlans.${index}.verificationDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Date (by H&S)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section K — Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>K. Signatures / Tanda tangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {signatoryFields.length > 0 && (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-2 font-medium whitespace-nowrap">Investigator Team / Tim Penyidik</th>
                      <th className="text-left p-2 font-medium whitespace-nowrap">Name / Nama</th>
                      <th className="text-left p-2 font-medium whitespace-nowrap">Date / Tanggal</th>
                      <th className="w-10 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {signatoryFields.map((field, index) => {
                      const role = field.signatoryRole as InvestigationSignatoryRoleEnum;
                      const label = role ? SIGNATORY_ROLE_LABELS[role] : null;
                      return (
                        <tr key={field.id} className="border-b last:border-0">
                          <td className="p-2 align-top">
                            {label && (
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {label.en} / {label.id}
                              </p>
                            )}
                            <FormField
                              control={form.control}
                              name={`signatories.${index}.roleName`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input {...field} placeholder="e.g. HSE Manager" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="p-2 align-top">
                            <FormField
                              control={form.control}
                              name={`signatories.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input {...field} placeholder="Full name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="p-2 align-top">
                            <FormField
                              control={form.control}
                              name={`signatories.${index}.signedAt`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section L — Health & Safety Comments */}
        <Card>
          <CardHeader>
            <CardTitle>L. Health and Safety Comments / Komentar Health and Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="hsComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health &amp; Safety Comments</FormLabel>
                  <FormControl>
                    <Editor value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit((d) => onSubmit(d))}
          >
            <Save className="mr-1 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit((d) => onSubmit(d, InvestigationStatusEnum.COMPLETE))}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Save & Mark Complete
          </Button>
        </div>
      </form>
    </Form>
  );
};

// ── SectionBEditable sub-component ────────────────────────────────────────────

const BODY_PART_ROWS_B: Array<{ values: InjuredBodyPartEnum[]; en: string; id: string }> = [
  { values: [InjuredBodyPartEnum.HEAD, InjuredBodyPartEnum.NECK], en: 'Head / Neck', id: 'Kepala / Leher' },
  { values: [InjuredBodyPartEnum.ARM], en: 'Arms', id: 'Lengan' },
  { values: [InjuredBodyPartEnum.HAND], en: 'Hands', id: 'Tangan' },
  { values: [InjuredBodyPartEnum.BACK], en: 'Back', id: 'Punggung' },
  { values: [InjuredBodyPartEnum.CHEST], en: 'Chest', id: 'Dada' },
  { values: [InjuredBodyPartEnum.ABDOMENT], en: 'Abdomen', id: 'Perut' },
  { values: [InjuredBodyPartEnum.FEET], en: 'Feet', id: 'Telapak kaki' },
  { values: [InjuredBodyPartEnum.LEG], en: 'Legs', id: 'Kaki' },
  { values: [InjuredBodyPartEnum.SKIN], en: 'Skin', id: 'Kulit' },
  { values: [InjuredBodyPartEnum.EYE], en: 'Eyes', id: 'Mata' },
  { values: [InjuredBodyPartEnum.INTERNAL_ORGAN], en: 'Internal Organs', id: 'Organ dalam' },
  { values: [InjuredBodyPartEnum.SHOULDER], en: 'Shoulder', id: 'Pundak' },
  { values: [InjuredBodyPartEnum.OTHER], en: 'Other', id: 'Lainnya' },
];

const TYPE_OF_INJURY_ROWS_B: Array<{ value: TypeOfInjuryEnum; en: string; id: string }> = [
  { value: TypeOfInjuryEnum.DERMATITIS, en: 'Dermatitis', id: 'Peradangan kulit' },
  { value: TypeOfInjuryEnum.PARALYSIS, en: 'Paralysis', id: 'Kelumpuhan' },
  { value: TypeOfInjuryEnum.AMPUTATION, en: 'Amputation', id: 'Terpotongnya anggota tubuh' },
  { value: TypeOfInjuryEnum.CRUSH, en: 'Crush', id: 'Remuk' },
  { value: TypeOfInjuryEnum.BURN, en: 'Burn', id: 'Luka Bakar' },
  { value: TypeOfInjuryEnum.CONCUSSION, en: 'Concussion', id: 'Gegar' },
  { value: TypeOfInjuryEnum.FRACTURE, en: 'Fracture', id: 'Patah tulang' },
  { value: TypeOfInjuryEnum.LACERATION, en: 'Laceration', id: 'Luka sobek' },
  { value: TypeOfInjuryEnum.SPRAIN, en: 'Sprain / Strain', id: 'Keseleo' },
  { value: TypeOfInjuryEnum.BRUISE, en: 'Bruising', id: 'Memar' },
  { value: TypeOfInjuryEnum.ABRASION, en: 'Abrasion', id: 'Luka lecet' },
  { value: TypeOfInjuryEnum.OTHER, en: 'Other', id: 'Lainnya' },
];

const MECHANISM_ROWS_B: Array<{ value: MechanismOfInjuryEnum; en: string; id: string }> = [
  { value: MechanismOfInjuryEnum.STRUCK_BY, en: 'Struck by', id: 'Ditabrak' },
  { value: MechanismOfInjuryEnum.CHEMICAL, en: 'Chemicals', id: 'Bahan Kimia' },
  { value: MechanismOfInjuryEnum.ELECTRICITY, en: 'Electricity', id: 'Listrik' },
  { value: MechanismOfInjuryEnum.FLYING_OBJECT, en: 'Flying object', id: 'Objek berterbangan' },
  { value: MechanismOfInjuryEnum.SHARP_OBJECTS, en: 'Sharp objects', id: 'Benda Tajam' },
  { value: MechanismOfInjuryEnum.FAILING_OBJECT, en: 'Falling Object', id: 'Objek jatuh' },
  { value: MechanismOfInjuryEnum.VEHICLES, en: 'Vehicles', id: 'Kendaraan' },
  { value: MechanismOfInjuryEnum.HAND_TOOLS, en: 'Hand Tools', id: 'Perkakas tangan' },
  { value: MechanismOfInjuryEnum.HEAT_COLD, en: 'Heat / Cold', id: 'Panas / Dingin' },
  { value: MechanismOfInjuryEnum.TRIP, en: 'Trip / Slip / Fall', id: 'Tersandung/Tergelincir/Terjatuh' },
  { value: MechanismOfInjuryEnum.MECHINARY, en: 'Machinery', id: 'Mesin' },
  { value: MechanismOfInjuryEnum.FALL_FROM_HEIGHT, en: 'Fall from Height', id: 'Jatuh dari ketinggian' },
  { value: MechanismOfInjuryEnum.MANUAL_HANDLING, en: 'Manual Handling', id: 'Pengangkatan manual' },
  { value: MechanismOfInjuryEnum.OTHER, en: 'Other', id: 'Lainnya' },
];

const INCIDENT_CLASSIFICATION_OPTIONS: { value: IncidentClassificationEnum; en: string; id: string }[] = [
  { value: IncidentClassificationEnum.MINOR, en: 'Minor (first aid only)', id: 'Dapat diselesaikan dengan P3K' },
  { value: IncidentClassificationEnum.MAJOR, en: 'Major (hospital treatment required)', id: 'Perlu penanganan medis di RS' },
  { value: IncidentClassificationEnum.FATALITY, en: 'Fatality (loss of life)', id: 'Kehilangan nyawa' },
];

interface SectionBEditableProps {
  form: ReturnType<typeof useForm<FormValues>>;
  uploadCategoryId: string | null;
}

const toggleArrayValue = (arr: string[], value: string): string[] =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const SectionBEditable = ({ form, uploadCategoryId }: SectionBEditableProps) => {
  const bodyPartsSummary = form.watch('bodyPartsSummary');
  const injuryTypesSummary = form.watch('injuryTypesSummary');
  const mechanismsSummary = form.watch('mechanismsSummary');

  const toggle = (
    field: 'bodyPartsSummary' | 'injuryTypesSummary' | 'mechanismsSummary',
    value: string,
  ) => {
    const current = form.getValues(field);
    form.setValue(field, toggleArrayValue(current, value), { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>B. Injury Details / Rincian Cidera</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <BGroupEditable
          label="B1. Body Part Injured / Bagian tubuh yang cidera"
          items={BODY_PART_ROWS_B.map((row) => ({
            key: row.en,
            en: row.en,
            id: row.id,
            value: row.values[0],
            checked: row.values.some((v) => bodyPartsSummary.includes(v)),
          }))}
          onToggle={(value) => toggle('bodyPartsSummary', value)}
        />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            B1. Body Diagram / Diagram Tubuh
          </p>
          <BodyDiagramCanvas
            value={form.watch('bodyDiagramUrl')}
            onChange={(url) => form.setValue('bodyDiagramUrl', url, { shouldDirty: true })}
            uploadCategoryId={uploadCategoryId}
          />
        </div>
        <BGroupEditable
          label="B2. Type of Injury / Tipe Cidera"
          items={TYPE_OF_INJURY_ROWS_B.map((row) => ({
            key: row.value,
            en: row.en,
            id: row.id,
            value: row.value,
            checked: injuryTypesSummary.includes(row.value),
          }))}
          onToggle={(value) => toggle('injuryTypesSummary', value)}
        />
        <BGroupEditable
          label="B3. Mechanism of Injury / Mekanisme Cidera"
          items={MECHANISM_ROWS_B.map((row) => ({
            key: row.value,
            en: row.en,
            id: row.id,
            value: row.value,
            checked: mechanismsSummary.includes(row.value),
          }))}
          onToggle={(value) => toggle('mechanismsSummary', value)}
        />

        <FormField
          control={form.control}
          name="incidentClassification"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                B4. Level of Injury / Tingkat Cedera
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2"
                >
                  {INCIDENT_CLASSIFICATION_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={cn(
                        'flex items-start gap-2 rounded-md border p-3 cursor-pointer',
                        field.value === opt.value && 'border-primary bg-primary/5',
                      )}
                      onClick={() => field.onChange(opt.value)}
                    >
                      <RadioGroupItem value={opt.value} id={`classification-${opt.value}`} className="mt-0.5" />
                      <Label htmlFor={`classification-${opt.value}`} className="font-normal cursor-pointer leading-snug">
                        <span className="font-medium">{opt.en}</span>
                        <span className="block text-xs text-muted-foreground">{opt.id}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

interface BGroupEditableProps {
  label: string;
  items: Array<{ key: string; en: string; id: string; value: string; checked: boolean }>;
  onToggle: (value: string) => void;
}

const BGroupEditable = ({ label, items, onToggle }: BGroupEditableProps) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {label}
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-start gap-2">
          <Checkbox
            checked={it.checked}
            onCheckedChange={() => onToggle(it.value)}
            className="mt-0.5"
          />
          <Label
            className="text-sm font-normal leading-snug cursor-pointer"
            onClick={(e) => { e.preventDefault(); onToggle(it.value); }}
          >
            <span>{it.en}</span>
            <span className="text-muted-foreground"> — {it.id}</span>
          </Label>
        </div>
      ))}
    </div>
  </div>
);

// ── CostInput sub-component ────────────────────────────────────────────────────

interface CostInputProps {
  name: keyof FormValues;
  label: string;
  idLabel: string;
  form: ReturnType<typeof useForm<FormValues>>;
}

const CostInput = ({ name, label, idLabel, form }: CostInputProps) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          <span className="text-xs text-muted-foreground"> / {idLabel}</span>
        </FormLabel>
        <FormControl>
          <Input {...field} placeholder="0" inputMode="numeric" />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default InvestigationReportForm;
