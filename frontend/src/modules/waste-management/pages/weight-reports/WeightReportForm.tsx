import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Loader2, Plus, Trash2, X, ExternalLink } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import uploadService from '@/modules/uploads/services/uploadService';

import { weightReportService, wasteSourceService, storageLocationService, wasteTypeService } from '../../services/wasteManagementService';
import { CreateWeightReportData, WeightReport, UpdateWeightReportData, WasteSource, StorageLocation, WasteType, PaginatedResponse } from '../../types/waste-management.types';

const itemSchema = z.object({
  wasteTypeId: z.string().min(1, 'Waste type is required'),
  weight: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().min(0, 'Weight must be positive')),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

const formSchema = z.object({
  reportCode: z.string().min(1, 'Report code is required'),
  sourceId: z.string().min(1, 'Waste source is required'),
  storageLocationId: z.string().min(1, 'Storage location is required'),
  reportDate: z.string().min(1, 'Report date is required'),
  submittedAt: z.string().min(1, 'Submission date is required'),
  reportDocumentUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(itemSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

interface WeightReportFormProps {
  mode: 'create' | 'edit';
}

export default function WeightReportForm({ mode }: WeightReportFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [fileCategoryId, setFileCategoryId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportCode: '',
      sourceId: '',
      storageLocationId: '',
      reportDate: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString().split('T')[0],
      reportDocumentUrl: '',
      isActive: true,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const fetchDependencies = useCallback(async () => {
    try {
      const [sourcesRes, locationsRes, wasteTypesRes] = await Promise.all([
        wasteSourceService.getAll({ limit: 100, isActive: true }),
        storageLocationService.getAll({ limit: 100, isActive: true }),
        wasteTypeService.getAll({ limit: 100, isActive: true }),
      ]);
      setSources((sourcesRes.data as PaginatedResponse<WasteSource>).data);
      setLocations((locationsRes.data as PaginatedResponse<StorageLocation>).data);
      setWasteTypes((wasteTypesRes.data as PaginatedResponse<WasteType>).data);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    const loadFileCategory = async () => {
      try {
        const category = await uploadService.getCategoryByName('documents');
        if (category) setFileCategoryId(category.id);
      } catch (error) {
        console.error('Failed to load file category', error);
      }
    };
    loadFileCategory();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      toast.error('File size exceeds 50MB limit.');
      return;
    }
    if (!fileCategoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }
    setUploadingFile(true);
    try {
      const response = await uploadService.uploadFile(file, fileCategoryId, true);
      const fileUrl = uploadService.getPublicFileUrl(response.id);
      form.setValue('reportDocumentUrl', fileUrl);
      setUploadedFileName(file.name);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = () => {
    form.setValue('reportDocumentUrl', '');
    setUploadedFileName(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await weightReportService.getById(id);
          const data = response.data as WeightReport;
          form.reset({
            reportCode: data.reportCode,
            sourceId: data.sourceId,
            storageLocationId: data.storageLocationId,
            reportDate: data.reportDate.split('T')[0],
            submittedAt: data.submittedAt.split('T')[0],
            reportDocumentUrl: data.reportDocumentUrl || '',
            isActive: data.isActive,
            items: data.items?.map((item) => ({
              wasteTypeId: item.wasteTypeId,
              weight: item.weight,
              unit: item.unit,
              notes: item.notes || '',
            })) || [],
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/weight-reports');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id, mode, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    form.clearErrors('items');

    if (data.items && data.items.length > 0) {
      const wasteTypeIds = data.items.map((i) => i.wasteTypeId).filter(Boolean);
      const duplicateIndex = wasteTypeIds.findIndex((id, index) => wasteTypeIds.indexOf(id) !== index);
      if (duplicateIndex >= 0) {
        const duplicateId = wasteTypeIds[duplicateIndex];
        const wasteTypeName = wasteTypes.find((wt) => wt.id === duplicateId)?.name || 'Unknown';
        form.setError('items', {
          type: 'manual',
          message: `Item ${wasteTypeName} is inputed more then 1`,
        });
        setSaving(false);
        return;
      }
    }

    try {
      const itemsWithOrder = data.items?.map((item, index) => ({
        wasteTypeId: item.wasteTypeId,
        weight: item.weight as number,
        unit: item.unit,
        notes: item.notes,
        order: index + 1,
      }));

      const submitData: CreateWeightReportData | UpdateWeightReportData = {
        ...data,
        reportDate: new Date(data.reportDate).toISOString(),
        submittedAt: new Date(data.submittedAt).toISOString(),
        items: itemsWithOrder as any,
      };

      if (mode === 'create') {
        await weightReportService.create(submitData as CreateWeightReportData);
        toast.success('Report created successfully');
      } else if (id) {
        await weightReportService.update(id, submitData);
        toast.success('Report updated successfully');
      }
      navigate('/waste-management/weight-reports');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
      if (error.response?.status === 409 && typeof message === 'string' && message.includes('inputed more then')) {
        form.setError('items', { type: 'manual', message });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Enter weight report information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reportCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter report code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waste Source *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={sources.map((s) => ({ label: s.name, value: s.id }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select source"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={locations.map((l) => ({ label: l.name, value: l.id }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date *</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submittedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Date *</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reportDocumentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value || uploadedFileName ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {uploadedFileName || 'Document attached'}
                            </span>
                            {field.value && (
                              <a href={field.value} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                <ExternalLink className="h-4 w-4" /> View
                              </a>
                            )}
                            <Button type="button" variant="ghost" size="sm"
                              onClick={handleFileRemove} disabled={uploadingFile}>
                              <X className="h-4 w-4" /> Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input type="file"
                              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleFileInputChange} disabled={uploadingFile}
                              className="cursor-pointer" />
                            {uploadingFile && (
                              <span className="text-sm text-muted-foreground">Uploading...</span>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, or images (max 50MB)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Waste Items</CardTitle>
                <CardDescription>Add waste types and their weights</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ wasteTypeId: '', weight: 0, unit: 'kg', notes: '' })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {form.formState.errors.items?.message && (
                <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 mb-4">
                  {form.formState.errors.items.message}
                </div>
              )}
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to start.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Waste Type *</TableHead>
                      <TableHead className="w-32">Weight *</TableHead>
                      <TableHead className="w-24">Unit</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.wasteTypeId`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <SearchableSelect
                                    options={wasteTypes.map((wt) => ({ label: wt.name, value: wt.id }))}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Select type"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.weight`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="ton">ton</SelectItem>
                                    <SelectItem value="lbs">lbs</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input placeholder="Optional notes" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/waste-management/weight-reports')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Report' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
