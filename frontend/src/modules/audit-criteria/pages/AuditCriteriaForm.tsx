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
  FormDescription,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import auditCriteriaService from '../services/auditCriteriaService';
import { CreateAuditCriteriaDTO, UpdateAuditCriteriaDTO, AuditCriteria } from '../types/audit-criteria.types';
import { TRANSITION_TYPES, TRANSITION_TYPE_OPTIONS } from '../constants/audit-criteria.constants';
import api from '@/core/lib/api';

const formSchema = z.object({
  name: z.string().min(1, 'Criteria name is required'),
  description: z.string().optional(),
  auditClauseId: z.string().min(1, 'Clause is required'),
  transitionType: z.enum(TRANSITION_TYPES, {
    required_error: 'Transition level is required',
  }),
  order: z.number().min(0, 'Order must be a positive number'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AuditCriteriaFormProps {
  criteria?: AuditCriteria;
  mode: 'create' | 'edit';
}

interface AuditClause {
  id: string;
  name: string;
  code: string;
  auditElementId: string;
}

const AuditCriteriaForm = ({ criteria, mode }: AuditCriteriaFormProps) => {
  const navigate = useNavigate();
  const [clauses, setClauses] = useState<AuditClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert clauses to SearchableSelectOption format
  const clauseOptions: SearchableSelectOption[] = clauses.map((clause) => ({
    value: clause.id,
    label: clause.name,
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      auditClauseId: '',
      transitionType: TRANSITION_TYPES[0],
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        setDataReady(false);

        const clausesResponse = await api.get('/audit-clauses', {
          params: { page: 1, limit: 1000, isActive: 'true' },
        });

        setClauses(clausesResponse.data.data || []);

        if (criteria) {
          form.reset({
            name: criteria.name,
            description: criteria.description || '',
            auditClauseId: criteria.auditClauseId,
            transitionType: criteria.transitionType,
            order: criteria.order,
            isActive: criteria.isActive,
          });
        }

        setDataReady(true);
      } catch (error) {
        console.error('Error fetching form options:', error);
        toast.error('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [criteria, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        const criteriaData: CreateAuditCriteriaDTO = {
          name: data.name,
          description: data.description || undefined,
          auditClauseId: data.auditClauseId,
          transitionType: data.transitionType,
          order: data.order,
          isActive: data.isActive,
        };
        await auditCriteriaService.createAuditCriteria(criteriaData);
        toast.success('Audit criteria created successfully');
      } else if (criteria) {
        const criteriaData: UpdateAuditCriteriaDTO = {
          name: data.name,
          description: data.description || undefined,
          auditClauseId: data.auditClauseId,
          transitionType: data.transitionType,
          order: data.order,
          isActive: data.isActive,
        };
        await auditCriteriaService.updateAuditCriteria(criteria.id, criteriaData);
        toast.success('Audit criteria updated successfully');
      }
      navigate('/audit-criteria');
    } catch (error: unknown) {
      console.error('Error saving audit criteria:', error);
      const errorMessage =
        error instanceof Error ? error.message : `Failed to ${mode} audit criteria`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Audit Criteria</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Criteria Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter criteria name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description (optional)"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField
                control={form.control}
                name="auditClauseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clause <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      {dataReady && (
                        <SearchableSelect
                          options={clauseOptions}
                          value={field.value}
                          onValueChange={(value) => form.setValue('auditClauseId', value)}
                          placeholder="Select clause"
                          searchPlaceholder="Search clause..."
                          emptyText="No clause found."
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transitionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transition Level <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transition level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSITION_TYPE_OPTIONS.map((option) => (
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
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter order"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      The order in which this criteria appears within the clause
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <div className="text-sm text-gray-500">
                          Disable to hide this criteria
                        </div>
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
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/audit-criteria')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AuditCriteriaForm;
