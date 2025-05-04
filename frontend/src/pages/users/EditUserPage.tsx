import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import userService, { UpdateUserDTO, UserDTO } from '@/services/userService';
import roleService from '@/services/roleService';
import officeService from '@/services/officeService';
import { Role, Office } from '@/lib/types';

const EditUserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [formData, setFormData] = useState<UpdateUserDTO>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    officeId: '',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch user data, roles, and offices
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoadingData(true);
      try {
        // Fetch user data, roles, and offices in parallel
        const [userResponse, rolesResponse, officesResponse] = await Promise.all([
          userService.getUserById(id),
          roleService.getRoles({ page: 1, pageSize: 100 }),
          officeService.getOffices({ page: 1, pageSize: 100 })
        ]);

        if (!userResponse || !rolesResponse.data || !officesResponse.data) {
          throw new Error('Failed to load required data');
        }

        // Set form data from user response
        const [firstName, lastName] = userResponse.name.split(' ');
        setFormData({
          email: userResponse.email,
          firstName,
          lastName,
          roleId: userResponse.roleId,
          officeId: userResponse.officeId || '',
          isActive: userResponse.status === 'active',
        });

        // Set roles and offices
        setRoles(rolesResponse.data);
        setOffices(officesResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load user data');
        setError('Failed to load user data. Please try again.');
        navigate('/users');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: keyof UpdateUserDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const validateForm = (): boolean => {
    // Basic form validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    
    if (!formData.roleId) {
      setError('Role is required');
      return false;
    }
    
    if (!formData.officeId) {
      setError('Office is required');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to update the user
      await userService.updateUser(id, formData);
      
      // Show success message
      toast.success('User updated successfully!');
      
      // Navigate back to users list
      navigate('/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      // Display a single error message from the API or a generic message
      const errorMessage = error.message || 'Failed to update user. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit User"
        subtitle="Update user information"
        actions={
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
        }
      />

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the user's details.</CardDescription>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="roleId">Role</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => handleSelectChange('roleId', value)}
                  >
                    <SelectTrigger id="roleId">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="officeId">Office</Label>
                  <Select
                    value={formData.officeId}
                    onValueChange={(value) => handleSelectChange('officeId', value)}
                  >
                    <SelectTrigger id="officeId">
                      <SelectValue placeholder="Select an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map(office => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isActive">Active Status</Label>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/users')}
              disabled={isLoading || isLoadingData}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingData}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Update User
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default EditUserPage; 