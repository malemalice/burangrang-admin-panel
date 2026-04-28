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
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';

import { waterQualityParameterService } from '../../services/wasteManagementService';
import {
  CreateWaterQualityParameterData,
  WaterQualityParameter,
  UpdateWaterQualityParameterData,
  WaterQualityParameterCategoryEnum,
} from '../../types/waste-management.types';

const CATEGORY_OPTIONS = Object.values(WaterQualityParameterCategoryEnum);

const DATE_INPUT_VALUE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;
const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toDateInputValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const matchedDate = value.match(DATE_INPUT_VALUE_PATTERN)?.[1];
  if (matchedDate) {
    return matchedDate;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid water quality parameter sample date received from API.');
  }

  return parsedDate.toISOString().split('T')[0];
};

const toIsoDateString = (value: string): string => {
  if (!ISO_DATE_ONLY_PATTERN.test(value)) {
    throw new Error('Invalid sample date. Please select a valid date.');
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid sample date. Please select a valid date.');
  }

  return parsedDate.toISOString();
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  category: z.nativeEnum(WaterQualityParameterCategoryEnum),
  unit: z.string().min(1, 'Unit is required'),
  displayOrder: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().int().optional(),
  ),
  standardLimit: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  regulatoryLimit: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  testMethod: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  dateSampleTaken: z.string().min(1, 'Date sample taken is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface WaterQualityParameterFormProps {
  mode: 'create' | 'edit';
}

export default function WaterQualityParameterForm({ mode }: WaterQualityParameterFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      category: WaterQualityParameterCategoryEnum.CHEMISTRY,
      unit: '',
      displayOrder: undefined,
      standardLimit: undefined,
      regulatoryLimit: undefined,
      testMethod: '',
      description: '',
      isActive: true,
      dateSampleTaken: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await waterQualityParameterService.getById(id);
          const data = response.data as WaterQualityParameter;
          form.reset({
            name: data.name,
            code: data.code,
            category: data.category ?? WaterQualityParameterCategoryEnum.CHEMISTRY,
            unit: data.unit,
            displayOrder: data.displayOrder ?? undefined,
            standardLimit: data.standardLimit,
            regulatoryLimit: data.regulatoryLimit,
            testMethod: data.testMethod || '',
            description: data.description || '',
            isActive: data.isActive,
            dateSampleTaken: toDateInputValue(data.dateSampleTaken),
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/water-quality-parameters');
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
      const submitData: CreateWaterQualityParameterData | UpdateWaterQualityParameterData = {
        ...data,
        dateSampleTaken: toIsoDateString(data.dateSampleTaken),
      };

      if (mode === 'create') {
        await waterQualityParameterService.create(submitData as CreateWaterQualityParameterData);
        toast.success('Parameter created successfully');
      } else if (id) {
        await waterQualityParameterService.update(id, submitData);
        toast.success('Parameter updated successfully');
      }
      navigate('/waste-management/water-quality-parameters');
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
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Parameter</CardTitle>
        <CardDescription>Enter the parameter information below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dateSampleTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Sample Taken *</FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
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
                      <Input placeholder="Enter code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value.charAt(0) + value.slice(1).toLowerCase()}
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
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Order"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="standardLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Limit</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="Enter limit" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regulatoryLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality Standard Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="Enter limit" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="testMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Method</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter test method" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description" className="resize-none" rows={3} {...field} />
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

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/water-quality-parameters')}>
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
