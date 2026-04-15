import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { RiskCategory } from '@/core/lib/types';
import { riskCategoryService } from '@/modules/master-data';

const RiskCategoryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [riskCategory, setRiskCategory] = useState<RiskCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id) return;

    const fetchRiskCategory = async () => {
      setIsLoading(true);
      try {
        const categoryData = await riskCategoryService.getById(id);
        setRiskCategory(categoryData);
      } catch (error) {
        console.error('Failed to fetch risk category:', error);
        toast.error('Failed to load type of hazard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskCategory();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await riskCategoryService.delete(id);
      toast.success('Type of hazard deleted successfully');
      navigate('/master/risk-categories');
    } catch (error) {
      console.error('Failed to delete risk category:', error);
      toast.error('Failed to delete type of hazard. It might have associated risks.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const risksColumns = [
    {
      id: 'name',
      header: 'Risk Name',
      cell: (risk: any) => (
        <div>
          <div className="font-medium">{risk.name}</div>
          {risk.code && <div className="text-xs text-gray-500">Code: {risk.code}</div>}
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (risk: any) => (
        <div className="text-sm">
          {risk.description || 'No description provided'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (risk: any) => (
        <Badge
          variant="outline"
          className={`${
            risk.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {risk.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={riskCategory?.name || 'Type of Hazard Details'}
        subtitle="View and manage type of hazard information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/risk-categories')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
            <Button
              onClick={() => navigate(`/master/risk-categories/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Category
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Category
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
        </div>
      ) : riskCategory ? (
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {riskCategory.risks && riskCategory.risks.length > 0 && (
                <TabsTrigger value="risks">Associated Risks ({riskCategory.risks.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="mr-2 h-5 w-5" /> Type of Hazard Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{riskCategory.name}</p>
                  </div>

                  {riskCategory.code && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Code</h3>
                      <p className="mt-1">{riskCategory.code}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge
                      variant="outline"
                      className={`${
                        riskCategory.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } border-0 mt-1`}
                    >
                      {riskCategory.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {riskCategory.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1">{riskCategory.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Related Risks</h3>
                    <p className="mt-1">
                      {riskCategory.risks && riskCategory.risks.length > 0
                        ? `${riskCategory.risks.length} risk(s) associated with this category`
                        : 'No risks associated with this category'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="mt-1">{new Date(riskCategory.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p className="mt-1">{new Date(riskCategory.updatedAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {riskCategory.risks && riskCategory.risks.length > 0 && (
              <TabsContent value="risks">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5" /> Associated Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={risksColumns}
                      data={riskCategory.risks}
                      pagination={{
                        pageIndex: 0,
                        limit: 10,
                        pageCount: Math.ceil(riskCategory.risks.length / 10),
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                        total: riskCategory.risks.length
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Type of Hazard"
        description={`Are you sure you want to delete the type of hazard "${riskCategory?.name}"? This action cannot be undone. Note that types of hazard with associated risks cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
};

export default RiskCategoryDetailPage;
