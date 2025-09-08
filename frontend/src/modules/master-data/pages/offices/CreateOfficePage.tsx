import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CreateOfficeDTO } from '../../types/master-data.types';
import { Office } from '@/core/lib/types';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';

const CreateOfficePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentOffices, setParentOffices] = useState<Office[]>([]);
  const [formData, setFormData] = useState<CreateOfficeDTO>({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    parentId: null,
    isActive: true
  });

  // Convert parent offices to options format
  const parentOfficeOptions: SearchableSelectOption[] = parentOffices.map(office => ({
    value: office.id,
    label: office.name
  }));

  // Fetch parent offices for dropdown
  useEffect(() => {
    const fetchParentOffices = async () => {
      try {
        const params = {
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc' as const
        };
        const response = await officeService.getOffices(params);
        setParentOffices(response.data);
      } catch (error) {
        console.error('Failed to fetch parent offices:', error);
        toast.error('Failed to load parent offices');
      }
    };

    fetchParentOffices();
  }, []);

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
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const office = await officeService.createOffice(formData);
      toast.success(`Office "${office.name}" has been created`);
      navigate('/master/offices');
    } catch (error: any) {
      console.error('Failed to create office:', error);
      const errorMessage = error.message || 'Failed to create office';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Office"
        subtitle="Add a new office to your organization"
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
              {isLoading ? 'Creating...' : 'Create Office'}
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
            <SearchableSelect
              options={parentOfficeOptions}
              value={formData.parentId || 'none'}
              onValueChange={(value) => handleSelectChange('parentId', value)}
              placeholder="Select a parent office (optional)"
              searchPlaceholder="Search offices..."
              emptyText="No offices found"
              includeNone={true}
            />
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

export default CreateOfficePage; 