import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import userService, { CreateUserDTO } from '@/services/userService';

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

const CreateUserPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>(MOCK_ROLES);
  const [offices, setOffices] = useState<{ id: string; name: string }[]>(MOCK_OFFICES);
  const [formData, setFormData] = useState<CreateUserDTO>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    officeId: '',
  });
  const [error, setError] = useState<string | null>(null);

  // For demo purposes, we'll use mock data for roles and offices
  // In a real app, these would be fetched from the API
  /*
  useEffect(() => {
    const fetchRolesAndOffices = async () => {
      try {
        // Fetch roles and offices from the backend
        // const [rolesResponse, officesResponse] = await Promise.all([
        //   api.get('/roles'),
        //   api.get('/offices')
        // ]);
        // setRoles(rolesResponse.data);
        // setOffices(officesResponse.data);
      } catch (error) {
        console.error('Failed to fetch roles and offices:', error);
        toast.error('Failed to load roles and offices');
      }
    };

    fetchRolesAndOffices();
  }, []);
  */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: keyof CreateUserDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Basic form validation
    if (!formData.email.trim()) {
      setError('Email is required');
      toast.error('Email is required');
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (!formData.firstName.trim()) {
      setError('First name is required');
      toast.error('First name is required');
      return false;
    }
    
    if (!formData.lastName.trim()) {
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
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to create a new user
      await userService.createUser(formData);
      
      // Show success message
      toast.success('User created successfully!');
      
      // Navigate back to users list
      navigate('/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Display a single error message from the API or a generic message
      const errorMessage = error.message || 'Failed to create user. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system"
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
            <CardDescription>Enter the details for the new user.</CardDescription>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
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
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/users')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
                  <Save className="mr-2 h-4 w-4" /> Create User
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default CreateUserPage; 