import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { weightReportService, wasteSourceService, storageLocationService } from '../../services/wasteManagementService';
import { WeightReport, PaginatedResponse, ReportStatusEnum } from '../../types/waste-management.types';

export default function WeightReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WeightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [sourcesRes, locationsRes] = await Promise.all([
          wasteSourceService.getAll({ limit: 100, isActive: true }),
          storageLocationService.getAll({ limit: 100, isActive: true }),
        ]);
        setSources((sourcesRes.data as PaginatedResponse<any>).data);
        setLocations((locationsRes.data as PaginatedResponse<any>).data);
      } catch (error) {
        console.error('Failed to fetch dependencies', error);
      }
    };
    fetchDependencies();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Report Status',
      type: 'select',
      options: Object.values(ReportStatusEnum).map((status) => ({
        label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        value: status,
      })),
    },
    {
      id: 'sourceId',
      label: 'Waste Source',
      type: 'searchableSelect',
      options: sources.map((s) => ({ label: s.name, value: s.id })),
    },
    {
      id: 'storageLocationId',
      label: 'Location',
      type: 'searchableSelect',
      options: locations.map((l) => ({ label: l.name, value: l.id })),
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
        status: activeFilters.status?.value as ReportStatusEnum | undefined,
        sourceId: activeFilters.sourceId?.value,
        storageLocationId: activeFilters.storageLocationId?.value,
        isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
      };
      const response = await weightReportService.getAll(params);
      const result = response.data as PaginatedResponse<WeightReport>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
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
      await weightReportService.delete(deleteId);
      toast.success('Report deleted successfully');
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
      let label = filter.value as string;
      if (filter.id === 'isActive') {
        label = filter.value === 'true' ? 'Active' : 'Inactive';
      } else if (filter.id === 'sourceId') {
        label = sources.find((s) => s.id === filter.value)?.name || String(filter.value);
      } else if (filter.id === 'storageLocationId') {
        label = locations.find((l) => l.id === filter.value)?.name || String(filter.value);
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
      id: 'reportCode',
      header: 'Report Code',
      cell: (item: WeightReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'source',
      header: 'Source',
      cell: (item: WeightReport) => item.source?.name || '-',
      isSortable: true,
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item: WeightReport) => item.storageLocation?.name || '-',
      isSortable: true,
    },
    {
      id: 'period',
      header: 'Period',
      cell: (item: WeightReport) => `${item.reportMonth} ${item.reportYear}`,
      isSortable: true,
    },
    {
      id: 'reportStatus',
      header: 'Report Status',
      cell: (item: WeightReport) => (
        <Badge variant={item.status === ReportStatusEnum.SUBMITTED ? 'default' : 'secondary'}>
          {item.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: WeightReport) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WeightReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/weight-reports/${item.id}/edit`)}>
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
        title="Solid Waste Recording"
        subtitle="Weight reports for solid waste management"
        actions={
          <Button onClick={() => navigate('/waste-management/weight-reports/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Report
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-auto" onValueChange={(value) => {
          setPage(1);
          if (value === 'all') {
            const newFilters = { ...activeFilters };
            delete newFilters.status;
            setActiveFilters(newFilters);
          } else {
            setActiveFilters({
              ...activeFilters,
              status: { value: value, label: value },
            });
          }
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.values(ReportStatusEnum).map((status) => (
              <TabsTrigger key={status} value={status}>
                {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </TabsTrigger>
            ))}
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
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
