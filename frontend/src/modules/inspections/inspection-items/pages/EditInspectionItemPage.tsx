import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Textarea } from '@/core/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';
import PageHeader from '@/core/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

import { InspectionItem, UpdateInspectionItemDTO } from '../types/inspection-item.types';
import inspectionItemsService from '../services/inspectionItemsService';
import { riskCategoryService, riskService, departmentService } from '@/modules/master-data';
import { RiskCategory, Risk, Department } from '@/core/lib/types';
import userService from '@/modules/users/services/userService';
import { User } from '@/core/lib/types';
import { GeneralStatusEnum, INSPECTION_ITEM_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';

const formSchema = z.object({
  riskCategoryId: z.string().min(1, 'Risk Category is required'),
  riskId: z.string().min(1, 'Risk is required'),
  assignedDepartmentId: z.string().min(1, 'Assigned Department is required'),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  followUpNotes: z.string().optional(),
  status: z.nativeEnum(GeneralStatusEnum),
});

type FormValues = z.infer<typeof formSchema>;

const EditInspectionItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InspectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskCategoryId: '',
      riskId: '',
      assignedDepartmentId: '',
      assigneeId: undefined,
      description: '',
      followUpNotes: '',
      status: GeneralStatusEnum.OPEN,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const [itemData, deptsRes, usersRes, riskCategoriesRes] = await Promise.all([
          inspectionItemsService.getById(id),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          userService.getUsers({ page: 1, limit: 100 }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true }),
        ]);

        setItem(itemData);
        setDepartments(deptsRes.data);
        setUsers(usersRes.data);
        setRiskCategories(riskCategoriesRes.data);

        // Load risks for the selected risk category
        if (itemData.riskCategoryId) {
          await loadRisks(itemData.riskCategoryId);
        }

        // Set form values
        form.reset({
          riskCategoryId: itemData.riskCategoryId,
          riskId: itemData.riskId,
          assignedDepartmentId: itemData.assignedDepartmentId,
          assigneeId: itemData.assigneeId || undefined,
          description: itemData.description || '',
          followUpNotes: itemData.followUpNotes || '',
          status: itemData.status,
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load inspection item');
        navigate('/inspections/items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, form]);

  const loadRisks = async (riskCategoryId: string) => {
    try {
      setIsLoadingRisks(true);
      const response = await riskService.getAll({
        page: 1,
        limit: 100,
        isActive: true,
        riskCategoryId,
      });
      setRisks(response.data);
    } catch (error) {
      console.error('Failed to fetch risks:', error);
      toast.error('Failed to load risks');
    } finally {
      setIsLoadingRisks(false);
    }
  };

  const handleRiskCategoryChange = async (riskCategoryId: string) => {
    form.setValue('riskCategoryId', riskCategoryId);
    form.setValue('riskId', ''); // Reset risk selection
    await loadRisks(riskCategoryId);
  };

  const riskOptions: ModalComboboxOption[] = risks.map(risk => ({
    value: risk.id,
    label: `${risk.name}${risk.description ? ` - ${risk.description}` : ''}`
  }));

  const riskCategoryOptions: ModalComboboxOption[] = riskCategories.map(category => ({
    value: category.id,
    label: category.name
  }));

  const departmentOptions: ModalComboboxOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const userOptions: ModalComboboxOption[] = users.map(user => ({
    value: user.id,
    label: user.name || `${user.firstName} ${user.lastName}`
  }));

  const onSubmit = async (values: FormValues) => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      const updateData: UpdateInspectionItemDTO = {
        riskCategoryId: values.riskCategoryId,
        riskId: values.riskId,
        assignedDepartmentId: values.assignedDepartmentId,
        assigneeId: values.assigneeId || undefined,
        description: values.description || undefined,
        followUpNotes: values.followUpNotes || undefined,
        status: values.status,
      };

      await inspectionItemsService.update(id, updateData);
      toast.success('Inspection item updated successfully');
      navigate(`/inspections/items/${id}`);
    } catch (error) {
      console.error('Failed to update inspection item:', error);
      toast.error('Failed to update inspection item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Inspection Item"
        subtitle="Update inspection item information"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(`/inspections/items/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Details
        </Button>
      </PageHeader>

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Item Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="riskCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Risk Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={riskCategoryOptions}
                            value={field.value}
                            onValueChange={handleRiskCategoryChange}
                            placeholder="Select risk category"
                            searchPlaceholder="Search risk category..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Risk <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={riskOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={isLoadingRisks ? "Loading risks..." : "Select risk"}
                            searchPlaceholder="Search risk..."
                            disabled={isLoadingRisks || !form.watch('riskCategoryId')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedDepartmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Assigned Department <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={departmentOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select department"
                            searchPlaceholder="Search department..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={userOptions}
                            value={field.value || ''}
                            onValueChange={(value) => field.onChange(value || undefined)}
                            placeholder="Select assignee (optional)"
                            searchPlaceholder="Search user..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSPECTION_ITEM_STATUS_OPTIONS.map((option) => (
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter inspection item description (optional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUpNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter follow-up notes (optional)"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/inspections/items/${id}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EditInspectionItemPage;
