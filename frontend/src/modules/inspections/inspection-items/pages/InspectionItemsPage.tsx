import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Eye,
  MoreHorizontal, 
  Edit,
  FileText,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
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

import { InspectionItem, InspectionItemSearchParams } from '../types/inspection-item.types';
import { CreateInspectionItemDTO } from '../../types/inspection.types';
import inspectionItemsService from '../services/inspectionItemsService';
import InspectionItemForm from '../../components/InspectionItemForm';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { IssueStatus, ISSUE_STATUS_OPTIONS } from '@/shared/constants/issue-status.enum';
import { departmentService, riskService, riskCategoryService } from '@/modules/master-data';
import { Department } from '@/modules/master-data/types/master-data.types';
import { Risk, RiskCategory } from '@/core/lib/types';
import userService from '@/modules/users/services/userService';
import { User } from '@/core/lib/types';

const InspectionItemsPage = () => {
  const navigate = useNavigate();
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [editingFormMode, setEditingFormMode] = useState<'creator' | 'updater' | 'verifier' | null>(null);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [departmentsResponse, usersResponse, risksResponse, riskCategoriesResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 100 }),
          userService.getUsers({ page: 1, limit: 100 }),
          riskService.getAll({ page: 1, limit: 100, isActive: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true }),
        ]);

        setDepartments(departmentsResponse.data);
        setUsers(usersResponse.data);
        setRisks(risksResponse.data);
        setRiskCategories(riskCategoriesResponse.data);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ISSUE_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'assignedDepartmentId',
      label: 'Assigned Department',
      type: 'searchableSelect',
      options: departments.map(dept => ({
        label: dept.name,
        value: dept.id,
      })),
    },
    {
      id: 'assigneeId',
      label: 'Assigned User',
      type: 'searchableSelect',
      options: users.map(user => ({
        label: user.name || `${user.firstName} ${user.lastName}`,
        value: user.id,
      })),
    },
    {
      id: 'riskId',
      label: 'Risk',
      type: 'searchableSelect',
      options: risks.map(risk => ({
        label: risk.name,
        value: risk.id,
      })),
    },
    {
      id: 'riskCategoryId',
      label: 'Risk Category',
      type: 'searchableSelect',
      options: riskCategories.map(category => ({
        label: category.name,
        value: category.id,
      })),
    },
    {
      id: 'inspectionCode',
      label: 'Inspection Code',
      type: 'text',
    },
  ], [departments, users, risks, riskCategories]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: InspectionItemSearchParams = {
        page: pageIndex + 1,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      // Add filters
      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value as IssueStatus;
      }
      if (activeFilters.assignedDepartmentId?.value) {
        params.assignedDepartmentId = activeFilters.assignedDepartmentId.value;
      }
      if (activeFilters.assigneeId?.value) {
        params.assigneeId = activeFilters.assigneeId.value;
      }
      if (activeFilters.riskId?.value) {
        params.riskId = activeFilters.riskId.value;
      }
      if (activeFilters.riskCategoryId?.value) {
        params.riskCategoryId = activeFilters.riskCategoryId.value;
      }
      if (activeFilters.inspectionCode?.value) {
        params.inspectionCode = activeFilters.inspectionCode.value;
      }

      const response = await inspectionItemsService.getAll(params);
      setInspectionItems(response.data);
      setTotalItems(response.meta.total);
      
      if (response.meta.page) {
        setPageIndex(response.meta.page - 1);
      }
    } catch (error) {
      console.error('Failed to fetch inspection items:', error);
      toast.error('Failed to load inspection items');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        const statusOption = ISSUE_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value)
        };
      } else {
        const field = filterFields.find(f => f.id === filter.id);
        if (field && field.type === 'select' && field.options) {
          const option = field.options.find(opt => opt.value === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: option?.label || String(filter.value)
          };
        } else {
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: String(filter.value)
          };
        }
      }
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

  const handleUpdateItemSubmit = async (itemData: CreateInspectionItemDTO) => {
    if (!editingItem) return;
    
    try {
      await inspectionItemsService.update(editingItem.id, itemData);
      toast.success('Inspection item updated successfully');
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
      setEditingFormMode(null);
      await fetchItems();
    } catch (error) {
      console.error('Failed to update inspection item:', error);
      toast.error('Failed to update inspection item');
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [IssueStatus.OPEN]: { label: 'Open Issue', variant: 'secondary' },
      [IssueStatus.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [IssueStatus.CLOSE]: { label: 'Closed', variant: 'default' },
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
      id: 'inspectionCode',
      header: 'Inspection Code',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.inspection?.code || 'N/A'}
        </div>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.area?.name || item.areaId || 'N/A'}
        </div>
      ),
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: (item: InspectionItem) => (
        <div>
          {item.inspection?.creator
            ? `${item.inspection.creator.firstName} ${item.inspection.creator.lastName}`
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'risk',
      header: 'Risk',
      cell: (item: InspectionItem) => (
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{item.riskCategory?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{item.risk?.name || 'N/A'}</div>
        </div>
      ),
    },
    {
      id: 'assignment',
      header: 'Assignment',
      cell: (item: InspectionItem) => (
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{item.assignedDepartment?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">
            {item.assignee 
              ? `${item.assignee.firstName} ${item.assignee.lastName}` 
              : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: InspectionItem) => getStatusBadge(item.status),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (item: InspectionItem) => (
        <div>
          {item.createdAt 
            ? format(new Date(item.createdAt), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: InspectionItem) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/inspections/items/${item.id}`)}
                className="text-primary hover:text-primary hover:bg-primary/10"
                aria-label={`View inspection item ${item.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingItem(item);
                  setEditingFormMode('creator');
                  setIsEditItemDialogOpen(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit as Creator</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingItem(item);
                  setEditingFormMode('updater');
                  setIsEditItemDialogOpen(true);
                }}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Wrench className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Update Action Item</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingItem(item);
                  setEditingFormMode('verifier');
                  setIsEditItemDialogOpen(true);
                }}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verify</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenu
            open={openDropdownId === item.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? item.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/inspections/items/${item.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Inspection Items"
        subtitle="View and manage inspection items"
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
                <span className="sr-only">View workflow information</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Inspection Item Workflow</p>
            </TooltipContent>
          </Tooltip>
        }
      />

      <DataTable
        columns={columns}
        data={inspectionItems}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalItems / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalItems
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={(open) => {
        setIsEditItemDialogOpen(open);
        if (!open) {
          setEditingItem(null);
          setEditingFormMode(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormMode === 'creator' && 'Edit as Creator'}
              {editingFormMode === 'updater' && 'Update Action Item'}
              {editingFormMode === 'verifier' && 'Verify Inspection Item'}
              {!editingFormMode && 'Edit Inspection Item'}
            </DialogTitle>
            <DialogDescription>
              {editingFormMode === 'creator' && 'Edit inspection item details (Area, Risk, Findings, Description, Due Date, Risk Mitigation)'}
              {editingFormMode === 'updater' && 'Update action item progress (After Images, Follow-up Notes)'}
              {editingFormMode === 'verifier' && 'Verify and adjust all inspection item fields'}
              {!editingFormMode && 'Update the inspection item details.'}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InspectionItemForm
              inspectionId={editingItem.inspectionId}
              initialItem={{
                areaId: editingItem.areaId,
                status: editingItem.status,
                riskCategoryId: editingItem.riskCategoryId,
                riskId: editingItem.riskId,
                assignedDepartmentId: editingItem.assignedDepartmentId,
                assigneeId: editingItem.assigneeId,
                description: editingItem.description,
                followUpNotes: editingItem.followUpNotes,
                findings: editingItem.findings,
                dueDateAt: editingItem.dueDateAt ? new Date(editingItem.dueDateAt).toISOString().split('T')[0] : undefined,
                images: editingItem.images?.map(img => ({
                  imageUrl: img.imageUrl,
                  caption: img.caption,
                  order: img.order,
                })),
                mitigation: editingItem.mitigation ? {
                  eliminate: editingItem.mitigation.eliminate,
                  transfer: editingItem.mitigation.transfer,
                  reduce: editingItem.mitigation.reduce,
                  accept: editingItem.mitigation.accept,
                  legalAspect: editingItem.mitigation.legalAspect,
                } : undefined,
              }}
              onSubmit={handleUpdateItemSubmit}
              onCancel={() => {
                setIsEditItemDialogOpen(false);
                setEditingItem(null);
                setEditingFormMode(null);
              }}
              showCard={false}
              formMode={editingFormMode || 'creator'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Information Dialog */}
      <Dialog open={isWorkflowInfoDialogOpen} onOpenChange={setIsWorkflowInfoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inspection Item Workflow</DialogTitle>
            <DialogDescription>
              The inspection item goes through three main stages before reaching completion
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {/* Step 1: Finding */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                    1
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Finding</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Record inspection findings and initial details
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => {
                    setIsWorkflowInfoDialogOpen(false);
                    toast.info('Please select an inspection item from the table to edit as creator');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit as Creator
                </Button>
              </div>

              {/* Arrow Connector 1 */}
              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Step 2: Action Plan */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <Wrench className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-semibold flex items-center justify-center">
                    2
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Action Plan</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Update action item progress with images and notes
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  onClick={() => {
                    setIsWorkflowInfoDialogOpen(false);
                    toast.info('Please select an inspection item from the table to update action item');
                  }}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Update Action Item
                </Button>
              </div>

              {/* Arrow Connector 2 */}
              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Step 3: Verify */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center justify-center">
                    3
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">Verify</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                  Verify and finalize inspection item
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={() => {
                    setIsWorkflowInfoDialogOpen(false);
                    toast.info('Please select an inspection item from the table to verify');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspectionItemsPage;
