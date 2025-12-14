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
import { storageLocationService } from '../../services/wasteManagementService';
import areaService from '@/modules/master-data/services/areaService';
import { StorageLocation, PaginatedResponse } from '../../types/waste-management.types';

export default function StorageLocationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true } });
        setAreas(response.data);
      } catch (error) {
        console.error('Failed to fetch areas', error);
      }
    };
    fetchAreas();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
    {
      id: 'areaId',
      label: 'Area',
      type: 'searchableSelect',
      options: areas.map((area) => ({
        label: area.name,
        value: area.id,
      })),
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
        areaId: activeFilters.areaId?.value,
      };
      const response = await storageLocationService.getAll(params);
      const result = response.data as PaginatedResponse<StorageLocation>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
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
      await storageLocationService.delete(deleteId);
      toast.success('Deleted successfully');
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
      let label = filter.value === 'true' ? 'Active' : 'Inactive';
      if (filter.id === 'areaId') {
        const area = areas.find((a) => a.id === filter.value);
        label = area?.name || String(filter.value);
      }
      newActiveFilters[filter.id] = {
        value: filter.value,
        label,
      };
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: StorageLocation) => item.name,
      isSortable: true,
    },
    {
      id: 'code',
      header: 'Code',
      cell: (item: StorageLocation) => item.code,
      isSortable: true,
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item: StorageLocation) => item.location,
      isSortable: true,
    },
    {
      id: 'area',
      header: 'Area',
      cell: (item: StorageLocation) => item.area?.name || '-',
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: StorageLocation) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: StorageLocation) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/storage-locations/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Storage Locations"
        subtitle="Manage waste storage locations"
        actions={
          <Button onClick={() => navigate('/waste-management/storage-locations/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Storage Location
          </Button>
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
        title="Delete Storage Location"
        description="Are you sure you want to delete this location? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
