import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
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
import { weightReportService } from '../../services/wasteManagementService';
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

  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Report Status',
      type: 'select',
      options: Object.values(ReportStatusEnum).map((status) => ({ label: status, value: status })),
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
      newActiveFilters[filter.id] = {
        value: filter.value,
        label: filter.value === 'true' ? 'Active' : 'Inactive',
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
          {item.status}
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
      />
      
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
