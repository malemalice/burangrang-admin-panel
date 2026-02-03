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
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';

import { treatmentPlantService } from '../../services/wasteManagementService';
import { CreateTreatmentPlantData, TreatmentPlant, UpdateTreatmentPlantData } from '../../types/waste-management.types';
import officeService from '@/modules/master-data/services/officeService';
import { Office } from '@/modules/master-data/types/master-data.types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.coerce.number().optional(),
  description: z.string().optional(),
  officeId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface TreatmentPlantFormProps {
  mode: 'create' | 'edit';
}

export default function TreatmentPlantForm({ mode }: TreatmentPlantFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      capacity: 0,
      description: '',
      officeId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await officeService.getOffices({ page: 1, limit: 100, filters: { isActive: true }, options: true });
        setOffices(response.data);
      } catch (error) {
        console.error('Failed to fetch offices', error);
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await treatmentPlantService.getById(id);
          const data = response.data as TreatmentPlant;
          form.reset({
            name: data.name,
            code: data.code,
            location: data.location,
            capacity: data.capacity || 0,
            description: data.description || '',
            officeId: data.officeId || '',
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to fetch treatment plant data');
          navigate('/waste-management/treatment-plants');
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
      const submitData: CreateTreatmentPlantData | UpdateTreatmentPlantData = {
        ...data,
        capacity: data.capacity || undefined,
        officeId: data.officeId || undefined,
      };

      if (mode === 'create') {
        await treatmentPlantService.create(submitData as CreateTreatmentPlantData);
        toast.success('Treatment plant created successfully');
      } else if (id) {
        await treatmentPlantService.update(id, submitData);
        toast.success('Treatment plant updated successfully');
      }
      navigate('/waste-management/treatment-plants');
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
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Treatment Plant</CardTitle>
        <CardDescription>Enter the treatment plant information below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter treatment plant name" {...field} />
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
                      <Input placeholder="Enter unique code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="Enter capacity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="officeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={offices.map((o) => ({ label: o.name, value: o.id }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select office"
                    />
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
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/treatment-plants')}>
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
