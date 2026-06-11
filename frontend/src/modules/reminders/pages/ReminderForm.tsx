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
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ModalCombobox, type ModalComboboxOption } from '@/core/components/ui/modal-combobox';
import reminderService from '../services/reminderService';
import { CreateReminderDTO, UpdateReminderDTO, Reminder, ReminderRepeatType, ReminderTargetType } from '../types/reminder.types';
import departmentService from '@/modules/master-data/services/departmentService';
import officeService from '@/modules/master-data/services/officeService';
import roleService from '@/modules/roles/services/roleService';
import userService from '@/modules/users/services/userService';

async function resolveTargetOptions(type: ReminderTargetType): Promise<ModalComboboxOption[]> {
  const params = { page: 1, limit: 200, filters: { options: true } } as any;
  switch (type) {
    case ReminderTargetType.DEPARTMENT: {
      const r = await departmentService.getDepartments(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name }));
    }
    case ReminderTargetType.OFFICE: {
      const r = await officeService.getOffices(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name }));
    }
    case ReminderTargetType.ROLE: {
      const r = await roleService.getRoles(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name ?? d.code }));
    }
    case ReminderTargetType.USER: {
      const r = await userService.getUsers(params);
      return r.data.map((u: any) => ({ value: u.id, label: u.fullName ?? u.email }));
    }
    default:
      return [];
  }
}

const formSchema = z.object({
  targetType: z.nativeEnum(ReminderTargetType).default(ReminderTargetType.USER),
  targetId: z.string().min(1, 'Pick a recipient'),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  remindAt: z.string().min(1, 'Remind at date and time is required'),
  repeatType: z.nativeEnum(ReminderRepeatType).default(ReminderRepeatType.NONE),
  repeatUntil: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReminderFormProps {
  reminder?: Reminder;
  mode: 'create' | 'edit';
}

const ReminderForm = ({ reminder, mode }: ReminderFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [targetOptions, setTargetOptions] = useState<ModalComboboxOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: reminder
      ? {
          targetType: reminder.targetType ?? ReminderTargetType.USER,
          targetId: reminder.targetId ?? '',
          entity: reminder.entity || '',
          entityId: reminder.entityId || '',
          message: reminder.message,
          remindAt: reminder.remindAt
            ? new Date(reminder.remindAt).toISOString().slice(0, 16)
            : '',
          repeatType: reminder.repeatType || ReminderRepeatType.NONE,
          repeatUntil: reminder.repeatUntil
            ? new Date(reminder.repeatUntil).toISOString().slice(0, 16)
            : '',
        }
      : {
          targetType: ReminderTargetType.USER,
          targetId: '',
          entity: '',
          entityId: '',
          message: '',
          remindAt: '',
          repeatType: ReminderRepeatType.NONE,
          repeatUntil: '',
        },
  });

  const targetType = form.watch('targetType');
  const repeatType = form.watch('repeatType');

  useEffect(() => {
    let active = true;
    resolveTargetOptions(targetType).then((opts) => {
      if (active) setTargetOptions(opts);
    });
    return () => { active = false; };
  }, [targetType]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      const remindAtISO = new Date(data.remindAt).toISOString();
      const repeatUntilISO = data.repeatUntil ? new Date(data.repeatUntil).toISOString() : undefined;

      if (mode === 'create') {
        const reminderData: CreateReminderDTO = {
          targetType: data.targetType,
          targetId: data.targetId,
          entity: data.entity || undefined,
          entityId: data.entityId || undefined,
          message: data.message,
          remindAt: remindAtISO,
          repeatType: data.repeatType === ReminderRepeatType.NONE ? undefined : data.repeatType,
          repeatUntil: repeatUntilISO,
        };
        await reminderService.createReminder(reminderData);
        toast.success('Reminder created successfully');
      } else if (reminder) {
        const reminderData: UpdateReminderDTO = {
          targetType: data.targetType,
          targetId: data.targetId,
          entity: data.entity || undefined,
          entityId: data.entityId || undefined,
          message: data.message,
          remindAt: remindAtISO,
          repeatType: data.repeatType === ReminderRepeatType.NONE ? undefined : data.repeatType,
          repeatUntil: repeatUntilISO,
        };
        await reminderService.updateReminder(reminder.id, reminderData);
        toast.success('Reminders updated successfully');
      }
      navigate('/reminders');
    } catch (error: unknown) {
      console.error('Error saving reminder:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} reminder`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Who gets reminded */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Who gets reminded</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send to</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue('targetId', '');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ReminderTargetType.USER}>A user</SelectItem>
                          <SelectItem value={ReminderTargetType.DEPARTMENT}>A department</SelectItem>
                          <SelectItem value={ReminderTargetType.ROLE}>A role</SelectItem>
                          <SelectItem value={ReminderTargetType.OFFICE}>An office</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {targetType === ReminderTargetType.USER
                          ? 'User'
                          : targetType === ReminderTargetType.DEPARTMENT
                            ? 'Department'
                            : targetType === ReminderTargetType.ROLE
                              ? 'Role'
                              : 'Office'}
                      </FormLabel>
                      <FormControl>
                        <ModalCombobox
                          options={targetOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select recipient"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="entity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., t_incidents, t_audits" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Entity primary key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reminder message"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remindAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remind At</FormLabel>
                  <FormControl>
                    <DateTimePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="repeatType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select repeat type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ReminderRepeatType.NONE}>None</SelectItem>
                        <SelectItem value={ReminderRepeatType.DAILY}>Daily</SelectItem>
                        <SelectItem value={ReminderRepeatType.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={ReminderRepeatType.MONTHLY}>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {repeatType && repeatType !== ReminderRepeatType.NONE && (
                <FormField
                  control={form.control}
                  name="repeatUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Until</FormLabel>
                      <FormControl>
                        <DateTimePicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/reminders')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReminderForm;
