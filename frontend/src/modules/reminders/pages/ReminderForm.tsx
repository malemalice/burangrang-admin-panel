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
import reminderService from '../services/reminderService';
import { CreateReminderDTO, UpdateReminderDTO, Reminder, ReminderRepeatType } from '../types/reminder.types';

const formSchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  remindAt: z.string().min(1, 'Remind at date and time is required'),
  repeatType: z.nativeEnum(ReminderRepeatType).default(ReminderRepeatType.NONE),
  repeatUntil: z.string().optional(),
}).refine((data) => {
  // If repeatType is not NONE, repeatUntil is required
  if (data.repeatType && data.repeatType !== ReminderRepeatType.NONE) {
    return !!data.repeatUntil;
  }
  return true;
}, {
  message: 'Repeat until date is required when repeat type is not None',
  path: ['repeatUntil'],
});

type FormValues = z.infer<typeof formSchema>;

interface ReminderFormProps {
  reminder?: Reminder;
  mode: 'create' | 'edit';
}

const ReminderForm = ({ reminder, mode }: ReminderFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity: '',
      entityId: '',
      message: '',
      remindAt: '',
      repeatType: ReminderRepeatType.NONE,
      repeatUntil: '',
    },
  });

  useEffect(() => {
    if (reminder) {
      // Convert ISO date strings to datetime-local format
      const remindAtLocal = reminder.remindAt
        ? new Date(reminder.remindAt).toISOString().slice(0, 16)
        : '';
      const repeatUntilLocal = reminder.repeatUntil
        ? new Date(reminder.repeatUntil).toISOString().slice(0, 16)
        : '';

      form.reset({
        entity: reminder.entity || '',
        entityId: reminder.entityId || '',
        message: reminder.message,
        remindAt: remindAtLocal,
        repeatType: reminder.repeatType || ReminderRepeatType.NONE,
        repeatUntil: repeatUntilLocal,
      });
    }
  }, [reminder, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Convert datetime-local to ISO 8601 format
      const remindAtISO = new Date(data.remindAt).toISOString();
      const repeatUntilISO = data.repeatUntil ? new Date(data.repeatUntil).toISOString() : undefined;

      if (mode === 'create') {
        const reminderData: CreateReminderDTO = {
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
          entity: data.entity || undefined,
          entityId: data.entityId || undefined,
          message: data.message,
          remindAt: remindAtISO,
          repeatType: data.repeatType === ReminderRepeatType.NONE ? undefined : data.repeatType,
          repeatUntil: repeatUntilISO,
        };
        await reminderService.updateReminder(reminder.id, reminderData);
        toast.success('Reminder updated successfully');
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

  const repeatType = form.watch('repeatType');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

