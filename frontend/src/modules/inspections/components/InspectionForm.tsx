import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect, SearchableSelectOption, MultiSelectSearchable } from '@/core/components/ui/searchable-select';

import { Inspection } from '../types/inspection.types';
import inspectionsService, { CreateInspectionDTO } from '../services/inspectionsService';
import areaService from '@/modules/master-data/services/areaService';
import type { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { userService } from '@/modules/users';
import { User } from '@/core/lib/types';
import { GENERAL_STATUS_OPTIONS, GeneralStatusEnum } from '@/shared/constants/general-status.enum';

// Generate inspection code: INS + YYMMDDHHmmss
// Includes seconds to reduce collision probability
const generateInspectionCode = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `INS${year}${month}${date}${hour}${minute}${second}`;
};

// Form schema for validation
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  areaId: z.string().min(1, 'Area is required'),
  inspectionDate: z.string().min(1, 'Inspection date is required'),
  status: z.nativeEnum(GeneralStatusEnum),
  isActive: z.boolean().default(true),
  inspectorIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InspectionFormProps {
  inspection?: Inspection;
  mode: 'create' | 'edit';
}

const InspectionForm = ({ inspection, mode }: InspectionFormProps) => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert data to SearchableSelectOption format
  const areaOptions: SearchableSelectOption[] = areas.map(area => ({
    value: area.id,
    label: area.name
  }));

  const userOptions: SearchableSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: mode === 'create' ? generateInspectionCode() : '',
      areaId: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      status: GeneralStatusEnum.DRAFT,
      isActive: true,
      inspectorIds: [],
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [areasResponse, usersResponse] = await Promise.all([
          areaService.getAreas({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: true }
          }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);
        setAreas(areasResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        toast.error('Failed to load reference data');
      } finally {
        setIsLoading(false);
        setDataReady(true);
      }
    };

    fetchData();
  }, []);

  // Set form values if editing
  useEffect(() => {
    if (inspection && mode === 'edit' && dataReady) {
      const inspectorIds = inspection.inspectors?.map(inspector => inspector.inspectorId) || [];
      form.reset({
        code: inspection.code,
        areaId: inspection.areaId,
        inspectionDate: inspection.inspectionDate
          ? new Date(inspection.inspectionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: inspection.status,
        isActive: inspection.isActive,
        inspectorIds,
      });
    }
  }, [inspection, mode, dataReady, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Transform the date if provided
      let inspectionData: CreateInspectionDTO = {
        code: data.code as string,
        areaId: data.areaId as string,
        inspectionDate: new Date(data.inspectionDate),
        status: data.status,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.inspectorIds && data.inspectorIds.length > 0 && {
          inspectors: data.inspectorIds.map((inspectorId, index) => ({
            inspectorId,
            order: index + 1,
          })),
        }),
      };

      if (mode === 'create') {
        try {
          await inspectionsService.create(inspectionData);
          toast.success('Inspection created successfully');
        } catch (error: any) {
          // Handle code conflict - regenerate code and retry once
          if (
            error?.response?.status === 409 ||
            error?.message?.toLowerCase().includes('code') ||
            error?.message?.toLowerCase().includes('already exists')
          ) {
            const newCode = generateInspectionCode();
            inspectionData.code = newCode;
            form.setValue('code', newCode);
            await inspectionsService.create(inspectionData);
            toast.success('Inspection created successfully (code regenerated)');
          } else {
            throw error;
          }
        }
      } else if (inspection) {
        await inspectionsService.update(inspection.id, inspectionData);
        toast.success('Inspection updated successfully');
      }
      navigate('/inspections');
    } catch (error) {
      toast.error(`Failed to ${mode} inspection`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Inspection</CardTitle>
        <CardDescription>
          Enter the details for the inspection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Inspection Code <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter inspection code" {...field} />
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
                      <FormLabel>
                        Area <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={areaOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select an area"
                          searchPlaceholder="Search area..."
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
                  name="inspectionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Inspection Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENERAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="inspectorIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspectors</FormLabel>
                      <FormControl>
                        <MultiSelectSearchable
                          options={userOptions}
                          value={field.value || []}
                          onValueChange={field.onChange}
                          placeholder="Select inspectors"
                          searchPlaceholder="Search inspectors..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/inspections')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InspectionForm;

