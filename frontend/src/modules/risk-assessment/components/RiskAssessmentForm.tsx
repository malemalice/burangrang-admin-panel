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
import { Switch } from '@/core/components/ui/switch';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';

import { RiskAssessment, Department, User } from '@/core/lib/types';
import riskAssessmentService, { type CreateRiskAssessmentDTO } from '../services/riskAssessmentService';
import { departmentService } from '@/modules/master-data';
import { userService } from '@/modules/users';
import { GENERAL_STATUS_OPTIONS, GeneralStatusEnum } from '@/shared/constants/general-status.enum';

// Generate assessment code: RA + YYMMDDHHmmss (includes seconds for uniqueness)
const generateAssessmentCode = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `RA${year}${month}${date}${hour}${minute}${second}`;
};

// Form schema for validation
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  assessmentDate: z.string().min(1, 'Assessment Date is required'),
  status: z.nativeEnum(GeneralStatusEnum),
  isActive: z.boolean().default(true),
  assigneeId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskAssessmentFormProps {
  assessment?: RiskAssessment;
  mode: 'create' | 'edit';
}

const RiskAssessmentForm = ({ assessment, mode }: RiskAssessmentFormProps) => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert data to SearchableSelectOption format
  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const userOptions: SearchableSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: mode === 'create' ? generateAssessmentCode() : '',
      description: '',
      departmentId: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      status: GeneralStatusEnum.DRAFT,
      isActive: true,
      assigneeId: '',
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [departmentsResponse, usersResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 1000 }),
          userService.getAll({ page: 1, limit: 1000 }),
        ]);

        setDepartments(departmentsResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        toast.error('Failed to load reference data');
      } finally {
        setIsLoading(false);
        setDataReady(true);
      }
    };

    fetchData();
  }, []);

  // Set form values if editing
  useEffect(() => {
    if (assessment && mode === 'edit' && dataReady) {
      form.reset({
        code: assessment.code,
        description: assessment.description || '',
        departmentId: assessment.departmentId,
        assessmentDate: assessment.assessmentDate
          ? new Date(assessment.assessmentDate).toISOString().split('T')[0]
          : undefined,
        status: assessment.status,
        isActive: assessment.isActive,
        assigneeId: assessment.assigneeId,
      });
    }
  }, [assessment, mode, dataReady, form]);


  const onSubmit = async (data: FormValues) => {
    try {
      // Transform the date if provided
      // Form validation ensures required fields are present
      const assessmentData: CreateRiskAssessmentDTO = {
        code: data.code as string,
        description: data.description,
        departmentId: data.departmentId as string,
        status: data.status,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
        // createdBy is set automatically by backend from authenticated user
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.assigneeId && { assigneeId: data.assigneeId }),
      };

      if (mode === 'create') {
        await riskAssessmentService.create(assessmentData);
        toast.success('Risk assessment created successfully');
      } else if (assessment) {
        await riskAssessmentService.update(assessment.id, assessmentData);
        toast.success('Risk assessment updated successfully');
      }
      navigate('/risk-assessment');
    } catch (error: any) {
      // Extract error message from API response
      let errorMessage = `Failed to ${mode} risk assessment`;
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Risk Assessment</CardTitle>
        <CardDescription>
          Enter the details for the risk assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assessment Code <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assessment code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Department <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={departmentOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a department"
                          searchPlaceholder="Search department..."
                        />
                      </FormControl>
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
                        placeholder="Enter assessment description" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assessmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assessment Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENERAL_STATUS_OPTIONS.map((option) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select an assignee"
                          searchPlaceholder="Search user..."
                          includeNone
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
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
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/risk-assessment')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentForm;

