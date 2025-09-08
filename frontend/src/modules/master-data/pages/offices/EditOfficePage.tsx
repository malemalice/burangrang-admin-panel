import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Building } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/core/components/ui/select';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import PageHeader from '@/core/components/ui/PageHeader';
import officeService from '../../services/officeService';
import { UpdateOfficeDTO } from '../../types/master-data.types';
import { Office } from '@/core/lib/types';

const EditOfficePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOffice, setIsLoadingOffice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentOffices, setParentOffices] = useState<Office[]>([]);
  const [formData, setFormData] = useState<UpdateOfficeDTO>({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    parentId: null,
    isActive: true
  });

  // Fetch office data and parent offices
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoadingOffice(true);
      try {
        // Fetch the office being edited
        const office = await officeService.getOfficeById(id);
        
        // Set form data
        setFormData({
          name: office.name,
          code: office.code || '',
          description: office.description || '',
          address: office.address || '',
          phone: office.phone || '',
          email: office.email || '',
          parentId: office.parentId || null,
          isActive: office.isActive || true
        });
        
        // Fetch potential parent offices (excluding this office and its children)
        const params = {
          page: 1,
          pageSize: 100,
          sortBy: 'name',
          sortOrder: 'asc' as const
        };
        const response = await officeService.getOffices(params);
        
        // Filter out the current office and any of its children from potential parents
        // to prevent circular relationships
        const validParentOffices = response.data.filter(office => 
          office.id !== id && !isChildOf(office, id)
        );
        
        setParentOffices(validParentOffices);
      } catch (error) {
        console.error('Failed to fetch office data:', error);
        toast.error('Failed to load office data');
        setError('Failed to load office data. Please try again.');
      } finally {
        setIsLoadingOffice(false);
      }
    };

    fetchData();
  }, [id]);

  // Helper function to check if an office is a child of the specified parent
  const isChildOf = (office: Office, parentId: string): boolean => {
    if (!office.children || office.children.length === 0) {
      return false;
    }
    
    return office.children.some(child => 
      child.id === parentId || isChildOf(child, parentId)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    // For parentId, convert empty string or 'none' to null
    const finalValue = name === 'parentId' && (value === '' || value === 'none') ? null : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Office name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      setError('Office ID is missing');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const office = await officeService.updateOffice(id, formData);
      toast.success(`Office "${office.name}" has been updated`);
      navigate('/master/offices');
    } catch (error: any) {
      console.error('Failed to update office:', error);
      const errorMessage = error.message || 'Failed to update office';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingOffice) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Office"
        subtitle="Update office information"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/master/offices')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="container py-6 max-w-2xl">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Office Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter office name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Office Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Enter office code"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select 
              value={formData.isActive.toString()}
              onValueChange={(value) => handleSelectChange('isActive', value === 'true')}
              disabled={isLoading}
            >
              <SelectTrigger id="isActive">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Office</Label>
            <Select 
              value={formData.parentId || 'none'}
              onValueChange={(value) => handleSelectChange('parentId', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Select a parent office (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-level Office)</SelectItem>
                {parentOffices.map(office => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter office description"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Enter office address"
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditOfficePage; 