import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, CheckCircle2, ListChecks } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import masterApprovalService from '../../services/masterApprovalService';
import { MasterApproval } from '@/core/lib/types';

const MasterApprovalDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [approval, setApproval] = useState<MasterApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchApproval = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await masterApprovalService.getById(id);
        setApproval(data);
      } catch (error) {
        console.error('Failed to fetch approval:', error);
        toast.error('Failed to load approval details');
        navigate('/master/approvals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApproval();
  }, [id, navigate]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!approval) return;
    
    setIsDeleting(true);
    try {
      await masterApprovalService.delete(approval.id);
      toast.success(`Approval "${approval.entity}" has been deleted`);
      navigate('/master/approvals');
    } catch (error) {
      console.error('Failed to delete approval:', error);
      toast.error('Failed to delete approval');
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
            <p className="mt-2 text-gray-600">Loading approval details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Approval not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/master/approvals')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Approvals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={approval.entity}
        subtitle="View and manage approval flow information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/approvals')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Approvals
            </Button>
            <Button
              onClick={() => navigate(`/master/approvals/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Approval
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Approval
            </Button>
          </div>
        }
      />

      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Approval Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Entity</h3>
                <p className="mt-1 font-medium">{approval.entity}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`${
                      approval.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    } border-0`}
                  >
                    {approval.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Number of Steps</h3>
                <p className="mt-1">{approval.items.length}</p>
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
                  {new Date(approval.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1">
                  {new Date(approval.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Approval Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approval.items.length === 0 ? (
              <p className="text-muted-foreground">No approval steps configured</p>
            ) : (
              <div className="space-y-4">
                {approval.items
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.jobPosition.name}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-muted-foreground">{item.department.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created by {item.creator.name} on{' '}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Approval"
        description={`Are you sure you want to delete "${approval.entity}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default MasterApprovalDetailPage;

