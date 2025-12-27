import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { Textarea } from '@/core/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';

import { CreateInspectionItemDTO } from '../types/inspection.types';
import { riskCategoryService, riskService } from '@/modules/master-data';
import { RiskCategory, Risk } from '@/core/lib/types';
import { userService } from '@/modules/users';
import { User } from '@/core/lib/types';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/core/lib/types';

// Form schema for validation
const formSchema = z.object({
  riskCategoryId: z.string().min(1, 'Risk Category is required'),
  riskId: z.string().min(1, 'Risk is required'),
  assignedDepartmentId: z.string().min(1, 'Assigned Department is required'),
  assigneeId: z.string().optional(),
  followUpNotes: z.string().optional(),
  order: z.coerce.number().min(0, 'Order must be 0 or greater').default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface InspectionItemFormProps {
  inspectionId?: string;
  initialItem?: Partial<CreateInspectionItemDTO>;
  onSubmit?: (item: CreateInspectionItemDTO) => void;
  onCancel?: () => void;
  showCard?: boolean;
}

const InspectionItemForm = ({ inspectionId, initialItem, onSubmit, onCancel, showCard = true }: InspectionItemFormProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);

  // Convert data to ModalComboboxOption format
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
    label: `${user.firstName} ${user.lastName}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskCategoryId: initialItem?.riskCategoryId || '',
      riskId: initialItem?.riskId || '',
      assignedDepartmentId: initialItem?.assignedDepartmentId || '',
      assigneeId: initialItem?.assigneeId || '',
      followUpNotes: initialItem?.followUpNotes || '',
      order: initialItem?.order || 0,
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [riskCategoriesResponse, risksResponse, departmentsResponse, usersResponse] = await Promise.all([
          riskCategoryService.getAll({ page: 1, limit: 1000, isActive: true }),
          riskService.getAll({ page: 1, limit: 1000, isActive: true }),
          departmentService.getDepartments({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: 'true' }
          }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);
        setRiskCategories(riskCategoriesResponse.data);
        setRisks(risksResponse.data);
        setDepartments(departmentsResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        toast.error('Failed to load reference data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter risks based on selected risk category
  const selectedRiskCategoryId = form.watch('riskCategoryId');
  const filteredRiskOptions = selectedRiskCategoryId
    ? riskOptions.filter(option => {
        const risk = risks.find(r => r.id === option.value);
        return risk?.riskCategoryId === selectedRiskCategoryId;
      })
    : riskOptions;

  const handleSubmit = async (data: FormValues) => {
    if (!onSubmit) return;

    try {
      setIsSubmitting(true);
      const itemData: CreateInspectionItemDTO = {
        riskCategoryId: data.riskCategoryId,
        riskId: data.riskId,
        assignedDepartmentId: data.assignedDepartmentId,
        assigneeId: data.assigneeId || undefined,
        followUpNotes: data.followUpNotes || undefined,
        order: data.order,
      };
      await onSubmit(itemData);
    } catch (error) {
      console.error('Failed to submit inspection item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear risk when category changes
                      form.setValue('riskId', '');
                    }}
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
                    options={filteredRiskOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={selectedRiskCategoryId ? "Select risk" : "Select risk category first"}
                    searchPlaceholder="Search risk..."
                    emptyText={selectedRiskCategoryId ? "No risks found" : "Please select a risk category first"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

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

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <input
                  type="number"
                  min="0"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{initialItem ? 'Edit' : 'Add'} Inspection Item</CardTitle>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
};

export default InspectionItemForm;

