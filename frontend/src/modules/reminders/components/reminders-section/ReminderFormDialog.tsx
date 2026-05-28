import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  ModalCombobox,
  type ModalComboboxOption,
} from '@/core/components/ui/modal-combobox';
import reminderService from '../../services/reminderService';
import {
  CreateReminderDTO,
  Reminder,
  ReminderRepeatType,
  ReminderTargetType,
  UpdateReminderDTO,
} from '../../types/reminder.types';

const DOW_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
];

const schema = z.object({
  subjectId: z.string().optional(), // resolves to subjectType+subjectId on submit
  message: z.string().min(1, 'Message is required'),
  repeatType: z.nativeEnum(ReminderRepeatType),
  remindAtDate: z.string().min(1, 'Start date is required'),
  remindAtTime: z.string().min(1, 'Time is required'),
  dayOfMonth: z.string().optional(),
  dayOfWeek: z.string().optional(),
  repeatUntil: z.string().optional(),
  targetType: z.nativeEnum(ReminderTargetType),
  targetId: z.string().min(1, 'Pick a recipient'),
});

type FormValues = z.infer<typeof schema>;

export interface ReminderFormDialogSubjectPicker {
  subjectType: string;
  label: string;
  resolveOptions: () => Promise<ModalComboboxOption[]>;
}

export interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  reminder?: Reminder;
  entity: string;
  entityLabel?: string;
  subjectPicker?: ReminderFormDialogSubjectPicker;
  defaultTarget?: { type: ReminderTargetType; id: string };
  resolveTargetOptions: (
    type: ReminderTargetType,
  ) => Promise<ModalComboboxOption[]>;
  onSaved(reminder: Reminder): void;
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function ReminderFormDialog(props: ReminderFormDialogProps) {
  const {
    open,
    onOpenChange,
    reminder,
    entity,
    entityLabel,
    subjectPicker,
    defaultTarget,
    resolveTargetOptions,
    onSaved,
  } = props;

  const mode: 'create' | 'edit' = reminder ? 'edit' : 'create';
  const [submitting, setSubmitting] = useState(false);
  const [targetOptions, setTargetOptions] = useState<ModalComboboxOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<ModalComboboxOption[]>([]);

  const initialRemindAt = useMemo(() => {
    if (reminder) return new Date(reminder.remindAt);
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  }, [reminder]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjectId: reminder?.subjectId ?? '',
      message: reminder?.message ?? '',
      repeatType: reminder?.repeatType ?? ReminderRepeatType.NONE,
      remindAtDate: initialRemindAt.toISOString().slice(0, 10),
      remindAtTime: initialRemindAt.toTimeString().slice(0, 5),
      dayOfMonth:
        reminder?.dayOfMonth?.toString() ??
        initialRemindAt.getDate().toString(),
      dayOfWeek:
        reminder?.dayOfWeek?.toString() ??
        initialRemindAt.getDay().toString(),
      repeatUntil: reminder?.repeatUntil?.slice(0, 10) ?? '',
      targetType: reminder?.targetType ?? defaultTarget?.type ?? ReminderTargetType.DEPARTMENT,
      targetId: reminder?.targetId ?? defaultTarget?.id ?? '',
    },
  });

  const targetType = form.watch('targetType');
  const repeatType = form.watch('repeatType');

  useEffect(() => {
    let active = true;
    resolveTargetOptions(targetType).then((opts) => {
      if (active) setTargetOptions(opts);
    });
    return () => {
      active = false;
    };
  }, [targetType, resolveTargetOptions]);

  useEffect(() => {
    if (!subjectPicker) {
      setSubjectOptions([]);
      return;
    }
    let active = true;
    subjectPicker.resolveOptions().then((opts) => {
      if (active) setSubjectOptions(opts);
    });
    return () => {
      active = false;
    };
  }, [subjectPicker]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const remindAtISO = combineDateTime(values.remindAtDate, values.remindAtTime);
      const repeatUntilISO = values.repeatUntil
        ? new Date(`${values.repeatUntil}T23:59:59`).toISOString()
        : undefined;

      const subjectType = subjectPicker && values.subjectId
        ? subjectPicker.subjectType
        : undefined;
      const subjectId = values.subjectId || undefined;

      const payload: CreateReminderDTO & UpdateReminderDTO = {
        targetType: values.targetType,
        targetId: values.targetId,
        entity,
        subjectType,
        subjectId,
        message: values.message,
        remindAt: remindAtISO,
        repeatType:
          values.repeatType === ReminderRepeatType.NONE ? undefined : values.repeatType,
        repeatUntil:
          values.repeatType === ReminderRepeatType.NONE ? undefined : repeatUntilISO,
        dayOfMonth:
          values.repeatType === ReminderRepeatType.MONTHLY && values.dayOfMonth
            ? Number(values.dayOfMonth)
            : undefined,
        dayOfWeek:
          values.repeatType === ReminderRepeatType.WEEKLY && values.dayOfWeek
            ? Number(values.dayOfWeek)
            : undefined,
      };

      const saved =
        mode === 'create'
          ? await reminderService.createReminder(payload)
          : await reminderService.updateReminder(reminder!.id, payload);
      toast.success(mode === 'create' ? 'Reminder created' : 'Reminder updated');
      onSaved(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'create'
      ? `New ${entityLabel ?? 'reminder'} reminder`
      : `Edit reminder`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {subjectPicker && (
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{subjectPicker.label} (optional)</FormLabel>
                    <FormControl>
                      <ModalCombobox
                        options={subjectOptions}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder={`Select ${subjectPicker.label.toLowerCase()}`}
                        includeNone
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Leave blank for a module-wide reminder; pick one to scope it to a specific {subjectPicker.label.toLowerCase()}.
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="What should the recipient be reminded of?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Schedule</div>

              <FormField
                control={form.control}
                name="repeatType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ReminderRepeatType.NONE}>Once</SelectItem>
                          <SelectItem value={ReminderRepeatType.DAILY}>Daily</SelectItem>
                          <SelectItem value={ReminderRepeatType.WEEKLY}>Weekly</SelectItem>
                          <SelectItem value={ReminderRepeatType.MONTHLY}>Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {repeatType === ReminderRepeatType.MONTHLY && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of month</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Falls back to the last day of the month when shorter (e.g. Feb 30 → Feb 28).
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {repeatType === ReminderRepeatType.WEEKLY && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of week</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOW_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="remindAtDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remindAtTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {repeatType !== ReminderRepeatType.NONE && (
                <FormField
                  control={form.control}
                  name="repeatUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Leave blank to repeat indefinitely.
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Who */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Who gets reminded</div>

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send to</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ReminderTargetType.USER}>A user</SelectItem>
                          <SelectItem value={ReminderTargetType.DEPARTMENT}>
                            A department
                          </SelectItem>
                          <SelectItem value={ReminderTargetType.ROLE}>A role</SelectItem>
                          <SelectItem value={ReminderTargetType.OFFICE}>An office</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? mode === 'create'
                    ? 'Creating…'
                    : 'Saving…'
                  : mode === 'create'
                    ? 'Create'
                    : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
