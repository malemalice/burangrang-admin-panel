import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { CreateAuditCriteriaDTO, TransitionTypeEnum } from '../types/audit-policy.types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  transitionType: z.nativeEnum(TransitionTypeEnum),
  order: z.coerce.number().min(0, 'Order must be 0 or greater'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AuditCriteriaFormProps {
  auditClauseId: string;
  initialCriterion?: Partial<CreateAuditCriteriaDTO>;
  onSubmit?: (criterion: CreateAuditCriteriaDTO) => void;
  onCancel?: () => void;
  showCard?: boolean;
  isSubmitting?: boolean;
}

export const AuditCriteriaForm = ({
  auditClauseId,
  initialCriterion,
  onSubmit,
  onCancel,
  showCard = true,
  isSubmitting = false,
}: AuditCriteriaFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialCriterion?.name || '',
      code: initialCriterion?.code || '',
      description: initialCriterion?.description || '',
      transitionType: initialCriterion?.transitionType || TransitionTypeEnum.INITIAL,
      order: initialCriterion?.order ?? 0,
      isActive: initialCriterion?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    if (!onSubmit) return;

    await onSubmit({
      ...data,
      auditClauseId,
      description: data.description || undefined,
    });
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Code <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1.1.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Criteria <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Criteria name" {...field} />
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
              <FormLabel>Interpretation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Interpretation of audit criteria and compliance/relevant documents"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="transitionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Transition Type <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transition type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TransitionTypeEnum.INITIAL}>Initial</SelectItem>
                    <SelectItem value={TransitionTypeEnum.TRANSITION_LEVEL}>Transition Level</SelectItem>
                    <SelectItem value={TransitionTypeEnum.ADVANCE_LEVEL}>Advance Level</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Order <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialCriterion ? 'Update Criteria' : 'Create Criteria'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (!showCard) {
    return formContent;
  }

  return <div className="space-y-6">{formContent}</div>;
};