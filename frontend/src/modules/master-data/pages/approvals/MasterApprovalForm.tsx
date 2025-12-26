import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import masterApprovalService from '../../services/masterApprovalService';
import { CreateMasterApprovalDTO, UpdateMasterApprovalDTO } from '../../types/master-data.types';
import { MasterApproval } from '@/core/lib/types';
import jobPositionService from '../../services/jobPositionService';
import departmentService from '../../services/departmentService';

const formSchema = z.object({
  entity: z.string().min(1, 'Entity is required'),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    jobPositionId: z.string().min(1, 'Job Position is required'),
    departmentId: z.string().min(1, 'Department is required'),
    order: z.number().default(1),
  })).min(1, 'At least one approval item is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface MasterApprovalFormProps {
  approval?: MasterApproval;
  mode: 'create' | 'edit';
}

const MasterApprovalForm = ({ approval, mode }: MasterApprovalFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [jobPositions, setJobPositions] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity: '',
      isActive: true,
      items: [{ jobPositionId: '', departmentId: '', order: 1 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Convert data to SearchableSelectOption format
  const jobPositionOptions: SearchableSelectOption[] = jobPositions.map(position => ({
    value: position.id,
    label: position.name,
  }));

  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        setDataReady(false);

        const [positionsRes, deptsRes] = await Promise.all([
          jobPositionService.getAll({ page: 1, limit: 100 }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
        ]);

        setJobPositions(positionsRes.data || []);
        setDepartments(deptsRes.data || []);

        if (approval) {
          form.reset({
            entity: approval.entity,
            isActive: approval.isActive,
            items: approval.items.map(item => ({
              jobPositionId: item.job_position_id,
              departmentId: item.department_id,
              order: item.order,
            })),
          });
        }

        // Set data ready only after everything is loaded
        setDataReady(true);
      } catch (error) {
        console.error('Failed to fetch options:', error);
        toast.error('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [approval, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        const createData: CreateMasterApprovalDTO = {
          entity: data.entity,
          isActive: data.isActive,
          items: data.items.map((item, index) => ({
            order: item.order || index + 1,
            jobPositionId: item.jobPositionId,
            departmentId: item.departmentId,
          })),
        };
        await masterApprovalService.create(createData);
        toast.success('Master approval created successfully');
      } else if (approval) {
        const updateData: UpdateMasterApprovalDTO = {
          entity: data.entity,
          isActive: data.isActive,
          items: data.items.map((item, index) => ({
            order: item.order || index + 1,
            jobPositionId: item.jobPositionId,
            departmentId: item.departmentId,
          })),
        };
        await masterApprovalService.update(approval.id, updateData);
        toast.success('Master approval updated successfully');
      }
      navigate('/master/approvals');
    } catch (error) {
      console.error('Failed to save approval:', error);
      toast.error(`Failed to ${mode} master approval`);
    } finally {
      setIsLoading(false);
    }
  };

  const moveItem = (from: number, to: number) => {
    move(from, to);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <span>Loading form options...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Master Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="entity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter entity name" {...field} />
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
                      Enable or disable this approval flow
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Approval Flow</h3>
                <Button
                  type="button"
                  onClick={() => append({ jobPositionId: '', departmentId: '', order: fields.length + 1 })}
                  disabled={!dataReady}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Step
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="mt-2 cursor-move">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.jobPositionId`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Job Position</FormLabel>
                              <FormControl>
                                {dataReady && (
                                  <SearchableSelect
                                    options={jobPositionOptions}
                                    value={field.value}
                                    onValueChange={(value) => form.setValue(`items.${index}.jobPositionId`, value)}
                                    placeholder="Select job position"
                                    searchPlaceholder="Search job position..."
                                    emptyText="No job position found."
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.departmentId`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                {dataReady && (
                                  <SearchableSelect
                                    options={departmentOptions}
                                    value={field.value}
                                    onValueChange={(value) => form.setValue(`items.${index}.departmentId`, value)}
                                    placeholder="Select department"
                                    searchPlaceholder="Search department..."
                                    emptyText="No department found."
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-2"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/approvals')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !dataReady}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MasterApprovalForm; 