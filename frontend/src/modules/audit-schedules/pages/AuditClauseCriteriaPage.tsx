import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import DataTable from '@/core/components/ui/data-table/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';

import auditSchedulesService from '../services/auditSchedulesService';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import { AuditSchedule } from '../types/audit-schedule.types';
import api from '@/core/lib/api';
import { AuditItemForm } from '../components/AuditItemForm';
import uploadService from '@/modules/uploads/services/uploadService';

interface AuditItem {
  id: string;
  auditId: string;
  auditCriteriaId: string;
  status: string;
  compliantStatus: string;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  auditCriteria?: AuditCriteria;
  departments?: Array<{ departmentId: string }>;
  users?: Array<{ userId: string }>;
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;
}

interface MergedCriteriaItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  transitionType: string;
  order: number;
  isFromAuditItem: boolean;
  auditItem?: AuditItem;
  masterCriteria?: AuditCriteria;
}

const AuditClauseCriteriaPage = () => {
  const { id, clauseId } = useParams<{ id: string; clauseId: string }>();
  const navigate = useNavigate();
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [auditClause, setAuditClause] = useState<AuditClause | null>(null);
  const [masterCriteria, setMasterCriteria] = useState<AuditCriteria[]>([]);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClause, setIsLoadingClause] = useState(true);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<MergedCriteriaItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !clauseId) return;

      try {
        setIsLoading(true);
        const [scheduleData, clauseData] = await Promise.all([
          auditSchedulesService.getById(id),
          auditPolicyService.getClauseById(clauseId),
        ]);
        setAuditSchedule(scheduleData);
        setAuditClause(clauseData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch audit schedule or clause');
        navigate(`/audit-schedules/${id}`);
      } finally {
        setIsLoading(false);
        setIsLoadingClause(false);
      }
    };

    fetchData();
  }, [id, clauseId, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !clauseId) return;

      try {
        setIsLoadingCriteria(true);
        
        // Fetch all master criteria for the clause (no pagination)
        const criteriaResponse = await auditPolicyService.getCriteria({
          page: 1,
          limit: 10000, // Large limit to get all
          auditClauseId: clauseId,
          isActive: true,
          sortBy: 'order',
          sortOrder: 'asc',
        });
        const criteria = criteriaResponse.data;
        setMasterCriteria(criteria);

        // Get criteria IDs for filtering
        const criteriaIds = criteria.map(c => c.id);

        // Fetch audit items - try different endpoints
        let items: AuditItem[] = [];
        
        // Try to get items from audit schedule response if available
        const scheduleWithItems = auditSchedule as AuditSchedule & { items?: AuditItem[] };
        if (scheduleWithItems?.items) {
          items = scheduleWithItems.items;
        } else {
          // Try to fetch items from audits endpoint (audit schedule is an audit)
          try {
            const auditResponse = await api.get(`/audits/${id}/items`, {
              params: {
                page: 1,
                limit: 10000,
              },
            });
            if (auditResponse?.data?.data) {
              items = auditResponse.data.data;
            }
          } catch (error) {
            // Endpoint might not exist, that's okay
            console.log('Audit items endpoint not available');
          }
        }

        // Filter items by criteria that belong to this clause
        const filteredItems = items.filter((item: AuditItem) => {
          return criteriaIds.includes(item.auditCriteriaId);
        });
        
        setAuditItems(filteredItems);
      } catch (error) {
        console.error('Failed to fetch audit criteria or items:', error);
        toast.error('Failed to fetch audit criteria');
      } finally {
        setIsLoadingCriteria(false);
      }
    };

    if (auditSchedule && auditClause) {
      fetchData();
    }
  }, [id, clauseId, auditSchedule, auditClause]);

  // Merge master criteria with audit items
  const mergedCriteria = useMemo(() => {
    if (!masterCriteria.length) return [];
    
    const criteriaMap = new Map<string, MergedCriteriaItem>();
    const itemsMap = new Map<string, AuditItem>();

    // Map audit items by criteria ID
    auditItems.forEach(item => {
      itemsMap.set(item.auditCriteriaId, item);
    });

    // Process master criteria - if audit item exists, use it, otherwise use master
    masterCriteria.forEach(criteria => {
      const auditItem = itemsMap.get(criteria.id);
      if (auditItem) {
        // Use audit item data
        criteriaMap.set(criteria.id, {
          id: auditItem.id,
          code: criteria.code,
          name: criteria.name,
          description: criteria.description,
          transitionType: criteria.transitionType,
          order: criteria.order,
          isFromAuditItem: true,
          auditItem,
          masterCriteria: criteria,
        });
      } else {
        // Use master criteria
        criteriaMap.set(criteria.id, {
          id: criteria.id,
          code: criteria.code,
          name: criteria.name,
          description: criteria.description,
          transitionType: criteria.transitionType,
          order: criteria.order,
          isFromAuditItem: false,
          masterCriteria: criteria,
        });
      }
    });

    // Convert map to array and sort by order
    return Array.from(criteriaMap.values()).sort((a, b) => a.order - b.order);
  }, [masterCriteria, auditItems]);

  const handleOpenForm = (item: MergedCriteriaItem) => {
    setSelectedCriteria(item);
    setIsFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormDialogOpen(false);
    setSelectedCriteria(null);
  };

  const handleSubmitForm = async (data: {
    compliantStatus: string;
    departmentIds: string[];
    userIds?: string[];
    evidence?: string;
    recommendation?: string;
    actionRealization?: string;
    dueDate: string;
    images: Array<{
      id: string;
      url: string;
      caption: string;
      file?: File;
      isNew?: boolean;
    }>;
  }) => {
    if (!id || !selectedCriteria) return;

    try {
      setIsSubmitting(true);

      // Upload new images first
      const uploadedImageUrls: Array<{ imageUrl: string; caption: string; order: number }> = [];
      const existingImages = data.images.filter(img => !img.isNew);
      const newImages = data.images.filter(img => img.isNew && img.file);

      // Add existing images
      existingImages.forEach((img, index) => {
        uploadedImageUrls.push({
          imageUrl: img.url,
          caption: img.caption || '',
          order: index + 1,
        });
      });

      // Upload new images
      if (newImages.length > 0) {
        try {
          const category = await uploadService.getCategoryByName('course-materials');
          if (!category) {
            throw new Error('File category not found');
          }

          for (let i = 0; i < newImages.length; i++) {
            const img = newImages[i];
            if (img.file) {
              const uploadResponse = await uploadService.uploadFile(
                img.file,
                category.id,
                true // isPublic
              );
              const fileUrl = uploadService.getPublicFileUrl(uploadResponse.id);
              uploadedImageUrls.push({
                imageUrl: fileUrl,
                caption: img.caption || '',
                order: existingImages.length + i + 1,
              });
            }
          }
        } catch (error) {
          console.error('Failed to upload images:', error);
          toast.error('Failed to upload some images');
        }
      }

      const payload = {
        auditCriteriaId: selectedCriteria.masterCriteria?.id || selectedCriteria.id,
        compliantStatus: data.compliantStatus,
        departmentIds: data.departmentIds,
        userIds: data.userIds || [],
        evidence: data.evidence || null,
        recommendation: data.recommendation || null,
        actionRealization: data.actionRealization || null,
        dueDate: new Date(data.dueDate).toISOString(),
        order: selectedCriteria.order,
        images: uploadedImageUrls,
      };

      if (selectedCriteria.auditItem) {
        // Update existing audit item
        await api.patch(`/audits/${id}/items/${selectedCriteria.auditItem.id}`, payload);
        toast.success('Audit item updated successfully');
      } else {
        // Create new audit item
        await api.post(`/audits/${id}/items`, payload);
        toast.success('Audit item created successfully');
      }

      // Refresh data
      const criteriaResponse = await auditPolicyService.getCriteria({
        page: 1,
        limit: 10000,
        auditClauseId: clauseId!,
        isActive: true,
        sortBy: 'order',
        sortOrder: 'asc',
      });
      setMasterCriteria(criteriaResponse.data);

      // Fetch audit items again
      const criteriaIds = criteriaResponse.data.map(c => c.id);
      try {
        const auditResponse = await api.get(`/audits/${id}/items`, {
          params: {
            page: 1,
            limit: 10000,
          },
        });
        if (auditResponse?.data?.data) {
          const filteredItems = auditResponse.data.data.filter((item: AuditItem) => {
            return criteriaIds.includes(item.auditCriteriaId);
          });
          setAuditItems(filteredItems);
        }
      } catch (error) {
        console.log('Failed to refresh audit items');
      }

      handleCloseForm();
    } catch (error: any) {
      console.error('Failed to save audit item:', error);
      toast.error(error?.response?.data?.message || 'Failed to save audit item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingClause) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <span>Loading audit clause details...</span>
        </div>
      </div>
    );
  }

  if (!auditSchedule || !auditClause) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Audit clause not found
        </h2>
        <p className="text-gray-600 mb-4">
          The audit clause you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate(`/audit-schedules/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Schedule
        </Button>
      </div>
    );
  }

  const auditCriteriaColumns = [
    {
      id: 'code',
      header: 'Code',
      cell: (item: MergedCriteriaItem) => (
        <div className="font-medium">{item.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (item: MergedCriteriaItem) => (
        <div>{item.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item: MergedCriteriaItem) => (
        <div className="text-sm text-muted-foreground">
          {item.description || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'transitionType',
      header: 'Transition Type',
      cell: (item: MergedCriteriaItem) => (
        <div className="text-sm">{item.transitionType}</div>
      ),
      isSortable: true,
    },
    {
      id: 'source',
      header: 'Source',
      cell: (item: MergedCriteriaItem) => (
        <div className="text-sm">
          {item.isFromAuditItem ? (
            <span className="text-blue-600 font-medium">Audit Item</span>
          ) : (
            <span className="text-gray-600">Master Criteria</span>
          )}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: MergedCriteriaItem) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenForm(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.isFromAuditItem ? 'Edit Audit Item' : 'Fill Audit Item'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      isSortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Audit Clause: ${auditClause.name}`}
        subtitle={`From Audit Schedule: ${auditSchedule.code}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/audit-schedules/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Schedule
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Audit Clause Details</CardTitle>
          <CardDescription>Basic information for this audit clause</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Code</label>
              <p className="text-sm font-medium">{auditClause.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm font-medium">{auditClause.name}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm font-medium">
                {auditClause.description || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Audit Element</label>
              <p className="text-sm font-medium">
                {auditClause.auditElement?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Active</label>
              <p className="text-sm font-medium">
                {auditClause.isActive ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Criteria Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Criteria</CardTitle>
          <CardDescription>
            All audit criteria with status active for audit clause: {auditClause.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={auditCriteriaColumns}
            data={mergedCriteria}
            isLoading={isLoadingCriteria}
            filterFields={[]}
            onSearch={() => {}}
            onApplyFilters={() => {}}
          />
        </CardContent>
      </Card>

      {/* Audit Item Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCriteria && (
            <AuditItemForm
              auditCriteriaId={selectedCriteria.masterCriteria?.id || selectedCriteria.id}
              auditCriteriaName={selectedCriteria.name}
              auditCriteriaDescription={selectedCriteria.description}
              auditCriteriaCode={selectedCriteria.code}
              auditScheduleCode={auditSchedule?.code}
              auditClauseName={auditClause?.name}
              auditElementName={auditClause?.auditElement?.name}
              auditItem={selectedCriteria.auditItem ? {
                id: selectedCriteria.auditItem.id,
                compliantStatus: selectedCriteria.auditItem.compliantStatus,
                departmentIds: selectedCriteria.auditItem.departments?.map(d => d.departmentId) || [],
                userIds: selectedCriteria.auditItem.users?.map(u => u.userId) || [],
                evidence: selectedCriteria.auditItem.evidence,
                recommendation: selectedCriteria.auditItem.recommendation,
                actionRealization: selectedCriteria.auditItem.actionRealization,
                dueDate: new Date(selectedCriteria.auditItem.dueDate),
                images: selectedCriteria.auditItem.images || [],
              } : undefined}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditClauseCriteriaPage;
