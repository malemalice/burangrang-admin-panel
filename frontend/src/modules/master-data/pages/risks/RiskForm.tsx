import { useCallback, useEffect, useState } from 'react';
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
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { riskService, riskCategoryService } from '@/modules/master-data';
import { createRiskCategoryFromQuery } from '@/modules/master-data/pages/risk-categories';
import { Risk, RiskCategory } from '@/core/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  riskCategoryId: z.string().min(1, 'Risk Category is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskFormProps {
  risk?: Risk;
  mode: 'create' | 'edit';
}

const RiskForm = ({ risk, mode }: RiskFormProps) => {
  const navigate = useNavigate();
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      riskCategoryId: '',
      isActive: true,
    },
  });

  const ensureSelectedCategoryInList = useCallback(
    async (
      items: RiskCategory[],
      selectedId: string | undefined
    ): Promise<RiskCategory[]> => {
      if (!selectedId) return items;
      if (items.some((c) => c.id === selectedId)) return items;
      try {
        const selected = await riskCategoryService.getById(selectedId);
        return [selected, ...items];
      } catch {
        return items;
      }
    },
    []
  );

  const handleSearchRiskCategories = useCallback(
    async (searchQuery: string) => {
      setIsLoadingRiskCategories(true);
      try {
        const query = searchQuery.trim();
        const limit = query ? 20 : 100;
        const response = await riskCategoryService.getAll({
          page: 1,
          limit,
          isActive: mode === 'edit' ? undefined : true,
          search: query || undefined,
          options: true,
        });
        const selectedId = form.getValues('riskCategoryId');
        const withSelected = await ensureSelectedCategoryInList(
          response.data,
          selectedId
        );
        setRiskCategories(withSelected);
      } catch (error) {
        console.error('Failed to search risk categories:', error);
        toast.error('Failed to search risk categories');
      } finally {
        setIsLoadingRiskCategories(false);
      }
    },
    [form, mode, ensureSelectedCategoryInList]
  );

  // Load categories on mount so dropdown has options and edit mode shows selected label
  useEffect(() => {
    handleSearchRiskCategories('');
  }, [handleSearchRiskCategories]);

  // Set form values when editing an existing risk (MDR-006, MDR-007: ensure riskCategoryId is set)
  useEffect(() => {
    if (risk) {
      form.reset({
        name: risk.name,
        code: risk.code,
        description: risk.description || '',
        riskCategoryId: risk.riskCategoryId || risk.riskCategory?.id || '',
        isActive: risk.isActive,
      });
      // Reload categories so selected category is in the list and "create new" works in edit mode
      handleSearchRiskCategories('');
    }
  }, [risk, form, handleSearchRiskCategories]);

  const handleCreateNewRiskCategory = useCallback(async (searchQuery: string): Promise<string> => {
    return createRiskCategoryFromQuery(searchQuery, (newCategory) => {
      setRiskCategories((prev) => [newCategory, ...prev]);
      form.setValue('riskCategoryId', newCategory.id);
    });
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'create') {
        await riskService.create(data);
        toast.success('Risk created successfully');
      } else {
        await riskService.update(risk!.id, data);
        toast.success('Risk updated successfully');
      }
      navigate('/master/risks');
    } catch (error) {
      console.error('Error saving risk:', error);
      toast.error(`Failed to ${mode} risk`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Risk</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="riskCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Category <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={riskCategories.map((c) => ({ value: c.id, label: c.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a risk category"
                      searchPlaceholder="Search risk category..."
                      onSearch={handleSearchRiskCategories}
                      isLoading={isLoadingRiskCategories}
                      onCreateNew={handleCreateNewRiskCategory}
                      createNewText="Create new risk category"
                    />
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
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter risk name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter risk code" {...field} />
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
                      placeholder="Enter risk description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-gray-500">
                      Enable or disable this risk
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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/risks')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RiskForm;
