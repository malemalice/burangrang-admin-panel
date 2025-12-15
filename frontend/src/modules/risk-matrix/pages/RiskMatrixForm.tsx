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
  likelihoodLevel: z.number().min(1).max(5),
  likelihoodName: z.string().min(1, 'Likelihood name is required'),
  likelihoodDesc: z.string().min(1, 'Likelihood description is required'),
  consequenceLevel: z.string().min(1, 'Consequence level is required'),
  consequenceName: z.string().min(1, 'Consequence name is required'),
  consequenceDesc: z.string().min(1, 'Consequence description is required'),
  risk_rating: z.nativeEnum(RiskRatingEnum),
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
      likelihoodLevel: 1,
      likelihoodName: '',
      likelihoodDesc: '',
      consequenceLevel: 'A',
      consequenceName: '',
      consequenceDesc: '',
      risk_rating: RiskRatingEnum.LOW,
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
        risk_rating: riskMatrix.riskRating,
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
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select likelihood level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Unlikely</SelectItem>
                          <SelectItem value="2">2 - Less likely to occur</SelectItem>
                          <SelectItem value="3">3 - Probably</SelectItem>
                          <SelectItem value="4">4 - Likely to occur</SelectItem>
                          <SelectItem value="5">5 - Most likely</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select consequence level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A - Insignificant</SelectItem>
                          <SelectItem value="B">B - Minor</SelectItem>
                          <SelectItem value="C">C - Moderate</SelectItem>
                          <SelectItem value="D">D - Major</SelectItem>
                          <SelectItem value="E">E - Extreme</SelectItem>
                        </SelectContent>
                      </Select>
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
                name="risk_rating"
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
