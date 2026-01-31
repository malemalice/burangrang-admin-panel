import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Eye, ClipboardCheck, Wrench, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/core/components/ui/badge';

import auditSchedulesService from '../services/auditSchedulesService';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import { AuditSchedule } from '../types/audit-schedule.types';
import { normalizeAuditItem, normalizeAuditItems } from '../utils/auditItemUtils';
import api from '@/core/lib/api';
import { AuditItemForm } from '../components/AuditItemForm';
import uploadService from '@/modules/uploads/services/uploadService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { CompliantStatusEnum } from '@/shared/constants/compliant-status.enum';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/modules/master-data/types/master-data.types';
import approvalService from '@/modules/master-data/services/approvalService';
import { ApprovalStatus } from '@/core/lib/types';

interface ImageUpload {
  id: string;
  url: string;
  caption: string;
  file?: File;
  isNew?: boolean;
}

interface AuditItem {
  id: string;
  auditId: string;
  auditCriteriaId: string;
  status: GeneralStatusEnum;
  compliantStatus: CompliantStatusEnum;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  auditCriteria?: AuditCriteria;
  departmentIds?: string[];
  userIds?: string[];
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
  const [formEntryMode, setFormEntryMode] = useState<'assessment' | 'update_action_item'>('assessment');
  const [selectedCriteria, setSelectedCriteria] = useState<MergedCriteriaItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});
  const [isApprovalFormOpen, setIsApprovalFormOpen] = useState(false);
  const [selectedItemForApprovalForm, setSelectedItemForApprovalForm] = useState<MergedCriteriaItem | null>(null);
  const [criteriaSearchTerm, setCriteriaSearchTerm] = useState('');

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

  // Fetch departments for department name lookup
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getDepartments({ page: 1, limit: 1000 });
        setDepartments(response.data);
        // Create a map of department ID to name for quick lookup
        const map: Record<string, string> = {};
        response.data.forEach((dept) => {
          map[dept.id] = dept.name;
        });
        setDepartmentMap(map);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

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

        // Fetch audit items - always use API endpoint to get full data with departments
        let items: AuditItem[] = [];
        
        // Always fetch from API endpoint to ensure we get departments relation
        // The auditSchedule.items might not include departments relation
        try {
          const auditResponse = await api.get(`/audits/${id}/items`, {
            params: {
              page: 1,
              limit: 10000,
            },
          });
          if (auditResponse?.data?.data) {
            // Normalize audit items using shared utility function
            items = normalizeAuditItems(auditResponse.data.data) as AuditItem[];
          }
        } catch (error) {
          console.error('Failed to fetch audit items from API:', error);
          // Fallback: try to use items from auditSchedule if API fails
          const scheduleWithItems = auditSchedule as AuditSchedule & { items?: AuditItem[] };
          if (scheduleWithItems?.items) {
            items = scheduleWithItems.items.map((item: any): AuditItem => ({
              ...item,
              departmentIds: item.departmentIds || [],
              userIds: item.userIds || [],
            } as AuditItem));
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

  // Filter criteria by search term (client-side)
  const filteredMergedCriteria = useMemo(() => {
    if (!criteriaSearchTerm?.trim()) return mergedCriteria;
    const term = criteriaSearchTerm.trim().toLowerCase();
    return mergedCriteria.filter(
      (item) =>
        item.code?.toLowerCase().includes(term) ||
        item.name?.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
  }, [mergedCriteria, criteriaSearchTerm]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = mergedCriteria.length;
    const filled = mergedCriteria.filter(item => item.isFromAuditItem).length;
    const comply = mergedCriteria.filter(
      item => item.auditItem?.compliantStatus === CompliantStatusEnum.COMPLY
    ).length;
    const notComply = mergedCriteria.filter(
      item => item.auditItem?.compliantStatus && 
      (item.auditItem.compliantStatus === CompliantStatusEnum.NOT_COMPLY_MAJOR || 
       item.auditItem.compliantStatus === CompliantStatusEnum.NOT_COMPLY_MINOR)
    ).length;
    
    return { total, filled, comply, notComply };
  }, [mergedCriteria]);

  const handleOpenForm = (
    item: MergedCriteriaItem,
    entryMode: 'assessment' | 'update_action_item' = 'assessment',
  ) => {
    setFormEntryMode(entryMode);
    setSelectedCriteria(item);
    setIsFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormDialogOpen(false);
    setFormEntryMode('assessment');
    setSelectedCriteria(null);
  };


  const handleOpenApprovalForm = async (item: MergedCriteriaItem) => {
    if (!id || !item.auditItem) return;

    // Check if audit item status is WAITING_APPROVAL
    if (item.auditItem.status !== GeneralStatusEnum.WAITING_APPROVAL) {
      toast.error('This audit item is not waiting for approval');
      return;
    }

    // Check approval rights
    try {
      const response = await approvalService.checkApprovalRights(
        item.auditItem.id,
        APPROVAL_ENTITIES.AUDIT_ITEM,
      );
      if (!response.canApprove) {
        toast.error('You do not have permission to approve this audit item');
        return;
      }
    } catch (error) {
      console.error('Failed to check approval rights:', error);
      toast.error('Failed to check approval rights');
      return;
    }

    setSelectedItemForApprovalForm(item);
    setIsApprovalFormOpen(true);
  };

  const handleCloseApprovalForm = () => {
    setIsApprovalFormOpen(false);
    setSelectedItemForApprovalForm(null);
  };

  const handleApprove = async (status: ApprovalStatus, notes: string) => {
    if (!id || !selectedItemForApprovalForm?.auditItem) return;

    try {
      setIsSubmitting(true);
      
      await approvalService.submitApproval({
        dataId: selectedItemForApprovalForm.auditItem.id,
        entity: APPROVAL_ENTITIES.AUDIT_ITEM,
        status,
        notes,
      });

      toast.success(`Audit item ${status === ApprovalStatus.APPROVED ? 'approved' : 'rejected'} successfully`);
      
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
        // Silently fail - items will refresh on next page load
      }

      handleCloseApprovalForm();
    } catch (error: unknown) {
      console.error('Failed to submit approval:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to submit approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm = async (data: {
    compliantStatus: CompliantStatusEnum;
    departmentIds: string[];
    userIds?: string[];
    evidence?: string;
    recommendation?: string;
    actionRealization?: string;
    dueDate: string;
    images: ImageUpload[];
    status?: string;
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
        // Include status if provided (from form mode)
        ...(data.status && { status: data.status }),
      };

      let updatedItemId: string;
      let itemStatus: string | undefined;
      
      // If status is explicitly provided (from form), use it
      // Otherwise, if compliant status is COMPLY, skip approval and set status to DONE directly
      const shouldSkipApproval = !data.status && data.compliantStatus === CompliantStatusEnum.COMPLY;
      
      if (selectedCriteria.auditItem) {
        // Update existing audit item
        const updatePayload = data.status 
          ? { ...payload, status: data.status }
          : shouldSkipApproval 
          ? { ...payload, status: GeneralStatusEnum.DONE }
          : payload;
        const updateResponse = await api.patch(`/audits/${id}/items/${selectedCriteria.auditItem.id}`, updatePayload);
        updatedItemId = selectedCriteria.auditItem.id;
        itemStatus = updateResponse.data?.status || selectedCriteria.auditItem.status;
        
        // Show appropriate success message
        if (data.status === GeneralStatusEnum.WAITING_APPROVAL) {
          toast.success('Audit item submitted for approval');
        } else if (data.status === GeneralStatusEnum.CLOSE) {
          toast.success('Audit item approved and closed');
        } else if (shouldSkipApproval) {
          toast.success('Audit item completed (COMPLY - no approval needed)');
        } else {
          toast.success('Audit item updated successfully');
        }
      } else {
        // Create new audit item
        const createPayload = data.status
          ? { ...payload, status: data.status }
          : shouldSkipApproval
          ? { ...payload, status: GeneralStatusEnum.DONE }
          : payload;
        const createResponse = await api.post(`/audits/${id}/items`, createPayload);
        updatedItemId = createResponse.data?.id || createResponse.data?.data?.id;
        itemStatus = createResponse.data?.status || createResponse.data?.data?.status || (shouldSkipApproval ? GeneralStatusEnum.DONE : GeneralStatusEnum.OPEN);
        
        // Show appropriate success message
        if (data.status === GeneralStatusEnum.WAITING_APPROVAL) {
          toast.success('Audit item created and submitted for approval');
        } else if (shouldSkipApproval) {
          toast.success('Audit item completed (COMPLY - no approval needed)');
        } else {
          toast.success('Audit item created successfully');
        }
      }

      // If status is not explicitly set and compliant status is NOT COMPLY and item status is OPEN, 
      // automatically submit for approval (legacy behavior for assessment mode)
      if (!data.status && !shouldSkipApproval && (itemStatus === GeneralStatusEnum.OPEN || (!selectedCriteria.auditItem && itemStatus === GeneralStatusEnum.OPEN))) {
        try {
          await auditSchedulesService.submitForApproval(id, updatedItemId);
          toast.success('Audit item submitted for approval');
        } catch (error) {
          console.error('Failed to submit for approval:', error);
          // Don't show error if user doesn't have permission - item is still saved
          // Only show error if it's a real issue
          if (error && typeof error === 'object' && 'response' in error) {
            const errorResponse = (error as { response?: { status?: number } })?.response;
            if (errorResponse?.status !== 403) {
              toast.error('Item saved but failed to submit for approval');
            }
          }
        }
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
          // Silently fail - items will refresh on next page load
        }

      handleCloseForm();
    } catch (error: unknown) {
      console.error('Failed to save audit item:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to save audit item');
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

  const getCompliantStatusBadge = (status?: CompliantStatusEnum) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          Not Filled
        </Badge>
      );
    }
    
    switch (status) {
      case CompliantStatusEnum.COMPLY:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-800">
            Comply
          </Badge>
        );
      case CompliantStatusEnum.NOT_COMPLY_MAJOR:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-800">
            Not Comply - Major
          </Badge>
        );
      case CompliantStatusEnum.NOT_COMPLY_MINOR:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-800">
            Not Comply - Minor
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

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
      id: 'transitionType',
      header: 'Transition Type',
      cell: (item: MergedCriteriaItem) => (
        <div className="text-sm">{item.transitionType}</div>
      ),
      isSortable: true,
    },
    {
      id: 'dates',
      header: 'Created At / Due Date',
      cell: (item: MergedCriteriaItem) => {
        const auditItem = item.auditItem;
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Created: </span>
              <span>
                {auditItem?.createdAt
                  ? format(new Date(auditItem.createdAt), 'dd MMM yyyy')
                  : 'N/A'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <span>
                {auditItem?.dueDate
                  ? format(new Date(auditItem.dueDate), 'dd MMM yyyy')
                  : 'N/A'}
              </span>
            </div>
          </div>
        );
      },
      isSortable: false,
    },
    {
      id: 'departments',
      header: 'Department Assigned',
      cell: (item: MergedCriteriaItem) => {
        const auditItem = item.auditItem;
        if (!auditItem) {
          return <div className="text-muted-foreground">N/A</div>;
        }
        
        // Handle both departmentIds (DTO format) and departments (raw format)
        // The API should return departmentIds, but handle both for safety
        let departmentIds: string[] = [];
        
        if (auditItem.departmentIds && Array.isArray(auditItem.departmentIds)) {
          departmentIds = auditItem.departmentIds;
        } else if ((auditItem as any).departments && Array.isArray((auditItem as any).departments)) {
          // Fallback: extract from departments array if departmentIds not present
          departmentIds = (auditItem as any).departments.map((d: any) => 
            d.departmentId || d.id || d
          ).filter((id: any) => id);
        }
        
        if (departmentIds.length === 0) {
          return <div className="text-muted-foreground">N/A</div>;
        }
        
        // Map department IDs to names, fallback to ID if name not found
        const departmentNames = departmentIds
          .map((id: string) => {
            const name = departmentMap[id];
            return name || id; // Fallback to ID if name not in map yet
          })
          .filter((name) => name) // Filter out any empty values
          .join(', ');
        
        return (
          <div className="text-sm">
            {departmentNames || 'N/A'}
          </div>
        );
      },
      isSortable: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: MergedCriteriaItem) => {
        const status = item.auditItem?.status;
        if (!status) {
          return <Badge variant="outline" className="bg-gray-100 text-gray-600">Not Started</Badge>;
        }

        switch (status) {
          case GeneralStatusEnum.DRAFT:
            return <Badge variant="outline" className="bg-gray-100 text-gray-600">Draft</Badge>;
          case GeneralStatusEnum.OPEN:
            return <Badge variant="outline" className="bg-blue-100 text-blue-800">Open</Badge>;
          case GeneralStatusEnum.WAITING_APPROVAL:
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Waiting Verification</Badge>;
          case GeneralStatusEnum.DONE:
            return <Badge className="bg-green-100 text-green-800">Done</Badge>;
          case GeneralStatusEnum.REJECTED:
            return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
          default:
            return <Badge variant="outline">{status}</Badge>;
        }
      },
      isSortable: false,
    },
    {
      id: 'compliantStatus',
      header: 'Compliant Status',
      cell: (item: MergedCriteriaItem) => (
        <div>
          {getCompliantStatusBadge(item.auditItem?.compliantStatus)}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: MergedCriteriaItem) => {
        const auditItem = item.auditItem;
        const status = auditItem?.status;
        const isDraft = status === GeneralStatusEnum.DRAFT;
        const isOpen = status === GeneralStatusEnum.OPEN;
        const isWaitingApproval = status === GeneralStatusEnum.WAITING_APPROVAL;
        const isDone = status === GeneralStatusEnum.DONE;
        const isRejected = status === GeneralStatusEnum.REJECTED;
        const hasNoItem = !item.isFromAuditItem;

        return (
          <div className="flex items-center gap-2">
            {/* View button - always shown */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/audit-schedules/${id}/clauses/${clauseId}/criteria/${item.masterCriteria?.id || item.id}`)}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>

            {/* Assess button - shown when no item exists or status is DRAFT/OPEN */}
            {(hasNoItem || isDraft || isOpen) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenForm(item, 'assessment')}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hasNoItem ? 'Assess Criteria' : 'Assess'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Update Action Item button - shown when item exists and status is OPEN */}
            {item.isFromAuditItem && isOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenForm(item, 'update_action_item')}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update Action Item</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Approve button - shown when status is WAITING_APPROVAL */}
            {item.isFromAuditItem && isWaitingApproval && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenApprovalForm(item)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approve</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of audit items status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Audit Items</label>
                <p className="text-2xl font-semibold">{summaryStats.total}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Already Filled</label>
                <p className="text-2xl font-semibold">{summaryStats.filled}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comply</label>
                <p className="text-2xl font-semibold text-green-600">{summaryStats.comply}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Not Comply</label>
                <p className="text-2xl font-semibold text-red-600">{summaryStats.notComply}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            data={filteredMergedCriteria}
            isLoading={isLoadingCriteria}
            filterFields={[]}
            searchValue={criteriaSearchTerm}
            onSearch={(term) => setCriteriaSearchTerm(term)}
            onApplyFilters={() => {}}
            searchPlaceholder="Search criteria by code or name..."
          />
        </CardContent>
      </Card>

      {/* Audit Item Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formEntryMode === 'update_action_item' ? 'Update Action Item' : 'Assess Audit Criteria'}
            </DialogTitle>
            <DialogDescription>
              {selectedCriteria
                ? formEntryMode === 'update_action_item'
                  ? `Update action item for criteria: ${selectedCriteria.name}`
                  : `Assess criteria: ${selectedCriteria.name}`
                : formEntryMode === 'update_action_item'
                  ? 'Update action item'
                  : 'Assess audit criteria'}
            </DialogDescription>
          </DialogHeader>
          {selectedCriteria && (
            <AuditItemForm
              key={selectedCriteria.auditItem?.id || `new-${selectedCriteria.id}`}
              auditCriteriaId={selectedCriteria.masterCriteria?.id || selectedCriteria.id}
              auditCriteriaName={selectedCriteria.name}
              auditCriteriaDescription={selectedCriteria.description}
              auditCriteriaCode={selectedCriteria.code}
              auditScheduleCode={auditSchedule?.code}
              auditClauseName={auditClause?.name}
              auditElementName={auditClause?.auditElement?.name}
              auditSchedule={auditSchedule}
              auditItem={selectedCriteria.auditItem ? {
                id: selectedCriteria.auditItem.id,
                status: selectedCriteria.auditItem.status,
                compliantStatus: selectedCriteria.auditItem.compliantStatus,
                departmentIds: selectedCriteria.auditItem.departmentIds || [],
                userIds: selectedCriteria.auditItem.userIds || [],
                evidence: selectedCriteria.auditItem.evidence,
                recommendation: selectedCriteria.auditItem.recommendation,
                actionRealization: selectedCriteria.auditItem.actionRealization,
                dueDate: new Date(selectedCriteria.auditItem.dueDate),
                images: selectedCriteria.auditItem.images || [],
              } : undefined}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              isSubmitting={isSubmitting}
              entryMode={formEntryMode}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Form Dialog */}
      <Dialog open={isApprovalFormOpen} onOpenChange={setIsApprovalFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Audit Item</DialogTitle>
            <DialogDescription>
              {selectedItemForApprovalForm ? `Review and approve criteria: ${selectedItemForApprovalForm.name}` : 'Review and approve audit criteria'}
            </DialogDescription>
          </DialogHeader>
          {selectedItemForApprovalForm && auditSchedule && auditClause && (
            <AuditItemForm
              key={`approval-${selectedItemForApprovalForm.auditItem?.id || selectedItemForApprovalForm.id}`}
              auditCriteriaId={selectedItemForApprovalForm.masterCriteria?.id || selectedItemForApprovalForm.id}
              auditCriteriaName={selectedItemForApprovalForm.name}
              auditCriteriaDescription={selectedItemForApprovalForm.description}
              auditCriteriaCode={selectedItemForApprovalForm.code}
              auditScheduleCode={auditSchedule?.code}
              auditClauseName={auditClause?.name}
              auditElementName={auditClause?.auditElement?.name}
              auditSchedule={auditSchedule}
              auditItem={selectedItemForApprovalForm.auditItem ? {
                id: selectedItemForApprovalForm.auditItem.id,
                status: selectedItemForApprovalForm.auditItem.status,
                compliantStatus: selectedItemForApprovalForm.auditItem.compliantStatus,
                departmentIds: selectedItemForApprovalForm.auditItem.departmentIds || [],
                userIds: selectedItemForApprovalForm.auditItem.userIds || [],
                evidence: selectedItemForApprovalForm.auditItem.evidence,
                recommendation: selectedItemForApprovalForm.auditItem.recommendation,
                actionRealization: selectedItemForApprovalForm.auditItem.actionRealization,
                dueDate: new Date(selectedItemForApprovalForm.auditItem.dueDate),
                images: selectedItemForApprovalForm.auditItem.images || [],
              } : undefined}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseApprovalForm}
              isSubmitting={isSubmitting}
              mode="approval"
              onApprove={handleApprove}
              auditId={id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditClauseCriteriaPage;
