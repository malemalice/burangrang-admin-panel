import { useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { InspectionItem } from '../types/inspection.types';

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
  onDeleteItem: (item: InspectionItem, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  itemToDelete: InspectionItem | null;
  deleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  hideActions?: boolean;
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
  onDeleteItem,
  onDeleteConfirm,
  itemToDelete,
  deleteDialogOpen,
  onDeleteDialogChange,
  hideActions = false,
}: InspectionItemsTableProps) => {
  const filterFields: FilterField[] = [];

  const columns = [
    {
      id: 'category',
      header: 'Risk Category',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.riskCategory
            ? `${item.riskCategory.name || item.riskCategoryId}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'risk',
      header: 'Risk',
      cell: (item: InspectionItem) => (
        <div>
          {item.risk 
            ? `${item.risk.name || item.riskId}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'department',
      header: 'Assigned Department',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.assignedDepartment
            ? item.assignedDepartment.name 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'assignee',
      header: 'Assignee',
      cell: (item: InspectionItem) => (
        <div>
          {item.assignee 
            ? `${item.assignee.firstName} ${item.assignee.lastName}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'images',
      header: 'Images',
      cell: (item: InspectionItem) => (
        <div className="font-medium">
          {item.images && item.images.length > 0 
            ? `${item.images.length} image(s)` 
            : 'No images'}
        </div>
      ),
      isSortable: false,
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
            </>
          )}
        </div>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Inspection Items</h2>
        {!hideActions && (
          <ThemeButton onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </ThemeButton>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalItems / limit),
          onPageChange,
          onPageSizeChange,
          total: totalItems,
        }}
        filterFields={filterFields}
        onSearch={onSearch}
        onApplyFilters={onApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogChange}
        title="Delete Inspection Item"
        description={`Are you sure you want to delete this inspection item? This action cannot be undone.`}
        onConfirm={onDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

