import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import departmentService from '@/services/departmentService';
import { Department } from '@/core/lib/types';

const DepartmentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await departmentService.getDepartment(id);
        setDepartment(data);
      } catch (error) {
        console.error('Failed to fetch department:', error);
        toast.error('Failed to load department details');
        navigate('/master/departments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartment();
  }, [id, navigate]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!department) return;
    
    setIsDeleting(true);
    try {
      await departmentService.deleteDepartment(department.id);
      toast.success(`Department "${department.name}" has been deleted`);
      navigate('/master/departments');
    } catch (error) {
      console.error('Failed to delete department:', error);
      toast.error('Failed to delete department');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
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

  if (!department) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Department not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/master/departments')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Departments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={department.name}
        subtitle="View and manage department information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/departments')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Departments
            </Button>
            <Button
              onClick={() => navigate(`/master/departments/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Department
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Department
            </Button>
          </div>
        }
      />

      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1">{department.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Code</h3>
                <p className="mt-1">{department.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{department.description || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`${
                      department.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    } border-0`}
                  >
                    {department.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1">
                  {new Date(department.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1">
                  {new Date(department.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Department"
        description={`Are you sure you want to delete "${department.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default DepartmentDetailPage; 