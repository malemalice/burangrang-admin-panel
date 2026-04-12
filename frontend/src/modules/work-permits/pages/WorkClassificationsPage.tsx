import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const WorkClassificationsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { classifications, isLoading, fetchClassifications, pagination } = useWorkClassifications();
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WorkClassification | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Record<string, { value: string | boolean; label: string }>
  >({});

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

  const fetchData = useCallback(async () => {
    const params: Parameters<typeof fetchClassifications>[0] = {
      page: pageIndex + 1,
      limit,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    Object.entries(activeFilters).forEach(([key, item]) => {
      if (key === 'status') {
        params.isActive = item.value === 'active';
      } else if (key === 'name' || key === 'code') {
        if (!params.search) {
          params.search = String(item.value);
        }
      }
    });

    await fetchClassifications(params);
  }, [pageIndex, limit, searchTerm, activeFilters, fetchClassifications]);

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

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setPageIndex(0);

      const newFilters: Record<string, { value: string | boolean; label: string }> = {};
      Object.entries(activeFilters).forEach(([key, item]) => {
        if (key !== 'status') {
          newFilters[key] = item;
        }
      });

      if (value === 'all') {
        setActiveFilters(newFilters);
      } else if (value === 'active') {
        setActiveFilters({
          ...newFilters,
          status: { value: 'active', label: 'Active' },
        });
      } else if (value === 'inactive') {
        setActiveFilters({
          ...newFilters,
          status: { value: 'inactive', label: 'Inactive' },
        });
      }
    },
    [activeFilters],
  );

  const handleApplyFilters = useCallback((filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: string | boolean; label: string }> = {};

    filters.forEach((filter) => {
      if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive',
        };
        setActiveTab(
          filter.value === 'active' ? 'active' : filter.value === 'inactive' ? 'inactive' : 'all',
        );
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value),
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  }, []);

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
        subtitle="Manage work permit classification types and safety guidelines"
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
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: pagination?.total || 0,
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
        searchPlaceholder="Search name, code, or safety guideline…"
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
