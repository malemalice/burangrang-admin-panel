import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RoleService, Permission } from '@/services/role.service';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const roleService = new RoleService();

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialData?: RoleFormData;
  onSubmit: (data: RoleFormData) => Promise<void>;
}

export function RoleForm({ initialData, onSubmit }: RoleFormProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [defaultPermissions, setDefaultPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingPermissions(true);
        console.log('Fetching permissions and default permissions...');
        
        // Fetch permissions and default permissions in parallel
        const [permissionsData, defaultPerms] = await Promise.all([
          roleService.getPermissions(),
          roleService.getDefaultPermissions(),
        ]);
        
        console.log('Permissions data:', permissionsData);
        console.log('Default permissions:', defaultPerms);
        
        setPermissions(permissionsData);
        setDefaultPermissions(defaultPerms);

        // If this is a new role, automatically check default permissions
        if (!initialData) {
          // Map default permissions to their full names
          const defaultPermissionNames = permissionsData
            .filter(permission => defaultPerms.includes(permission.name))
            .map(permission => roleService.formatPermissionName(permission));
          
          console.log('Setting default permission names:', defaultPermissionNames);
          setValue('permissions', defaultPermissionNames);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load permissions. Please try again.');
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchData();
  }, [initialData, setValue]);

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    const currentPermissions = watch('permissions');
    const permissionName = roleService.formatPermissionName(permission);
    
    // Don't allow changing default permissions
    if (defaultPermissions.includes(permission.name)) {
      console.log('Cannot change default permission:', permission.name);
      return;
    }
    
    const newPermissions = checked
      ? [...currentPermissions, permissionName]
      : currentPermissions.filter((p) => p !== permissionName);
    
    setValue('permissions', newPermissions);
  };

  const onSubmitForm = async (data: RoleFormData) => {
    try {
      setIsLoading(true);
      // Ensure default permissions are included
      const defaultPermissionNames = permissions
        .filter(permission => defaultPermissions.includes(permission.name))
        .map(permission => roleService.formatPermissionName(permission));
      
      const allPermissions = [...new Set([...defaultPermissionNames, ...data.permissions])];
      console.log('Submitting permissions:', allPermissions);
      await onSubmit({ ...data, permissions: allPermissions });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save role');
    } finally {
      setIsLoading(false);
    }
  };

  const isDefaultPermission = (permission: Permission) => {
    const isDefault = defaultPermissions.includes(permission.name);
    console.log('Checking if permission is default:', permission.name, isDefault);
    return isDefault;
  };

  const groupPermissionsByModule = () => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
    });
    return groups;
  };

  if (isLoadingPermissions) {
    return <div className="text-center py-4">Loading permissions...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            {...register('name')}
            className="mt-1"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            {...register('description')}
            className="mt-1"
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Permissions</label>
          <div className="space-y-4">
            {Object.entries(groupPermissionsByModule()).map(([module, modulePermissions]) => (
              <div key={module} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 capitalize">{module}</h4>
                <div className="space-y-2 pl-4">
                  {modulePermissions.map((permission) => {
                    const permissionName = roleService.formatPermissionName(permission);
                    const isDefault = isDefaultPermission(permission);
                    return (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={watch('permissions').includes(permissionName)}
                          onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                          disabled={isDefault}
                        />
                        <label
                          htmlFor={permission.id}
                          className={`text-sm flex items-center space-x-2 ${
                            isDefault ? 'text-gray-400' : ''
                          }`}
                        >
                          <span>{permission.action}</span>
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={watch('isActive')}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Role'}
      </Button>
    </form>
  );
} 