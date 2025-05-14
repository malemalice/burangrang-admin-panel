import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import userService, { CreateUserDTO, UpdateUserDTO } from '@/services/userService';
import roleService from '@/services/roleService';
import officeService from '@/services/officeService';
import departmentService from '@/services/departmentService';
import jobPositionService from '@/services/jobPositionService';
import { User, Role, Office, Department, JobPosition } from '@/lib/types';

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
        const [rolesResponse, officesResponse, departmentsResponse, jobPositionsResponse] = await Promise.all([
          roleService.getRoles({ page: 1, limit: 100 }),
          officeService.getOffices({ page: 1, limit: 100 }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          jobPositionService.getAll({ page: 1, limit: 100 })
        ]);

        setRoles(rolesResponse.data);
        setOffices(officesResponse.data);
        setDepartments(departmentsResponse.data);
        setJobPositions(jobPositionsResponse.data);

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
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || `Failed to ${mode} user`);
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
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="officeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an office" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {offices.map(office => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name}
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
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobPositionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {jobPositions.map(position => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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