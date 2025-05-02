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
import userService, { UpdateUserDTO } from '@/services/userService';

// Use realistic UUIDs to match backend expectations
const MOCK_ROLES = [
  { id: '2fd0f1e8-868d-4e36-8c33-9a6e8e8ea111', name: 'Admin' },
  { id: '2fd0f1e8-868d-4e36-8c33-9a6e8e8ea222', name: 'Manager' },
  { id: '2fd0f1e8-868d-4e36-8c33-9a6e8e8ea333', name: 'User' }
];

const MOCK_OFFICES = [
  { id: '3fd5e7c9-868d-4e36-8c33-9a6e8e8ea444', name: 'Headquarters' },
  { id: '3fd5e7c9-868d-4e36-8c33-9a6e8e8ea555', name: 'Branch Office' },
  { id: '3fd5e7c9-868d-4e36-8c33-9a6e8e8ea666', name: 'Remote Office' }
];

const EditUserPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>(MOCK_ROLES);
  const [offices, setOffices] = useState<{ id: string; name: string }[]>(MOCK_OFFICES);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserDTO & { id?: string }>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    officeId: '',
    isActive: true,
  });

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const user = await userService.getUserById(userId);
        
        // Split the name into first and last name
        let firstName = '', lastName = '';
        if (user.name) {
          const nameParts = user.name.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
        
        // Map the roleId to one of our mock roles if needed
        const roleId = user.roleId || MOCK_ROLES.find(r => r.name === user.role)?.id || MOCK_ROLES[0].id;
        
        setFormData({
          id: user.id,
          email: user.email,
          firstName,
          lastName,
          roleId,
          officeId: MOCK_OFFICES[0].id, // Use first mock office for now
          isActive: user.status === 'active',
        });
      } catch (error: any) {
        console.error('Failed to fetch user:', error);
        const errorMessage = error.message || 'Failed to load user data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: keyof UpdateUserDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, isActive: value === 'active' }));
  };

  const validateForm = (): boolean => {
    // Basic form validation
    if (!formData.email?.trim()) {
      setError('Email is required');
      toast.error('Email is required');
      return false;
    }
    
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (!formData.firstName?.trim()) {
      setError('First name is required');
      toast.error('First name is required');
      return false;
    }
    
    if (!formData.lastName?.trim()) {
      setError('Last name is required');
      toast.error('Last name is required');
      return false;
    }
    
    if (!formData.roleId) {
      setError('Role is required');
      toast.error('Role is required');
      return false;
    }
    
    if (!formData.officeId) {
      setError('Office is required');
      toast.error('Office is required');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('User ID is required');
      toast.error('User ID is required');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Call the API to update the user
      await userService.updateUser(userId, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        officeId: formData.officeId,
        isActive: formData.isActive,
        // Don't include password unless it's changed
        ...(formData.password ? { password: formData.password } : {})
      });
      
      // Show success message
      toast.success('User updated successfully!');
      
      // Navigate back to users list
      navigate('/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || 'Failed to update user. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit User"
        subtitle={`Edit user details for ${formData.firstName} ${formData.lastName}`}
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
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
                  <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={6}
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
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/users')}
              disabled={isLoading || isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSaving}>
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

export default EditUserPage; 