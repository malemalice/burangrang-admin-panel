import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { waterQualityParameterService } from '../../services/wasteManagementService';
import { WaterQualityParameter, PaginatedResponse } from '../../types/waste-management.types';

export default function WaterQualityParametersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WaterQualityParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      id: 'dateSampleTakenRange',
      label: 'Date Sample Taken',
      type: 'dateRange',
      dateRangeMode: 'date',
      showRelativePresets: true,
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = activeFilters.dateSampleTakenRange?.value as { from?: string; to?: string } | undefined;
      const params = {
        page,
        limit,
        search: search || undefined,
        isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as 'desc',
        dateSampleTakenFrom: dateRange?.from?.split('T')[0],
        dateSampleTakenTo: dateRange?.to?.split('T')[0],
      };
      const response = await waterQualityParameterService.getAll(params);
      const result = response.data as PaginatedResponse<WaterQualityParameter>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch parameters');
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
      await waterQualityParameterService.delete(deleteId);
      toast.success('Parameter deleted successfully');
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
      if (filter.id === 'dateSampleTakenRange') {
        const range = filter.value as { from?: string; to?: string };
        newActiveFilters[filter.id] = {
          value: range,
          label: [range.from, range.to].filter(Boolean).join(' - '),
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'true' ? 'Active' : 'Inactive',
        };
      }
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: WaterQualityParameter) => item.name,
      isSortable: true,
    },
    {
      id: 'code',
      header: 'Code',
      cell: (item: WaterQualityParameter) => item.code,
      isSortable: true,
    },
    {
      id: 'dateSampleTaken',
      header: 'Date Sample Taken',
      cell: (item: WaterQualityParameter) => new Date(item.dateSampleTaken || '').toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'unit',
      header: 'Unit',
      cell: (item: WaterQualityParameter) => item.unit,
      isSortable: true,
    },
    {
      id: 'standardLimit',
      header: 'Standard Limit',
      cell: (item: WaterQualityParameter) => item.standardLimit || '-',
      isSortable: true,
    },
    {
      id: 'regulatoryLimit',
      header: 'Quality Standard Value',
      cell: (item: WaterQualityParameter) => item.regulatoryLimit || '-',
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: WaterQualityParameter) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WaterQualityParameter) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-parameters/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-parameters/${item.id}/edit`)}>
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
        title="Water Quality Parameters"
        subtitle="Manage water quality measurement parameters"
        actions={
          <Button onClick={() => navigate('/waste-management/water-quality-parameters/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Parameter
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
        // @ts-ignore - The types in DataTable are generic and TS struggles with the prop intersection
        onRowClick={(item: WaterQualityParameter) => navigate(`/waste-management/water-quality-parameters/${item.id}`)}
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
        title="Delete Parameter"
        description="Are you sure you want to delete this parameter? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
