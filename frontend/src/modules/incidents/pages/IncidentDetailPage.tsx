import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import incidentsService from '../services/incidentsService';
import { Incident } from '../types/incident.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

const IncidentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await incidentsService.getById(id);
        setIncident(data);
      } catch (error) {
        console.error('Failed to fetch incident:', error);
        toast.error('Failed to load incident');
        navigate('/incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncident();
  }, [id, navigate]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await incidentsService.delete(id);
      toast.success('Incident deleted successfully');
      navigate('/incidents');
    } catch (error) {
      console.error('Failed to delete incident:', error);
      toast.error('Failed to delete incident');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusConfig = {
      [GeneralStatusEnum.DRAFT]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Draft' },
      [GeneralStatusEnum.OPEN]: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Open' },
      [GeneralStatusEnum.SCHEDULED]: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Scheduled' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Waiting Approval' },
      [GeneralStatusEnum.DONE]: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Done' },
      [GeneralStatusEnum.REJECTED]: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
      [GeneralStatusEnum.CLOSE]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Closed' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading incident details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Incident not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/incidents')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incidents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Incident: ${incident.code}`}
        subtitle="View and manage incident information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/incidents')}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incidents
            </Button>
            <Button
              onClick={() => navigate(`/incidents/${id}/edit`)}
              disabled={isLoading || isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Incident
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Incident
            </Button>
          </div>
        }
      />

      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Code</h3>
                <p className="mt-1">{incident.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                <p className="mt-1">{incident.subject}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Incident Date</h3>
                <p className="mt-1">{format(new Date(incident.incidentDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1">{incident.incidentLocation}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1">{incident.incidentType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Classification</h3>
                <p className="mt-1">{incident.incidentClassification}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                <p className="mt-1">{incident.priority}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">{getStatusBadge(incident.status)}</div>
              </div>
              {incident.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 whitespace-pre-wrap">{incident.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.area && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Area</h3>
                  <p className="mt-1">{incident.area.name}</p>
                </div>
              )}
              {incident.riskCategory && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Risk Category</h3>
                  <p className="mt-1">{incident.riskCategory.name}</p>
                </div>
              )}
              {incident.requester && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requester</h3>
                  <p className="mt-1">
                    {incident.requester.name ??
                      [incident.requester.firstName, incident.requester.lastName].filter(Boolean).join(' ').trim() ||
                      '-'}
                  </p>
                </div>
              )}
              {incident.reporter && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reporter</h3>
                  <p className="mt-1">
                    {incident.reporter.name ??
                      [incident.reporter.firstName, incident.reporter.lastName].filter(Boolean).join(' ').trim() ||
                      '-'}
                  </p>
                </div>
              )}
              {incident.assignedDepartment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned Department</h3>
                  <p className="mt-1">{incident.assignedDepartment.name}</p>
                </div>
              )}
              {incident.assignee && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                  <p className="mt-1">
                    {incident.assignee.name ??
                      [incident.assignee.firstName, incident.assignee.lastName].filter(Boolean).join(' ').trim() ||
                      '-'}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="mt-1">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1">{incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Incident"
        description={`Are you sure you want to delete incident "${incident.code}"? This action will mark it as inactive.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
};

export default IncidentDetailPage;
