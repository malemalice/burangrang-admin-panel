import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { wasteTypeService } from '../../services/wasteManagementService';
import { WasteType, PaginatedResponse, WasteTypeEnum } from '../../types/waste-management.types';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

export default function WasteTypesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState<WasteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filterFields: FilterField[] = [
    {
      id: 'wasteType',
      label: 'Waste Type',
      type: 'select',
      options: Object.values(WasteTypeEnum).map((type) => ({ label: type, value: type })),
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        wasteType: activeFilters.wasteType?.value as WasteTypeEnum | undefined,
        isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
      };
      const response = await wasteTypeService.getAll(params);
      const result = response.data as PaginatedResponse<WasteType>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch waste types');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await wasteTypeService.delete(deleteId);
      toast.success('Waste type deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach((filter) => {
      newActiveFilters[filter.id] = {
        value: filter.value,
        label: filter.id === 'isActive' ? (filter.value === 'true' ? 'Active' : 'Inactive') : filter.value as string,
      };
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: WasteType) => item.name,
      isSortable: true,
    },
    {
      id: 'code',
      header: 'Code',
      cell: (item: WasteType) => item.code,
      isSortable: true,
    },
    {
      id: 'wasteType',
      header: 'Type',
      cell: (item: WasteType) => <Badge variant="outline">{item.wasteType}</Badge>,
      isSortable: true,
    },
    {
      id: 'requiresSpecialHandling',
      header: 'Special Handling',
      cell: (item: WasteType) => (
        item.requiresSpecialHandling ? <Badge variant="destructive">Yes</Badge> : 'No'
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: WasteType) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WasteType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('waste-management:read') && (
              <DropdownMenuItem onClick={() => navigate(`/waste-management/waste-types/${item.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
            )}
            {hasPermission('waste-management:update') && (
              <DropdownMenuItem onClick={() => navigate(`/waste-management/waste-types/${item.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {hasPermission('waste-management:delete') && (
              <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Waste Types"
        subtitle="Manage waste type classifications"
        actions={
          <PermissionGuard permission="waste-management:create">
            <Button onClick={() => navigate('/waste-management/waste-types/create')}>
              <Plus className="mr-2 h-4 w-4" /> Add Waste Type
            </Button>
          </PermissionGuard>
        }
      >
        <Tabs defaultValue="all" className="w-auto" onValueChange={(value) => {
          setPage(1);
          if (value === 'all') {
            const newFilters = { ...activeFilters };
            delete newFilters.isActive;
            setActiveFilters(newFilters);
          } else {
            setActiveFilters({
              ...activeFilters,
              isActive: { value: value === 'active' ? 'true' : 'false', label: value === 'active' ? 'Active' : 'Inactive' },
            });
          }
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        pagination={{
          pageIndex: page - 1,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: (newPage) => setPage(newPage + 1),
          onPageSizeChange: setLimit,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Waste Type"
        description="Are you sure you want to delete this waste type? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
