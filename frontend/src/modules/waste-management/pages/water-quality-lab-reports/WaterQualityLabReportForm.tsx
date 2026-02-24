import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

import { waterQualityLabReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { CreateWaterQualityLabReportData, WaterQualityLabReport, UpdateWaterQualityLabReportData, TreatmentPlant, PaginatedResponse, WaterQualityLabReportStatusEnum } from '../../types/waste-management.types';

const VALID_REPORT_STATUSES = Object.values(WaterQualityLabReportStatusEnum);

const formSchema = z.object({
  reportCode: z.string().min(1, 'Report code is required'),
  treatmentPlantId: z.string().min(1, 'Treatment plant is required'),
  reportDate: z.string().min(1, 'Report date is required'),
  submittedAt: z.string().min(1, 'Submission date is required'),
  reportDocumentUrl: z.string().optional(),
  summary: z.string().optional(),
  recommendations: z.string().optional(),
  analystSignature: z.string().optional(),
  status: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface WaterQualityLabReportFormProps {
  mode: 'create' | 'edit';
}

export default function WaterQualityLabReportForm({ mode }: WaterQualityLabReportFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [treatmentPlants, setTreatmentPlants] = useState<TreatmentPlant[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportCode: '',
      treatmentPlantId: '',
      reportDate: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString().split('T')[0],
      reportDocumentUrl: '',
      summary: '',
      recommendations: '',
      analystSignature: '',
      isActive: true,
    },
  });

  const fetchTreatmentPlants = useCallback(async () => {
    try {
      const response = await treatmentPlantService.getAll({ limit: 100, isActive: true });
      setTreatmentPlants((response.data as PaginatedResponse<TreatmentPlant>).data);
    } catch (error) {
      console.error('Failed to fetch treatment plants:', error);
    }
  }, []);

  useEffect(() => {
    fetchTreatmentPlants();
  }, [fetchTreatmentPlants]);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await waterQualityLabReportService.getById(id);
          const data = response.data as WaterQualityLabReport;
          form.reset({
            reportCode: data.reportCode,
            treatmentPlantId: data.treatmentPlantId,
            reportDate: data.reportDate.split('T')[0],
            submittedAt: data.submittedAt.split('T')[0],
            reportDocumentUrl: data.reportDocumentUrl || '',
            summary: data.summary || '',
            recommendations: data.recommendations || '',
            analystSignature: data.analystSignature || '',
            status: data.status,
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/water-quality-lab-reports');
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
      const submitData: CreateWaterQualityLabReportData | UpdateWaterQualityLabReportData = {
        ...data,
        reportDate: new Date(data.reportDate).toISOString(),
        submittedAt: new Date(data.submittedAt).toISOString(),
      };
      if (data.status && VALID_REPORT_STATUSES.includes(data.status as WaterQualityLabReportStatusEnum)) {
        (submitData as UpdateWaterQualityLabReportData).status = data.status as WaterQualityLabReportStatusEnum;
      }

      if (mode === 'create') {
        await waterQualityLabReportService.create(submitData as CreateWaterQualityLabReportData);
        toast.success('Report created successfully');
      } else if (id) {
        await waterQualityLabReportService.update(id, submitData);
        toast.success('Report updated successfully');
      }
      navigate('/waste-management/water-quality-lab-reports');
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
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Report</CardTitle>
        <CardDescription>Enter lab report information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="treatmentPlantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Plant *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={treatmentPlants.map((tp) => ({ label: tp.name, value: tp.id }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select plant"
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
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter summary" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter recommendations" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="analystSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analyst Signature</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter analyst signature" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VALID_REPORT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
            </div>

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

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/water-quality-lab-reports')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
