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

import { storageLocationService } from '../../services/wasteManagementService';
import areaService from '@/modules/master-data/services/areaService';
import { CreateStorageLocationData, StorageLocation, UpdateStorageLocationData } from '../../types/waste-management.types';
import { AreaDTO } from '@/modules/master-data/types/master-data.types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  location: z.string().min(1, 'Location is required'),
  areaId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface StorageLocationFormProps {
  mode: 'create' | 'edit';
}

export default function StorageLocationForm({ mode }: StorageLocationFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<AreaDTO[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      areaId: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true } });
        setAreas(response.data);
      } catch (error) {
        console.error('Failed to fetch areas', error);
      }
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await storageLocationService.getById(id);
          const data = response.data as StorageLocation;
          form.reset({
            name: data.name,
            code: data.code,
            location: data.location,
            areaId: data.areaId || '',
            description: data.description || '',
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/storage-locations');
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
      const submitData: CreateStorageLocationData | UpdateStorageLocationData = {
        ...data,
        areaId: data.areaId || undefined,
      };

      if (mode === 'create') {
        await storageLocationService.create(submitData as CreateStorageLocationData);
        toast.success('Storage location created successfully');
      } else if (id) {
        await storageLocationService.update(id, submitData);
        toast.success('Storage location updated successfully');
      }
      navigate('/waste-management/storage-locations');
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
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Storage Location</CardTitle>
        <CardDescription>Enter the storage location information</CardDescription>
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
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={areas.map((a) => ({ label: a.name, value: a.id }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select area"
                      />
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
                    <Textarea placeholder="Enter description" className="resize-none" {...field} />
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
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/storage-locations')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Location' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
