import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';

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
import roleService from '@/modules/roles/services/roleService';
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

// Base form schema
const baseFormSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  assessmentDate: z.string().min(1, 'Assessment Date is required'),
  status: z.nativeEnum(GeneralStatusEnum),
  isActive: z.boolean().default(true),
  assigneeId: z.string().optional(),
}).refine((data) => {
  // If assessment date is in the past, status cannot be SCHEDULED
  if (data.assessmentDate && data.status === GeneralStatusEnum.SCHEDULED) {
    const assessmentDate = new Date(data.assessmentDate);
    const today = new Date();
    // Set time to midnight for date-only comparison
    today.setHours(0, 0, 0, 0);
    assessmentDate.setHours(0, 0, 0, 0);
    
    // If assessment date is less than today (in the past)
    if (assessmentDate < today) {
      return false;
    }
  }
  return true;
}, {
  message: 'Status cannot be set to Scheduled if the assessment date is in the past',
  path: ['status'],
});

interface RiskAssessmentFormProps {
  assessment?: RiskAssessment;
  mode: 'create' | 'edit';
}

const RiskAssessmentForm = ({ assessment, mode }: RiskAssessmentFormProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Convert data to SearchableSelectOption format
  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const userOptions: SearchableSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  // Filter status options based on user role
  // Hide WAITING_APPROVAL and REJECTED for all users
  // Hide DONE for non-SUPER_ADMIN users (unless it's the current status when editing)
  const currentStatus = assessment?.status;
  const availableStatusOptions = GENERAL_STATUS_OPTIONS.filter(option => {
    if (option.value === GeneralStatusEnum.WAITING_APPROVAL || 
        option.value === GeneralStatusEnum.REJECTED) {
      return false; // Hide for all users
    }
    if (option.value === GeneralStatusEnum.DONE && !isSuperAdmin) {
      // Allow DONE if it's the current status (for editing existing assessments)
      // This allows non-SUPER_ADMIN users to see the current DONE status
      // but they won't be able to select it again if they change it
      if (mode === 'edit' && currentStatus === GeneralStatusEnum.DONE) {
        return true; // Show DONE if editing and it's the current status
      }
      return false; // Hide DONE for non-SUPER_ADMIN users
    }
    return true;
  });

  type FormValues = z.infer<typeof baseFormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(baseFormSchema),
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

  // Fetch current user's role code
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (!currentUser?.id) return;
      
      try {
        // Get full user profile which includes roleId
        const response = await api.get('/users/me');
        const userData = response.data;
        
        let roleCode: string | null = null;
        
        // Try to get role code from the role object in the response
        if (userData.role && typeof userData.role === 'object') {
          if ('code' in userData.role) {
            roleCode = userData.role.code;
          }
        }
        
        // If role code is not directly available, fetch it using roleId
        if (!roleCode && userData.roleId) {
          try {
            const role = await roleService.getRoleById(userData.roleId);
            roleCode = role.code;
          } catch (roleError) {
            console.error('Failed to fetch role by ID:', roleError);
          }
        }
        
        setIsSuperAdmin(roleCode === 'SUPER_ADMIN');
      } catch (error) {
        console.error('Failed to fetch current user role:', error);
        // Default to not super admin if fetch fails
        setIsSuperAdmin(false);
      }
    };

    fetchCurrentUserRole();
  }, [currentUser]);

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
    // Additional validation: Only SUPER_ADMIN can set status to DONE
    if (data.status === GeneralStatusEnum.DONE && !isSuperAdmin) {
      toast.error('Only Super Admin can set status to Done');
      form.setError('status', {
        type: 'manual',
        message: 'Only Super Admin can set status to Done',
      });
      return;
    }

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
        navigate('/risk-assessment');
      } else if (assessment) {
        await riskAssessmentService.update(assessment.id, assessmentData);
        toast.success('Risk assessment updated successfully');
        navigate(`/risk-assessment/${assessment.id}`);
      }
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
                          {availableStatusOptions.map((option) => (
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

