import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, ArrowLeft, Mail, Phone, MapPin, Building, ExternalLink } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { Office } from '@/core/lib/types';
import officeService from '../../services/officeService';

const OfficeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id) return;

    const fetchOffice = async () => {
      setIsLoading(true);
      try {
        const officeData = await officeService.getOfficeById(id);
        setOffice(officeData);
      } catch (error) {
        console.error('Failed to fetch office:', error);
        toast.error('Failed to load office data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffice();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id || !office) return;

    setIsDeleting(true);
    try {
      await officeService.deleteOffice(id);
      toast.success(`Office "${office.name}" has been deleted`);
      navigate('/master/offices');
    } catch (error) {
      console.error('Failed to delete office:', error);
      toast.error('Failed to delete office');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Office not found</h2>
        <p className="text-gray-500 mb-4">The office you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/master/offices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
        </Button>
      </div>
    );
  }

  const childrenColumns = [
    {
      id: 'name',
      header: 'Office Name',
      cell: (office: Office) => (
        <div>
          <div className="font-medium">{office.name}</div>
          {office.code && <div className="text-xs text-gray-500">Code: {office.code}</div>}
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: (office: Office) => (
        <div className="text-sm">
          {office.address || 'No address provided'}
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (office: Office) => (
        <div className="text-sm">
          {office.phone || office.email ? (
            <>
              {office.phone && <div>{office.phone}</div>}
              {office.email && <div>{office.email}</div>}
            </>
          ) : (
            'No contact info'
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (childOffice: Office) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/master/offices/${childOffice.id}`)}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={office?.name || 'Office Details'}
        subtitle="View and manage office information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/master/offices')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Offices
            </Button>
            <Button
              onClick={() => navigate(`/master/offices/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Office
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Office
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
        </div>
      ) : office ? (
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {office.children && office.children.length > 0 && (
                <TabsTrigger value="children">Child Offices ({office.children.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building className="mr-2 h-5 w-5" /> Office Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="mt-1">{office.name}</p>
                    </div>

                    {office.code && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Code</h3>
                        <p className="mt-1">{office.code}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <Badge
                        variant="outline"
                        className={`${
                          office.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } border-0 mt-1`}
                      >
                        {office.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {office.parent && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Parent Office</h3>
                        <p className="mt-1">
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => navigate(`/master/offices/${office.parent?.id}`)}
                          >
                            {office.parent.name}
                          </Button>
                        </p>
                      </div>
                    )}

                    {office.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1">{office.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">{new Date(office.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1">{new Date(office.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="mr-2 h-5 w-5" /> Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {office.address ? (
                        <p className="whitespace-pre-line">{office.address}</p>
                      ) : (
                        <p className="text-gray-500">No address provided</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Phone className="mr-2 h-5 w-5" /> Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                        {office.phone ? (
                          <p className="mt-1">{office.phone}</p>
                        ) : (
                          <p className="text-gray-500 mt-1">No phone number provided</p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        {office.email ? (
                          <p className="mt-1">
                            <a href={`mailto:${office.email}`} className="text-blue-600 hover:underline">
                              {office.email}
                            </a>
                          </p>
                        ) : (
                          <p className="text-gray-500 mt-1">No email address provided</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {office.children && office.children.length > 0 && (
              <TabsContent value="children">
                <Card>
                  <CardHeader>
                    <CardTitle>Child Offices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={childrenColumns}
                      data={office.children}
                      pagination={{
                        pageIndex: 0,
                        pageSize: 10,
                        pageCount: Math.ceil(office.children.length / 10),
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
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
        title="Delete Office"
        description={`Are you sure you want to delete the office "${office?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default OfficeDetailPage; 