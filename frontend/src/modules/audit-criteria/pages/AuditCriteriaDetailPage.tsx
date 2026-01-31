import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import auditCriteriaService from '../services/auditCriteriaService';
import { TRANSITION_TYPE_LABELS } from '../constants/audit-criteria.constants';
import { AuditCriteria } from '../types/audit-criteria.types';

const AuditCriteriaDetailPage = () => {
  const { criteriaId } = useParams<{ criteriaId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [criteria, setCriteria] = useState<AuditCriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCriteria = async () => {
      if (!criteriaId) {
        setError('Audit Criteria ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const criteriaData = await auditCriteriaService.getAuditCriteriaById(criteriaId);
        setCriteria(criteriaData);
      } catch (err) {
        console.error('Error fetching audit criteria:', err);
        setError('Failed to load audit criteria data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCriteria();
  }, [criteriaId]);

  const handleDelete = async () => {
    if (!criteriaId) return;

    try {
      setDeleting(true);
      await auditCriteriaService.deleteAuditCriteria(criteriaId);
      toast.success('Audit criteria deleted successfully');
      navigate('/audit-criteria');
    } catch (err: any) {
      console.error('Error deleting audit criteria:', err);
      toast.error(err.message || 'Failed to delete audit criteria');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getTransitionTypeBadge = (transitionType: string) => {
    const variants: Record<string, { className: string }> = {
      INITIAL: {
        className: 'bg-blue-100 text-blue-800',
      },
      TRANSITION_LEVEL: {
        className: 'bg-yellow-100 text-yellow-800',
      },
      ADVANCE_LEVEL: {
        className: 'bg-green-100 text-green-800',
      },
    };

    const variant = variants[transitionType] || {
      className: 'bg-gray-100 text-gray-800',
    };

    const label = TRANSITION_TYPE_LABELS[transitionType as keyof typeof TRANSITION_TYPE_LABELS] || transitionType;

    return (
      <Badge variant="outline" className={`${variant.className} border-0`}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !criteria) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Audit Criteria Details</h1>
          <Button variant="outline" onClick={() => navigate('/audit-criteria')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Criteria
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || 'Audit criteria not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Criteria Details</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate('/audit-criteria')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Criteria
          </Button>
          <Button variant="outline" onClick={() => navigate(`/audit-criteria/${criteriaId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Criteria
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Criteria
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Criteria Information</CardTitle>
          <CardDescription>View audit criteria details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Criteria Name</Label>
              <div className="text-base">{criteria.name}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Code</Label>
              <div className="text-base font-mono">{criteria.code}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Clause</Label>
              <div className="text-base">{criteria.clauseName || '-'}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Element</Label>
              <div className="text-base">{criteria.elementName || '-'}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Transition Level</Label>
              <div>{getTransitionTypeBadge(criteria.transitionType)}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Order</Label>
              <div className="text-base">{criteria.order}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <div>
                <Badge
                  variant="outline"
                  className={`${
                    criteria.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  } border-0`}
                >
                  {criteria.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {criteria.description && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <div className="text-base whitespace-pre-wrap">{criteria.description}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Created At</Label>
              <div className="text-base">
                {new Date(criteria.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Updated At</Label>
              <div className="text-base">
                {new Date(criteria.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit Criteria</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{criteria.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuditCriteriaDetailPage;
