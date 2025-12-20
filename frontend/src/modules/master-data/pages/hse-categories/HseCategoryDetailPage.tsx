import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, ArrowLeft, Shield, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { HseCategory } from '@/core/lib/types';
import { hseCategoryService } from '@/modules/master-data';

const HseCategoryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [hseCategory, setHseCategory] = useState<HseCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id) return;

    const fetchHseCategory = async () => {
      setIsLoading(true);
      try {
        const categoryData = await hseCategoryService.getById(id);
        setHseCategory(categoryData);
      } catch (error) {
        console.error('Failed to fetch HSE category:', error);
        toast.error('Failed to load HSE category data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHseCategory();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await hseCategoryService.delete(id);
      toast.success('HSE category deleted successfully');
      navigate('/master/hse-categories');
    } catch (error) {
      console.error('Failed to delete HSE category:', error);
      toast.error('Failed to delete HSE category. It might have associated risks.');
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
        title={hseCategory?.name || 'HSE Category Details'}
        subtitle="View and manage health, safety, and environment category information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/hse-categories')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
            <Button
              onClick={() => navigate(`/master/hse-categories/${id}/edit`)}
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
      ) : hseCategory ? (
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {hseCategory.risks && hseCategory.risks.length > 0 && (
                <TabsTrigger value="risks">Associated Risks ({hseCategory.risks.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="mr-2 h-5 w-5" /> HSE Category Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{hseCategory.name}</p>
                  </div>

                  {hseCategory.code && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Code</h3>
                      <p className="mt-1">{hseCategory.code}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge
                      variant="outline"
                      className={`${
                        hseCategory.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } border-0 mt-1`}
                    >
                      {hseCategory.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {hseCategory.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1">{hseCategory.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Related Risks</h3>
                    <p className="mt-1">
                      {hseCategory.risks && hseCategory.risks.length > 0
                        ? `${hseCategory.risks.length} risk(s) associated with this category`
                        : 'No risks associated with this category'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="mt-1">{new Date(hseCategory.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p className="mt-1">{new Date(hseCategory.updatedAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {hseCategory.risks && hseCategory.risks.length > 0 && (
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
                      data={hseCategory.risks}
                      pagination={{
                        pageIndex: 0,
                        limit: 10,
                        pageCount: Math.ceil(hseCategory.risks.length / 10),
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                        total: hseCategory.risks.length
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
        title="Delete HSE Category"
        description={`Are you sure you want to delete the HSE category "${hseCategory?.name}"? This action cannot be undone. Note that categories with associated risks cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default HseCategoryDetailPage; 