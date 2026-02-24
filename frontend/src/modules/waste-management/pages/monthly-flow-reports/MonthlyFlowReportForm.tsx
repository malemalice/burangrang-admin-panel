import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, X, ExternalLink } from 'lucide-react';
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
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import uploadService from '@/modules/uploads/services/uploadService';

import { monthlyFlowReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { CreateMonthlyFlowReportData, MonthlyFlowReport, UpdateMonthlyFlowReportData, ReportStatusEnum, TreatmentPlant } from '../../types/waste-management.types';

const formSchema = z.object({
  reportCode: z.string().min(1, 'Report code is required'),
  treatmentPlantId: z.string().min(1, 'Treatment plant is required'),
  reportDate: z.string().min(1, 'Report date is required'),
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

export default function MonthlyFlowReportForm({ mode }: MonthlyFlowReportFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plants, setPlants] = useState<TreatmentPlant[]>([]);
  const [fileCategoryId, setFileCategoryId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportCode: '',
      treatmentPlantId: '',
      reportDate: new Date().toISOString().split('T')[0],
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
          const response = await monthlyFlowReportService.getById(id);
          const data = response.data as MonthlyFlowReport;
          form.reset({
            reportCode: data.reportCode,
            treatmentPlantId: data.treatmentPlantId,
            reportDate: data.reportDate ? new Date(data.reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            totalVolume: data.totalVolume,
            averageDailyFlow: data.averageDailyFlow,
            peakFlow: data.peakFlow,
            minimumFlow: data.minimumFlow,
            reportDocumentUrl: data.reportDocumentUrl || '',
            status: data.status,
            isActive: data.isActive,
          });
          if (data.reportDocumentUrl) setUploadedFileName('Current document');
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
          reportDate: new Date(data.reportDate).toISOString(),
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
          reportDate: new Date(data.reportDate).toISOString(),
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
                name="reportDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  <FormLabel>Document</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value || uploadedFileName ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {uploadedFileName || 'Document attached'}
                          </span>
                          {field.value && (
                            <a
                              href={field.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" /> View
                            </a>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleFileRemove}
                            disabled={uploadingFile}
                          >
                            <X className="h-4 w-4" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileInputChange}
                            disabled={uploadingFile}
                            className="cursor-pointer"
                          />
                          {uploadingFile && (
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, or images (max 50MB)
                  </p>
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
