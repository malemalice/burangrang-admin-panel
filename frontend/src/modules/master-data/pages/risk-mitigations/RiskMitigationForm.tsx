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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { riskMitigationService, riskService } from '@/modules/master-data';
import { RiskMitigation, Risk } from '@/core/lib/types';

// Define form schema
const formSchema = z.object({
  level: z.coerce.number().min(1).max(5),
  mitigationDescription: z.string().min(1, "Description is required"),
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
      level: riskMitigation?.level || 1,
      mitigationDescription: riskMitigation?.mitigationDescription || '',
      riskId: riskMitigation?.riskId || '',
      isActive: riskMitigation?.isActive !== undefined ? riskMitigation.isActive : true,
    },
  });

  // Fetch risks for dropdown
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await riskService.getAll({ limit: 100, isActive: true });
        setRisks(response.data);
      } catch (error) {
        toast.error('Failed to fetch risks');
      }
    };

    fetchRisks();
  }, []);

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
                  <FormLabel>Risk</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a risk" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {risks.map((risk) => (
                        <SelectItem key={risk.id} value={risk.id}>
                          {risk.name} ({risk.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the risk for which this mitigation applies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mitigation level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Level 1 (Lowest)</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                      <SelectItem value="5">Level 5 (Highest)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the level of the mitigation measure (1-5)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mitigationDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter mitigation description"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the mitigation measure in detail
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
