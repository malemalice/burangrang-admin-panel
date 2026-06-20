import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Eye, Trash2, Plus, MoreHorizontal, ClipboardList } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useWorkClassifications } from '../hooks/useWorkClassifications';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useWorkPermitClassificationContentEnabled } from '../hooks/useWorkPermitClassificationContentEnabled';

const FILTER_PARAM_KEYS = ['name', 'code', 'status'] as const;

const WorkClassificationsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const { enabled: classificationContentEnabled } = useWorkPermitClassificationContentEnabled();
  const { classifications, isLoading, fetchClassifications, pagination } = useWorkClassifications();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WorkClassification | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filterFields: FilterField[] = useMemo(() => {
    return [
      {
        id: 'name',
        label: 'Name',
        type: 'text',
        placeholder: 'Filter by name',
      },
      {
        id: 'code',
        label: 'Code',
        type: 'text',
        placeholder: 'Filter by code',
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];
  }, []);

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

  const activeFilters = useMemo(() => {
    const out: Record<string, { value: string | boolean; label: string }> = {};
    const status = searchParams.get('status');
    if (status === 'active' || status === 'inactive') {
      out.status = { value: status, label: status === 'active' ? 'Active' : 'Inactive' };
    }
    const name = searchParams.get('name');
    if (name) out.name = { value: name, label: name };
    const code = searchParams.get('code');
    if (code) out.code = { value: code, label: code };
    return out;
  }, [searchParams]);

  const sorting = useMemo((): { id: string; desc: boolean } | null => {
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    if (!sortBy) return null;
    return { id: sortBy, desc: sortOrder !== 'asc' };
  }, [searchParams]);

  const activeTab = useMemo(() => {
    const status = searchParams.get('status');
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'all';
  }, [searchParams]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams],
  );

  const fetchData = useCallback(async () => {
    const trimmed = searchTerm.trim();
    const params: Parameters<typeof fetchClassifications>[0] = {
      page: pageIndex + 1,
      limit,
      search: trimmed.length > 0 ? trimmed : undefined,
      sortBy: sorting ? (sorting.id === 'status' ? 'isActive' : sorting.id) : 'createdAt',
      sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
    };

    if (activeFilters.status) {
      params.isActive = activeFilters.status.value === 'active';
    }

    await fetchClassifications(params);
  }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchClassifications]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = useCallback((row: WorkClassification, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await workClassificationService.deleteWorkClassification(itemToDelete.id);
      toast.success('Work classification deleted successfully');
      setOpenDropdownId(null);
      fetchData();
    } catch (error: unknown) {
      console.error('Error deleting work classification:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete work classification';
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, fetchData]);

  const handleDialogCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    setOpenDropdownId(null);
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      updateSearchParams((next) => {
        if (trimmed) next.set('search', trimmed);
        else next.delete('search');
        next.set('page', '1');
      });
    },
    [updateSearchParams],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      updateSearchParams((next) => {
        FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
        if (value === 'active') next.set('status', 'active');
        else if (value === 'inactive') next.set('status', 'inactive');
        next.set('page', '1');
      });
    },
    [updateSearchParams],
  );

  const handleApplyFilters = useCallback(
    (filters: FilterValue[]) => {
      updateSearchParams((next) => {
        FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
        filters.forEach((filter: FilterValue) => {
          if (filter.id === 'status') {
            next.set('status', String(filter.value));
          } else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            next.set(filter.id, String(filter.value));
          }
        });
        next.set('page', '1');
      });
    },
    [updateSearchParams],
  );

  const handleSortingChange = useCallback(
    (newSorting: { id: string; desc: boolean } | null) => {
      updateSearchParams((next) => {
        if (newSorting) {
          next.set('sortBy', newSorting.id);
          next.set('sortOrder', newSorting.desc ? 'desc' : 'asc');
        } else {
          next.delete('sortBy');
          next.delete('sortOrder');
        }
        next.set('page', '1');
      });
    },
    [updateSearchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams((next) => {
        next.set('page', String(page + 1));
      });
    },
    [updateSearchParams],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateSearchParams((next) => {
        next.set('limit', String(size));
        next.set('page', '1');
      });
    },
    [updateSearchParams],
  );

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Classification',
        cell: (row: WorkClassification) => (
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.code}</div>
            </div>
          </div>
        ),
        isSortable: true,
      },
      {
        id: 'description',
        header: 'Description',
        cell: (row: WorkClassification) => (
          <div className="max-w-md truncate text-muted-foreground">
            {row.description || '—'}
          </div>
        ),
        isSortable: false,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row: WorkClassification) => (
          <Badge
            variant="outline"
            className={
              row.isActive
                ? 'border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                : 'border-0 bg-muted text-muted-foreground'
            }
          >
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        isSortable: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row: WorkClassification) => (
          <DropdownMenu
            open={openDropdownId === row.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? row.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPermission('work-permit:read') && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenDropdownId(null);
                    navigate(`/master/work-classifications/${row.id}`);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
              )}
              {hasPermission('work-permit:update') && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenDropdownId(null);
                    navigate(`/master/work-classifications/${row.id}/edit`);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {hasPermission('work-permit:update') && hasPermission('work-permit:delete') && (
                <DropdownMenuSeparator />
              )}
              {hasPermission('work-permit:delete') && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleDeleteClick(row, e as React.MouseEvent);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        isSortable: false,
      },
    ],
    [openDropdownId, navigate, handleDeleteClick, hasPermission],
  );

  return (
    <>
      <PageHeader
        title="Work classifications"
        subtitle={
          classificationContentEnabled
            ? 'Manage work permit classification types and safety guidelines'
            : 'Manage work permit classification types'
        }
        actions={
          <PermissionGuard permission="work-permit:create">
            <Button onClick={() => navigate('/master/work-classifications/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add classification
            </Button>
          </PermissionGuard>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={classifications}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: pagination?.totalPages || 0,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          total: pagination?.total || 0,
        }}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
        searchValue={searchTerm}
        searchPlaceholder={
          classificationContentEnabled
            ? 'Search name, code, or safety guideline…'
            : 'Search name or code…'
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete work classification"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This cannot be undone if no work permits use it.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default WorkClassificationsPage;
