import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, ArrowLeft, AlertTriangle, Tag, Shield, ListChecks } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { Risk, RiskMitigation } from '@/core/lib/types';
import { riskService } from '@/modules/master-data';

const RiskDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id) return;

    const fetchRisk = async () => {
      setIsLoading(true);
      try {
        const riskData = await riskService.getById(id);
        setRisk(riskData);
      } catch (error) {
        console.error('Failed to fetch risk:', error);
        toast.error('Failed to load risk data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRisk();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await riskService.delete(id);
      toast.success('Risk deleted successfully');
      navigate('/master/risks');
    } catch (error) {
      console.error('Failed to delete risk:', error);
      toast.error('Failed to delete risk. It might have associated mitigations.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const mitigationsColumns = [
    {
      id: 'eliminate',
      header: 'Eliminate',
      cell: (mitigation: RiskMitigation) => (
        <div className="text-sm max-w-xs">
          {mitigation.eliminate ? (
            <div className="truncate">{mitigation.eliminate}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'transfer',
      header: 'Transfer',
      cell: (mitigation: RiskMitigation) => (
        <div className="text-sm max-w-xs">
          {mitigation.transfer ? (
            <div className="truncate">{mitigation.transfer}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'reduce',
      header: 'Reduce',
      cell: (mitigation: RiskMitigation) => (
        <div className="text-sm max-w-xs">
          {mitigation.reduce ? (
            <div className="truncate">{mitigation.reduce}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'accept',
      header: 'Accept',
      cell: (mitigation: RiskMitigation) => (
        <div className="text-sm max-w-xs">
          {mitigation.accept ? (
            <div className="truncate">{mitigation.accept}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (mitigation: RiskMitigation) => (
        <Badge
          variant="outline"
          className={`${
            mitigation.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {mitigation.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={risk?.name || 'Risk Details'}
        subtitle="View and manage health, safety, and environment risk information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/risks')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Risks
            </Button>
            <Button
              onClick={() => navigate(`/master/risks/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Risk
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Risk
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
        </div>
      ) : risk ? (
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {risk.mitigations && risk.mitigations.length > 0 && (
                <TabsTrigger value="mitigations">Mitigations ({risk.mitigations.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5" /> Risk Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="mt-1">{risk.name}</p>
                    </div>

                    {risk.code && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Code</h3>
                        <p className="mt-1">{risk.code}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">HSE Category</h3>
                      <p className="mt-1">
                        {risk.hseCategory ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => navigate(`/master/hse-categories/${risk.hseCategoryId}`)}
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            {risk.hseCategory.name}
                          </Button>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <Badge
                        variant="outline"
                        className={`${
                          risk.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } border-0 mt-1`}
                      >
                        {risk.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {risk.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1">{risk.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mitigations</h3>
                      <p className="mt-1">
                        {risk.mitigations && risk.mitigations.length > 0
                          ? `${risk.mitigations.length} mitigation(s) associated with this risk`
                          : 'No mitigations associated with this risk'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">{new Date(risk.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1">{new Date(risk.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {risk.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Shield className="mr-2 h-5 w-5" /> Detailed Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{risk.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {risk.mitigations && risk.mitigations.length > 0 && (
              <TabsContent value="mitigations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ListChecks className="mr-2 h-5 w-5" /> Mitigation Measures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={mitigationsColumns}
                      data={risk.mitigations}
                      pagination={{
                        pageIndex: 0,
                        limit: 10,
                        pageCount: Math.ceil(risk.mitigations.length / 10),
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                        total: risk.mitigations.length
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
        title="Delete Risk"
        description={`Are you sure you want to delete the risk "${risk?.name}"? This action cannot be undone. Note that risks with associated mitigations cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default RiskDetailPage;
