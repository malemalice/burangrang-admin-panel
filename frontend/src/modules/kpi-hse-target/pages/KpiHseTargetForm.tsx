import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent } from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import {
  HseTarget,
  HseTargetType,
  Month,
  MONTHS,
  MONTH_LABELS,
  TYPE_LABELS,
} from '../types/kpi-hse-target.types';
import kpiHseTargetService from '../services/kpiHseTargetService';

const formSchema = z.object({
  type: z.enum(['INCIDENT', 'RISK', 'INSPECTION', 'AUDIT'], {
    required_error: 'Type is required',
  }),
  code: z.string().min(1, 'Code is required'),
  name: z.string().optional(),
  month: z.union([
    z.enum(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']),
    z.literal('__NONE__'),
    z.null(),
  ]).optional().nullable(),
  year: z.coerce.number().min(2000, 'Year must be at least 2000').max(2100, 'Year cannot exceed 2100'),
  target: z.coerce.number().min(0, 'Target must be 0 or greater'),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface KpiHseTargetFormProps {
  hseTarget?: HseTarget;
  mode: 'create' | 'edit';
}

export default function KpiHseTargetForm({ hseTarget, mode }: KpiHseTargetFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: hseTarget?.type || 'INCIDENT',
      code: hseTarget?.code || '',
      name: hseTarget?.name || '',
      month: hseTarget?.month ?? null,
      year: hseTarget?.year || currentYear,
      target: hseTarget?.target ?? 0,
      isActive: hseTarget?.isActive ?? true,
    },
  });

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        type: data.type as HseTargetType,
        code: data.code,
        name: data.name || undefined,
        month: (data.month && data.month !== '__NONE__' ? data.month : undefined) as Month | undefined,
        year: data.year,
        target: data.target,
        isActive: data.isActive,
      };

      if (mode === 'create') {
        await kpiHseTargetService.createHseTarget(payload);
        toast.success('HSE target created successfully');
      } else if (hseTarget) {
        await kpiHseTargetService.updateHseTarget(hseTarget.id, payload);
        toast.success('HSE target updated successfully');
      }
      navigate('/dashboard/kpi-hse-target');
    } catch (error: any) {
      console.error('Failed to save HSE target:', error);
      const message = error.response?.data?.message || 'Failed to save HSE target';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(TYPE_LABELS) as HseTargetType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FATALITY, MAJOR, HIGH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Display label for target scope" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Month - Optional for yearly targets */}
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (Optional - leave empty for yearly)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === '__NONE__' ? null : val)}
                      value={field.value ?? '__NONE__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Yearly (no month)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__NONE__">Yearly (no specific month)</SelectItem>
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
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value)}>
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

              {/* Target */}
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active - Edit mode only */}
              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/kpi-hse-target')}>
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
