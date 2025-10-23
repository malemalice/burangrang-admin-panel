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
import { Threat, ThreatMitigation } from '@/core/lib/types';
import { threatService } from '@/modules/master-data';

const ThreatDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [threat, setThreat] = useState<Threat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id) return;

    const fetchThreat = async () => {
      setIsLoading(true);
      try {
        const threatData = await threatService.getById(id);
        setThreat(threatData);
      } catch (error) {
        console.error('Failed to fetch threat:', error);
        toast.error('Failed to load threat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreat();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await threatService.delete(id);
      toast.success('Threat deleted successfully');
      navigate('/master/threats');
    } catch (error) {
      console.error('Failed to delete threat:', error);
      toast.error('Failed to delete threat. It might have associated mitigations.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const mitigationsColumns = [
    {
      id: 'level',
      header: 'Level',
      cell: (mitigation: ThreatMitigation) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
          Level {mitigation.level}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (mitigation: ThreatMitigation) => (
        <div className="text-sm">
          {mitigation.mitigationDescription}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (mitigation: ThreatMitigation) => (
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
        title={threat?.name || 'Threat Details'}
        subtitle="View and manage health, safety, and environment threat information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/threats')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Threats
            </Button>
            <Button
              onClick={() => navigate(`/master/threats/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Threat
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Threat
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
        </div>
      ) : threat ? (
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {threat.mitigations && threat.mitigations.length > 0 && (
                <TabsTrigger value="mitigations">Mitigations ({threat.mitigations.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5" /> Threat Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="mt-1">{threat.name}</p>
                    </div>

                    {threat.code && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Code</h3>
                        <p className="mt-1">{threat.code}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">HSE Category</h3>
                      <p className="mt-1">
                        {threat.hseCategory ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => navigate(`/master/hse-categories/${threat.hseCategoryId}`)}
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            {threat.hseCategory.name}
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
                          threat.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } border-0 mt-1`}
                      >
                        {threat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {threat.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1">{threat.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mitigations</h3>
                      <p className="mt-1">
                        {threat.mitigations && threat.mitigations.length > 0
                          ? `${threat.mitigations.length} mitigation(s) associated with this threat`
                          : 'No mitigations associated with this threat'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">{new Date(threat.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1">{new Date(threat.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {threat.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Shield className="mr-2 h-5 w-5" /> Detailed Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{threat.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {threat.mitigations && threat.mitigations.length > 0 && (
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
                      data={threat.mitigations}
                      pagination={{
                        pageIndex: 0,
                        limit: 10,
                        pageCount: Math.ceil(threat.mitigations.length / 10),
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                        total: threat.mitigations.length
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
        title="Delete Threat"
        description={`Are you sure you want to delete the threat "${threat?.name}"? This action cannot be undone. Note that threats with associated mitigations cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default ThreatDetailPage; 