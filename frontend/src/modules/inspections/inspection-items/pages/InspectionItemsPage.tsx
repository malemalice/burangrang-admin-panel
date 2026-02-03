import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { GeneralStatusEnum, INSPECTION_ITEM_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { departmentService, riskService, riskCategoryService } from '@/modules/master-data';
import { Department } from '@/modules/master-data/types/master-data.types';
import { Risk, RiskCategory } from '@/core/lib/types';
import userService from '@/modules/users/services/userService';
import { User } from '@/core/lib/types';
import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';
import { ROLE_CODES } from '@/shared/constants/role-codes.constants';
import roleService from '@/modules/roles/services/roleService';

const FILTER_KEYS = ['status', 'assignedDepartmentId', 'assigneeId', 'riskId', 'riskCategoryId', 'inspectionCode'];

const InspectionItemsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const pageIndex = useMemo(() => {
    const raw = searchParams.get('page');
    const page = raw ? Number(raw) : 1;
    if (!Number.isFinite(page) || page <= 0) return 0;
    return Math.floor(page) - 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = searchParams.get('limit');
    const parsed = raw ? Number(raw) : 10;
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.floor(parsed);
  }, [searchParams]);

  const searchTerm = useMemo(() => searchParams.get('search') ?? '', [searchParams]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [editingFormMode, setEditingFormMode] = useState<'creator' | 'updater' | 'verifier' | null>(null);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] = useState(false);
  const [approvalRights, setApprovalRights] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        let roleCode: string | null = null;
        if (userData.role && typeof userData.role === 'object' && 'code' in userData.role) {
          roleCode = userData.role.code;
        }
        if (!roleCode && userData.roleId) {
          const role = await roleService.getRoleById(userData.roleId);
          roleCode = role.code;
        }
        setIsSuperUser(roleCode === ROLE_CODES.SUPER_ADMIN);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();
  }, [currentUser?.id]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [departmentsResponse, usersResponse, risksResponse, riskCategoriesResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 100, options: true }),
          userService.getUsers({ page: 1, limit: 100, options: true }),
          riskService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
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
      options: INSPECTION_ITEM_STATUS_OPTIONS.map(option => ({
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

  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};

    const status = searchParams.get('status');
    if (status) {
      const option = INSPECTION_ITEM_STATUS_OPTIONS.find(opt => opt.value === status);
      filters.status = { value: status, label: option?.label ?? status };
    }

    const assignedDepartmentId = searchParams.get('assignedDepartmentId');
    if (assignedDepartmentId) {
      const dept = departments.find(d => d.id === assignedDepartmentId);
      filters.assignedDepartmentId = { value: assignedDepartmentId, label: dept?.name ?? assignedDepartmentId };
    }

    const assigneeId = searchParams.get('assigneeId');
    if (assigneeId) {
      const user = users.find(u => u.id === assigneeId);
      filters.assigneeId = { value: assigneeId, label: user ? (user.name || `${user.firstName} ${user.lastName}`) : assigneeId };
    }

    const riskId = searchParams.get('riskId');
    if (riskId) {
      const risk = risks.find(r => r.id === riskId);
      filters.riskId = { value: riskId, label: risk?.name ?? riskId };
    }

    const riskCategoryId = searchParams.get('riskCategoryId');
    if (riskCategoryId) {
      const category = riskCategories.find(c => c.id === riskCategoryId);
      filters.riskCategoryId = { value: riskCategoryId, label: category?.name ?? riskCategoryId };
    }

    const inspectionCode = searchParams.get('inspectionCode');
    if (inspectionCode) {
      filters.inspectionCode = { value: inspectionCode, label: inspectionCode };
    }

    return filters;
  }, [searchParams, departments, users, risks, riskCategories]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: InspectionItemSearchParams = {
        page: pageIndex + 1,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      // Add search term
      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }
      // Add filters
      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value as GeneralStatusEnum;
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

      // Check approval rights for items with WAITING_APPROVAL status
      const rightsMap: Record<string, boolean> = {};
      const waitingApprovalItems = response.data.filter(item => item.status === GeneralStatusEnum.WAITING_APPROVAL);
      
      await Promise.all(
        waitingApprovalItems.map(async (item) => {
          try {
            const rights = await inspectionItemsService.checkApprovalRights(item.id);
            rightsMap[item.id] = rights.canApprove || false;
          } catch (error) {
            console.error(`Failed to check approval rights for item ${item.id}:`, error);
            rightsMap[item.id] = false;
          }
        })
      );
      
      setApprovalRights(prev => ({ ...prev, ...rightsMap }));
    } catch (error) {
      console.error('Failed to fetch inspection items:', error);
      toast.error('Failed to load inspection items');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams(next => next.set('page', String(page + 1)));
    },
    [updateSearchParams]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateSearchParams(next => {
        next.set('limit', String(size));
        next.set('page', '1');
      });
    },
    [updateSearchParams]
  );

  const handleSearch = useCallback(
    (term: string) => {
      updateSearchParams(next => {
        const trimmed = term.trim();
        if (trimmed) next.set('search', trimmed);
        else next.delete('search');
        next.set('page', '1');
      });
    },
    [updateSearchParams]
  );

  const handleApplyFilters = useCallback(
    (filters: FilterValue[]) => {
      updateSearchParams(next => {
        FILTER_KEYS.forEach(k => next.delete(k));
        filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            if (filter.id === 'inspectionCode') {
              next.set(filter.id, String(filter.value));
            } else {
              next.set(filter.id, String(filter.value));
            }
          }
        });
        next.set('page', '1');
      });
    },
    [updateSearchParams]
  );

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

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.OPEN]: { label: 'Open Issue', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [GeneralStatusEnum.CLOSE]: { label: 'Close', variant: 'default' },
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
      cell: (item: InspectionItem) => {
        const isClosed = item.status === GeneralStatusEnum.CLOSE;
        const isWaitingApproval = item.status === GeneralStatusEnum.WAITING_APPROVAL;
        const hasApprovalRights = approvalRights[item.id] || false;
        
        // When status is CLOSED, only show View button
        if (isClosed) {
          return (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/inspections/items/${item.id}`, { state: { returnTo: location.search } })}
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
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            {/* View button - always shown except when closed (handled above) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/inspections/items/${item.id}`, { state: { returnTo: location.search } })}
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
            
            {/* Edit as Creator - hidden when status is WAITING_APPROVAL or CLOSED */}
            {!isWaitingApproval && (
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
            )}
            
            {/* Update Action Item - hidden when WAITING_APPROVAL unless super_user */}
            {(!isWaitingApproval || isSuperUser) && (
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
            )}
            
            {/* Verify button - only show when status is WAITING_APPROVAL and user has approval rights */}
            {isWaitingApproval && hasApprovalRights && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      // Double-check approval rights before allowing verifier mode
                      try {
                        const rights = await inspectionItemsService.checkApprovalRights(item.id);
                        if (!rights.canApprove) {
                          toast.error('You do not have approval rights for this inspection item');
                          return;
                        }
                        setEditingItem(item);
                        setEditingFormMode('verifier');
                        setIsEditItemDialogOpen(true);
                      } catch (error) {
                        console.error('Failed to check approval rights:', error);
                        toast.error('Failed to check approval rights');
                      }
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
            )}
            
            {/* Dropdown menu (Edit) - hidden when CLOSED or WAITING_APPROVAL unless super_user */}
            {!isClosed && (!isWaitingApproval || isSuperUser) && (
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
                  <DropdownMenuItem onClick={() => navigate(`/inspections/items/${item.id}/edit`, { state: { returnTo: location.search } })}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      }
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
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          total: totalItems
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        searchValue={searchTerm}
        onSearch={handleSearch}
        searchPlaceholder="Search by inspection code, risk, description..."
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
                id: editingItem.id, // Include id for approval rights check in verifier mode
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
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Record inspection findings and initial details
                </p>
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
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Update action item progress with images and notes
                </p>
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
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Verify and finalize inspection item
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspectionItemsPage;
