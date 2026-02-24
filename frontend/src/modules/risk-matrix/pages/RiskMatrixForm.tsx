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
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import riskMatrixService from '../services/riskMatrixService';
import { CreateRiskMatrixDTO, UpdateRiskMatrixDTO, RiskMatrix, RiskRatingEnum } from '../types/risk-matrix.types';

const formSchema = z.object({
  likelihoodLevel: z.string().min(1, 'Likelihood level is required').max(2, 'Likelihood level must be 1-2 characters'),
  likelihoodName: z.string().min(1, 'Likelihood name is required'),
  likelihoodDesc: z.string().min(1, 'Likelihood description is required'),
  consequenceLevel: z.number().min(1).max(99),
  consequenceName: z.string().min(1, 'Consequence name is required'),
  consequenceDesc: z.string().min(1, 'Consequence description is required'),
  interpretation: z.nativeEnum(RiskRatingEnum),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskMatrixFormProps {
  riskMatrix?: RiskMatrix;
  mode: 'create' | 'edit';
}

const RiskMatrixForm = ({ riskMatrix, mode }: RiskMatrixFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      likelihoodLevel: 'A',
      likelihoodName: '',
      likelihoodDesc: '',
      consequenceLevel: 1,
      consequenceName: '',
      consequenceDesc: '',
      interpretation: RiskRatingEnum.LOW,
      isActive: true,
    },
  });

  useEffect(() => {
    if (riskMatrix && mode === 'edit') {
      form.reset({
        likelihoodLevel: riskMatrix.likelihoodLevel,
        likelihoodName: riskMatrix.likelihoodName,
        likelihoodDesc: riskMatrix.likelihoodDesc,
        consequenceLevel: riskMatrix.consequenceLevel,
        consequenceName: riskMatrix.consequenceName,
        consequenceDesc: riskMatrix.consequenceDesc,
        interpretation: riskMatrix.interpretation,
        isActive: riskMatrix.isActive,
      });
    }
    setIsLoadingData(false);
  }, [riskMatrix, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        await riskMatrixService.createRiskMatrix(data as CreateRiskMatrixDTO);
        toast.success('Risk matrix entry created successfully');
      } else if (riskMatrix) {
        await riskMatrixService.updateRiskMatrix(riskMatrix.id, data as UpdateRiskMatrixDTO);
        toast.success('Risk matrix entry updated successfully');
      }
      navigate('/risk-matrix');
    } catch (error) {
      console.error('Error saving risk matrix:', error);
      toast.error(`Failed to ${mode} risk matrix entry`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <span>Loading risk matrix details...</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Risk Matrix Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Likelihood Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Likelihood Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="likelihoodLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Likelihood Level</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="A-Z, AA-ZZ"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            // Only allow up to 2 characters
                            if (value.length > 2) return;
                            // Validate: allow empty, single letter (A-Z), or two letters (AA-ZZ)
                            if (value && !/^[A-Z]{1,2}$/.test(value)) return;
                            field.onChange(value);
                          }}
                          maxLength={2}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="likelihoodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Likelihood Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Most likely" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="likelihoodDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Likelihood Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., occur more than one time in a week of the work cycle"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consequence Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Consequence Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="consequenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consequence Level</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="1-99"
                          value={field.value?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow up to 2 digits
                            if (value.length > 2) return;
                            // Validate: allow empty, single digit (1-9), or two digits (10-99)
                            if (value && !/^([1-9]|[1-9][0-9])$/.test(value)) return;
                            field.onChange(value ? parseInt(value, 10) : undefined);
                          }}
                          maxLength={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consequenceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consequence Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Extreme" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="consequenceDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consequence Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Incidents that could result in death or permanent disability"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Risk Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="interpretation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Rating</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as RiskRatingEnum)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RiskRatingEnum.LOW}>Low</SelectItem>
                        <SelectItem value={RiskRatingEnum.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={RiskRatingEnum.HIGH}>High</SelectItem>
                        <SelectItem value={RiskRatingEnum.EXTREME}>Extreme</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/risk-matrix')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixForm;
