import { useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { RiskAssessmentItem } from '@/core/lib/types';
import { getRiskBadge } from '../utils/riskBadgeHelpers';

interface RiskAssessmentItemsTableProps {
  items: RiskAssessmentItem[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (term: string) => void;
  onApplyFilters: (filters: FilterValue[]) => void;
  onAddItem: () => void;
  onViewItem: (item: RiskAssessmentItem) => void;
  onEditItem: (item: RiskAssessmentItem) => void;
  onDeleteItem: (item: RiskAssessmentItem, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  itemToDelete: RiskAssessmentItem | null;
  deleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  hideActions?: boolean;
}

export const RiskAssessmentItemsTable = ({
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
}: RiskAssessmentItemsTableProps) => {
  const filterFields: FilterField[] = [];

  const columns = [
    {
      id: 'category',
      header: 'Risk Category',
      cell: (item: RiskAssessmentItem) => (
        <div className="font-medium">
          {item.mRiskCategory
            ? `${item.mRiskCategory.code} - ${item.mRiskCategory.name}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'risk',
      header: 'Risk',
      cell: (item: RiskAssessmentItem) => (
        <div>
          {item.mRisk 
            ? `${item.mRisk.code} - ${item.mRisk.name}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'riskRating',
      header: 'Risk Matrix Rating',
      cell: (item: RiskAssessmentItem) => (
        <div className="font-medium">
          {item.riskMatrixRating || 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'interpretation',
      header: 'Interpretation',
      cell: (item: RiskAssessmentItem) => getRiskBadge(item.interpretation),
      isSortable: true,
    },
    {
      id: 'postRiskMatrixRating',
      header: 'Post Risk Matrix Rating',
      cell: (item: RiskAssessmentItem) => (
        <div className="font-medium">
          {item.postRiskMatrixRating || 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'postInterpretation',
      header: 'Post Interpretation',
      cell: (item: RiskAssessmentItem) => (
        <div>
          {item.postInterpretation ? getRiskBadge(item.postInterpretation) : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: RiskAssessmentItem) => (
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
        <h2 className="text-2xl font-bold">Risk Assessment Items</h2>
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
        title="Delete Risk Assessment Item"
        description={`Are you sure you want to delete this risk assessment item? This action cannot be undone.`}
        onConfirm={onDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};
