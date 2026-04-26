import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Info, Save } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
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
import { Card, CardContent } from '@/core/components/ui/card';
import { getYearOptions, getCurrentYear } from '@/core/utils/date';
import { ManHour, ManHourGroup, Month, MONTHS, MONTH_LABELS, GROUP_LABELS } from '../types/man-hour.types';
import manHourService from '../services/manHourService';
import { useState, useRef } from 'react';

/** Students: fixed 22 work days in month; capacity in man-hours = qty × mhpd × this. */
const WORKING_DAYS_PER_MONTH = 22;

function getInitialTotalWorkingDays(manHour?: ManHour): number {
  if (!manHour) {
    return 22;
  }
  if (manHour.group === 'STUDENT') {
    return manHour.qty * Number(manHour.manHourPerDay) * WORKING_DAYS_PER_MONTH;
  }
  const v = Number(manHour.totalWorkingDays) || 0;
  if (v <= 0) {
    return 22;
  }
  if (v > 31) {
    const legacyCapacity = manHour.qty * Number(manHour.manHourPerDay) * WORKING_DAYS_PER_MONTH;
    if (Math.abs(v - legacyCapacity) < 1) {
      return 22;
    }
    return 22;
  }
  return v;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name / Class is required'),
  group: z.enum(['STUDENT', 'NON_STUDENT'], {
    required_error: 'Group is required',
  }),
  qty: z.coerce.number().min(1, 'Value must be greater or equal to 1'),
  manHourPerDay: z.coerce.number().min(0, 'Hours per day must be positive').max(24, 'Hours per day cannot exceed 24'),
  month: z.enum(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], {
    required_error: 'Month is required',
  }),
  year: z.coerce.number().min(2000, 'Year must be at least 2000').max(2100, 'Year cannot exceed 2100'),
  totalWorkingDays: z.coerce.number().min(0, 'Total working days must be positive or zero'),
  lostHour: z.coerce.number().min(0, 'Lost hours must be positive').default(0),
  total: z.coerce.number().min(0, 'Total must be positive'),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManHourFormProps {
  manHour?: ManHour;
  mode: 'create' | 'edit';
}

export default function ManHourForm({ manHour, mode }: ManHourFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = getCurrentYear();

  // Track which field the user last edited to avoid circular updates
  const lastEditedField = useRef<'lostHour' | 'total' | 'hrApply' | null>(null);

  const defaultTotalWorkingDays = getInitialTotalWorkingDays(manHour);
  const defaultLostHour = manHour?.lostHour ?? 0;
  const defaultTotal = manHour?.total ?? 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: manHour?.name || '',
      group: manHour?.group || 'STUDENT',
      qty: manHour?.qty || 0,
      manHourPerDay: manHour?.manHourPerDay || 0,
      month: manHour?.month || 'JAN',
      year: manHour?.year || currentYear,
      totalWorkingDays: defaultTotalWorkingDays,
      lostHour: defaultLostHour,
      total: defaultTotal,
      notes: manHour?.notes || '',
      isActive: manHour?.isActive ?? true,
    },
  });

  const yearOptions = getYearOptions();

  const watchedQty = useWatch({ control: form.control, name: 'qty' });
  const watchedManHourPerDay = useWatch({ control: form.control, name: 'manHourPerDay' });
  const watchedGroup = useWatch({ control: form.control, name: 'group' });
  const watchedTotalWorkingDays = useWatch({ control: form.control, name: 'totalWorkingDays' });
  const watchedLostHour = useWatch({ control: form.control, name: 'lostHour' });
  const watchedTotal = useWatch({ control: form.control, name: 'total' });

  const studentComputedCapacity =
    (Number(watchedQty) || 0) * (Number(watchedManHourPerDay) || 0) * WORKING_DAYS_PER_MONTH;
  const nonStudentDayCount =
    (Number(watchedTotalWorkingDays) || 0) > 0 ? Number(watchedTotalWorkingDays) : 22;
  const nonStudentCapacityManHours =
    (Number(watchedQty) || 0) * (Number(watchedManHourPerDay) || 0) * nonStudentDayCount;
  const capacityForBalance =
    watchedGroup === 'NON_STUDENT' ? nonStudentCapacityManHours : studentComputedCapacity;

  // Sync totals: STUDENT column totalWorkingDays = capacity; NON_STUDENT totalWorkingDays = day count; total = capacity − lost
  useEffect(() => {
    if (lastEditedField.current === 'hrApply') return;
    if (!watchedGroup) return;
    const q = Number(watchedQty) || 0;
    const m = Number(watchedManHourPerDay) || 0;
    const lh = Number(form.getValues('lostHour')) || 0;

    if (watchedGroup === 'STUDENT') {
      const cap = q * m * WORKING_DAYS_PER_MONTH;
      form.setValue('totalWorkingDays', cap, { shouldValidate: false });
      form.setValue('total', Math.max(0, cap - lh), { shouldValidate: false });
      return;
    }

    const dayCount = Math.max(0, Number(form.getValues('totalWorkingDays')) || 0) || 22;
    const cap = q * m * dayCount;
    form.setValue('total', Math.max(0, cap - lh), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedGroup, watchedQty, watchedManHourPerDay, watchedTotalWorkingDays]);

  // When lostHour changes, recompute total
  useEffect(() => {
    if (lastEditedField.current !== 'lostHour') return;
    const lh = Number(watchedLostHour) || 0;
    form.setValue('total', Math.max(0, capacityForBalance - lh), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLostHour, capacityForBalance, watchedGroup]);

  // When total changes, back-calculate lostHour
  useEffect(() => {
    if (lastEditedField.current !== 'total') return;
    const t = Number(watchedTotal) || 0;
    form.setValue('lostHour', Math.max(0, capacityForBalance - t), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTotal, capacityForBalance, watchedGroup]);

  /**
   * HR hardcopy: user enters Quantity (people) and Total man hours from HR.
   * Derives hours/day so capacity matches HR total; any rounding gap becomes lost hours.
   * STUDENT: capacity = qty × hours/day × 22. NON_STUDENT: capacity = qty × hours/day × working day count; total = capacity − lostHour.
   */
  const applyFromHrHardcopy = () => {
    const qty = Number(form.getValues('qty')) || 0;
    const hrTotal = Number(form.getValues('total')) || 0;
    if (qty < 1) {
      toast.error('Enter quantity (people) first.');
      return;
    }
    if (hrTotal < 0) {
      toast.error('Total man hours cannot be negative.');
      return;
    }
    const isStudent = form.getValues('group') === 'STUDENT';
    const dayCount = isStudent
      ? WORKING_DAYS_PER_MONTH
      : Math.max(0, Number(form.getValues('totalWorkingDays')) || 0) || 22;
    const rawHoursPerDay = hrTotal / (qty * dayCount);
    if (rawHoursPerDay > 24) {
      toast.error(
        'The combination implies more than 24 hours per day. Check quantity, total from HR, and working day count.',
      );
      return;
    }
    const manHourPerDay = Math.round(rawHoursPerDay * 100) / 100;
    const totalCapacity = qty * manHourPerDay * dayCount;
    const lostHour = Math.max(0, Math.round((totalCapacity - hrTotal) * 100) / 100);
    const reconciledTotal = Math.round((totalCapacity - lostHour) * 100) / 100;
    const totalWorkingDaysDisplay = isStudent
      ? totalCapacity
      : dayCount;

    lastEditedField.current = 'hrApply';
    form.setValue('manHourPerDay', manHourPerDay, { shouldValidate: true });
    form.setValue('lostHour', lostHour, { shouldValidate: true });
    form.setValue('total', reconciledTotal, { shouldValidate: true });
    form.setValue('totalWorkingDays', totalWorkingDaysDisplay, { shouldValidate: true });
    requestAnimationFrame(() => {
      lastEditedField.current = null;
    });
    toast.success('Hours per day and lost hours updated from HR totals.');
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await manHourService.createManHour({
          name: data.name,
          group: data.group as ManHourGroup,
          qty: data.qty,
          manHourPerDay: data.manHourPerDay,
          month: data.month as Month,
          year: data.year,
          ...(data.group === 'NON_STUDENT' ? { totalWorkingDays: data.totalWorkingDays } : {}),
          lostHour: data.lostHour,
          total: data.total,
          notes: data.notes,
        });
        toast.success('Man hour created successfully');
      } else if (manHour) {
        await manHourService.updateManHour(manHour.id, {
          name: data.name,
          group: data.group as ManHourGroup,
          qty: data.qty,
          manHourPerDay: data.manHourPerDay,
          month: data.month as Month,
          year: data.year,
          ...(data.group === 'NON_STUDENT' ? { totalWorkingDays: data.totalWorkingDays } : {}),
          lostHour: data.lostHour,
          total: data.total,
          notes: data.notes,
          isActive: data.isActive,
        });
        toast.success('Man hour updated successfully');
      }
      navigate('/man-hours');
    } catch (error: any) {
      console.error('Failed to save man hour:', error);
      const message = error.response?.data?.message || 'Failed to save man hour';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-950/30">
          <Info className="h-4 w-4 text-yellow-800 dark:text-yellow-400" aria-hidden />
          <AlertDescription className="space-y-3 text-foreground">
            <p className="font-medium">How totals work (this form)</p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Student</span> — Capacity (man-hours) = Quantity
              (people) × Hours per day × {WORKING_DAYS_PER_MONTH} fixed work days. The &quot;capacity&quot;
              field in the form reflects that. Total man hours = Capacity − Lost hours. Editing
              &quot;Total man hours&quot; or &quot;Lost hours&quot; adjusts the other to match.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Non-student</span> — Set <span className="text-foreground">Working days in month</span>{' '}
              (1–31; often 20–22). New rows default to {WORKING_DAYS_PER_MONTH} unless
              the saved record already has a value or you set another. Capacity = Quantity × Hours per day
              × working days in month. Total man hours = Capacity − Lost hours, same as for students.
            </p>
            <p className="font-medium pt-1">Data from HR (optional)</p>
            <p className="text-sm text-muted-foreground">
              Enter <span className="text-foreground font-medium">Quantity (people)</span> and{' '}
              <span className="text-foreground font-medium">Total man hours</span> as from HR, then
              use &quot;Apply HR totals&quot;. The app derives <span className="text-foreground font-medium">Hours per day</span> (2
              decimals) and, if needed, <span className="text-foreground font-medium">Lost hours</span> to reconcile rounding.{' '}
              For <span className="text-foreground font-medium">non-student</span>, the divisor uses your current{' '}
              <span className="text-foreground font-medium">Working days in month</span> (not the fixed {WORKING_DAYS_PER_MONTH}{' '}
              used for students). For <span className="text-foreground font-medium">student</span>, the divisor is{' '}
              {WORKING_DAYS_PER_MONTH} (same as the student capacity formula).
            </p>
            <Button type="button" variant="outline" size="sm" onClick={applyFromHrHardcopy}>
              Apply HR totals
            </Button>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name / Class *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Year 1-2, Kukang - KG2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group */}
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === 'NON_STUDENT') {
                          const twd = form.getValues('totalWorkingDays');
                          const n = Number(twd);
                          if (twd === undefined || twd === null || n <= 0) {
                            form.setValue('totalWorkingDays', 22, { shouldValidate: true });
                          }
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">{GROUP_LABELS.STUDENT}</SelectItem>
                        <SelectItem value="NON_STUDENT">{GROUP_LABELS.NON_STUDENT}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (People) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Man Hour Per Day */}
              <FormField
                control={form.control}
                name="manHourPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours per Day *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Month */}
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month}>
                            {MONTH_LABELS[month]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearOptions.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
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
                name="totalWorkingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedGroup === 'NON_STUDENT' ? 'Working days in month *' : 'Total man-hour capacity (display)'}
                    </FormLabel>
                    {watchedGroup === 'NON_STUDENT' ? (
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="31"
                          {...field}
                        />
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Input
                          type="number"
                          readOnly
                          disabled
                          className="bg-muted cursor-not-allowed"
                          {...field}
                          value={field.value ?? studentComputedCapacity}
                        />
                      </FormControl>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {watchedGroup === 'NON_STUDENT' ? (
                        <>
                          Man-hour capacity = Quantity × Hours per day × this day count. Default 22 when empty.
                        </>
                      ) : (
                        <>
                          Same as: {watchedQty || 0} people × {watchedManHourPerDay || 0} hrs/day × {WORKING_DAYS_PER_MONTH} days
                        </>
                      )}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lost Hour */}
              <FormField
                control={form.control}
                name="lostHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lost Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        {...field}
                        onFocus={() => { lastEditedField.current = 'lostHour'; }}
                        onChange={(e) => {
                          lastEditedField.current = 'lostHour';
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Hours lost due to absence, accidents, etc.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total */}
              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Man Hours *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        {...field}
                        onFocus={() => { lastEditedField.current = 'total'; }}
                        onChange={(e) => {
                          lastEditedField.current = 'total';
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Capacity (see formulas above) − Lost hours. Editing this will auto-adjust Lost hours.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes - Full width */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <ThemeButton type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </ThemeButton>
        </div>
      </form>
    </Form>
  );
}
