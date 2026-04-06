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

const WORKING_DAYS_PER_MONTH = 22;

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

  const defaultTotalWorkingDays = manHour
    ? manHour.totalWorkingDays
    : 0;
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
      lostHour: defaultLostHour,
      total: defaultTotal,
      notes: manHour?.notes || '',
      isActive: manHour?.isActive ?? true,
    },
  });

  const yearOptions = getYearOptions();

  const watchedQty = useWatch({ control: form.control, name: 'qty' });
  const watchedManHourPerDay = useWatch({ control: form.control, name: 'manHourPerDay' });
  const watchedLostHour = useWatch({ control: form.control, name: 'lostHour' });
  const watchedTotal = useWatch({ control: form.control, name: 'total' });

  const computedTotalWorkingDays =
    (Number(watchedQty) || 0) * (Number(watchedManHourPerDay) || 0) * WORKING_DAYS_PER_MONTH;

  // When qty or manHourPerDay change, recompute total keeping existing lostHour (skip right after HR apply)
  useEffect(() => {
    if (lastEditedField.current === 'hrApply') return;
    const twds = (Number(watchedQty) || 0) * (Number(watchedManHourPerDay) || 0) * WORKING_DAYS_PER_MONTH;
    const lh = Number(form.getValues('lostHour')) || 0;
    form.setValue('total', Math.max(0, twds - lh), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedQty, watchedManHourPerDay]);

  // When lostHour changes, recompute total
  useEffect(() => {
    if (lastEditedField.current !== 'lostHour') return;
    const lh = Number(watchedLostHour) || 0;
    form.setValue('total', Math.max(0, computedTotalWorkingDays - lh), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLostHour]);

  // When total changes, back-calculate lostHour
  useEffect(() => {
    if (lastEditedField.current !== 'total') return;
    const t = Number(watchedTotal) || 0;
    form.setValue('lostHour', Math.max(0, computedTotalWorkingDays - t), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTotal]);

  /**
   * HR hardcopy: user enters Quantity (people) and Total man hours from HR.
   * Derives hours/day so capacity matches HR total; any rounding gap becomes lost hours.
   * totalWorkingDays = qty × hours/day × 22, total = totalWorkingDays − lostHour (= HR total when feasible).
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
    const rawHoursPerDay = hrTotal / (qty * WORKING_DAYS_PER_MONTH);
    if (rawHoursPerDay > 24) {
      toast.error(
        'The combination implies more than 24 hours per day. Check quantity and total from HR.',
      );
      return;
    }
    const manHourPerDay = Math.round(rawHoursPerDay * 100) / 100;
    const totalWorkingDays = qty * manHourPerDay * WORKING_DAYS_PER_MONTH;
    const lostHour = Math.max(0, Math.round((totalWorkingDays - hrTotal) * 100) / 100);
    const reconciledTotal = Math.round((totalWorkingDays - lostHour) * 100) / 100;

    lastEditedField.current = 'hrApply';
    form.setValue('manHourPerDay', manHourPerDay, { shouldValidate: true });
    form.setValue('lostHour', lostHour, { shouldValidate: true });
    form.setValue('total', reconciledTotal, { shouldValidate: true });
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
            <p className="font-medium">Formulas (this month)</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground">Total working days (capacity)</span> = Quantity
                (people) × Hours per day × {WORKING_DAYS_PER_MONTH} (working days per month).
              </li>
              <li>
                <span className="text-foreground">Total man hours</span> = Total working days − Lost
                hours.
              </li>
              <li>
                Lost hours capture absence, accidents, or other time not worked vs the capacity
                figure.
              </li>
            </ul>
            <p className="font-medium pt-1">Data from HR (hardcopy / spreadsheet)</p>
            <p className="text-sm text-muted-foreground">
              Enter <strong className="text-foreground font-medium">Quantity (people)</strong> and{' '}
              <strong className="text-foreground font-medium">Total man hours</strong> exactly as
              from HR, then click &quot;Apply HR totals&quot;. The system sets{' '}
              <strong className="text-foreground font-medium">Hours per day</strong> so capacity
              matches the HR total (rounded to two decimals), assigns any small remainder to{' '}
              <strong className="text-foreground font-medium">Lost hours</strong>, and keeps{' '}
              <strong className="text-foreground font-medium">Total man hours</strong> consistent
              with the formulas above.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type="number" step="0.5" min="0" max="24" {...field} />
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

              {/* Total Working Days (read-only computed) */}
              <FormItem>
                <FormLabel>Total Working Days</FormLabel>
                <Input
                  type="number"
                  value={computedTotalWorkingDays}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Calculated: {watchedQty || 0} people × {watchedManHourPerDay || 0} hrs/day × {WORKING_DAYS_PER_MONTH} days
                </p>
              </FormItem>

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
                    <p className="text-xs text-muted-foreground">Total Working Days − Lost Hours. Editing this will auto-adjust Lost Hours.</p>
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
