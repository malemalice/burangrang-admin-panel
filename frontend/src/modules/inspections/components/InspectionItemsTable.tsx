import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, FileText, Wrench, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { InspectionItem } from '../types/inspection.types';
import { getStatusBadge } from '../utils/inspectionBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

interface InspectionItemsTableProps {
  items: InspectionItem[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (term: string) => void;
  onApplyFilters: (filters: FilterValue[]) => void;
  onAddItem: () => void;
  onViewItem: (item: InspectionItem) => void;
  onEditItem: (item: InspectionItem) => void;
  onEditItemAsCreator?: (item: InspectionItem) => void;
  onEditItemAsUpdater?: (item: InspectionItem) => void;
  onEditItemAsVerifier?: (item: InspectionItem) => void;
  onDeleteItem: (item: InspectionItem, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  itemToDelete: InspectionItem | null;
  deleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  hideActions?: boolean;
  hideHeader?: boolean;
  hidePagination?: boolean;
  approvalRights?: Record<string, boolean>; // Map of item ID to approval rights
  isSuperUser?: boolean; // When true, show Update Action Item and Edit even when item is WAITING_APPROVAL
}

export const InspectionItemsTable = ({
  items,
  isLoading,
  pageIndex,
  limit,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onApplyFilters,
  onAddItem,
  onViewItem,
  onEditItem,
  onEditItemAsCreator,
  onEditItemAsUpdater,
  onEditItemAsVerifier,
  onDeleteItem,
  onDeleteConfirm,
  itemToDelete,
  deleteDialogOpen,
  onDeleteDialogChange,
  hideActions = false,
  hideHeader = false,
  hidePagination = false,
  approvalRights = {},
  isSuperUser = false,
}: InspectionItemsTableProps) => {
  const filterFields: FilterField[] = [];

  const columns = [
    {
      id: 'area',
      header: 'Area',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.area?.name || item.areaId || 'N/A'}
        </div>
      ),
      isSortable: true,
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
      isSortable: true,
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
      isSortable: true,
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
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: InspectionItem) => getStatusBadge(item.status),
      isSortable: true,
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
      isSortable: true,
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
                    onClick={() => onViewItem(item)}
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
                  onClick={() => onViewItem(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
            
            {!hideActions && (
              <>
                {/* Edit as Creator - hidden when status is WAITING_APPROVAL or CLOSED */}
                {onEditItemAsCreator && !isWaitingApproval && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditItemAsCreator(item)}
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
                {onEditItemAsUpdater && (!isWaitingApproval || isSuperUser) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditItemAsUpdater(item)}
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
                {onEditItemAsVerifier && isWaitingApproval && hasApprovalRights && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditItemAsVerifier(item)}
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
                
                {/* Edit button - hidden when status is CLOSED or WAITING_APPROVAL (unless super_user) */}
                {!isClosed && (!isWaitingApproval || isSuperUser) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Delete button - hidden when status is CLOSED or WAITING_APPROVAL */}
                {!isClosed && !isWaitingApproval && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => onDeleteItem(item, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        );
      },
      isSortable: false,
    },
  ];

  return (
    <>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Inspection Finding Monitoring</h2>
          {!hideActions && (
            <ThemeButton onClick={onAddItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </ThemeButton>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={
          hidePagination
            ? undefined
            : {
                pageIndex,
                limit,
                pageCount: Math.ceil(totalItems / limit),
                onPageChange,
                onPageSizeChange,
                total: totalItems,
              }
        }
        filterFields={hideHeader ? [] : filterFields}
        onSearch={hideHeader ? undefined : onSearch}
        onApplyFilters={hideHeader ? undefined : onApplyFilters}
        hideSearch={hideHeader}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogChange}
        title="Delete Inspection Finding Monitoring"
        description={`Are you sure you want to delete this Inspection Finding Monitoring? This action cannot be undone.`}
        onConfirm={onDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

