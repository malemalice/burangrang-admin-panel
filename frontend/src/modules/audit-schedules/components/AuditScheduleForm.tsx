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

import { AuditSchedule, CreateAuditScheduleDTO } from '../types/audit-schedule.types';
import auditSchedulesService from '../services/auditSchedulesService';
import areaService from '@/modules/master-data/services/areaService';
import type { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { userService } from '@/modules/users';
import { User } from '@/core/lib/types';
import { GENERAL_STATUS_OPTIONS, GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import api from '@/core/lib/api';
import { auditPeriodsService, AuditPeriod, formatPeriodLabel } from '@/modules/audit-periods';

// Generate audit code: AUD + YYMMDDHHmmss
const generateAuditCode = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `AUD${year}${month}${date}${hour}${minute}${second}`;
};

// Form schema for validation
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  areaIds: z.array(z.string()).min(1, 'At least one area is required'),
  auditDate: z.string().min(1, 'Audit date is required'),
  auditElementId: z.string().min(1, 'Audit element is required'),
  auditPeriodId: z.string().min(1, 'Audit period is required'),
  status: z.nativeEnum(GeneralStatusEnum).optional(), // Optional - auto-determined by backend
  isActive: z.boolean().default(true),
  auditorIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuditScheduleFormProps {
  auditSchedule?: AuditSchedule;
  mode: 'create' | 'edit';
}

const AuditScheduleForm = ({ auditSchedule, mode }: AuditScheduleFormProps) => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditElements, setAuditElements] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [auditPeriods, setAuditPeriods] = useState<AuditPeriod[]>([]);
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

  const auditElementOptions: SearchableSelectOption[] = auditElements.map(el => ({
    value: el.id,
    label: el.name
  }));

  const auditPeriodOptions: SearchableSelectOption[] = auditPeriods.map(p => ({
    value: p.id,
    label: formatPeriodLabel(p.month, p.year),
  }));

  // Filter status options to only show DONE and SCHEDULED (only valid statuses for audit schedules)
  const statusOptions = GENERAL_STATUS_OPTIONS.filter(
    option => option.value === GeneralStatusEnum.DONE || option.value === GeneralStatusEnum.SCHEDULED
  );

  // Helper function to determine default status based on audit date
  // Matches backend logic: past dates = DONE, today or future = SCHEDULED
  const getDefaultStatus = (auditDate: string): GeneralStatusEnum => {
    if (!auditDate) return GeneralStatusEnum.SCHEDULED;
    const date = new Date(auditDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today ? GeneralStatusEnum.DONE : GeneralStatusEnum.SCHEDULED;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: mode === 'create' ? generateAuditCode() : '',
      areaIds: [],
      auditDate: new Date().toISOString().split('T')[0],
      auditElementId: '',
      auditPeriodId: '',
      status: getDefaultStatus(new Date().toISOString().split('T')[0]),
      isActive: true,
      auditorIds: [],
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [areasResponse, usersResponse, auditElementsResponse, auditPeriodsResponse] = await Promise.all([
          areaService.getAreas({
            page: 1,
            limit: 1000,
            filters: { isActive: true },
            options: true
          }),
          userService.getAll({ page: 1, limit: 1000, options: true }),
          api.get('/audit-elements', { params: { page: 1, limit: 1000, isActive: true, options: true } }),
          auditPeriodsService.getAll({ page: 1, limit: 1000, options: true }),
        ]);
        setAreas(areasResponse.data);
        setUsers(usersResponse.data);
        setAuditElements(auditElementsResponse.data.data || []);
        setAuditPeriods(auditPeriodsResponse.data || []);
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
    if (auditSchedule && mode === 'edit' && dataReady) {
      const auditorIds = auditSchedule.auditors?.map(auditor => auditor.id) || [];
      const areaIds = auditSchedule.areaIds || [];
      const auditDateStr = auditSchedule.auditDate
        ? new Date(auditSchedule.auditDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      form.reset({
        code: auditSchedule.code,
        areaIds,
        auditDate: auditDateStr,
        auditElementId: auditSchedule.auditElementId,
        auditPeriodId: auditSchedule.auditPeriodId || '',
        status: auditSchedule.status,
        isActive: auditSchedule.isActive,
        auditorIds,
      });
    }
  }, [auditSchedule, mode, dataReady, form]);

  // Auto-update status when audit date changes (both SCHEDULED and DONE)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'auditDate' && value.auditDate) {
        const newStatus = getDefaultStatus(value.auditDate);
        form.setValue('status', newStatus, { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const auditScheduleData: CreateAuditScheduleDTO = {
        code: data.code as string,
        areaIds: data.areaIds as string[],
        auditDate: new Date(data.auditDate),
        auditElementId: data.auditElementId,
        auditPeriodId: data.auditPeriodId,
        status: data.status,
        isActive: true, // Always default to true (field is hidden)
        ...(data.auditorIds && data.auditorIds.length > 0 && {
          auditorIds: data.auditorIds,
        }),
      };

      if (mode === 'create') {
        try {
          await auditSchedulesService.create(auditScheduleData);
          toast.success('Audit schedule created successfully');
        } catch (error: any) {
          if (
            error?.response?.status === 409 ||
            error?.message?.toLowerCase().includes('code') ||
            error?.message?.toLowerCase().includes('already exists')
          ) {
            const newCode = generateAuditCode();
            auditScheduleData.code = newCode;
            form.setValue('code', newCode);
            await auditSchedulesService.create(auditScheduleData);
            toast.success('Audit schedule created successfully (code regenerated)');
          } else {
            // Display backend validation error messages
            const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${mode} audit schedule`;
            toast.error(errorMessage);
            return; // Don't navigate on error
          }
        }
      } else if (auditSchedule) {
        try {
          await auditSchedulesService.update(auditSchedule.id, auditScheduleData);
          toast.success('Audit schedule updated successfully');
        } catch (error: any) {
          // Display backend validation error messages
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update audit schedule';
          toast.error(errorMessage);
          return; // Don't navigate on error
        }
      }
      navigate('/audit-schedules');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${mode} audit schedule`;
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Audit</CardTitle>
        <CardDescription>
          Enter the details for the audit schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="auditPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Audit Period <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={auditPeriodOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select audit period"
                          searchPlaceholder="Search audit periods..."
                        />
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
                      <FormLabel>
                        Audit Code <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter audit code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auditElementId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Audit Element <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={auditElementOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select audit element"
                          searchPlaceholder="Search audit elements..."
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
                  name="areaIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Areas <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <MultiSelectSearchable
                          options={areaOptions}
                          value={field.value || []}
                          onValueChange={field.onChange}
                          placeholder="Select areas"
                          searchPlaceholder="Search areas..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auditDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Audit Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status
                        <span className="text-muted-foreground text-xs ml-2">
                          (Auto-determined based on audit date)
                        </span>
                      </FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {field.value === GeneralStatusEnum.DONE 
                          ? 'Note: Status will be auto-corrected to DONE if audit date is in the past'
                          : 'Note: Status will be auto-corrected to SCHEDULED if audit date is today or in the future'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auditorIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auditors</FormLabel>
                      <FormControl>
                        <MultiSelectSearchable
                          options={userOptions}
                          value={field.value || []}
                          onValueChange={field.onChange}
                          placeholder="Select auditors"
                          searchPlaceholder="Search auditors..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/audit-schedules')}
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

export default AuditScheduleForm;
