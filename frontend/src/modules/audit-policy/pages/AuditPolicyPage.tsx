import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

import { Button, ThemeButton } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';

import auditPolicyService from '../services/auditPolicyService';
import { AuditElement } from '../types/audit-policy.types';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const AuditPolicyPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [elements, setElements] = useState<AuditElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [elementToDelete, setElementToDelete] = useState<AuditElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>({ id: 'code', desc: false });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      id: 'code',
      label: 'Element Code',
      type: 'text',
      placeholder: 'Filter by element code...',
    },
    {
      id: 'isActive',
      label: 'Active Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ], []);

  const fetchElements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (activeFilters.code?.value) {
        params.code = activeFilters.code.value as string;
      }

      if (activeFilters.isActive?.value === 'active') {
        params.isActive = true;
      } else if (activeFilters.isActive?.value === 'inactive') {
        params.isActive = false;
      }

      if (sorting) {
        params.sortBy = sorting.id;
        params.sortOrder = sorting.desc ? 'desc' : 'asc';
      }

      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key !== 'isActive' && key !== 'code' && filter.value !== undefined && filter.value !== null && filter.value !== '') {
          params[key] = filter.value;
        }
      });

      const response = await auditPolicyService.getElements(params);
      setElements(response.data);
      setTotalElements(response.meta.total);

      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit elements:', error);
      toast.error('Failed to load audit elements');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters, sorting]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  const handleApplyFilters = useCallback((filters: FilterValue[]) => {
    const filtersMap: Record<string, { value: any; label: string }> = {};
    filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        filtersMap[filter.id] = { value: filter.value, label: filter.label || filter.value.toString() };
      }
    });
    setActiveFilters(filtersMap);
    setPageIndex(0);
  }, []);

  const handleDeleteClick = (element: AuditElement, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setElementToDelete(element);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!elementToDelete) return;

    setIsLoading(true);
    try {
      await auditPolicyService.deleteElement(elementToDelete.id);
      toast.success('Audit element has been deleted');
      setOpenDropdownId(null);
      fetchElements();
    } catch (error) {
      console.error('Failed to delete audit element:', error);
      toast.error('Failed to delete audit element');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setElementToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setElementToDelete(null);
    setOpenDropdownId(null);
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (element: AuditElement) => (
        <div className="font-medium">{element.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (element: AuditElement) => (
        <div>{element.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (element: AuditElement) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {element.description || '-'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (element: AuditElement) => (
        <Badge variant={element.isActive ? 'default' : 'secondary'}>
          {element.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (element: AuditElement) => (
        <div className="text-sm text-gray-600">
          {format(new Date(element.createdAt), 'dd MMM yyyy')}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (element: AuditElement) => (
        <div className="flex items-center gap-2">
          <DropdownMenu
            open={openDropdownId === element.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? element.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPermission('audit-policy:read') && (
                <DropdownMenuItem onClick={() => navigate(`/audit-policy/${element.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {((hasPermission('audit-policy:read') || hasPermission('audit-policy:update')) && hasPermission('audit-policy:delete')) && (
                <DropdownMenuSeparator />
              )}
              {hasPermission('audit-policy:update') && (
                <DropdownMenuItem onClick={() => navigate(`/audit-policy/${element.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {hasPermission('audit-policy:delete') && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => handleDeleteClick(element, e)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Policy"
        subtitle="Manage audit policy elements, clauses, and criteria"
        actions={
          <PermissionGuard permission="audit-policy:create">
            <ThemeButton onClick={() => navigate('/audit-policy/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create Element
            </ThemeButton>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        data={elements}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalElements / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalElements,
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        searchPlaceholder="Search by code, name, or description..."
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogCancel();
        }}
        title="Delete Audit Element"
        description={`Are you sure you want to delete "${elementToDelete?.name}"? This action cannot be undone and will also delete all associated clauses and criteria.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
};

export default AuditPolicyPage;