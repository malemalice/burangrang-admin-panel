import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Eye,
  Info,
  ClipboardCheck,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';

import { AuditResult, CompliantStatusEnum, COMPLIANT_STATUS_OPTIONS } from '../types/audit-result.types';
import auditResultsService from '../services/auditResultsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import api from '@/core/lib/api';
import auditSchedulesService from '@/modules/audit-schedules/services/auditSchedulesService';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditSchedule } from '@/modules/audit-schedules/types/audit-schedule.types';
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import { AuditItemForm } from '@/modules/audit-schedules/components/AuditItemForm';
import { normalizeAuditItem } from '@/modules/audit-schedules/utils/auditItemUtils';
import uploadService from '@/modules/uploads/services/uploadService';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/modules/master-data/types/master-data.types';

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
  status: string;
  compliantStatus: string;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  departmentIds?: string[];
  userIds?: string[];
  departments?: Array<{ departmentId: string }>;
  users?: Array<{ userId: string }>;
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;
}

const AuditResultsPage = () => {
  const navigate = useNavigate();
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAuditResults, setTotalAuditResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [auditElements, setAuditElements] = useState<Array<{ value: string; label: string }>>([]);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [auditClause, setAuditClause] = useState<AuditClause | null>(null);
  const [auditCriteria, setAuditCriteria] = useState<AuditCriteria | null>(null);
  const [auditItem, setAuditItem] = useState<AuditItem | null>(null);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});

  // Fetch audit elements for filter
  useEffect(() => {
    const fetchAuditElements = async () => {
      try {
        const response = await api.get('/audit-elements', {
          params: { page: 1, limit: 1000, isActive: true },
        });
        setAuditElements(
          response.data.data.map((el: any) => ({
            value: el.id,
            label: el.name,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch audit elements:', error);
      }
    };
    fetchAuditElements();
  }, []);

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

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'auditScheduleCode',
      label: 'Audit Schedule Code',
      type: 'text',
    },
    {
      id: 'auditElementId',
      label: 'Audit Element',
      type: 'select',
      options: auditElements,
    },
    {
      id: 'compliantStatus',
      label: 'Compliant Status',
      type: 'select',
      options: COMPLIANT_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    }
  ];

  const fetchAuditResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1, // API expects 1-based page index
        limit,
      };

      // Add search term if exists
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add filters
      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key === 'auditScheduleCode') {
          // For audit schedule code, use search instead
          if (!params.search) {
            params.search = filter.value;
          }
        } else {
          params[key] = filter.value;
        }
      });

      const response = await auditResultsService.getAll(params);
      setAuditResults(response.data);
      setTotalAuditResults(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit results:', error);
      toast.error('Failed to load audit results');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchAuditResults();
  }, [fetchAuditResults]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value)
        };
      } else if (filter.id === 'compliantStatus') {
        const compliantOption = COMPLIANT_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: compliantOption?.label || String(filter.value)
        };
      } else if (filter.id === 'auditElementId') {
        const elementOption = auditElements.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: elementOption?.label || String(filter.value)
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value)
        };
      }
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0); // Reset to first page on new filters
  };

  const handleOpenForm = async (result: AuditResult) => {
    setSelectedResult(result);
    setIsLoadingFormData(true);
    setIsFormDialogOpen(true);

    try {
      // Fetch audit schedule, clause, and criteria
      const [scheduleData, clauseData, criteriaData] = await Promise.all([
        auditSchedulesService.getById(result.auditId),
        auditPolicyService.getClauseById(result.auditClause.id),
        auditPolicyService.getCriterionById(result.auditCriteria.id),
      ]);

      setAuditSchedule(scheduleData);
      setAuditClause(clauseData);
      setAuditCriteria(criteriaData);

      // Try to fetch audit item
      try {
        const auditResponse = await api.get(`/audits/${result.auditId}/items`, {
          params: {
            page: 1,
            limit: 10000,
          },
        });
        
        if (auditResponse?.data?.data) {
          // Normalize audit items using shared utility function
          const normalizedItems = auditResponse.data.data.map((item: any) => normalizeAuditItem(item));
          const item = normalizedItems.find((item: any) => item.auditCriteriaId === result.auditCriteria.id);
          if (item) {
            setAuditItem(item as AuditItem);
          } else {
            setAuditItem(null);
          }
        } else {
          setAuditItem(null);
        }
      } catch (error) {
        console.log('Audit item not found or endpoint not available');
        setAuditItem(null);
      }
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      toast.error('Failed to load audit item form data');
      setIsFormDialogOpen(false);
      setSelectedResult(null);
    } finally {
      setIsLoadingFormData(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormDialogOpen(false);
    setSelectedResult(null);
    setAuditSchedule(null);
    setAuditClause(null);
    setAuditCriteria(null);
    setAuditItem(null);
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
  }) => {
    if (!selectedResult) return;

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
        auditCriteriaId: selectedResult.auditCriteria.id,
        compliantStatus: data.compliantStatus,
        departmentIds: data.departmentIds,
        userIds: data.userIds || [],
        evidence: data.evidence || null,
        recommendation: data.recommendation || null,
        actionRealization: data.actionRealization || null,
        dueDate: new Date(data.dueDate).toISOString(),
        order: auditCriteria?.order || 0,
        images: uploadedImageUrls,
      };

      if (auditItem) {
        // Update existing audit item
        await api.patch(`/audits/${selectedResult.auditId}/items/${auditItem.id}`, payload);
        toast.success('Audit item updated successfully');
      } else {
        // Create new audit item
        await api.post(`/audits/${selectedResult.auditId}/items`, payload);
        toast.success('Audit item created successfully');
      }

      // Refresh audit results
      await fetchAuditResults();

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

  const getCompliantStatusBadge = (status: CompliantStatusEnum) => {
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'auditScheduleCode',
      header: 'Audit Schedule Code',
      cell: (result: AuditResult) => (
        <button
          onClick={() => navigate(`/audit-schedules/${result.auditId}`)}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          aria-label={`View audit schedule ${result.auditScheduleCode}`}
        >
          {result.auditScheduleCode}
        </button>
      ),
    },
    {
      id: 'auditElementClause',
      header: 'Element / Clause',
      cell: (result: AuditResult) => {
        const element = result.auditElement;
        const clause = result.auditClause;
        
        if (!element && !clause) return <div>N/A</div>;
        
        return (
          <div className="space-y-1">
            {element && (
              <div className="font-semibold text-sm">
                <span className="font-mono text-xs text-muted-foreground mr-1">{element.code}</span>
                <span className="text-foreground">{element.name}</span>
              </div>
            )}
            {clause && (
              <div className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                <span className="font-mono text-xs mr-1">{clause.code}</span>
                <span>{clause.name}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'auditCriteria',
      header: 'Audit Criteria',
      cell: (result: AuditResult) => {
        const criteria = result.auditCriteria;
        if (!criteria) return <div>N/A</div>;
        return (
          <div>
            <span className="font-mono text-xs text-muted-foreground">{criteria.code}</span>
            <span className="mx-1">-</span>
            <span>{criteria.name}</span>
          </div>
        );
      },
    },
    {
      id: 'compliantStatus',
      header: 'Compliant Status',
      cell: (result: AuditResult) => getCompliantStatusBadge(result.compliantStatus),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (result: AuditResult) => getStatusBadge(result.status),
    },
    {
      id: 'dates',
      header: 'Created At / Due Date',
      cell: (result: AuditResult) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Created: </span>
            <span>{result.createdAt 
              ? format(new Date(result.createdAt), 'dd MMM yyyy') 
              : 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Due: </span>
            <span>{result.dueDate 
              ? format(new Date(result.dueDate), 'dd MMM yyyy') 
              : 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'departments',
      header: 'Department Assigned',
      cell: (result: AuditResult) => {
        const departmentIds = result.departmentIds || [];
        if (departmentIds.length === 0) {
          return <div className="text-muted-foreground">N/A</div>;
        }
        // Map department IDs to names, fallback to ID if name not found
        const departmentNames = departmentIds
          .map((id) => {
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
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (result: AuditResult) => {
        const isDraft = result.status === GeneralStatusEnum.DRAFT;
        const isOpen = result.status === GeneralStatusEnum.OPEN;
        const isWaitingApproval = result.status === GeneralStatusEnum.WAITING_APPROVAL;
        const isDone = result.status === GeneralStatusEnum.DONE;
        const isRejected = result.status === GeneralStatusEnum.REJECTED;

        return (
          <div className="flex items-center gap-2">
            {/* View button - always shown */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/audit-schedules/${result.auditId}/clauses/${result.auditClause.id}/criteria/${result.auditCriteria.id}`, {
                    state: { returnTo: '/audit-results' }
                  })}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  aria-label={`View audit criteria ${result.auditCriteria.code}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>

            {/* Assess button - shown when status is DRAFT or OPEN */}
            {(isDraft || isOpen) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenForm(result)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    aria-label={`Assess audit criteria ${result.auditCriteria.code}`}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assess Criteria</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Update button - shown when status is OPEN or WAITING_APPROVAL */}
            {(isOpen || isWaitingApproval) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenForm(result)}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    aria-label={`Update audit criteria ${result.auditCriteria.code}`}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Verify button - shown when status is WAITING_APPROVAL */}
            {isWaitingApproval && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenForm(result)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    aria-label={`Verify audit criteria ${result.auditCriteria.code}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verify</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <PageHeader
        title="Audit Results"
        subtitle="Monitor and track all audit item updates"
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsWorkflowInfoDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">View audit workflow information</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Audit Workflow</p>
            </TooltipContent>
          </Tooltip>
        }
      />

      <DataTable
        columns={columns}
        data={auditResults}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalAuditResults / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalAuditResults
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      {/* Audit Item Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assess Audit Criteria</DialogTitle>
            <DialogDescription>
              {selectedResult && auditCriteria 
                ? `Assess criteria: ${auditCriteria.name}`
                : 'Assess audit criteria'}
            </DialogDescription>
          </DialogHeader>
          {isLoadingFormData ? (
            <div className="flex items-center justify-center py-8">
              <span>Loading form data...</span>
            </div>
          ) : selectedResult && auditSchedule && auditClause && auditCriteria ? (
            <AuditItemForm
              auditCriteriaId={auditCriteria.id}
              auditCriteriaName={auditCriteria.name}
              auditCriteriaDescription={auditCriteria.description}
              auditCriteriaCode={auditCriteria.code}
              auditScheduleCode={auditSchedule.code}
              auditClauseName={auditClause.name}
              auditElementName={auditSchedule.auditElement?.name}
              auditSchedule={auditSchedule}
              auditItem={auditItem ? {
                id: auditItem.id,
                compliantStatus: auditItem.compliantStatus,
                departmentIds: auditItem.departmentIds || [],
                userIds: auditItem.userIds || [],
                evidence: auditItem.evidence,
                recommendation: auditItem.recommendation,
                actionRealization: auditItem.actionRealization,
                dueDate: new Date(auditItem.dueDate),
                images: auditItem.images || [],
              } : undefined}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              isSubmitting={isSubmitting}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Workflow Information Dialog */}
      <Dialog open={isWorkflowInfoDialogOpen} onOpenChange={setIsWorkflowInfoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Audit Workflow</DialogTitle>
            <DialogDescription>
              The audit result goes through three main stages before reaching completion
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {/* Step 1: Auditor Assesses */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <ClipboardCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                    1
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Auditor Assesses</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Auditor assesses the criteria and determines compliance status
                </p>
              </div>

              {/* Arrow Connector 1 */}
              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Step 2: Assigned Dept Updates */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <Wrench className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-semibold flex items-center justify-center">
                    2
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Assigned Dept Updates</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Assigned department updates the audit item with corrective actions
                </p>
              </div>

              {/* Arrow Connector 2 */}
              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Step 3: Approver Verifies */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center justify-center">
                    3
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Approver Verifies</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Approver verifies the updates and changes status to closed if approved
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuditResultsPage;
