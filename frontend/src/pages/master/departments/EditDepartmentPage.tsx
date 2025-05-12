import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import PageHeader from '@/components/ui/PageHeader';
import departmentService, { UpdateDepartmentDTO } from '@/services/departmentService';
import { Department } from '@/lib/types';

const EditDepartmentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepartment, setIsLoadingDepartment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateDepartmentDTO>({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) return;
      
      setIsLoadingDepartment(true);
      try {
        const data = await departmentService.getDepartment(id);
        setFormData({
          name: data.name,
          code: data.code,
          description: data.description || '',
          isActive: data.isActive
        });
      } catch (error) {
        console.error('Failed to fetch department:', error);
        toast.error('Failed to load department details');
        navigate('/master/departments');
      } finally {
        setIsLoadingDepartment(false);
      }
    };

    fetchDepartment();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      await departmentService.updateDepartment(id, formData);
      toast.success('Department updated successfully');
      navigate(`/master/departments/${id}`);
    } catch (error) {
      console.error('Failed to update department:', error);
      setError('Failed to update department. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  if (isLoadingDepartment) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading department details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Department"
        subtitle="Update department information"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(`/master/departments/${id}`)}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />

      <div className="container mx-auto py-6">
        <div className="max-w-2xl">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Active</Label>
                  <div className="text-sm text-muted-foreground">
                    Set whether this department is active
                  </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/master/departments/${id}`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditDepartmentPage; 