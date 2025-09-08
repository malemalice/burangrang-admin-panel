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
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import userService, { CreateUserDTO, UpdateUserDTO } from '@/services/userService';
import roleService from '@/services/roleService';
import officeService from '@/services/officeService';
import departmentService from '@/services/departmentService';
import jobPositionService from '@/services/jobPositionService';
import { User, Role, Office, Department, JobPosition } from '@/core/lib/types';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';

const formSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleId: z.string().min(1, 'Role is required'),
  officeId: z.string().min(1, 'Office is required'),
  departmentId: z.string().optional(),
  jobPositionId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user?: User;
  mode: 'create' | 'edit';
}

const UserForm = ({ user, mode }: UserFormProps) => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert data to SearchableSelectOption format
  const roleOptions: SearchableSelectOption[] = roles ? roles.map(role => ({
    value: role.id,
    label: role.name
  })) : [];

  const officeOptions: SearchableSelectOption[] = offices ? offices.map(office => ({
    value: office.id,
    label: office.name
  })) : [];

  const departmentOptions: SearchableSelectOption[] = departments ? departments.map(department => ({
    value: department.id,
    label: department.name
  })) : [];

  const jobPositionOptions: SearchableSelectOption[] = jobPositions ? jobPositions.map(position => ({
    value: position.id,
    label: position.name
  })) : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: mode === 'create' ? '' : undefined,
      firstName: '',
      lastName: '',
      roleId: '',
      officeId: '',
      departmentId: 'none',
      jobPositionId: 'none',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        setDataReady(false);
        
        const [rolesResponse, officesResponse, departmentsResponse, jobPositionsResponse] = await Promise.all([
          roleService.getRoles({ page: 1, limit: 100 }),
          officeService.getOffices({ page: 1, limit: 100 }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          jobPositionService.getAll({ page: 1, limit: 100 })
        ]);

        setRoles(rolesResponse.data || []);
        setOffices(officesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
        setJobPositions(jobPositionsResponse.data || []);

        if (user) {
          const { name, email, roleId, officeId, departmentId, jobPositionId, status } = user;
          const nameParts = name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');

          form.reset({
            email,
            firstName,
            lastName,
            roleId,
            officeId,
            departmentId: departmentId || 'none',
            jobPositionId: jobPositionId || 'none',
            isActive: status === 'active',
          });
        }
        
        // Set data ready only after everything is loaded
        setDataReady(true);
      } catch (error) {
        console.error('Error fetching form options:', error);
        toast.error('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [user, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        const userData: CreateUserDTO = {
          email: data.email,
          password: data.password as string,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          officeId: data.officeId,
          departmentId: data.departmentId === 'none' ? undefined : data.departmentId,
          jobPositionId: data.jobPositionId === 'none' ? undefined : data.jobPositionId,
        };
        await userService.createUser(userData);
        toast.success('User created successfully');
      } else if (user) {
        const userData: UpdateUserDTO = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          officeId: data.officeId,
          departmentId: data.departmentId === 'none' ? undefined : data.departmentId,
          jobPositionId: data.jobPositionId === 'none' ? undefined : data.jobPositionId,
          isActive: data.isActive,
        };
        
        // Only include password if it was provided
        if (data.password) {
          userData.password = data.password;
        }
        
        await userService.updateUser(user.id, userData);
        toast.success('User updated successfully');
      }
      navigate('/users');
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} user`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} User</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      {dataReady && (
                        <SearchableSelect
                          options={roleOptions}
                          value={field.value}
                          onValueChange={(value) => form.setValue("roleId", value)}
                          placeholder="Select role"
                          searchPlaceholder="Search role..."
                          emptyText="No role found."
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="officeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Office</FormLabel>
                    <FormControl>
                      {dataReady && (
                        <SearchableSelect
                          options={officeOptions}
                          value={field.value}
                          onValueChange={(value) => form.setValue("officeId", value)}
                          placeholder="Select office"
                          searchPlaceholder="Search office..."
                          emptyText="No office found."
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      {dataReady && (
                        <SearchableSelect
                          options={departmentOptions}
                          value={field.value}
                          onValueChange={(value) => form.setValue("departmentId", value)}
                          placeholder="Select department"
                          searchPlaceholder="Search department..."
                          emptyText="No department found."
                          includeNone={true}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobPositionId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Job Position</FormLabel>
                    <FormControl>
                      {dataReady && (
                        <SearchableSelect
                          options={jobPositionOptions}
                          value={field.value}
                          onValueChange={(value) => form.setValue("jobPositionId", value)}
                          placeholder="Select job position"
                          searchPlaceholder="Search job position..."
                          emptyText="No job position found."
                          includeNone={true}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-gray-500">
                        Disable to prevent user from logging in
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
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
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

export default UserForm; 