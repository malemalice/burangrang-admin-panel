import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
import { ManHour, ManHourGroup, Month, MONTHS, MONTH_LABELS, GROUP_LABELS } from '../types/man-hour.types';
import manHourService from '../services/manHourService';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  group: z.enum(['STUDENT', 'NON_STUDENT'], {
    required_error: 'Group is required',
  }),
  qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
  manHourPerDay: z.coerce.number().min(0, 'Hours per day must be positive').max(24, 'Hours per day cannot exceed 24'),
  month: z.enum(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], {
    required_error: 'Month is required',
  }),
  year: z.coerce.number().min(2000, 'Year must be at least 2000').max(2100, 'Year cannot exceed 2100'),
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
  const currentYear = new Date().getFullYear();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      name: manHour?.name || '',
      group: manHour?.group || 'STUDENT',
      qty: manHour?.qty || 0,
      manHourPerDay: manHour?.manHourPerDay || 0,
      month: manHour?.month || 'JAN',
      year: manHour?.year || currentYear,
      notes: manHour?.notes || '',
      isActive: manHour?.isActive ?? true,
    },
  });

  // Generate year options
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/man-hours')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <ThemeButton type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </ThemeButton>
        </div>
      </form>
    </Form>
  );
}
