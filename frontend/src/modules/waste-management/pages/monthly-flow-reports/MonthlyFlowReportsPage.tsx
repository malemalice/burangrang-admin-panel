import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, FileText } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { monthlyFlowReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { MonthlyFlowReport, PaginatedResponse, TreatmentPlant } from '../../types/waste-management.types';
import { formatDate } from '@/core/utils/date';

export default function MonthlyFlowReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonthlyFlowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [plants, setPlants] = useState<TreatmentPlant[]>([]);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await treatmentPlantService.getAll({ page: 1, limit: 100, isActive: true });
        setPlants(response.data.data);
      } catch (error) {
        console.error('Failed to fetch plants', error);
      }
    };
    fetchPlants();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'treatmentPlantId',
      label: 'Treatment Plant',
      type: 'searchableSelect',
      options: plants.map((plant) => ({
        label: plant.name,
        value: plant.id,
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
        treatmentPlantId: activeFilters.treatmentPlantId?.value,
        // reportMonth: activeFilters.reportMonth?.value,
        // reportYear: activeFilters.reportYear?.value ? Number(activeFilters.reportYear.value) : undefined,
      };
      const response = await monthlyFlowReportService.getAll(params);
      const result = response.data as PaginatedResponse<MonthlyFlowReport>;
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
      await monthlyFlowReportService.delete(deleteId);
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
      let label = String(filter.value);
      if (filter.id === 'treatmentPlantId') {
        const plant = plants.find((p) => p.id === filter.value);
        if (plant) label = plant.name;
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
      header: 'Code',
      cell: (item: MonthlyFlowReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'treatmentPlant',
      header: 'Treatment Plant',
      cell: (item: MonthlyFlowReport) => item.treatmentPlant?.name || '-',
      isSortable: true,
    },
    {
      id: 'reportDate',
      header: 'Report Date',
      cell: (item: MonthlyFlowReport) => formatDate(item.reportDate || ''),
      isSortable: true,
    },
    {
      id: 'totalVolume',
      header: 'Total Volume',
      cell: (item: MonthlyFlowReport) => `${item.totalVolume?.toLocaleString()} m³`,
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: MonthlyFlowReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}?print=true`)}>
              <FileText className="mr-2 h-4 w-4" /> Print PDF
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
        title="Waste Water Flow Recording"
        subtitle="Monthly flow reports for treatment plants"
        actions={
          <Button onClick={() => navigate('/waste-management/monthly-flow-reports/create')}>
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
