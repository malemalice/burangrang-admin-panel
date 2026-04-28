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
  eliminationControl: z.string().optional(),
  substitutionControl: z.string().optional(),
  engineeringControl: z.string().optional(),
  administrationControl: z.string().optional(),
  personalProtectiveEquipment: z.string().optional(),
  transfer: z.string().optional(),
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
      eliminationControl: (riskMitigation as any)?.eliminationControl || '',
      substitutionControl: (riskMitigation as any)?.substitutionControl || '',
      engineeringControl: (riskMitigation as any)?.engineeringControl || '',
      administrationControl: (riskMitigation as any)?.administrationControl || '',
      personalProtectiveEquipment: (riskMitigation as any)?.personalProtectiveEquipment || '',
      transfer: riskMitigation?.transfer || '',
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
          options: true,
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
              name="eliminationControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Elimination Control</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter elimination control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe elimination control measures (control hierarchy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="substitutionControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Substitution Control</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter substitution control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe substitution control measures (control hierarchy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engineeringControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engineering Control</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter engineering control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe engineering control measures (control hierarchy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="administrationControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administration Control</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter administration control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe administration control measures (control hierarchy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalProtectiveEquipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Protective Equipment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter PPE control measure"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe PPE control measures (control hierarchy)
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
