import { useEffect, useState } from 'react';
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
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';

import { monthlyFlowReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { CreateMonthlyFlowReportData, MonthlyFlowReport, UpdateMonthlyFlowReportData, MonthEnum, ReportStatusEnum, TreatmentPlant } from '../../types/waste-management.types';

const formSchema = z.object({
  reportCode: z.string().min(1, 'Report code is required'),
  treatmentPlantId: z.string().min(1, 'Treatment plant is required'),
  reportMonth: z.nativeEnum(MonthEnum),
  reportYear: z.coerce.number().min(2000, 'Year must be valid'),
  totalVolume: z.coerce.number().min(0),
  averageDailyFlow: z.coerce.number().min(0),
  peakFlow: z.coerce.number().optional(),
  minimumFlow: z.coerce.number().optional(),
  reportDocumentUrl: z.string().optional(),
  status: z.nativeEnum(ReportStatusEnum).optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface MonthlyFlowReportFormProps {
  mode: 'create' | 'edit';
}

export default function MonthlyFlowReportForm({ mode }: MonthlyFlowReportFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plants, setPlants] = useState<TreatmentPlant[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportCode: '',
      treatmentPlantId: '',
      reportMonth: MonthEnum.JAN,
      reportYear: new Date().getFullYear(),
      totalVolume: 0,
      averageDailyFlow: 0,
      reportDocumentUrl: '',
      isActive: true,
      status: ReportStatusEnum.SUBMITTED,
    },
  });

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await treatmentPlantService.getAll({ page: 1, limit: 100, isActive: true });
        setPlants(response.data.data);
      } catch (error) {
        console.error('Failed to fetch plants', error);
      }
    };
    fetchPlants();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await monthlyFlowReportService.getById(id);
          const data = response.data as MonthlyFlowReport;
          form.reset({
            reportCode: data.reportCode,
            treatmentPlantId: data.treatmentPlantId,
            reportMonth: data.reportMonth,
            reportYear: data.reportYear,
            totalVolume: data.totalVolume,
            averageDailyFlow: data.averageDailyFlow,
            peakFlow: data.peakFlow,
            minimumFlow: data.minimumFlow,
            reportDocumentUrl: data.reportDocumentUrl || '',
            status: data.status,
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/monthly-flow-reports');
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
      if (mode === 'create') {
        const submitData: CreateMonthlyFlowReportData = {
          reportCode: data.reportCode,
          treatmentPlantId: data.treatmentPlantId,
          reportMonth: data.reportMonth,
          reportYear: data.reportYear,
          totalVolume: data.totalVolume,
          averageDailyFlow: data.averageDailyFlow,
          peakFlow: data.peakFlow,
          minimumFlow: data.minimumFlow,
          reportDocumentUrl: data.reportDocumentUrl,
          isActive: data.isActive,
          submittedAt: new Date().toISOString(),
        };
        await monthlyFlowReportService.create(submitData);
        toast.success('Report created successfully');
      } else if (id) {
        const submitData: UpdateMonthlyFlowReportData = {
          reportCode: data.reportCode,
          treatmentPlantId: data.treatmentPlantId,
          reportMonth: data.reportMonth,
          reportYear: data.reportYear,
          totalVolume: data.totalVolume,
          averageDailyFlow: data.averageDailyFlow,
          peakFlow: data.peakFlow,
          minimumFlow: data.minimumFlow,
          reportDocumentUrl: data.reportDocumentUrl,
          isActive: data.isActive,
          status: data.status,
        };
        await monthlyFlowReportService.update(id, submitData);
        toast.success('Report updated successfully');
      }
      navigate('/waste-management/monthly-flow-reports');
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
        <CardDescription>Enter the report information</CardDescription>
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
                      <Input placeholder="Enter code" {...field} />
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
                        options={plants.map((p) => ({ label: p.name, value: p.id }))}
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
                name="reportMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Volume (m³) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="averageDailyFlow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avg Daily Flow (m³/day) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="peakFlow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peak Flow</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumFlow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Flow</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                    <Input placeholder="Enter URL" {...field} />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ReportStatusEnum).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/monthly-flow-reports')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Report' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
