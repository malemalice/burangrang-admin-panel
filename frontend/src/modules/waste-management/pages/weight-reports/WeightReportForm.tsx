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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';

import { weightReportService, wasteSourceService, storageLocationService, wasteTypeService } from '../../services/wasteManagementService';
import { CreateWeightReportData, WeightReport, UpdateWeightReportData, WasteSource, StorageLocation, WasteType, MonthEnum, PaginatedResponse } from '../../types/waste-management.types';

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
  reportMonth: z.nativeEnum(MonthEnum, {
    errorMap: () => ({ message: 'Please select a month' }),
  }),
  reportYear: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().int().min(2000, 'Year must be valid')),
  submittedAt: z.string().min(1, 'Submission date is required'),
  reportDocumentUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(itemSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportCode: '',
      sourceId: '',
      storageLocationId: '',
      reportDate: new Date().toISOString().split('T')[0],
      reportMonth: MonthEnum.JAN,
      reportYear: new Date().getFullYear(),
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
            reportMonth: data.reportMonth,
            reportYear: data.reportYear,
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
      toast.error(error.response?.data?.message || 'Operation failed');
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="reportMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MonthEnum).map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} value={field.value ?? ''} onChange={field.onChange} />
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
                    <FormLabel>Document URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document URL" {...field} />
                    </FormControl>
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
