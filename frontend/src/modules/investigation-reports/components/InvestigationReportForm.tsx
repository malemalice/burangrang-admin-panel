import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash2, Save, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import uploadService from '@/modules/uploads/services/uploadService';
import investigationReportsService from '../services/investigationReportsService';
import type { Incident } from '@/modules/incidents/types/incident.types';
import {
  InvestigationCauseSectionEnum,
  InvestigationSignatoryRoleEnum,
  InvestigationStatusEnum,
  type InvestigationReport,
} from '../types/investigation-report.types';
import {
  HFACS_ACTIVE_FAILURE,
  HFACS_LATENT_FAILURE,
  HFACS_LOOKUP,
  type HfacsTier1,
} from '../constants/hfacsCatalogue';

const SIGNATORY_ROLES: Array<{
  role: InvestigationSignatoryRoleEnum;
  labelEn: string;
  labelId: string;
  defaultRoleName: string;
}> = [
  { role: InvestigationSignatoryRoleEnum.LEAD_INVESTIGATOR, labelEn: 'Lead Investigator', labelId: 'Penyidik 1', defaultRoleName: 'HSE Manager' },
  { role: InvestigationSignatoryRoleEnum.INVESTIGATOR_2, labelEn: '2nd Investigator', labelId: 'Penyidik 2', defaultRoleName: 'HSE Officer' },
  { role: InvestigationSignatoryRoleEnum.INVESTIGATOR_3, labelEn: '3rd Investigator', labelId: 'Penyidik 3', defaultRoleName: 'Risk & Business Continuity' },
  { role: InvestigationSignatoryRoleEnum.RELATED_MANAGER, labelEn: 'Related Manager', labelId: 'Manager terkait', defaultRoleName: '' },
  { role: InvestigationSignatoryRoleEnum.SECURITY, labelEn: 'Security', labelId: 'Security', defaultRoleName: 'Chief of Security' },
];

const causeSchema = z.object({
  causeKey: z.string(),
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
  signatoryRole: z.nativeEnum(InvestigationSignatoryRoleEnum),
  roleName: z.string().optional(),
  name: z.string().optional(),
  signatureUrl: z.string().optional(),
  signedAt: z.string().optional(),
});

const formSchema = z.object({
  taskBeingPerformed: z.string().optional(),
  equipmentUsed: z.string().optional(),

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
  distributionSafetyCommittee: z.boolean().default(false),
  distributionHeadOfBusinessOp: z.boolean().default(false),
  distributionRelatedDepartment: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

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

interface Props {
  incident: Incident;
  report?: InvestigationReport;
  mode: 'create' | 'edit';
}

const InvestigationReportForm = ({ incident, report, mode }: Props) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadCategoryId, setUploadCategoryId] = useState<string | null>(null);

  // Pre-build initial cause rows: every catalogue item, with isSelected from existing report
  const initialCauses = useMemo(() => {
    const allKeys = Array.from(HFACS_LOOKUP.keys());
    const existingByKey = new Map((report?.causes ?? []).map((c) => [c.causeKey, c]));
    return allKeys.map((causeKey) => {
      const existing = existingByKey.get(causeKey);
      return {
        causeKey,
        isSelected: existing?.isSelected ?? false,
        customNotes: existing?.customNotes ?? '',
      };
    });
  }, [report]);

  const initialSignatories = useMemo(() => {
    const byRole = new Map((report?.signatories ?? []).map((s) => [s.signatoryRole, s]));
    return SIGNATORY_ROLES.map((slot) => {
      const existing = byRole.get(slot.role);
      return {
        signatoryRole: slot.role,
        roleName: existing?.roleName ?? slot.defaultRoleName,
        name: existing?.name ?? '',
        signatureUrl: existing?.signatureUrl ?? '',
        signedAt: existing?.signedAt
          ? format(new Date(existing.signedAt), 'yyyy-MM-dd')
          : '',
      };
    });
  }, [report]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskBeingPerformed: report?.taskBeingPerformed ?? '',
      equipmentUsed: report?.equipmentUsed ?? '',

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
      distributionSafetyCommittee: report?.distributionSafetyCommittee ?? false,
      distributionHeadOfBusinessOp: report?.distributionHeadOfBusinessOp ?? false,
      distributionRelatedDepartment: report?.distributionRelatedDepartment ?? false,
    },
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } =
    useFieldArray({ control: form.control, name: 'actionPlans' });

  useEffect(() => {
    let cancelled = false;
    uploadService
      .getCategoryByName('incident-images')
      .then((cat) => {
        if (!cancelled && cat) setUploadCategoryId(cat.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const watched = form.watch();
  const total = sumCost(watched);

  const handleSignatureUpload = async (index: number, file: File) => {
    if (!uploadCategoryId) {
      toast.error('Upload not ready, please retry');
      return;
    }
    try {
      const res = await uploadService.uploadFile(file, uploadCategoryId, true);
      form.setValue(`signatories.${index}.signatureUrl`, res.url, { shouldDirty: true });
      toast.success('Signature uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload signature');
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
        .map((c) => {
          const lookup = HFACS_LOOKUP.get(c.causeKey)!;
          return {
            causeKey: c.causeKey,
            section: lookup.section,
            tier1: lookup.tier1,
            tier2: lookup.tier2,
            causeName: lookup.labelEn,
            isSelected: c.isSelected,
            customNotes: c.customNotes && c.customNotes.trim() !== '' ? c.customNotes : undefined,
            order: 0,
          };
        });

      const payload = {
        taskBeingPerformed: data.taskBeingPerformed || undefined,
        equipmentUsed: data.equipmentUsed || undefined,
        ...(statusOverride ? { status: statusOverride } : {}),
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
        signatories: data.signatories
          .filter((s) => s.name || s.signatureUrl)
          .map((s, i) => ({
            signatoryRole: s.signatoryRole,
            roleName: s.roleName || undefined,
            name: s.name || undefined,
            signatureUrl: s.signatureUrl || undefined,
            signedAt: s.signedAt ? new Date(s.signedAt).toISOString() : undefined,
            order: i,
          })),
        hsComments: data.hsComments || undefined,
        distributionSafetyCommittee: data.distributionSafetyCommittee,
        distributionHeadOfBusinessOp: data.distributionHeadOfBusinessOp,
        distributionRelatedDepartment: data.distributionRelatedDepartment,
      };

      const saved =
        mode === 'create'
          ? await investigationReportsService.create({ incidentId: incident.id, ...payload })
          : await investigationReportsService.update(report!.id, payload);

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

  const renderHfacsTier = (tiers: HfacsTier1[]) => (
    <div className="space-y-6">
      {tiers.map((t1) => (
        <div key={t1.tier1} className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">{t1.labelEn}</h3>
            <p className="text-xs text-muted-foreground">{t1.labelId}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t1.tier2s.map((t2) => (
              <div key={t2.tier2} className="rounded-md border p-4 space-y-2">
                <div>
                  <p className="text-sm font-medium">{t2.labelEn}</p>
                  <p className="text-xs text-muted-foreground">{t2.labelId}</p>
                </div>
                <div className="space-y-1.5">
                  {t2.items.map((item) => {
                    const allCauses = form.getValues('causes');
                    const causeIndex = allCauses.findIndex((c) => c.causeKey === item.causeKey);
                    if (causeIndex < 0) return null;
                    const isSelected = form.watch(`causes.${causeIndex}.isSelected`);
                    return (
                      <div key={item.causeKey} className="space-y-1">
                        <div className="flex items-start gap-2">
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

  // ── render
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => onSubmit(d))}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Section A — Read-only incident details */}
        <Card>
          <CardHeader>
            <CardTitle>A. Accident Details / Rincian Kecelakaan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <KV label="Report Number" value={report?.reportNumber ?? '— Auto-generated on create —'} />
            <KV label="Incident Code" value={incident.code} />
            <KV label="Accident Location" value={incident.area?.name ?? '—'} />
            <KV
              label="Accident Date"
              value={
                incident.incidentDate
                  ? format(new Date(incident.incidentDate), 'dd MMM yyyy')
                  : '—'
              }
            />
            <KV
              label="Incident Time"
              value={
                incident.incidentDate
                  ? format(new Date(incident.incidentDate), 'HH:mm')
                  : '—'
              }
            />
            <KV
              label="Report Date"
              value={
                incident.createdAt
                  ? format(new Date(incident.createdAt), 'dd MMM yyyy')
                  : '—'
              }
            />
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Description of Incident</Label>
              <p className="text-sm whitespace-pre-line">{incident.description ?? '—'}</p>
            </div>

            <FormField
              control={form.control}
              name="taskBeingPerformed"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>A1. Task Being Performed (Pekerjaan apa yang sedang dilakukan)</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipmentUsed"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>A2. Equipment, Tools and Materials (Peralatan atau material apa yang sedang di gunakan)</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section B + C — read-only injured persons */}
        <Card>
          <CardHeader>
            <CardTitle>B/C. Injured Persons / Rincian Korban</CardTitle>
          </CardHeader>
          <CardContent>
            {!incident.injuredPersons || incident.injuredPersons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No injured person during this incident.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">No</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Gender</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Body Part</th>
                      <th className="text-left p-2">Type of Injury</th>
                      <th className="text-left p-2">Mechanism</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incident.injuredPersons.map((p, i) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{p.injuredPersonName ?? '—'}</td>
                        <td className="p-2">{p.gender ?? '—'}</td>
                        <td className="p-2">{p.position ?? '—'}</td>
                        <td className="p-2">{p.department?.name ?? '—'}</td>
                        <td className="p-2">{p.injuredBodyPart}</td>
                        <td className="p-2">{p.typeOfInjury}</td>
                        <td className="p-2">{p.mechanismOfInjury}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 text-sm text-muted-foreground">
              Level of Injury (B4): <Badge variant="secondary">{incident.incidentClassification}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section D/E read-only */}
        <Card>
          <CardHeader>
            <CardTitle>D/E. Action Following Incident & Stop Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <KV label="Treatment" value={incident.treatment} />
            <KV label="Absence" value={incident.absence} />
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Treatment Description</Label>
              <p className="text-sm whitespace-pre-line">{incident.treatmentDescription ?? '—'}</p>
            </div>
            <KV label="Need to Stop Activity" value={incident.needToStopActivity} />
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Stop Activity Description</Label>
              <p className="text-sm whitespace-pre-line">{incident.stopActivityDescription ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Section F — read-only witnesses */}
        <Card>
          <CardHeader>
            <CardTitle>F. Witnesses / Saksi</CardTitle>
          </CardHeader>
          <CardContent>
            {!incident.witnesses || incident.witnesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No witnesses recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">No</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Gender</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incident.witnesses.map((w, i) => (
                      <tr key={w.id} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{w.witnessName ?? '—'}</td>
                        <td className="p-2">{w.gender ?? '—'}</td>
                        <td className="p-2">{w.position ?? '—'}</td>
                        <td className="p-2">{w.department?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <CardContent>{renderHfacsTier(HFACS_LATENT_FAILURE)}</CardContent>
        </Card>

        {/* Section I — Active Failure */}
        <Card>
          <CardHeader>
            <CardTitle>I. Active Failure / Kegagalan Aktif (Direct Cause)</CardTitle>
          </CardHeader>
          <CardContent>{renderHfacsTier(HFACS_ACTIVE_FAILURE)}</CardContent>
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
                        className="text-red-600"
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
          <CardContent className="space-y-4">
            {SIGNATORY_ROLES.map((slot, index) => (
              <Card key={slot.role} className="bg-muted/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{slot.labelEn}</p>
                      <p className="text-xs text-muted-foreground">{slot.labelId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`signatories.${index}.roleName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role Label</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. HSE Manager" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`signatories.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`signatories.${index}.signedAt`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signed Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Signature Image</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSignatureUpload(index, f);
                          }}
                          className="hidden"
                          id={`sig-upload-${slot.role}`}
                        />
                        <label htmlFor={`sig-upload-${slot.role}`}>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="mr-1 h-4 w-4" /> Upload
                            </span>
                          </Button>
                        </label>
                        {watched.signatories?.[index]?.signatureUrl && (
                          <img
                            src={watched.signatories[index].signatureUrl}
                            alt="signature"
                            className="h-10 max-w-[120px] object-contain bg-white rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Section L — H&S Comments + Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>L. Health and Safety Comments / Komentar Health and Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hsComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>H&S Comments</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[120px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Distribution / Distribusi</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(
                  [
                    ['distributionSafetyCommittee', 'Safety Committee'],
                    ['distributionHeadOfBusinessOp', 'Head of Business Operation'],
                    ['distributionRelatedDepartment', 'Related Department'],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 rounded-md border p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label className="font-normal cursor-pointer">{label}</Label>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
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

const KV = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <Label className="text-muted-foreground">{label}</Label>
    <p className="text-sm">{value}</p>
  </div>
);

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
