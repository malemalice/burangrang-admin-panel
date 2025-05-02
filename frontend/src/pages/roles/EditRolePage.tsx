import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import roleService, { UpdateRoleDTO } from '@/services/roleService';
import { Permission, Role } from '@/lib/types';

const EditRolePage = () => {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateRoleDTO & { id?: string }>({
    name: '',
    description: '',
    permissionIds: [],
    isActive: true,
  });

  // Fetch role data and permissions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!roleId) {
          throw new Error('Role ID is required');
        }
        
        // Fetch role and permissions in parallel
        const [role, permissions] = await Promise.all([
          roleService.getRoleById(roleId),
          roleService.getPermissions()
        ]);
        
        setPermissions(permissions);
        
        // Set form data from role
        setFormData({
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          permissionIds: role.permissions.map(p => p.id),
        });
      } catch (error: any) {
        console.error('Failed to fetch role data:', error);
        const errorMessage = error.message || 'Failed to load role data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsLoadingPermissions(false);
      }
    };

    fetchData();
  }, [roleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => {
      const updatedPermissionIds = checked
        ? [...(prev.permissionIds || []), permissionId]
        : (prev.permissionIds || []).filter(id => id !== permissionId);
      
      return { ...prev, permissionIds: updatedPermissionIds };
    });
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, isActive: value === 'active' }));
  };

  const validateForm = (): boolean => {
    // Basic form validation
    if (!formData.name?.trim()) {
      setError('Role name is required');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleId) {
      const errorMsg = 'Role ID is required';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Call the API to update the role
      await roleService.updateRole(roleId, {
        name: formData.name,
        description: formData.description,
        permissionIds: formData.permissionIds,
        isActive: formData.isActive,
      });
      
      // Show success message
      toast.success('Role updated successfully!');
      
      // Navigate back to roles list
      navigate('/roles');
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.message || 'Failed to update role. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Role"
        subtitle={`Edit role details for ${formData.name}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/roles')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
          </Button>
        }
      />

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Update the role's details and permissions.</CardDescription>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Admin"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Role description and responsibilities"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {isLoadingPermissions ? (
                    <div className="flex justify-center py-4">
                      <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  ) : permissions.length === 0 ? (
                    <p className="text-sm text-gray-500">No permissions available.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={(formData.permissionIds || []).includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked === true)
                            }
                          />
                          <div className="space-y-1">
                            <Label
                              htmlFor={`permission-${permission.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/roles')}
              disabled={isLoading || isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSaving || isLoadingPermissions}>
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default EditRolePage; 