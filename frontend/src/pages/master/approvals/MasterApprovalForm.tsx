import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import masterApprovalService, { CreateMasterApprovalDTO } from '@/services/masterApprovalService';
import { MasterApproval } from '@/lib/types';
import jobPositionService from '@/services/jobPositionService';
import departmentService from '@/services/departmentService';
import userService from '@/services/userService';

const formSchema = z.object({
  entity: z.string().min(1, 'Entity is required'),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    job_position_id: z.string().min(1, 'Job Position is required'),
    department_id: z.string().min(1, 'Department is required'),
    createdBy: z.string().min(1, 'Creator is required'),
    order: z.number().optional(),
  })).min(1, 'At least one approval item is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface MasterApprovalFormProps {
  approval?: MasterApproval;
  mode: 'create' | 'edit';
}

const MasterApprovalForm = ({ approval, mode }: MasterApprovalFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [jobPositions, setJobPositions] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity: '',
      isActive: true,
      items: [{ job_position_id: '', department_id: '', createdBy: '', order: 1 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [positionsRes, deptsRes, usersRes] = await Promise.all([
          jobPositionService.getAll({ page: 1, limit: 100 }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          userService.getUsers({ page: 1, limit: 100 }),
        ]);

        setJobPositions(positionsRes.data);
        setDepartments(deptsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to fetch options:', error);
        toast.error('Failed to load form options');
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (approval) {
      form.reset({
        entity: approval.entity,
        isActive: approval.isActive,
        items: approval.items.map(item => ({
          job_position_id: item.job_position_id,
          department_id: item.department_id,
          createdBy: item.createdBy,
          order: item.order,
        })),
      });
    }
  }, [approval, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        await masterApprovalService.create(data);
        toast.success('Master approval created successfully');
      } else if (approval) {
        await masterApprovalService.update(approval.id, data);
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
                  onClick={() => append({ job_position_id: '', department_id: '', createdBy: '', order: fields.length + 1 })}
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.job_position_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Position</FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={jobPositions.map(position => ({
                                    value: position.id,
                                    label: position.name,
                                  }))}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select job position"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.department_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={departments.map(dept => ({
                                    value: dept.id,
                                    label: dept.name,
                                  }))}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select department"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.createdBy`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Creator</FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={users.map(user => ({
                                    value: user.id,
                                    label: user.name,
                                  }))}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select creator"
                                />
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

export default MasterApprovalForm; 