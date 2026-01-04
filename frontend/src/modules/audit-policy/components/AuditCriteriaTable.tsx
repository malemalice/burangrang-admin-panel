import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';
import { AuditCriteria, TransitionTypeEnum } from '../types/audit-policy.types';

interface AuditCriteriaTableProps {
  criteria: AuditCriteria[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (term: string) => void;
  onApplyFilters: (filters: FilterValue[]) => void;
  onAddCriterion: () => void;
  onEditCriterion: (criterion: AuditCriteria) => void;
  onDeleteCriterion: (criterion: AuditCriteria, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  criterionToDelete: AuditCriteria | null;
  deleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  clauseCode?: string;
}

const getTransitionTypeBadge = (type: TransitionTypeEnum) => {
  const variants: Record<TransitionTypeEnum, 'default' | 'secondary' | 'outline'> = {
    [TransitionTypeEnum.INITIAL]: 'default',
    [TransitionTypeEnum.TRANSITION_LEVEL]: 'secondary',
    [TransitionTypeEnum.ADVANCE_LEVEL]: 'outline',
  };

  const labels: Record<TransitionTypeEnum, string> = {
    [TransitionTypeEnum.INITIAL]: 'Initial',
    [TransitionTypeEnum.TRANSITION_LEVEL]: 'Transition',
    [TransitionTypeEnum.ADVANCE_LEVEL]: 'Advance',
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

export const AuditCriteriaTable = ({
  criteria,
  isLoading,
  pageIndex,
  limit,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onApplyFilters,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion,
  onDeleteConfirm,
  criterionToDelete,
  deleteDialogOpen,
  onDeleteDialogChange,
  clauseCode,
}: AuditCriteriaTableProps) => {
  const filterFields: FilterField[] = [];

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (criterion: AuditCriteria) => (
        <div className="font-medium">{clauseCode ? `${clauseCode}.${criterion.order}` : criterion.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Criteria',
      cell: (criterion: AuditCriteria) => (
        <div>{criterion.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Interpretation',
      cell: (criterion: AuditCriteria) => (
        <div className="text-sm text-gray-600 max-w-md">
          {criterion.description || '-'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'transitionType',
      header: 'Type',
      cell: (criterion: AuditCriteria) => getTransitionTypeBadge(criterion.transitionType),
      isSortable: true,
    },
    {
      id: 'order',
      header: 'Order',
      cell: (criterion: AuditCriteria) => (
        <div>{criterion.order}</div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (criterion: AuditCriteria) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditCriterion(criterion)}
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
                onClick={(e) => onDeleteCriterion(criterion, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Criteria</h2>
        <ThemeButton onClick={onAddCriterion}>
          <Plus className="mr-2 h-4 w-4" /> Add Criteria
        </ThemeButton>
      </div>

      <DataTable
        columns={columns}
        data={criteria}
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
        title="Delete Criteria"
        description={`Are you sure you want to delete "${criterionToDelete?.name}"? This action cannot be undone.`}
        onConfirm={onDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};