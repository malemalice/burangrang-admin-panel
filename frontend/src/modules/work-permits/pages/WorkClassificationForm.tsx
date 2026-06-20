import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { RichEditor } from '@/core/components/ui/rich-editor';
import { SearchableSelect, type SearchableSelectOption } from '@/core/components/ui/searchable-select';
import uploadService from '@/modules/uploads/services/uploadService';
import safetyEquipmentService from '@/modules/ppe/services/safetyEquipmentService';
import riskService from '@/modules/master-data/services/riskService';
import riskMitigationService, {
  type RiskMitigation,
} from '@/modules/risk-assessment/services/riskMitigationService';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';
import { useWorkPermitClassificationContentEnabled } from '../hooks/useWorkPermitClassificationContentEnabled';

const EMPTY_HTML = '<p></p>';

const attachmentSchema = z.object({
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().optional(),
  description: z.string().optional(),
  order: z.number().min(0),
});

const riskEquipmentRowSchema = z.object({
  riskId: z.string().min(1, 'Risk is required'),
  safetyEquipmentId: z.string().min(1, 'Safety equipment is required'),
  order: z.number().min(0),
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  safetyGuideline: z.string().optional(),
  isActive: z.boolean().default(true),
  attachments: z.array(attachmentSchema).optional(),
  riskEquipmentRows: z.array(riskEquipmentRowSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkClassificationFormProps {
  classification?: WorkClassification;
  mode: 'create' | 'edit';
}

const WorkClassificationForm = ({ classification, mode }: WorkClassificationFormProps) => {
  const navigate = useNavigate();
  const { enabled: classificationContentEnabled } = useWorkPermitClassificationContentEnabled();
  const [documentsCategoryId, setDocumentsCategoryId] = useState<string | null>(null);
  const [safetyEquipmentOptions, setSafetyEquipmentOptions] = useState<SearchableSelectOption[]>([]);
  const [riskOptions, setRiskOptions] = useState<SearchableSelectOption[]>([]);
  const [mitigationsByRiskId, setMitigationsByRiskId] = useState<Record<string, RiskMitigation[]>>({});
  const [mitigationsLoadingByRiskId, setMitigationsLoadingByRiskId] = useState<Record<string, boolean>>({});
  const [mitigationsErrorByRiskId, setMitigationsErrorByRiskId] = useState<Record<string, string | undefined>>({});
  const isMountedRef = useRef(true);
  const mitigationsInFlightRef = useRef<Set<string>>(new Set());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      safetyGuideline: EMPTY_HTML,
      isActive: true,
      attachments: [],
      riskEquipmentRows: [],
    },
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: 'attachments',
  });

  const {
    fields: riskEquipmentRowFields,
    append: appendRiskEquipmentRow,
    remove: removeRiskEquipmentRow,
  } = useFieldArray({
    control: form.control,
    name: 'riskEquipmentRows',
  });

  const watchedRiskEquipmentRows = useWatch({
    control: form.control,
    name: 'riskEquipmentRows',
  });

  const distinctSelectedRiskIds = useMemo(() => {
    const rows = watchedRiskEquipmentRows ?? [];
    const ids = rows.map((r) => r?.riskId).filter((id): id is string => !!id);
    return Array.from(new Set(ids));
  }, [watchedRiskEquipmentRows]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!classificationContentEnabled) return;
    const loadCategory = async () => {
      try {
        const category = await uploadService.getCategoryByName('work-permit-documents');
        if (category) {
          setDocumentsCategoryId(category.id);
        } else {
          toast.error('File category for work permit documents not found');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to resolve upload category');
      }
    };
    loadCategory();
  }, [classificationContentEnabled]);

  useEffect(() => {
    const loadRiskOptions = async () => {
      try {
        const res = await riskService.getAll({
          page: 1,
          limit: 500,
          sortBy: 'name',
          sortOrder: 'asc',
          options: true,
        });
        setRiskOptions(
          res.data.map((r) => ({
            value: r.id,
            label: `${r.name} (${r.code})`,
          })),
        );
      } catch (e) {
        console.error(e);
        toast.error('Failed to load risk options');
      }
    };
    loadRiskOptions();
  }, []);

  useEffect(() => {
    const loadSafetyEquipmentOptions = async () => {
      try {
        const res = await safetyEquipmentService.getSafetyEquipments({
          page: 1,
          limit: 500,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        setSafetyEquipmentOptions(
          res.data.map((se) => ({
            value: se.id,
            label: `${se.name} (${se.code})`,
          })),
        );
      } catch (e) {
        console.error(e);
        toast.error('Failed to load safety equipment options');
      }
    };
    loadSafetyEquipmentOptions();
  }, []);

  useEffect(() => {
    if (classification) {
      form.reset({
        name: classification.name,
        code: classification.code,
        description: classification.description || '',
        safetyGuideline: classification.safetyGuideline?.trim()
          ? classification.safetyGuideline
          : EMPTY_HTML,
        isActive: classification.isActive,
        attachments:
          classification.attachments?.map((a, i) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            description: a.description ?? '',
            order: a.order ?? i,
          })) ?? [],
        riskEquipmentRows:
          classification.riskEquipmentRows?.map((row, i) => ({
            riskId: row.risk.id,
            safetyEquipmentId: row.safetyEquipment.id,
            order: row.order ?? i,
          })) ?? [],
      });
    }
  }, [classification, form]);

  useEffect(() => {
    const loadMitigations = async (riskId: string) => {
      mitigationsInFlightRef.current.add(riskId);
      try {
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: true }));
        setMitigationsErrorByRiskId((prev) => ({ ...prev, [riskId]: undefined }));

        const mitigations = await riskMitigationService.getByRiskId(riskId);
        if (!isMountedRef.current) return;

        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: mitigations }));
      } catch (e) {
        console.error(e);
        if (!isMountedRef.current) return;
        setMitigationsErrorByRiskId((prev) => ({
          ...prev,
          [riskId]: 'Failed to load mitigation information',
        }));
        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: [] }));
      } finally {
        mitigationsInFlightRef.current.delete(riskId);
        if (!isMountedRef.current) return;
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: false }));
      }
    };

    distinctSelectedRiskIds.forEach((riskId) => {
      if (mitigationsByRiskId[riskId] !== undefined) return;
      if (mitigationsInFlightRef.current.has(riskId)) return;
      void loadMitigations(riskId);
    });
  }, [distinctSelectedRiskIds, mitigationsByRiskId]);

  const handleAttachmentUpload = async (file: File) => {
    if (!documentsCategoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExt = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    if (!validTypes.includes(file.type) && (!ext || !allowedExt.includes(ext))) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
      return;
    }
    try {
      const response = await uploadService.uploadFile(file, documentsCategoryId, false);
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
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to upload file');
    }
  };

  const onSubmit = async (data: FormValues) => {
    const safetyGuideline =
      !data.safetyGuideline ||
      data.safetyGuideline === EMPTY_HTML ||
      data.safetyGuideline === '<p></p>'
        ? undefined
        : data.safetyGuideline;

    const rawAttachments = data.attachments ?? [];
    const attachmentPayload =
      rawAttachments.length > 0
        ? rawAttachments.map((a, i) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            description: a.description?.trim() ? a.description : undefined,
            order: i,
          }))
        : mode === 'edit'
          ? []
          : undefined;

    const payload = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      ...(classificationContentEnabled
        ? {
            safetyGuideline,
            ...(attachmentPayload !== undefined ? { attachments: attachmentPayload } : {}),
          }
        : {}),
      isActive: data.isActive,
      riskEquipmentRows: data.riskEquipmentRows?.length
        ? data.riskEquipmentRows.map((row, i) => ({
            riskId: row.riskId,
            safetyEquipmentId: row.safetyEquipmentId,
            order: i,
          }))
        : mode === 'edit'
          ? []
          : undefined,
    };

    try {
      if (mode === 'create') {
        await workClassificationService.createWorkClassification(payload);
        toast.success('Work classification created successfully');
      } else {
        await workClassificationService.updateWorkClassification(classification!.id, payload);
        toast.success('Work classification updated successfully');
      }
      navigate('/master/work-classifications');
    } catch (error: unknown) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} work classification:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${mode === 'create' ? 'create' : 'update'} work classification`;
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create' : 'Edit'} work classification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Classification name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Unique code" {...field} />
                    </FormControl>
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
                    <Textarea placeholder="Short description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {classificationContentEnabled && (
              <FormField
                control={form.control}
                name="safetyGuideline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety guidelines</FormLabel>
                    <FormControl>
                      <RichEditor
                        value={field.value || EMPTY_HTML}
                        onChange={field.onChange}
                        pageLayout
                        enablePdfExport
                      />
                    </FormControl>
                    <FormDescription>
                      Rich text with tables; merge or split cells from the table toolbar when a table
                      is selected. Page breaks in the editor are visual guides only (the document still
                      grows with content); use Preview PDF to see the exact paginated output.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Risk mitigation</CardTitle>
                  <CardDescription>Bind risk + safety equipment per row</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendRiskEquipmentRow({
                      riskId: '',
                      safetyEquipmentId: '',
                      order: riskEquipmentRowFields.length,
                    })
                  }
                >
                  Add row
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskEquipmentRowFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rows.</p>
                ) : (
                  riskEquipmentRowFields.map((field, index) => {
                    const rows = form.watch('riskEquipmentRows') ?? [];
                    const selectedPairs = rows
                      .map((r) => `${r?.riskId || ''}__${r?.safetyEquipmentId || ''}`)
                      .filter((k) => k !== '__');

                    return (
                      <div key={field.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`riskEquipmentRows.${index}.riskId`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Risk</FormLabel>
                                <FormControl>
                                  <SearchableSelect
                                    options={riskOptions}
                                    value={f.value || ''}
                                    onValueChange={(next) => {
                                      f.onChange(next);
                                    }}
                                    placeholder="Select risk…"
                                    searchPlaceholder="Search risk…"
                                    emptyText="No risks found"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`riskEquipmentRows.${index}.safetyEquipmentId`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Safety equipment</FormLabel>
                                <FormControl>
                                  <SearchableSelect
                                    options={safetyEquipmentOptions}
                                    value={f.value || ''}
                                    onValueChange={(next) => {
                                      const currentRiskId = form.getValues(`riskEquipmentRows.${index}.riskId`);
                                      const key = `${currentRiskId || ''}__${next || ''}`;
                                      const duplicates = selectedPairs.filter((k) => k === key).length;
                                      if (currentRiskId && next && duplicates > 1) {
                                        toast.error('This risk + equipment pair is already selected');
                                        return;
                                      }
                                      f.onChange(next);
                                    }}
                                    placeholder="Select equipment…"
                                    searchPlaceholder="Search equipment…"
                                    emptyText="No equipment found"
                                  />
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
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeRiskEquipmentRow(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3">
                        {(() => {
                          const riskId = form.getValues(`riskEquipmentRows.${index}.riskId`) || '';
                          if (!riskId) {
                            return (
                              <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-sm text-muted-foreground">
                                  Select a risk to see mitigation information.
                                </p>
                              </div>
                            );
                          }

                          const isLoading = !!mitigationsLoadingByRiskId[riskId];
                          const error = mitigationsErrorByRiskId[riskId];
                          const mitigations = mitigationsByRiskId[riskId] ?? [];

                          if (isLoading) {
                            return (
                              <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-sm text-muted-foreground">Loading mitigation information…</p>
                              </div>
                            );
                          }

                          if (error) {
                            return (
                              <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-sm text-destructive">{error}</p>
                              </div>
                            );
                          }

                          const parts = mitigations.flatMap((m) => {
                            const items: Array<{ label: string; value: string }> = [];
                            if (m.eliminationControl?.trim()) items.push({ label: 'Elimination Control', value: m.eliminationControl });
                            if (m.substitutionControl?.trim()) items.push({ label: 'Substitution Control', value: m.substitutionControl });
                            if (m.engineeringControl?.trim()) items.push({ label: 'Engineering Control', value: m.engineeringControl });
                            if (m.administrationControl?.trim()) items.push({ label: 'Administration Control', value: m.administrationControl });
                            if (m.personalProtectiveEquipment?.trim()) items.push({ label: 'Personal Protective Equipment', value: m.personalProtectiveEquipment });
                            if (m.transfer?.trim()) items.push({ label: 'Transfer', value: m.transfer });
                            if (m.accept?.trim()) items.push({ label: 'Accept', value: m.accept });
                            return items;
                          });

                          const combinedText = parts
                            .map((p) => `${p.label}\n${p.value}`)
                            .join('\n\n');

                          return (
                            <div className="rounded-md border bg-muted/20 p-3">
                              <p className="text-sm font-medium">Mitigation information</p>
                              {combinedText.length === 0 ? (
                                <p className="mt-1 text-sm text-muted-foreground">No mitigation information found.</p>
                              ) : (
                                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {combinedText}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {classificationContentEnabled && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Attached documents</CardTitle>
                    <CardDescription>Reference files for this classification (PDF, Word, or images)</CardDescription>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="wc-attachment-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleAttachmentUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('wc-attachment-upload')?.click()}
                      disabled={!documentsCategoryId}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {attachmentFields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {form.watch(`attachments.${index}.fileName`)}
                        </p>
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
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive classifications may be hidden from selection lists
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/work-classifications')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WorkClassificationForm;
