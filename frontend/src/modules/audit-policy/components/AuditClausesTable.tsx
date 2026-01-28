import { useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { AuditClause } from '../types/audit-policy.types';

interface AuditClausesTableProps {
  clauses: AuditClause[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (term: string) => void;
  onApplyFilters: (filters: FilterValue[]) => void;
  onAddClause: () => void;
  onViewClause: (clause: AuditClause) => void;
  onEditClause: (clause: AuditClause) => void;
  onDeleteClause: (clause: AuditClause, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  clauseToDelete: AuditClause | null;
  deleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
}

export const AuditClausesTable = ({
  clauses,
  isLoading,
  pageIndex,
  limit,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onApplyFilters,
  onAddClause,
  onViewClause,
  onEditClause,
  onDeleteClause,
  onDeleteConfirm,
  clauseToDelete,
  deleteDialogOpen,
  onDeleteDialogChange,
}: AuditClausesTableProps) => {
  const filterFields: FilterField[] = [];

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (clause: AuditClause) => (
        <div className="font-medium">{clause.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (clause: AuditClause) => (
        <div>{clause.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'order',
      header: 'Order',
      cell: (clause: AuditClause) => (
        <div>{clause.order}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (clause: AuditClause) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {clause.description || '-'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (clause: AuditClause) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewClause(clause)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Criteria</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditClause(clause)}
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
                onClick={(e) => onDeleteClause(clause, e)}
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
        <h2 className="text-2xl font-bold">Clauses</h2>
        <ThemeButton onClick={onAddClause}>
          <Plus className="mr-2 h-4 w-4" /> Add Clause
        </ThemeButton>
      </div>

      <DataTable
        columns={columns}
        data={clauses}
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
        title="Delete Clause"
        description={`Are you sure you want to delete "${clauseToDelete?.name}"? This action cannot be undone and will also delete all associated criteria.`}
        onConfirm={onDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};