import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/core/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { riskMitigationService, riskService } from '@/modules/master-data';
import { RiskMitigation, Risk } from '@/core/lib/types';

// Define form schema
const formSchema = z.object({
  eliminate: z.string().optional(),
  transfer: z.string().optional(),
  reduce: z.string().optional(),
  accept: z.string().optional(),
  riskId: z.string().min(1, "Risk is required"),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskMitigationFormProps {
  riskMitigation?: RiskMitigation;
  mode: 'create' | 'edit';
}

const RiskMitigationForm = ({ riskMitigation, mode }: RiskMitigationFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [risks, setRisks] = useState<Risk[]>([]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eliminate: riskMitigation?.eliminate || '',
      transfer: riskMitigation?.transfer || '',
      reduce: riskMitigation?.reduce || '',
      accept: riskMitigation?.accept || '',
      riskId: riskMitigation?.riskId || '',
      isActive: riskMitigation?.isActive !== undefined ? riskMitigation.isActive : true,
    },
  });

  // Fetch risks for dropdown. In edit mode include inactive so selected risk appears (MDRMG-003).
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await riskService.getAll({
          limit: 100,
          isActive: mode === 'edit' ? undefined : true,
        });
        setRisks(response.data);
      } catch (error) {
        toast.error('Failed to fetch risks');
      }
    };

    fetchRisks();
  }, [mode]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        await riskMitigationService.create(values);
        toast.success('Risk mitigation created successfully');
      } else if (mode === 'edit' && riskMitigation) {
        await riskMitigationService.update(riskMitigation.id, values);
        toast.success('Risk mitigation updated successfully');
      }
      
      navigate('/master/risk-mitigations');
    } catch (error: any) {
      const errorMessage = error.message || 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/master/risk-mitigations');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Risk Mitigation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="riskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={risks.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a risk"
                      searchPlaceholder="Search risk..."
                    />
                  </FormControl>
                  <FormDescription>
                    Select the risk for which this mitigation applies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eliminate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eliminate</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter eliminate control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe measures to eliminate the risk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transfer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter transfer control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe measures to transfer the risk (e.g., insurance, outsourcing)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reduce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reduce</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reduce control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe measures to reduce the risk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accept</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter accept control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe when and how to accept the risk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Set whether this mitigation is currently active
                    </FormDescription>
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

            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RiskMitigationForm;
